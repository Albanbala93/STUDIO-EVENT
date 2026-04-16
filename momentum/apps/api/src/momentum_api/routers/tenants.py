from fastapi import APIRouter

from momentum_api.models import Tenant

router = APIRouter()


@router.get("/{tenant_id}")
def get_tenant(tenant_id: str) -> Tenant:
    return Tenant(id=tenant_id, name="Demo tenant")
