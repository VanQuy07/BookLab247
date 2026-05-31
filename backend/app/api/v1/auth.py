from fastapi import APIRouter, HTTPException, status
from datetime import datetime, timezone
from pydantic import BaseModel # Thêm thư viện này để tạo form Đăng nhập
from app.schemas.user import UserCreate, UserResponse
from app.core.database import db
from app.core.security import get_password_hash, verify_password # Bổ sung thêm hàm verify_password

router = APIRouter()

# ==========================================
# 1. API ĐĂNG KÝ TÀI KHOẢN (REGISTER)
# ==========================================
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate):
    # 1. Kiểm tra xem Email này đã có ai dùng chưa
    existing_user = await db["users"].find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email này đã được đăng ký!")

    # 2. Băm mật khẩu cho an toàn
    hashed_password = get_password_hash(user_data.password)

    # 3. Chuẩn bị gói dữ liệu để ném vào MongoDB
    new_user = {
        "full_name": user_data.full_name,
        "email": user_data.email,
        "password": hashed_password,
        "role": user_data.role,
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }

    # 4. Lưu vào Database
    result = await db["users"].insert_one(new_user)
    
    # 5. Lấy chính user vừa tạo ra để trả về (nhờ UserResponse, nó sẽ tự động giấu password đi)
    created_user = await db["users"].find_one({"_id": result.inserted_id})
    created_user["_id"] = str(created_user["_id"]) # Đổi ObjectId thành string
    
    return created_user


# ==========================================
# 2. API ĐĂNG NHẬP (LOGIN)
# ==========================================
# Khai báo form hứng dữ liệu Đăng nhập từ Frontend gửi xuống
class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login_user(login_data: LoginRequest):
    # ==========================================
    # 1. TÀI KHOẢN ADMIN CỐ ĐỊNH 
    # ==========================================
    if login_data.email == "admin@booklab247.com" and login_data.password == "admin123":
        return {
            "message": "Đăng nhập Admin thành công!",
            "access_token": "token_dac_quyen_cua_admin",
            "user_name": "Quản Trị Viên",
            "role": "ADMIN"
        }
    # ==========================================
    # 2. TÀI KHOẢN QUẢN LÝ (MANAGER) CỐ ĐỊNH 
    # ==========================================
    if login_data.email == "manager@booklab247.com" and login_data.password == "manager123":
        return {
            "message": "Đăng nhập Quản lý thành công!",
            "access_token": "token_dac_quyen_cua_manager",
            "user_name": "Quản Lý Lab",
            "role": "MANAGER" # <-- Lưu ý role ở đây là MANAGER
        }

    # ==========================================
    # 2. KIỂM TRA TÀI KHOẢN SINH VIÊN (MongoDB)
    # ==========================================
    user = await db["users"].find_one({"email": login_data.email})
    
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Email hoặc mật khẩu không chính xác!")
    
    return {
        "message": "Đăng nhập thành công!",
        "access_token": f"token_cua_{user['_id']}",
        "user_name": user["full_name"],
        "role": user["role"]
    }