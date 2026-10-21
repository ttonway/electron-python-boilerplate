import logging
from typing import Any, Callable, Literal, TypeVar

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict

import main

__version__ = "1.0.0"
logger = logging.getLogger(__name__)
ResultT = TypeVar("ResultT")
Methods = Literal["api_add"]

class ApiRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

class ApiResponse(BaseModel):
    success: bool = True
    message: str = "ok"
    data: Any = None

app = FastAPI(
    title="Python main API",
    description="HTTP JSON wrapper for the Python api functions.",
    version=__version__,
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^(null|https?://(?:localhost|127\.0\.0\.1)(?::\d+)?)$",
    allow_credentials=False,
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

def _execute(operation: Callable[[], ResultT]) -> ApiResponse:
    try:
        return ApiResponse(data=operation())
    except Exception as exc:
        logger.exception("api operation failed")
        return ApiResponse(success=False, message=str(exc))

@app.post("/api/{method}", response_model=ApiResponse, tags=["data"])
def dispatch(method: Methods, request: ApiRequest) -> ApiResponse:
    func = getattr(main, method)
    arguments = request.model_dump()
    return _execute(lambda: func(**arguments))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=0)
