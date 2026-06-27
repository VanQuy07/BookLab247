from fastapi import APIRouter
from app.api.v1 import auth, labs, equipments, bookings, dashboard, reports

api_router = APIRouter()

# API Đăng nhập / Đăng ký
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# API Phòng Lab
api_router.include_router(labs.router, prefix="/labs", tags=["labs"])

# API Thiết bị
api_router.include_router(equipments.router, prefix="/equipments", tags=["equipments"])

# API Dashboard
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])

# API Đặt phòng
api_router.include_router(
    bookings.router, prefix="/bookings", tags=["bookings"]
)

# API Báo cáo
api_router.include_router(
    reports.router,
    prefix="/reports",
    tags=["Reports"]
)