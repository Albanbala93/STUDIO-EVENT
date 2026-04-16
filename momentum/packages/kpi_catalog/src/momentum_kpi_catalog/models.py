from typing import Literal

from pydantic import BaseModel


class KPIDefinition(BaseModel):
    id: str
    name: str
    category: Literal["internal_communication", "corporate_event", "csr_sustainability"]
    unit: str
    provenance_default: Literal["measured", "estimated"]
