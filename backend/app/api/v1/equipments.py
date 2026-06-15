from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.core.database import db
from bson import ObjectId
from fastapi import HTTPException

router = APIRouter()


class EquipmentCreate(BaseModel):
    name: str
    category: str
    managementType: str  # "serial" hoặc "pool"
    serialNumber: Optional[str] = ""
    totalQuantity: int
    inUseQuantity: int = 0
    status: str  # "available", "maintenance", "liquidated"
    maintenanceAlertHours: int
    imageUrl: str
    roomId: Optional[str] = ""
    pricePerHour: int = 0
    category: Optional[str] = None


@router.get("")
async def get_all_equipments():
    equipments = []
    
    # 1. Lấy tất cả thiết bị
    cursor = db["equipments"].find({})
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        
        # 2. Xử lý logic tên phòng (location)
        room_id = doc.get("roomId")
        if room_id and ObjectId.is_valid(room_id):
            # Tìm tên phòng tương ứng trong collection "rooms"
            room = await db["labs"].find_one({"_id": ObjectId(room_id)})
            if room:
                # Ưu tiên lấy 'name', nếu không có thì lấy 'title'
                doc["location"] = room.get("name") or room.get("title") or "Phòng không tên"
            else:
                doc["location"] = "Phòng không tồn tại"
        else:
            doc["location"] = "Trong kho" # Nếu không có roomId
            
        equipments.append(doc)
        
    return equipments

@router.post("")
async def create_equipment(eq_data: EquipmentCreate):
    new_eq = eq_data.model_dump()
    result = await db["equipments"].insert_one(new_eq)
    new_eq["id"] = str(result.inserted_id)
    del new_eq["_id"]
    return new_eq


# ==========================================
# API SỬA THÔNG TIN THIẾT BỊ
# ==========================================
@router.put("/{eq_id}")
async def update_equipment(eq_id: str, eq_data: EquipmentCreate):
    try:
        updated_data = eq_data.model_dump()
        result = await db["equipments"].update_one(
            {"_id": ObjectId(eq_id)},
            {"$set": updated_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Không tìm thấy thiết bị để sửa!")
            
        return {"message": "Cập nhật thiết bị thành công", "id": eq_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail="ID thiết bị không hợp lệ hoặc lỗi DB")

# ==========================================
# API XÓA THIẾT BỊ
# ==========================================
@router.delete("/{eq_id}")
async def delete_equipment(eq_id: str):
    try:
        result = await db["equipments"].delete_one({"_id": ObjectId(eq_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Không tìm thấy thiết bị để xóa!")
            
        return {"message": "Xóa thiết bị thành công"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="ID thiết bị không hợp lệ hoặc lỗi DB")