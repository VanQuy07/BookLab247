import os
import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from dotenv import load_dotenv
from app.core.database import db

# 1. Tải các biến môi trường (Khóa bảo mật Cloudinary) từ file .env
load_dotenv()

# 2. Khởi tạo kết nối với Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

router = APIRouter()

class LabCreate(BaseModel):
    title: str
    capacity: str
    priceText: str
    price: str
    imageUrl: str

# ==========================================
# API LẤY DANH SÁCH PHÒNG TỪ MONGODB
# ==========================================
@router.get("")
async def get_all_labs():
    labs = []
    cursor = db["labs"].find({})
    async for document in cursor:
        document["id"] = str(document["_id"])
        del document["_id"]
        labs.append(document)
    return labs

# ==========================================
# API THÊM PHÒNG MỚI VÀO MONGODB
# ==========================================
@router.post("")
async def create_lab(lab_data: LabCreate):
    new_lab = lab_data.model_dump()
    result = await db["labs"].insert_one(new_lab)
    
    # 1. Ép kiểu ID thành chuỗi cho Frontend dễ dùng
    new_lab["id"] = str(result.inserted_id)
    
    # 2. Xóa bỏ cái trường _id gốc của MongoDB đi để FastAPI không bị lỗi
    del new_lab["_id"] 
    
    return new_lab

# ==========================================
# API UPLOAD ẢNH (CHỈ LƯU LÊN CLOUDINARY)
# ==========================================
@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Code mới: Đẩy thẳng file lên Cloudinary, bỏ qua ổ cứng
        upload_result = cloudinary.uploader.upload(file.file)
        
        # Lấy đường link HTTPS an toàn do Cloudinary trả về
        secure_url = upload_result.get("secure_url")
        
        return {"imageUrl": secure_url}
        
    except Exception as e:
        print("Lỗi upload ảnh:", str(e))
        raise HTTPException(status_code=500, detail="Không thể tải ảnh lên Cloudinary!")