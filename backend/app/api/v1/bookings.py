import os
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.core.database import db
from bson import ObjectId

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


# ================== 1. API TẠO ĐƠN ĐẶT PHÒNG ==================
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
    
    # Gán trạng thái mặc định là "pending" (Chờ duyệt) cho đơn mới
    new_booking_data["status"] = "pending"

    result = await db["bookings"].insert_one(new_booking_data)
    new_booking_data["id"] = str(result.inserted_id)
    del new_booking_data["_id"]

    return {"message": "Đặt lịch thành công!", "data": new_booking_data}


# ================== 2. API LẤY LỊCH SỬ ĐƠN ==================
@router.get("")
async def get_bookings():
    # 1. Kéo toàn bộ danh sách đơn từ MongoDB
    bookings_cursor = db["bookings"].find().sort("date", -1) # Sắp xếp ngày mới nhất lên đầu
    bookings_list = await bookings_cursor.to_list(length=100) # Lấy tạm 100 đơn
    
    # 2. Xử lý ObjectId của MongoDB thành string để Frontend đọc được
    for booking in bookings_list:
        booking["id"] = str(booking["_id"])
        del booking["_id"]
        
    # 3. Trả về đúng định dạng mảng (Array) mà Frontend đang chờ
    return bookings_list

# ================== 3. API DUYỆT / TỪ CHỐI ĐƠN ==================
class BookingStatusUpdate(BaseModel):
    status: str  # Frontend sẽ gửi lên "confirmed" (Duyệt) hoặc "cancelled" (Từ chối)

@router.patch("/{booking_id}/status")
async def update_booking_status(booking_id: str, status_update: BookingStatusUpdate):
    # Kiểm tra ID có hợp lệ với MongoDB không
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(status_code=400, detail="ID đơn hàng không hợp lệ")

    # Cập nhật trạng thái mới vào Database
    result = await db["bookings"].update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {"status": status_update.status}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn đặt phòng này trong Database")

    return {"message": f"Đã cập nhật trạng thái thành: {status_update.status}"}