from typing import Generic, TypeVar

from pydantic import BaseModel
from fastapi.responses import JSONResponse

DataT = TypeVar("DataT")


class UnifiedResponseModel(BaseModel, Generic[DataT]):
    status_code: int = 200
    status_message: str = "SUCCESS"
    data: DataT


def response_ok(data: DataT) -> UnifiedResponseModel[DataT]:
    return UnifiedResponseModel(data=data)


def response_error(status_message: str, status_code: int = 400, data: object | None = None) -> JSONResponse:
    payload = UnifiedResponseModel(
        status_code=status_code,
        status_message=status_message,
        data=data or {},
    )
    return JSONResponse(status_code=status_code, content=payload.model_dump(mode="json"))
