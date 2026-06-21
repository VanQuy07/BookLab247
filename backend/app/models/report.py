from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class ReportLog(BaseModel):
    status: str
    changedBy: str
    message: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)


class ReportComment(BaseModel):
    userId: str
    content: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class ReportStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    IN_REVIEW = "IN_REVIEW"
    APPROVED = "APPROVED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"
    ESCALATED = "ESCALATED"


class Report(BaseModel):

    id: Optional[str] = None

    type: str

    title: str

    description: str

    severity: str

    roomId: Optional[str] = None
    roomName: Optional[str] = None

    equipmentId: Optional[str] = None

    bookingId: Optional[str] = None

    images: List[str] = Field(default_factory=list)

    status: ReportStatus = ReportStatus.SUBMITTED

    createdBy: str

    assignedTo: Optional[str] = None

    logs: List[ReportLog] = Field(default_factory=list)

    comments: List[ReportComment] = Field(default_factory=list)

    createdAt: datetime = Field(default_factory=datetime.utcnow)
    
    updatedAt: datetime = Field(default_factory=datetime.utcnow)