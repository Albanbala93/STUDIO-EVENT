from fastapi import APIRouter

from momentum_api.models import Initiative, InitiativeType

router = APIRouter()


@router.get("/")
def list_initiatives(tenant_id: str) -> list[Initiative]:
    return [
        Initiative(
            id="demo-internal-comms",
            tenant_id=tenant_id,
            name="Quarterly leadership update",
            initiative_type=InitiativeType.INTERNAL_COMMUNICATION,
        )
    ]
