from typing import Generic, TypeVar

from pydantic import BaseModel

DataT = TypeVar("DataT")


class UnifiedResponseModel(BaseModel, Generic[DataT]):
    status_code: int = 200
    status_message: str = "SUCCESS"
    data: DataT


def response_ok(data: DataT) -> UnifiedResponseModel[DataT]:
    return UnifiedResponseModel(data=data)
