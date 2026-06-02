# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.staticfiles import StaticFiles # THÊM DÒNG NÀY
# from contextlib import asynccontextmanager
# from app.core.database import client
# from app.api.v1.router import api_router 
# import os # THÊM DÒNG NÀY

# # Tự động tạo thư mục "uploads" nếu chưa có
# os.makedirs("uploads", exist_ok=True)

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     try:
#         await client.admin.command('ping')
#         print("✅ Kết nối MongoDB thành công!")
#     except Exception as e:
#         print("❌ Lỗi kết nối MongoDB:", e)
#     yield 
#     client.close()
#     print("💤 Đã đóng kết nối MongoDB.")

# app = FastAPI(lifespan=lifespan, title="BookLab247 API")

# # Cho phép Frontend xem ảnh trong thư mục "uploads"
# app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# # MỞ CỬA CORS CHO FRONTEND
# app.add_middleware(
#     CORSMiddleware,
#     # THÊM CẢ LOCALHOST VÀ 127.0.0.1 VÀO ĐÂY
#     allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], 
#     allow_credentials=True,
#     allow_methods=["*"], 
#     allow_headers=["*"],
# )

# app.include_router(api_router, prefix="/api/v1")



from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.core.database import client, db  # <-- THÊM db VÀO ĐÂY
from app.api.v1.router import api_router 
import os

# Tự động tạo thư mục "uploads" nếu chưa có
os.makedirs("uploads", exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        # 1. Kiểm tra kết nối
        await client.admin.command('ping')
        print("✅ Kết nối MongoDB thành công!")
        
        # ==========================================
        # 2. LOGIC TẠO DỮ LIỆU MỒI (SEED DATA)
        # ==========================================
        lab_count = await db["labs"].count_documents({})
        if lab_count == 0:
            print("⚠️ Không tìm thấy dữ liệu phòng! Đang tiến hành tạo Dữ liệu mồi...")
            
            # Thêm Phòng mồi
            lab_data = {
                "title": "Phòng Lab 1 (Mồi)",
                "capacity": "40",
                "priceText": "400.000đ/giờ",
                "price": "400000",
                "imageUrl": "https://via.placeholder.com/800x400.png?text=Phong+Lab+1" 
            }
            lab_result = await db["labs"].insert_one(lab_data)
            lab_id_str = str(lab_result.inserted_id)
            
            # Thêm Thiết bị mồi
            devices_data = [
                {"name": "Máy chiếu Sony A", "status": "Available", "lab_id": lab_id_str},
                {"name": "Micro không dây", "status": "Available", "lab_id": lab_id_str},
                {"name": "Bảng vẽ Wacom (Kho)", "status": "Available", "lab_id": ""}
            ]
            await db["devices"].insert_many(devices_data)
            
            print("✅ Đã tạo dữ liệu mồi thành công! Hãy báo Frontend fetch API.")
        else:
            print("✅ Dữ liệu đã tồn tại, bỏ qua bước Seed Data.")
        # ==========================================
            
    except Exception as e:
        print("❌ Lỗi kết nối MongoDB:", e)
        
    yield # API bắt đầu nhận request tại đây
    
    # Logic khi tắt server
    client.close()
    print("💤 Đã đóng kết nối MongoDB.")

app = FastAPI(lifespan=lifespan, title="BookLab247 API")

# Cho phép Frontend xem ảnh trong thư mục "uploads"
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# MỞ CỬA CORS CHO FRONTEND
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")