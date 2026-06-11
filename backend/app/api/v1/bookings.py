from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Header, HTTPException, Query, status

from app.core.database import db
from app.schemas.booking import BookingCancel, BookingCreate, BookingResponse, BookingStatusUpdate

router = APIRouter()

_FIXED_ACCOUNT_TOKENS = {
    "token_dac_quyen_cua_admin": "ADMIN",
    "token_dac_quyen_cua_manager": "MANAGER",
}

_REQUEST_STATUSES = {"CHO_DUYET", "DA_DUYET", "BI_TU_CHOI", "DA_HUY"}
_BORROW_STATUSES = {"DANG_MUON", "DA_XONG", "DA_HUY"}
_ACTIVE_STATUSES = {"CHO_DUYET", "DA_DUYET", "DANG_MUON"}


def time_to_mins(time_str: str) -> int:
    h, m = map(int, time_str.split(":"))
    return h * 60 + m


def _normalize_status(status_value: str | None) -> str:
    if not status_value:
        return "CHO_DUYET"

    aliases = {
        "pending": "CHO_DUYET",
        "confirmed": "DA_DUYET",
        "checked-in": "DANG_MUON",
        "cancelled": "DA_HUY",
        "rejected": "BI_TU_CHOI",
        "completed": "DA_XONG",
    }
    return aliases.get(status_value, status_value)


def _extract_token_context(authorization: str | None) -> tuple[str, str | None, str | None]:
    if not authorization:
        raise HTTPException(status_code=401, detail="Thiếu token xác thực")

    token = authorization.removeprefix("Bearer ").strip()
    if token.startswith("token_cua_"):
        return "mongo", token.removeprefix("token_cua_"), None

    if token in _FIXED_ACCOUNT_TOKENS:
        return "fixed", token, _FIXED_ACCOUNT_TOKENS[token]

    raise HTTPException(status_code=401, detail="Token không hợp lệ")


def _serialize_booking(booking: dict, room: dict | None = None) -> dict:
    booking["id"] = str(booking["_id"])
    booking.pop("_id", None)
    booking["status"] = _normalize_status(booking.get("status"))
    booking["rejection_reason"] = booking.get("rejection_reason")
    history = booking.get("status_history", [])
    for entry in history:
        changed_at = entry.get("changed_at")
        if isinstance(changed_at, datetime):
            entry["changed_at"] = changed_at.isoformat()
    booking["status_history"] = history
    if room:
        booking["room_name"] = room.get("name")
        booking["room_building"] = room.get("building")
        booking["room_floor"] = room.get("floor")
    else:
        booking.setdefault("room_name", None)
        booking.setdefault("room_building", None)
        booking.setdefault("room_floor", None)
    return booking


async def _load_rooms_map(room_ids: list[str]) -> dict[str, dict]:
    if not room_ids:
        return {}

    object_ids = []
    for room_id in room_ids:
        try:
            object_ids.append(ObjectId(room_id))
        except Exception:
            continue

    if not object_ids:
        return {}

    rooms_cursor = db["labs"].find({"_id": {"$in": object_ids}})
    rooms = await rooms_cursor.to_list(length=len(object_ids))
    return {str(room["_id"]): room for room in rooms}


async def _serialize_bookings_with_rooms(bookings_list: list[dict]) -> list[dict]:
    room_ids = list({booking.get("room_id") for booking in bookings_list if booking.get("room_id")})
    rooms_map = await _load_rooms_map(room_ids)
    return [
        _serialize_booking(booking, rooms_map.get(booking.get("room_id")))
        for booking in bookings_list
    ]


async def _get_booking_or_404(booking_id: str) -> dict:
    try:
        booking = await db["bookings"].find_one({"_id": ObjectId(booking_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID booking không hợp lệ")

    if not booking:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn đặt lịch")
    return booking


def _append_status_history(booking: dict, new_status: str, reason: str | None = None) -> list[dict]:
    history = booking.get("status_history") or []
    history.append(
        {
            "status": new_status,
            "changed_at": datetime.now(timezone.utc),
            "reason": reason,
        }
    )
    return history


@router.post("", response_model=BookingResponse)
async def create_booking(
    booking: BookingCreate,
    authorization: str | None = Header(default=None),
):
    account_type, user_identifier, _ = _extract_token_context(authorization)
    user_id = user_identifier if account_type == "mongo" else user_identifier

    new_start = time_to_mins(booking.start_time)
    new_end_with_buffer = new_start + booking.duration_mins + booking.buffer_mins

    overlapping_booking = await db["bookings"].find_one(
        {
            "room_id": booking.room_id,
            "date": booking.date,
            "start_time_mins": {"$lt": new_end_with_buffer},
            "end_time_with_buffer_mins": {"$gt": new_start},
            "status": {"$in": ["CHO_DUYET", "DA_DUYET", "DANG_MUON"]},
        }
    )

    if overlapping_booking:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Rất tiếc, phòng đã có người đặt vào khung giờ này!",
        )

    new_booking_data = booking.model_dump()
    new_booking_data["user_id"] = user_id
    new_booking_data["start_time_mins"] = new_start
    new_booking_data["end_time_with_buffer_mins"] = new_end_with_buffer
    new_booking_data["status"] = "CHO_DUYET"
    new_booking_data["rejection_reason"] = None
    new_booking_data["created_at"] = datetime.now(timezone.utc)
    new_booking_data["status_history"] = _append_status_history(
        new_booking_data, "CHO_DUYET", "Khởi tạo đơn"
    )

    result = await db["bookings"].insert_one(new_booking_data)
    created_booking = await db["bookings"].find_one({"_id": result.inserted_id})
    if not created_booking:
        raise HTTPException(status_code=500, detail="Không thể tạo đơn đặt lịch")

    return (await _serialize_bookings_with_rooms([created_booking]))[0]


@router.get("", response_model=list[BookingResponse])
async def get_bookings(
    authorization: str | None = Header(default=None),
    status: str | None = Query(default=None),
    group: str | None = Query(default=None),
):
    account_type, user_identifier, role = _extract_token_context(authorization)

    query: dict = {}
    if account_type == "mongo":
        query = {"user_id": user_identifier}

    if status:
        query["status"] = _normalize_status(status)
    elif group == "request":
        query["status"] = {"$in": list(_REQUEST_STATUSES)}
    elif group == "borrow":
        query["status"] = {"$in": list(_BORROW_STATUSES)}

    bookings_cursor = db["bookings"].find(query).sort("created_at", -1)
    bookings_list = await bookings_cursor.to_list(length=200)

    return await _serialize_bookings_with_rooms(bookings_list)


@router.patch("/{booking_id}/cancel", response_model=BookingResponse)
async def cancel_booking(
    booking_id: str,
    payload: BookingCancel | None = None,
    authorization: str | None = Header(default=None),
):
    account_type, user_identifier, _ = _extract_token_context(authorization)
    booking = await _get_booking_or_404(booking_id)

    if account_type == "mongo" and booking.get("user_id") != user_identifier:
        raise HTTPException(status_code=403, detail="Bạn không có quyền hủy đơn này")

    current_status = _normalize_status(booking.get("status"))
    if current_status not in {"CHO_DUYET", "DA_DUYET"}:
        raise HTTPException(
            status_code=400,
            detail="Chỉ có thể hủy đơn đang chờ duyệt hoặc đã duyệt",
        )

    cancel_reason = payload.cancel_reason if payload else None
    history_reason = cancel_reason or "Người dùng hủy đơn"

    await db["bookings"].update_one(
        {"_id": booking["_id"]},
        {
            "$set": {
                "status": "DA_HUY",
                "rejection_reason": None,
                "status_history": _append_status_history(booking, "DA_HUY", history_reason),
            }
        },
    )

    updated_booking = await _get_booking_or_404(booking_id)
    return (await _serialize_bookings_with_rooms([updated_booking]))[0]


@router.patch("/{booking_id}/status", response_model=BookingResponse)
async def update_booking_status(
    booking_id: str,
    payload: BookingStatusUpdate,
    authorization: str | None = Header(default=None),
):
    account_type, _, role = _extract_token_context(authorization)
    if account_type != "fixed" or role not in {"ADMIN", "MANAGER"}:
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên hoặc quản lý mới được duyệt/từ chối")

    booking = await _get_booking_or_404(booking_id)
    normalized_status = _normalize_status(payload.status)

    if normalized_status not in _REQUEST_STATUSES | _BORROW_STATUSES:
        raise HTTPException(status_code=400, detail="Trạng thái không hợp lệ")

    update_data = {
        "status": normalized_status,
        "status_history": _append_status_history(
            booking,
            normalized_status,
            payload.rejection_reason,
        ),
    }

    if normalized_status == "BI_TU_CHOI":
        update_data["rejection_reason"] = payload.rejection_reason or "Không có lý do"
    elif normalized_status == "DA_HUY":
        update_data["rejection_reason"] = None
    else:
        update_data["rejection_reason"] = None

    await db["bookings"].update_one({"_id": booking["_id"]}, {"$set": update_data})
    updated_booking = await _get_booking_or_404(booking_id)
    return (await _serialize_bookings_with_rooms([updated_booking]))[0]
