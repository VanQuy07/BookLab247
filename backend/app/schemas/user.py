from pydantic import BaseModel, EmailStr, Field
from enum import Enum
from typing import Optional
from datetime import datetime, timezone

# 1. Định nghĩa 3 quyền hạn (RBAC)
class UserRole(str, Enum):
    STUDENT = "STUDENT"
    LECTURER = "LECTURER"
    ADMIN = "ADMIN"

# 2. Form dữ liệu khi người dùng Đăng ký
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.STUDENT  # Mặc định đăng ký mới là Sinh viên

# 3. Form dữ liệu trả về cho Frontend (Che giấu mật khẩu)
class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        populate_by_name = True


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    student_id: Optional[str] = None
    department: Optional[str] = None
    avatar: Optional[str] = None


class UserProfileResponse(UserResponse):
    phone: Optional[str] = None
    student_id: Optional[str] = None
    department: Optional[str] = None
    avatar: Optional[str] = None