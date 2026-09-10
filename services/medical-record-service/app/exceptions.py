"""Custom exceptions for the medical record service."""
from fastapi import HTTPException, status


class MedicalRecordNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail="Medical record not found")


class RecordVisitNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail="Record-visit link not found")


class RecordFileNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")


class ForbiddenAccessError(HTTPException):
    def __init__(self, detail: str = "Access denied for this medical record"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class InvalidRecordStateError(HTTPException):
    def __init__(self, detail: str = "Invalid medical record state transition"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class DuplicateVisitLinkError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail="This visit is already linked to the medical record",
        )


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


class UpstreamServiceError(HTTPException):
    def __init__(self, service: str):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Required upstream service '{service}' is unavailable",
        )
