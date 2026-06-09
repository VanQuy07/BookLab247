from datetime import datetime
from typing import List, Optional, Literal

from pydantic import BaseModel, Field


BookingStatus = Literal[
	"CHO_DUYET",
	"DA_DUYET",
	"BI_TU_CHOI",
	"DA_HUY",
	"DANG_MUON",
	"DA_XONG",
]


class BookingCreate(BaseModel):
	room_id: str
	customer_name: str
	phone: str
	date: str
	start_time: str
	duration_mins: int
	buffer_mins: int = 15
	note: str = ""
	equipments: List[dict] = Field(default_factory=list)


class BookingStatusUpdate(BaseModel):
	status: BookingStatus
	rejection_reason: Optional[str] = None


class BookingCancel(BaseModel):
	cancel_reason: Optional[str] = None


class BookingResponse(BaseModel):
	id: str
	room_id: str
	room_name: Optional[str] = None
	room_building: Optional[str] = None
	room_floor: Optional[str] = None
	customer_name: str
	phone: str
	date: str
	start_time: str
	duration_mins: int
	buffer_mins: int
	note: str = ""
	equipments: List[dict] = Field(default_factory=list)
	user_id: Optional[str] = None
	status: BookingStatus
	rejection_reason: Optional[str] = None
	start_time_mins: Optional[int] = None
	end_time_with_buffer_mins: Optional[int] = None
	status_history: List[dict] = Field(default_factory=list)
	created_at: Optional[datetime] = None
