from fastapi import APIRouter
from app.api.v1 import auth, labs, equipments, bookings  # Bổ sung thêm labs ở đây

api_router = APIRouter()

# API Đăng nhập / Đăng ký
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# API Phòng Lab
api_router.include_router(labs.router, prefix="/labs", tags=["labs"])  # Thêm dòng này

# API Thiết bị
api_router.include_router(equipments.router, prefix="/equipments", tags=["equipments"])

# API Đặt phòng (Thêm mới)
api_router.include_router(
    bookings.router, prefix="/bookings", tags=["bookings"]
)  # <-- Thêm dòng này
