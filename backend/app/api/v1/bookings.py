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
        room["id"] = str(room["_id"])
        room.pop("_id", None)
    return room or {}


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
    return _serialize_booking(created)


# ================== 2. LẤY TẤT CẢ (ADMIN) ==================
@router.get("")
async def get_bookings(
    authorization: str | None = Header(default=None),
):
    bookings_cursor = db["bookings"].find().sort("created_at", -1)
    bookings_list = await bookings_cursor.to_list(length=500)
    results = []
    for doc in bookings_list:
        doc = _serialize_booking(doc)
        room = _get_room_info(doc.get("room_id", ""))
        doc["room"] = room
        results.append(doc)
    return results


# ================== 3. LẤY ĐƠN CỦA USER ĐANG ĐĂNG NHẬP ==================
@router.get("/me")
async def get_my_bookings(
    user_id: str,
    authorization: str | None = Header(default=None),
):
    if not user_id or not user_id.strip():
        raise HTTPException(status_code=400, detail="Thiếu user_id")

    bookings_cursor = db["bookings"].find(
        {"user_id": user_id.strip()}
    ).sort("created_at", -1)
    bookings_list = await bookings_cursor.to_list(length=500)
    results = []
    for doc in bookings_list:
        doc = _serialize_booking(doc)
        room = _get_room_info(doc.get("room_id", ""))
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

    normalized = status_update.status.strip().lower()
    if normalized in ("confirmed", "duyệt", "đã duyệt", "approved"):
        new_status = "confirmed"
    elif normalized in ("rejected", "từ chối", "bị từ chối", "bi_tu_choi"):
        new_status = "rejected"
    else:
        new_status = status_update.status

    update_data = {
        "status": new_status,
        "updated_at": datetime.now(timezone.utc),
    }
    if new_status == "rejected":
        update_data["rejection_reason"] = status_update.status

    result = await db["bookings"].update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        raise HTTPException(
            status_code=404, detail="Không tìm thấy đơn đặt phòng"
        )

    updated = await db["bookings"].find_one({"_id": ObjectId(booking_id)})
    return _serialize_booking(updated)


# ================== 5. USER TỰ HỦY ĐƠN ==================
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
    return _serialize_booking(updated)
