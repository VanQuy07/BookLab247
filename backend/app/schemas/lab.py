from pydantic import BaseModel, Field
from typing import Optional


class LabCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    capacity: str = Field(..., max_length=50)
    priceText: Optional[str] = Field(None, max_length=200)
    imageUrl: str


class LabResponse(LabCreate):
    id: str
