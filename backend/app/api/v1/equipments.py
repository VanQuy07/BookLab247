from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.core.database import db

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


@router.get("")
async def get_all_equipments():
    equipments = []
    cursor = db["equipments"].find({})
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        equipments.append(doc)
    return equipments


@router.post("")
async def create_equipment(eq_data: EquipmentCreate):
    new_eq = eq_data.model_dump()
    result = await db["equipments"].insert_one(new_eq)
    new_eq["id"] = str(result.inserted_id)
    del new_eq["_id"]
    return new_eq
