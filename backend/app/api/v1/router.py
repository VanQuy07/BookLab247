from fastapi import APIRouter
from app.api.v1 import labs

api_router = APIRouter()

# Đăng ký router labs vào router tổng
api_router.include_router(labs.router, prefix="/labs", tags=["Phòng Lab"])
