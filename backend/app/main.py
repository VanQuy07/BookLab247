from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # THÊM DÒNG NÀY
from contextlib import asynccontextmanager
from app.core.database import client
from app.api.v1.router import api_router 
import os # THÊM DÒNG NÀY

# Tự động tạo thư mục "uploads" nếu chưa có
os.makedirs("uploads", exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await client.admin.command('ping')
        print("✅ Kết nối MongoDB thành công!")
    except Exception as e:
        print("❌ Lỗi kết nối MongoDB:", e)
    yield 
    client.close()
    print("💤 Đã đóng kết nối MongoDB.")

app = FastAPI(lifespan=lifespan, title="BookLab247 API")

# Cho phép Frontend xem ảnh trong thư mục "uploads"
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# MỞ CỬA CORS CHO FRONTEND
app.add_middleware(
    CORSMiddleware,
    # THÊM CẢ LOCALHOST VÀ 127.0.0.1 VÀO ĐÂY
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")