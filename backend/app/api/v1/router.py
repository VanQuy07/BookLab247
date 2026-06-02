from fastapi import APIRouter
from app.api.v1 import labs, devices, auth

api_router = APIRouter()

# API Đăng nhập / Đăng ký
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# API Phòng Lab
api_router.include_router(labs.router, prefix="/labs", tags=["labs"]) 
api_router.include_router(devices.router, prefix="/devices", tags=["Devices"])