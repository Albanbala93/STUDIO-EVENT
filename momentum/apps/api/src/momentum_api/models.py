from enum import StrEnum

from pydantic import BaseModel, Field


class InitiativeType(StrEnum):
    INTERNAL_COMMUNICATION = "internal_communication"
    CORPORATE_EVENT = "corporate_event"
    CSR_SUSTAINABILITY = "csr_sustainability"


class DataProvenance(StrEnum):
    MEASURED = "measured"
    ESTIMATED = "estimated"
    DECLARED = "declared"
    PROXY = "proxy"


class Tenant(BaseModel):
    id: str
    name: str


class Initiative(BaseModel):
    id: str
    tenant_id: str
    name: str
    initiative_type: InitiativeType


class KPIValueIn(BaseModel):
    kpi_id: str
    value: float
    provenance: DataProvenance
    confidence: float = Field(ge=0, le=1)
    method: str | None = None


class KPIRecommendationRequest(BaseModel):
    initiative_type: InitiativeType
    goals: list[str] = Field(default_factory=list)
