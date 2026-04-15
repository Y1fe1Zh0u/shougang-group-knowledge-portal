from fastapi import APIRouter

from app.schemas.common import response_ok

router = APIRouter()


@router.get("/health")
async def health_check():
    return response_ok(
        {
            "service": "knowledge-portal-backend",
            "status": "ok",
        }
    )
