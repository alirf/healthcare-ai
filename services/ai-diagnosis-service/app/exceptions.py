"""Custom exceptions."""
from fastapi import HTTPException, status


class InternalAPIKeyError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing internal API key",
        )


class ModelNotLoadedError(HTTPException):
    def __init__(self, detail: str = "Diagnosis model is not loaded"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail,
        )


class DiagnosisError(HTTPException):
    def __init__(self, detail: str = "Diagnosis failed"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
        )
