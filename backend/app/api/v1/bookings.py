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
    bookings_cursor = db["bookings"].find().sort("date", -1)
    bookings_list = await bookings_cursor.to_list(length=100)
    
    # --- ĐOẠN THÊM MỚI 1: Lấy ngày hiện tại và danh sách ca đã duyệt ổn định ---
    today_str = datetime.now().strftime("%Y-%m-%d")
    confirmed_bookings = [b for b in bookings_list if b.get("status") in ["confirmed", "checked-in"]]

    for booking in bookings_list:
        booking["id"] = str(booking["_id"])
        del booking["_id"]
        
        # --- ĐOẠN THÊM MỚI 2: Tính toán thuộc tính động trước khi trả về ---
        booking["is_urgent"] = (booking.get("date") == today_str) # Đơn khẩn trong ngày
        booking["is_conflict"] = False
        booking["conflict_with"] = ""
        
        if booking.get("status") == "pending":
            b_start = booking.get("start_time_mins", 0)
            b_end = booking.get("end_time_with_buffer_mins", 0)
            
            # Quét đối chiếu với các đơn đã duyệt xem có bị đè khung giờ không
            for cb in confirmed_bookings:
                if cb.get("room_id") == booking.get("room_id") and cb.get("date") == booking.get("date"):
                    cb_start = cb.get("start_time_mins", 0)
                    cb_end = cb.get("end_time_with_buffer_mins", 0)
                    
                    if b_start < cb_end and b_end > cb_start:
                        booking["is_conflict"] = True
                        booking["conflict_with"] = cb.get("customer_name", "Khách ẩn danh")
                        break
                        
    return bookings_list

# ================== 3. API DUYỆT / TỪ CHỐI ĐƠN ==================
class BookingStatusUpdate(BaseModel):
    status: str  # Frontend sẽ gửi lên "confirmed" (Duyệt) hoặc "cancelled" (Từ chối)
    cancel_reason: str = ""

@router.patch("/{booking_id}/status")
async def update_booking_status(booking_id: str, status_update: BookingStatusUpdate):
    # Kiểm tra ID có hợp lệ với MongoDB không
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(status_code=400, detail="ID đơn hàng không hợp lệ")

    # Cập nhật trạng thái mới vào Database
    # result = await db["bookings"].update_one(
    #     {"_id": ObjectId(booking_id)},
    #     {"$set": {"status": status_update.status}}
    # )

    # if result.matched_count == 0:
    #     raise HTTPException(status_code=404, detail="Không tìm thấy đơn đặt phòng này trong Database")

    # return {"message": f"Đã cập nhật trạng thái thành: {status_update.status}"}
    
    update_data = {"status": status_update.status}
    
    if status_update.status == "cancelled" and status_update.cancel_reason:
        update_data["cancel_reason"] = status_update.cancel_reason

    result = await db["bookings"].update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": update_data} 
    )