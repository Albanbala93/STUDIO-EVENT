from typing import Literal

from pydantic import BaseModel, Field


DataProvenance = Literal["measured", "estimated"]


class KPIValue(BaseModel):
    kpi_id: str
    value: float
    provenance: DataProvenance
    confidence: float = Field(ge=0, le=1)


class ScoreResult(BaseModel):
    performance_score: float = Field(ge=0, le=100)
    confidence_score: float = Field(ge=0, le=100)
    measured_count: int
    estimated_count: int
