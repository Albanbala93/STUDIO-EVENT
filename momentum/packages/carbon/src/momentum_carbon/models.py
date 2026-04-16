from typing import Literal

from pydantic import BaseModel, Field


class CarbonEstimate(BaseModel):
    kg_co2e: float
    provenance: Literal["estimated"]
    method: str
    confidence: float = Field(ge=0, le=1)
