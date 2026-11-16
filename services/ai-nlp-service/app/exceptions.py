"""Custom exceptions for the AI NLP service."""
from fastapi import HTTPException, status


class InternalAPIKeyError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid internal API key")


class ModelNotLoadedError(HTTPException):
    def __init__(self, detail: str = "Model is not loaded"):
        super().__init__(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)
