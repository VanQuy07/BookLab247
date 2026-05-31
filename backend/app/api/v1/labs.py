from fastapi import APIRouter, HTTPException, status
from typing import List
from bson import ObjectId

# Import đúng chuẩn theo cấu trúc mới
from app.schemas.lab import LabCreate, LabResponse
from app.models.lab import LAB_COLLECTION_NAME, lab_helper
from app.core.database import db

router = APIRouter()
labs_collection = db[LAB_COLLECTION_NAME]


@router.get("/", response_model=List[LabResponse])
async def get_all_labs():
    labs = []
    cursor = labs_collection.find()
    async for lab in cursor:
        labs.append(lab_helper(lab))
    return labs


@router.post("/", response_model=LabResponse, status_code=status.HTTP_201_CREATED)
async def create_lab(lab_data: LabCreate):
    new_lab_dict = lab_data.dict()
    result = await labs_collection.insert_one(new_lab_dict)

    inserted_lab = await labs_collection.find_one({"_id": result.inserted_id})
    if inserted_lab:
        return lab_helper(inserted_lab)
    raise HTTPException(status_code=500, detail="Không thể thêm phòng Lab")


@router.delete("/{lab_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lab(lab_id: str):
    if not ObjectId.is_valid(lab_id):
        raise HTTPException(status_code=400, detail="ID không hợp lệ")

    delete_result = await labs_collection.delete_one({"_id": ObjectId(lab_id)})
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng Lab để xóa")
    return None
