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


class BookingCancelRequest(BaseModel):
    cancel_reason: str = ""


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


def _get_room_info(room_id: str) -> dict:
    try:
        room = db["labs"].find_one({"_id": ObjectId(room_id)})
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


def _auto_update_booking_statuses():
    """Tự động chuyển trạng thái đơn đặt phòng theo thời gian."""
    now = datetime.now(timezone.utc)
    updated_count = 0

    # Chuyển DA_DUYET -> DANG_MUON (đến giờ bắt đầu)
    pending_to_active = db["bookings"].find({
        "status": "DA_DUYET",
    })
    for booking in pending_to_active:
        booking_datetime = _parse_booking_datetime(booking.get("date", ""), booking.get("start_time", ""))
        if booking_datetime and now >= booking_datetime:
            db["bookings"].update_one(
                {"_id": booking["_id"]},
                {"$set": {"status": "DANG_MUON", "updated_at": now}}
            )
            updated_count += 1

    # Chuyển DANG_MUON -> DA_XONG (hết giờ mượn)
    active_to_done = db["bookings"].find({
        "status": "DANG_MUON",
    })
    for booking in active_to_done:
        end_time = _get_end_time(
            booking.get("start_time", ""),
            booking.get("duration_mins", 0),
            booking.get("buffer_mins", 0)
        )
        end_datetime = _parse_booking_datetime(booking.get("date", ""), end_time)
        if end_datetime and now >= end_datetime:
            db["bookings"].update_one(
                {"_id": booking["_id"]},
                {"$set": {"status": "DA_XONG", "updated_at": now}}
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


# ================== 1. TẠO ĐƠN ==================
@router.post("")
async def create_booking(booking: BookingCreate):
    new_start = time_to_mins(booking.start_time)
    new_end_with_buffer = (
        new_start + booking.duration_mins + booking.buffer_mins
    )

    overlapping = await db["bookings"].find_one(
        {
            "room_id": booking.room_id,
            "date": booking.date,
            "start_time_mins": {"$lt": new_end_with_buffer},
            "end_time_with_buffer_mins": {"$gt": new_start},
            "status": {"$in": ["pending", "confirmed", "CHO_DUYET", "DA_DUYET", "DANG_MUON"]},
        }
    )
    if overlapping:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Phòng đã có người đặt vào khung giờ này!",
        )

    new_booking_data = booking.model_dump()
    new_booking_data["start_time_mins"] = new_start
    new_booking_data["end_time_with_buffer_mins"] = new_end_with_buffer
    new_booking_data["status"] = "pending"
    new_booking_data["rejection_reason"] = None
    new_booking_data["cancel_reason"] = None
    new_booking_data["created_at"] = datetime.now(timezone.utc)
    new_booking_data["updated_at"] = datetime.now(timezone.utc)

    result = await db["bookings"].insert_one(new_booking_data)
    created = await db["bookings"].find_one({"_id": result.inserted_id})
    created = _serialize_booking(created)
    created["room"] = _get_room_info(booking.room_id)
    return created


# ================== 2. LẤY TẤT CẢ (ADMIN) ==================
# ================== 2. LẤY TẤT CẢ (ADMIN) - ĐÃ MERGE ==================
@router.get("")
async def get_bookings(
    authorization: str | None = Header(default=None),
):
    # 1. Tự động cập nhật trạng thái theo giờ (Từ nhánh Master)
    _auto_update_booking_statuses()

    # 2. Lấy danh sách đơn (Từ nhánh Master)
    bookings_cursor = db["bookings"].find().sort("created_at", -1)
    bookings_list = await bookings_cursor.to_list(length=500)
    
    # 3. Lấy ngày hiện tại và ca đã duyệt (Từ nhánh của Hằng)
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    # Cập nhật thêm các status tiếng Việt của nhánh master vào danh sách đối chiếu
    confirmed_statuses = ["confirmed", "checked-in", "CHO_DUYET", "DA_DUYET", "DANG_MUON"]
    confirmed_bookings = [b for b in bookings_list if b.get("status") in confirmed_statuses]

    results = []
    for doc in bookings_list:
        # 4. Serialize và gắn thông tin phòng (Từ nhánh Master)
        doc = _serialize_booking(doc)
        room = _get_room_info(doc.get("room_id", ""))
        doc["room"] = room
        
        # 5. Xử lý logic Đơn khẩn và Trùng lịch (Từ nhánh của Hằng)
        doc["is_urgent"] = (doc.get("date") == today_str)
        doc["is_conflict"] = False
        doc["conflict_with"] = ""
        
        if doc.get("status") in ["pending", "CHO_DUYET"]:
            b_start = doc.get("start_time_mins", 0)
            b_end = doc.get("end_time_with_buffer_mins", 0)
            
            for cb in confirmed_bookings:
                if cb.get("room_id") == doc.get("room_id") and cb.get("date") == doc.get("date"):
                    cb_start = cb.get("start_time_mins", 0)
                    cb_end = cb.get("end_time_with_buffer_mins", 0)
                    
                    if b_start < cb_end and b_end > cb_start:
                        doc["is_conflict"] = True
                        doc["conflict_with"] = cb.get("customer_name", "Khách ẩn danh")
                        break
                        
        results.append(doc)
        
    return results


# ================== 3. API DUYỆT / TỪ CHỐI ĐƠN - ĐÃ MERGE ==================
# Giữ class của Hằng để nhận cancel_reason
class BookingStatusUpdate(BaseModel):
    status: str
    cancel_reason: str = ""

@router.patch("/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    status_update: BookingStatusUpdate,
    authorization: str | None = Header(default=None),
):
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(status_code=400, detail="ID đơn không hợp lệ")

    # Chuẩn hóa status của Master + Frontend của Hằng đang gửi "cancelled"
    normalized = status_update.status.strip().lower()
    if normalized in ("confirmed", "duyệt", "đã duyệt", "approved"):
        new_status = "confirmed"
    elif normalized in ("rejected", "từ chối", "bị từ chối", "bi_tu_choi", "cancelled"):
        new_status = "cancelled"
    else:
        new_status = status_update.status

    update_data = {
        "status": new_status,
        "updated_at": datetime.now(timezone.utc),
    }
    
    # Ghi nhận lý do hủy của Hằng
    if new_status == "cancelled":
        update_data["rejection_reason"] = status_update.status
        if status_update.cancel_reason:
            update_data["cancel_reason"] = status_update.cancel_reason

    result = await db["bookings"].update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": update_data},
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=404, detail="Không tìm thấy đơn đặt phòng"
        )

    # Trả về data đầy đủ để Master không bị lỗi
    updated = await db["bookings"].find_one({"_id": ObjectId(booking_id)})
    updated = _serialize_booking(updated)
    updated["room"] = _get_room_info(updated.get("room_id", ""))
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
                "status": "cancelled",
                "cancel_reason": cancel_reason,
                "cancelled_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    updated = await db["bookings"].find_one({"_id": ObjectId(booking_id)})
    updated = _serialize_booking(updated)
    updated["room"] = _get_room_info(updated.get("room_id", ""))
    return updated