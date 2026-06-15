# from fastapi import APIRouter
# from app.core.database import db

# router = APIRouter()

# @router.get("/stats")
# async def get_dashboard_stats():
#     # 1. Đếm tổng số lượng cực nhanh bằng count_documents
#     # total_users = await db["users"].count_documents({})
#     # total_labs = await db["labs"].count_documents({})


    
#     # 2. Gom nhóm (Aggregation) để đếm số user theo từng Role (Tối ưu hơn vòng lặp)
#     user_roles_cursor = db["users"].aggregate([
#         {"$group": {"_id": "$role", "count": {"$sum": 1}}}
#     ])
#     user_roles = []
#     async for role in user_roles_cursor:
#         # role sẽ có dạng: {"_id": "STUDENT", "count": 150}
#         user_roles.append({"name": role["_id"], "value": role["count"]})

#     # 3. Tính tổng thiết bị và thiết bị đang mượn
#     equipment_stats_cursor = db["equipments"].aggregate([
#         {"$group": {
#             "_id": None, 
#             "total_qty": {"$sum": "$totalQuantity"},
#             "in_use_qty": {"$sum": "$inUseQuantity"}
#         }}
#     ])
    
#     eq_stats = {"total": 0, "in_use": 0}
#     async for stat in equipment_stats_cursor:
#         eq_stats["total"] = stat.get("total_qty", 0)
#         eq_stats["in_use"] = stat.get("in_use_qty", 0)

#     # 4. Trả về ĐÚNG MỘT CỤC data nhỏ gọn cho Frontend
#     return {
#         "total_users": total_users,
#         "total_labs": total_labs,
#         "total_equipments": eq_stats["total"],
#         "in_use_equipments": eq_stats["in_use"],
#         "user_roles_data": user_roles,
#         "equipment_status_data": [
#             {"name": "Sẵn sàng", "value": eq_stats["total"] - eq_stats["in_use"]},
#             {"name": "Đang mượn", "value": eq_stats["in_use"]}
#         ]
#     }

from fastapi import APIRouter, Query
from datetime import datetime, timedelta, timezone
from app.core.database import db
from bson import ObjectId

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(time_range: str = Query("today")):
    now = datetime.now(timezone.utc)
    
    # 1. Xác định mốc thời gian
    if time_range == "yesterday":
        start_date = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = (now - timedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=999)
    elif time_range == "7days":
        start_date = now - timedelta(days=7)
        end_date = now
    elif time_range == "month":
        start_date = now - timedelta(days=30)
        end_date = now
    else: # Default today
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now

    date_filter = {"created_at": {"$gte": start_date, "$lte": end_date}}

    # 2. Thống kê Thiết bị
    eq_stats_cursor = db["equipments"].aggregate([
        {"$group": {
            "_id": None, 
            "total_qty": {"$sum": "$totalQuantity"},
            "in_use_qty": {"$sum": "$inUseQuantity"}
        }}
    ])
    
    total_eq = 0
    in_use_eq = 0
    async for stat in eq_stats_cursor:
        total_eq = stat.get("total_qty", 0)
        in_use_eq = stat.get("in_use_qty", 0)

    # 3. Thống kê Phòng Lab
    total_labs_count = await db["labs"].count_documents({})
    # Đếm số đơn đặt phòng đang ở trạng thái DANG_MUON trong khoảng thời gian lọc
    in_use_labs = await db["bookings"].count_documents({
        "status": "DANG_MUON",
        "created_at": {"$gte": start_date, "$lte": end_date}
    })

    # 4. Thống kê User và Phòng ưa chuộng (dữ liệu bổ sung)
    total_users = await db["users"].count_documents(date_filter)
    
    lab_usage_cursor = db["bookings"].aggregate([
        {"$match": {"created_at": {"$gte": start_date, "$lte": end_date}}},
        {"$group": {"_id": "$room_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ])
    
    popular_labs = []
    async for lab in lab_usage_cursor:
        room_info = await db["labs"].find_one({"_id": ObjectId(lab["_id"])})
        room_name = room_info.get("name", "Phòng Lab") if room_info else "Phòng lạ"
        popular_labs.append({"name": room_name, "value": lab["count"]})

    return {
        "total_users": total_users,
        "total_labs": total_labs_count,
        "total_equipments": total_eq,
        "in_use_equipments": in_use_eq,
        "equipment_stats": [
            {"name": "Sẵn sàng", "value": max(0, total_eq - in_use_eq)},
            {"name": "Đang mượn", "value": in_use_eq}
        ],
        "lab_stats": [
            {"name": "Sẵn sàng", "value": max(0, total_labs_count - in_use_labs)},
            {"name": "Đang mượn", "value": in_use_labs}
        ],
        "popular_labs_data": popular_labs if popular_labs else [{"name": "Chưa có dữ liệu", "value": 1}]
    }