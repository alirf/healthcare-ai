"""Custom exceptions for the visit intake service."""
from fastapi import HTTPException, status


class VisitNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")


class SymptomNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail="Symptom not found")


class SuggestionNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail="Disease suggestion not found")


class PrescriptionNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")


class ForbiddenAccessError(HTTPException):
    def __init__(self, detail: str = "Access denied for this visit"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class InvalidVisitStateError(HTTPException):
    def __init__(self, detail: str = "Invalid visit state transition"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class InvalidFileError(HTTPException):
    def __init__(self, detail: str = "Invalid file"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class FileTooLargeError(HTTPException):
    def __init__(self, max_size_mb: int):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {max_size_mb}MB",
        )


class InternalAPIKeyError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid internal API key")
