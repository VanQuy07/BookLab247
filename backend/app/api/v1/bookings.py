import os
from datetime import datetime, timezone

from bson import ObjectId
from dotenv import load_dotenv
from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel

from app.core.database import db

load_dotenv()

router = APIRouter()


class BookingCreate(BaseModel):
    room_id: str
    customer_name: str
    user_id: str = ""
    phone: str
    date: str
    start_time: str
    duration_mins: int
    buffer_mins: int = 15
    note: str = ""
    equipments: list = []


class BookingStatusUpdate(BaseModel):
    status: str
    payment_status: str | None = None


class BookingCancelRequest(BaseModel):
    cancel_reason: str = ""


class MaintenanceLogCreate(BaseModel):
    type: str
    item_id: str
    item_name: str
    reason: str
    start_date: str
    start_time: str
    end_date: str
    end_time: str
    status: str = "pending"


class FixedBookingCreate(BaseModel):
    room_id: str
    title: str
    start_date: str
    end_date: str
    days_of_week: list[int]
    start_time: str
    end_time: str
    note: str = ""
    exception_dates: list[str] = []
    status: str = "active"


def time_to_mins(time_str: str) -> int:
    h, m = map(int, time_str.split(":"))
    return h * 60 + m


def _serialize_booking(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    created_at = doc.get("created_at")
    if isinstance(created_at, datetime):
        doc["created_at"] = created_at.isoformat()
    if doc.get("updated_at") and isinstance(doc["updated_at"], datetime):
        doc["updated_at"] = doc["updated_at"].isoformat()
    return doc


async def _get_room_info(room_id: str) -> dict:
    try:
        room = await db["labs"].find_one({"_id": ObjectId(room_id)})
    except Exception:
        room = None
    if room:
        return {
            "id": str(room["_id"]),
            "name": room.get("name", "Phòng Lab"),
            "building": room.get("building", ""),
            "floor": room.get("floor", ""),
            "type": room.get("type", ""),
        }
    return {}


async def _auto_update_booking_statuses():
    """Tự động chuyển trạng thái đơn đặt phòng theo thời gian."""
    now = datetime.now(timezone.utc)
    updated_count = 0

    # Chuyển DA_DUYET -> DANG_MUON (đến giờ bắt đầu)
    pending_to_active = db["bookings"].find(
        {
            "status": "DA_DUYET",
        }
    )
    async for booking in pending_to_active:
        booking_datetime = _parse_booking_datetime(
            booking.get("date", ""), booking.get("start_time", "")
        )
        if booking_datetime and now >= booking_datetime:
            await db["bookings"].update_one(
                {"_id": booking["_id"]},
                {"$set": {"status": "DANG_MUON", "updated_at": now}},
            )
            updated_count += 1

    # Chuyển DANG_MUON -> DA_XONG (hết giờ mượn)
    active_to_done = db["bookings"].find(
        {
            "status": "DANG_MUON",
        }
    )
    async for booking in active_to_done:
        end_time = _get_end_time(
            booking.get("start_time", ""),
            booking.get("duration_mins", 0),
            booking.get("buffer_mins", 0),
        )
        end_datetime = _parse_booking_datetime(booking.get("date", ""), end_time)
        if end_datetime and now >= end_datetime:
            await db["bookings"].update_one(
                {"_id": booking["_id"]},
                {"$set": {"status": "DA_XONG", "updated_at": now}},
            )
            updated_count += 1

    return updated_count


def _parse_booking_datetime(date_str: str, time_str: str) -> datetime | None:
    """Parse ngày + giờ thành datetime timezone-aware."""
    if not date_str or not time_str:
        return None
    try:
        dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        return dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _get_end_time(start_time: str, duration_mins: int, buffer_mins: int = 0) -> str:
    """Tính giờ kết thúc (bao gồm buffer)."""
    if not start_time:
        return "00:00"
    try:
        h, m = map(int, start_time.split(":"))
        total_mins = h * 60 + m + duration_mins + buffer_mins
        end_h = (total_mins // 60) % 24
        end_m = total_mins % 60
        return f"{end_h:02d}:{end_m:02d}"
    except ValueError:
        return "00:00"


# ================== 0. QUẢN LÝ LỊCH CỐ ĐỊNH LÊN DATABASE ==================
@router.post("/fixed")
async def create_fixed_booking(rule: FixedBookingCreate):
    data = rule.model_dump()
    data["created_at"] = datetime.now(timezone.utc)
    result = await db["fixed_bookings"].insert_one(data)
    created = await db["fixed_bookings"].find_one({"_id": result.inserted_id})
    created["id"] = str(created["_id"])
    created.pop("_id", None)
    return created


@router.get("/fixed")
async def get_fixed_bookings():
    cursor = db["fixed_bookings"].find().sort("created_at", -1)
    results = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)
        results.append(doc)
    return results


@router.put("/fixed/{rule_id}")
async def update_fixed_booking(rule_id: str, rule: FixedBookingCreate):
    if not ObjectId.is_valid(rule_id):
        raise HTTPException(status_code=400, detail="ID không hợp lệ")
    await db["fixed_bookings"].update_one(
        {"_id": ObjectId(rule_id)}, {"$set": rule.model_dump()}
    )
    return {"success": True}


@router.delete("/fixed/{rule_id}")
async def delete_fixed_booking(rule_id: str):
    if not ObjectId.is_valid(rule_id):
        raise HTTPException(status_code=400, detail="ID không hợp lệ")
    await db["fixed_bookings"].delete_one({"_id": ObjectId(rule_id)})
    return {"success": True}


# ================== 0.5. QUẢN LÝ BẢO TRÌ ==================
@router.post("/maintenance")
async def create_maintenance(log: MaintenanceLogCreate):
    data = log.model_dump()
    data["created_at"] = datetime.now(timezone.utc)
    result = await db["maintenance_logs"].insert_one(data)
    created = await db["maintenance_logs"].find_one({"_id": result.inserted_id})
    created["id"] = str(created["_id"])
    created.pop("_id", None)
    return created


@router.get("/maintenance")
async def get_maintenance_logs():
    cursor = db["maintenance_logs"].find().sort("created_at", -1)
    logs_list = await cursor.to_list(length=500)
    results = []
    for doc in logs_list:
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)
        results.append(doc)
    return results


@router.put("/maintenance/{log_id}")
async def update_maintenance(log_id: str, status_data: dict):
    if not ObjectId.is_valid(log_id):
        raise HTTPException(status_code=400, detail="ID không hợp lệ")
    await db["maintenance_logs"].update_one(
        {"_id": ObjectId(log_id)},
        {"$set": {"status": status_data.get("status", "completed")}},
    )
    return {"success": True}


# ================== 1. TẠO ĐƠN ==================
@router.post("")
async def create_booking(booking: BookingCreate):
    new_start = time_to_mins(booking.start_time)
    new_end_with_buffer = new_start + booking.duration_mins + booking.buffer_mins

    # 1. KIỂM TRA TRÙNG LỊCH ĐẶT LẺ
    overlapping = await db["bookings"].find_one(
        {
            "room_id": booking.room_id,
            "date": booking.date,
            "start_time_mins": {"$lt": new_end_with_buffer},
            "end_time_with_buffer_mins": {"$gt": new_start},
            # "status": {
            #     "$in": ["pending", "confirmed", "CHO_DUYET", "DA_DUYET", "DANG_MUON"]
            # },
            "status": {
                "$in": [
                    "CHO_DUYET",
                    "DA_DUYET",
                    "DANG_MUON"
                ]
            }
        }
    )
    if overlapping:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Phòng đã có khách đặt lẻ vào khung giờ này!",
        )

    # 2. NÂNG CẤP 1A: KIỂM TRA TRÙNG LỊCH CỐ ĐỊNH (FIXED BOOKINGS)
    target_date_obj = datetime.strptime(booking.date, "%Y-%m-%d")
    js_day = (
        target_date_obj.weekday() + 1
    ) % 7  # Chuyển sang chuẩn getDay() của JS (0=CN, 1=T2)

    overlapping_fixed = await db["fixed_bookings"].find_one(
        {
            "room_id": booking.room_id,
            "status": "active",
            "start_date": {"$lte": booking.date},
            "end_date": {"$gte": booking.date},
            "days_of_week": js_day,
            "exception_dates": {"$ne": booking.date},
        }
    )

    if overlapping_fixed:
        f_start = time_to_mins(overlapping_fixed.get("start_time", "00:00"))
        f_end = time_to_mins(overlapping_fixed.get("end_time", "00:00"))
        if new_start < f_end and new_end_with_buffer > f_start:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Phòng đang có Lịch cố định ({overlapping_fixed.get('title')}) vào khung giờ này!",
            )
    new_booking_data = booking.model_dump()
    new_booking_data["start_time_mins"] = new_start
    new_booking_data["end_time_with_buffer_mins"] = new_end_with_buffer
    # new_booking_data["status"] = "pending"
    new_booking_data["status"] = "CHO_DUYET"
    new_booking_data["rejection_reason"] = None
    new_booking_data["cancel_reason"] = None
    new_booking_data["created_at"] = datetime.now(timezone.utc)
    new_booking_data["updated_at"] = datetime.now(timezone.utc)

    result = await db["bookings"].insert_one(new_booking_data)
    created = await db["bookings"].find_one({"_id": result.inserted_id})
    created = _serialize_booking(created)
    created["room"] = await _get_room_info(booking.room_id)
    return created


@router.get("")
async def get_bookings(
    authorization: str | None = Header(default=None),
):
    await _auto_update_booking_statuses()

    bookings_cursor = db["bookings"].find().sort("created_at", -1)
    bookings_list = await bookings_cursor.to_list(length=500)

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    confirmed_statuses = [
        "confirmed",
        "checked-in",
        "CHO_DUYET",
        "DA_DUYET",
        "DANG_MUON",
    ]
    confirmed_bookings = [
        b for b in bookings_list if b.get("status") in confirmed_statuses
    ]

    results = []
    for doc in bookings_list:
        doc = _serialize_booking(doc)
        room = await _get_room_info(doc.get("room_id", ""))
        doc["room"] = room

        doc["is_urgent"] = doc.get("date") == today_str
        doc["is_conflict"] = False
        doc["conflict_with"] = ""

        if doc.get("status") in ["pending", "CHO_DUYET"]:
            b_start = doc.get("start_time_mins", 0)
            b_end = doc.get("end_time_with_buffer_mins", 0)

            for cb in confirmed_bookings:
                if cb.get("room_id") == doc.get("room_id") and cb.get(
                    "date"
                ) == doc.get("date"):
                    cb_start = cb.get("start_time_mins", 0)
                    cb_end = cb.get("end_time_with_buffer_mins", 0)

                    if b_start < cb_end and b_end > cb_start:
                        doc["is_conflict"] = True
                        doc["conflict_with"] = cb.get("customer_name", "Khách ẩn danh")
                        break

        results.append(doc)

    return results


# ================== 3. API DUYỆT / TỪ CHỐI ĐƠN - ĐÃ MERGE ==================
class BookingStatusUpdate(BaseModel):
    status: str
    payment_status: str | None = None
    cancel_reason: str = ""


# ================== 3.5. API LẤY LỊCH SỬ ĐẶT CỦA USER ==================
@router.get("/user/{user_id}")
async def get_user_bookings(user_id: str):
    await _auto_update_booking_statuses()

    uid = user_id.strip()
    bookings_cursor = (
        db["bookings"]
        .find({"$or": [{"user_id": uid}, {"customer_name": uid}]})
        .sort("created_at", -1)
    )
    bookings_list = await bookings_cursor.to_list(length=500)
    results = []
    for doc in bookings_list:
        doc = _serialize_booking(doc)
        room = await _get_room_info(doc.get("room_id", ""))
        doc["room"] = room
        results.append(doc)
    return results


# ================== 4. DUYỆT / TỪ CHỐI (ADMIN) ==================
@router.patch("/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    status_update: BookingStatusUpdate,
    authorization: str | None = Header(default=None),
):
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(status_code=400, detail="ID đơn không hợp lệ")

    # Chuẩn hóa status của Master + Frontend của Hằng đang gửi "cancelled"
    # normalized = status_update.status.strip().lower()
    # if normalized in ("confirmed", "duyệt", "đã duyệt", "approved"):
    #     new_status = "confirmed"
    # elif normalized in ("rejected", "từ chối", "bị từ chối", "bi_tu_choi"):
    #     new_status = "rejected"
    normalized = status_update.status.strip().lower()

    #Trước khi sửa lúc 14h38 18062026
    # if normalized in (
    #     "confirmed",
    #     "duyệt",
    #     "đã duyệt",
    #     "approved"
    # ):
    #     new_status = "DA_DUYET"

    # elif normalized in (
    #     "rejected",
    #     "từ chối",
    #     "bị từ chối",
    #     "bi_tu_choi"
    # ):
    #     new_status = "DA_TU_CHOI"
    # else:
    #     new_status = status_update.status

    if normalized in (
        "confirmed",
        "duyệt",
        "đã duyệt",
        "approved"
    ):
        new_status = "DA_DUYET"

    elif normalized in (
        "rejected",
        "từ chối",
        "bị từ chối",
        "bi_tu_choi"
    ):
        new_status = "DA_TU_CHOI"

    elif normalized in (
        "cancelled",
        "hủy",
        "da_huy"
    ):
        new_status = "DA_HUY"

    else:
        new_status = status_update.status

    update_data = {
        "status": new_status,
        "updated_at": datetime.now(timezone.utc),
    }
    # if new_status == "rejected":
    if new_status in ("DA_TU_CHOI", "DA_HUY"):
        update_data["rejection_reason"] = status_update.status

        if status_update.cancel_reason:
            update_data["cancel_reason"] = status_update.cancel_reason

    if status_update.payment_status:
        update_data["payment_status"] = status_update.payment_status

    result = await db["bookings"].update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": update_data},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn đặt phòng")

    # Trả về data đầy đủ để Master không bị lỗi
    updated = await db["bookings"].find_one({"_id": ObjectId(booking_id)})
    updated = _serialize_booking(updated)
    updated["room"] = await _get_room_info(updated.get("room_id", ""))
    return updated


# ================== 5. USER TỰ HỦY ĐƠN ==================
# Giữ nguyên API này của nhánh Master vì nó phục vụ trang User
@router.patch("/{booking_id}/cancel")
async def cancel_booking(
    booking_id: str,
    cancel_request: BookingCancelRequest | None = None,
    authorization: str | None = Header(default=None),
):
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(status_code=400, detail="ID đơn không hợp lệ")

    booking = await db["bookings"].find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn đặt phòng")

    current_status = booking.get("status", "")
    cancellable = {"pending", "confirmed", "CHO_DUYET", "DA_DUYET", "DANG_MUON"}
    if current_status not in cancellable:
        raise HTTPException(
            status_code=400,
            detail=f"Không thể hủy đơn ở trạng thái '{current_status}'. "
            f"Chỉ đơn đang chờ duyệt hoặc đã duyệt mới được hủy.",
        )

    cancel_reason = ""
    if cancel_request:
        cancel_reason = cancel_request.cancel_reason.strip()

    await db["bookings"].update_one(
        {"_id": ObjectId(booking_id)},
        {
            "$set": {
                # "status": "cancelled",
                "status": "DA_HUY",
                "cancel_reason": cancel_reason,
                "cancelled_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    updated = await db["bookings"].find_one({"_id": ObjectId(booking_id)})
    updated = _serialize_booking(updated)

    updated["room"] = await _get_room_info(updated.get("room_id", ""))
    return updated
