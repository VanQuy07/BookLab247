from fastapi import APIRouter
from app.core.database import db

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats():
    # 1. Đếm tổng số lượng cực nhanh bằng count_documents
    total_users = await db["users"].count_documents({})
    total_labs = await db["labs"].count_documents({})
    
    # 2. Gom nhóm (Aggregation) để đếm số user theo từng Role (Tối ưu hơn vòng lặp)
    user_roles_cursor = db["users"].aggregate([
        {"$group": {"_id": "$role", "count": {"$sum": 1}}}
    ])
    user_roles = []
    async for role in user_roles_cursor:
        # role sẽ có dạng: {"_id": "STUDENT", "count": 150}
        user_roles.append({"name": role["_id"], "value": role["count"]})

    # 3. Tính tổng thiết bị và thiết bị đang mượn
    equipment_stats_cursor = db["equipments"].aggregate([
        {"$group": {
            "_id": None, 
            "total_qty": {"$sum": "$totalQuantity"},
            "in_use_qty": {"$sum": "$inUseQuantity"}
        }}
    ])
    
    eq_stats = {"total": 0, "in_use": 0}
    async for stat in equipment_stats_cursor:
        eq_stats["total"] = stat.get("total_qty", 0)
        eq_stats["in_use"] = stat.get("in_use_qty", 0)

    # 4. Trả về ĐÚNG MỘT CỤC data nhỏ gọn cho Frontend
    return {
        "total_users": total_users,
        "total_labs": total_labs,
        "total_equipments": eq_stats["total"],
        "in_use_equipments": eq_stats["in_use"],
        "user_roles_data": user_roles,
        "equipment_status_data": [
            {"name": "Sẵn sàng", "value": eq_stats["total"] - eq_stats["in_use"]},
            {"name": "Đang mượn", "value": eq_stats["in_use"]}
        ]
    }