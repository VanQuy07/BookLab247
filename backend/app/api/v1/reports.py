from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime
from app.core.database import db

router = APIRouter()


# ==========================
# CREATE REPORT
# ==========================
@router.post("/")
async def create_report(payload: dict):

    report_type = payload.get("type")

    # ==========================
    # VALIDATE TYPE
    # ==========================
    if report_type not in ["ROOM", "EQUIPMENT"]:
        raise HTTPException(status_code=400, detail="Invalid report type")

        # ==========================

    # VALIDATE TITLE
    # ==========================
    if not payload.get("title", "").strip():
        raise HTTPException(status_code=400, detail="Title is required")

    # ==========================
    # VALIDATE DESCRIPTION
    # ==========================
    if not payload.get("description", "").strip():
        raise HTTPException(status_code=400, detail="Description is required")

    # ==========================


    # VALIDATE SEVERITY
    # ==========================
    if payload.get("severity") not in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
        raise HTTPException(status_code=400, detail="Invalid severity")

    room = None
    equipment = None

    # ==========================
    # ROOM REPORT
    # ==========================
    if report_type == "ROOM":

        room_id = payload.get("roomId")

        if not room_id:
            raise HTTPException(status_code=400, detail="roomId required")

        try:
            room = await db.labs.find_one({"_id": ObjectId(room_id)})
        except:
            raise HTTPException(status_code=400, detail="Invalid roomId")

        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        # Chống report trùng
        existing_report = await db.reports.find_one(
            {
                "roomId": room_id,
                "status": {
                    "$in": ["SUBMITTED", "IN_REVIEW", "APPROVED", "IN_PROGRESS"]
                },
            }
        )

        if existing_report:
            raise HTTPException(
                status_code=400, detail="Phòng này đang có báo cáo chưa xử lý"
            )

    # ==========================
    # EQUIPMENT REPORT
    # ==========================
    if report_type == "EQUIPMENT":

        equipment_id = payload.get("equipmentId")

        if not equipment_id:
            raise HTTPException(status_code=400, detail="equipmentId required")

        try:
            equipment = await db.equipments.find_one({"_id": ObjectId(equipment_id)})
        except:
            raise HTTPException(status_code=400, detail="Invalid equipmentId")

        if not equipment:
            raise HTTPException(status_code=404, detail="Equipment not found")

        existing_report = await db.reports.find_one(
            {
                "equipmentId": equipment_id,
                "status": {
                    "$in": ["SUBMITTED", "IN_REVIEW", "APPROVED", "IN_PROGRESS"]
                },
            }
        )

        if existing_report:
            raise HTTPException(
                status_code=400, detail="Thiết bị này đang có báo cáo chưa xử lý"
            )

    # ==========================
    # VALIDATE SEVERITY
    # ==========================
    if payload.get("severity") == "CRITICAL" and len(payload.get("images", [])) == 0:
        raise HTTPException(status_code=400, detail="Critical report requires image")

    # ==========================
    # VALIDATE CREATED BY
    # ==========================
    if not payload.get("createdBy"):
        raise HTTPException(status_code=400, detail="createdBy required")

    # ==========================
    # BUILD REPORT
    # ==========================
    report = {
        "type": payload["type"],
        "title": payload["title"],
        "description": payload["description"],
        "severity": payload["severity"],
        "roomId": payload.get("roomId"),
        "roomName": room["name"] if room else None,
        "equipmentId": payload.get("equipmentId") or None,
        "equipmentName": equipment["name"] if equipment else None,
        "bookingId": payload.get("bookingId"),
        "images": payload.get("images", []),
        "status": "SUBMITTED",
        "createdBy": payload["createdBy"],
        "assignedTo": None,
        "logs": [
            {
                "status": "SUBMITTED",
                "changedBy": payload["createdBy"],
                "message": "Tạo báo cáo",
                "createdAt": datetime.utcnow(),
            }
        ],
        "comments": [],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    result = await db.reports.insert_one(report)

    return {"message": "Tạo báo cáo thành công", "id": str(result.inserted_id)}


# ==========================
# GET ALL REPORTS
# ==========================
@router.get("/")
async def get_reports():

    reports = []

    async for report in db.reports.find():

        report["_id"] = str(report["_id"])

        reports.append(report)

    return reports


# ==========================
# GET MY REPORTS
# ==========================
@router.get("/my/{user_id}")
async def get_my_reports(user_id: str):

    reports = []

    cursor = db.reports.find({"createdBy": user_id})

    async for report in cursor:

        report["_id"] = str(report["_id"])

        reports.append(report)

    return reports


# ==========================
# GET REPORT DETAIL
# ==========================
@router.get("/{report_id}")
async def get_report(report_id: str):

    report = await db.reports.find_one({"_id": ObjectId(report_id)})

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report["_id"] = str(report["_id"])

    return report


# ==========================
# UPDATE STATUS
# ==========================
@router.patch("/{report_id}/status")
async def update_status(report_id: str, payload: dict):

    report = await db.reports.find_one({"_id": ObjectId(report_id)})

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Xác định severity
    new_severity = report.get("severity")
    if payload["status"] == "ESCALATED":
        new_severity = "CRITICAL"
    await db.reports.update_one(
        {"_id": ObjectId(report_id)},
        {
            "$set": {"status": payload["status"], "severity": new_severity, "updatedAt": datetime.utcnow()},
            "$push": {
                "logs": {
                    "status": payload["status"],
                    "changedBy": payload["changedBy"],
                    "message": payload.get("message", ""),
                    "createdAt": datetime.utcnow(),
                }
            },
        },
    )

    return {"message": "Status updated"}


# ==========================
# ASSIGN REPORT
# ==========================
@router.patch("/{report_id}/assign")
async def assign_report(report_id: str, payload: dict):

    await db.reports.update_one(
    {
        "_id": ObjectId(report_id)
    },
    {
        "$set": {
            "assignedTo": payload["assignedTo"],
            "updatedAt": datetime.utcnow()
        },
        "$push": {
            "logs": {
                "status": "ASSIGNED",
                "changedBy": payload.get("changedBy", "SYSTEM"),
                "message": f"Giao cho {payload['assignedTo']}",
                "createdAt": datetime.utcnow()
            }
        }
    }
)

    return {"message": "Assigned"}


# ==========================
# COMMENT
# ==========================
@router.post("/{report_id}/comment")
async def add_comment(report_id: str, payload: dict):

    await db.reports.update_one(
        {"_id": ObjectId(report_id)},
        {
            "$push": {
                "comments": {
                    "userId": payload["userId"],
                    "content": payload["content"],
                    "createdAt": datetime.utcnow(),
                }
            },
            "$set": {"updatedAt": datetime.utcnow()},
        },
    )

    return {"message": "Comment added"}

# ==========================
# DELETE REPORT
# ==========================
@router.delete("/{report_id}")
async def delete_report(report_id: str):
    
    result = await db.reports.delete_one({"_id": ObjectId(report_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {"message": "Report deleted"}