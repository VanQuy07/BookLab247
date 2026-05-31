from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.core.database import db
import shutil
import uuid

router = APIRouter()

class LabCreate(BaseModel):
    title: str
    capacity: str
    priceText: str
    price: str
    imageUrl: str

# Chú ý: Bỏ dấu gạch chéo đi (thành chuỗi rỗng "")
@router.get("")
async def get_all_labs():
    labs = []
    cursor = db["labs"].find({})
    async for document in cursor:
        document["id"] = str(document["_id"])
        del document["_id"]
        labs.append(document)
    return labs

# Chú ý: Bỏ dấu gạch chéo đi
@router.post("")
async def create_lab(lab_data: LabCreate):
    new_lab = lab_data.model_dump()
    result = await db["labs"].insert_one(new_lab)
    
    # 1. Ép kiểu ID thành chuỗi cho Frontend dễ dùng
    new_lab["id"] = str(result.inserted_id)
    
    # 2. Xóa bỏ cái trường _id gốc của MongoDB đi để FastAPI không bị lỗi
    del new_lab["_id"] 
    
    return new_lab

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    try:
        file_extension = file.filename.split(".")[-1]
        new_file_name = f"{uuid.uuid4()}.{file_extension}"
        file_path = f"uploads/{new_file_name}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"imageUrl": f"http://127.0.0.1:8000/uploads/{new_file_name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Không thể lưu ảnh!")