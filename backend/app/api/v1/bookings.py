import os
import redis.asyncio as redis
from redis.asyncio.lock import Lock
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.core.database import db

router = APIRouter()

# Khởi tạo kết nối Redis (Bạn nhớ cài thư viện: pip install redis)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(REDIS_URL)


class BookingCreate(BaseModel):
    room_id: str
    customer_name: str
    phone: str
    date: str  # YYYY-MM-DD
    start_time: str  # HH:mm
    duration_mins: int
    buffer_mins: int = 15
    note: str = ""


# Hàm tiện ích: Đổi "HH:mm" thành số phút để dễ so sánh
def time_to_mins(time_str: str) -> int:
    h, m = map(int, time_str.split(":"))
    return h * 60 + m


@router.post("")
async def create_booking(booking: BookingCreate):
    # 1. Quy đổi thời gian ra số phút
    new_start = time_to_mins(booking.start_time)
    new_end_with_buffer = new_start + booking.duration_mins + booking.buffer_mins

    # 2. THỰC HIỆN GIẢI PHÁP 2B: Tạo Khóa Redis (Distributed Lock)
    # Khóa này giới hạn theo từng Phòng và từng Ngày cụ thể
    lock_key = f"lock:booking:room:{booking.room_id}:date:{booking.date}"

    # Bật khóa với timeout = 5 giây (tránh bị kẹt vĩnh viễn nếu server sập)
    async with Lock(redis_client, lock_key, timeout=5):
        # 3. THỰC HIỆN GIẢI PHÁP 2A: Truy vấn kiểm tra trùng lặp (MongoDB)
        # Chỉ chạy lệnh này khi đã cầm được "chìa khóa" đi qua cửa Redis
        overlapping_booking = await db["bookings"].find_one(
            {
                "room_id": booking.room_id,
                "date": booking.date,
                # Điều kiện trùng: (Start Cũ < End Mới) VÀ (End Cũ > Start Mới)
                "start_time_mins": {"$lt": new_end_with_buffer},
                "end_time_with_buffer_mins": {"$gt": new_start},
            }
        )

        # Nếu phát hiện trùng lặp -> Từ chối ngay
        if overlapping_booking:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Rất tiếc, phòng đã có người đặt vào khung giờ này trong lúc bạn đang thao tác!",
            )

        # 4. Nếu không trùng -> Chuẩn bị dữ liệu và Lưu (Insert) vào DB
        new_booking_data = booking.model_dump()
        # Lưu thêm 2 trường tính toán sẵn để sau này dễ Query
        new_booking_data["start_time_mins"] = new_start
        new_booking_data["end_time_with_buffer_mins"] = new_end_with_buffer

        result = await db["bookings"].insert_one(new_booking_data)
        new_booking_data["id"] = str(result.inserted_id)
        del new_booking_data["_id"]

        return {"message": "Đặt lịch thành công!", "data": new_booking_data}
