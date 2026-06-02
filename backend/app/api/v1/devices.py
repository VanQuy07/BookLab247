from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.database import db
from bson import ObjectId

router = APIRouter()

class DeviceCreate(BaseModel):
    name: str
    status: str = "Available" # Available, Maintenance, Broken
    lab_id: str = ""
    imageUrl: str = ""          # Lưu ID của phòng, nếu trống là đang ở kho

@router.get("")
async def get_all_devices():
    devices = []
    cursor = db["devices"].find({})
    async for document in cursor:
        document["id"] = str(document["_id"])
        del document["_id"]
        devices.append(document)
    return devices

@router.post("")
async def create_device(device_data: DeviceCreate):
    new_device = device_data.model_dump()
    result = await db["devices"].insert_one(new_device)
    
    new_device["id"] = str(result.inserted_id)
    del new_device["_id"]
    return new_device

@router.put("/{device_id}")
async def update_device(device_id: str, device_data: DeviceCreate):
    try:
        updated_data = device_data.model_dump()
        result = await db["devices"].update_one(
            {"_id": ObjectId(device_id)}, 
            {"$set": updated_data}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Không tìm thấy thiết bị")
        return {"message": "Cập nhật thiết bị thành công!"}
    except Exception:
        raise HTTPException(status_code=400, detail="ID Thiết bị không hợp lệ")

@router.delete("/{device_id}")
async def delete_device(device_id: str):
    try:
        result = await db["devices"].delete_one({"_id": ObjectId(device_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Không tìm thấy thiết bị")
        return {"message": "Xóa thiết bị thành công!"}
    except Exception:
        raise HTTPException(status_code=400, detail="ID Thiết bị không hợp lệ")