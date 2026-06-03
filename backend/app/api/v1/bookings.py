import os
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.core.database import db

router = APIRouter()


class BookingCreate(BaseModel):
    room_id: str
    customer_name: str
    phone: str
    date: str
    start_time: str
    duration_mins: int
    buffer_mins: int = 15
    note: str = ""
    equipments: list = []  # Thêm list thiết bị để không bị lỗi 422


def time_to_mins(time_str: str) -> int:
    h, m = map(int, time_str.split(":"))
    return h * 60 + m


@router.post("")
async def create_booking(booking: BookingCreate):
    new_start = time_to_mins(booking.start_time)
    new_end_with_buffer = new_start + booking.duration_mins + booking.buffer_mins

    # 1. Truy vấn kiểm tra trùng lặp (MongoDB)
    overlapping_booking = await db["bookings"].find_one(
        {
            "room_id": booking.room_id,
            "date": booking.date,
            "start_time_mins": {"$lt": new_end_with_buffer},
            "end_time_with_buffer_mins": {"$gt": new_start},
        }
    )

    # Nếu phát hiện trùng lặp -> Từ chối ngay
    if overlapping_booking:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Rất tiếc, phòng đã có người đặt vào khung giờ này!",
        )

    # 2. Nếu không trùng -> Chuẩn bị dữ liệu và Lưu (Insert) vào DB
    new_booking_data = booking.model_dump()
    new_booking_data["start_time_mins"] = new_start
    new_booking_data["end_time_with_buffer_mins"] = new_end_with_buffer

    result = await db["bookings"].insert_one(new_booking_data)
    new_booking_data["id"] = str(result.inserted_id)
    del new_booking_data["_id"]

    return {"message": "Đặt lịch thành công!", "data": new_booking_data}
