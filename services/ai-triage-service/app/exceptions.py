"""Custom exceptions for the AI Triage service."""
from fastapi import HTTPException, status


class InternalAPIKeyError(HTTPException):
    """Missing or invalid X-Internal-API-Key on an internal endpoint."""

    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing internal API key",
        )


class NLPServiceUnavailableError(HTTPException):
    """ai-nlp-service is unreachable or returned a non-200 response."""

    def __init__(self, detail: str = "ai-nlp-service is unavailable"):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail,
        )


class DiagnosisServiceUnavailableError(HTTPException):
    """ai-diagnosis-service is unreachable or returned a non-200 response."""

    def __init__(self, detail: str = "ai-diagnosis-service is unavailable"):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail,
        )


class VisitServiceUnavailableError(HTTPException):
    """visit-intake-service is unreachable when the orchestration flow needs it."""

    def __init__(self, detail: str = "visit-intake-service is unavailable"):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail,
        )


class TriageError(HTTPException):
    """Generic triage failure (e.g. empty visit, malformed upstream payload)."""

    def __init__(self, detail: str = "Triage failed"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
        )


class DiagnosisError(HTTPException):
    """Generic diagnosis failure (e.g. no evidences available, empty visit)."""

    def __init__(self, detail: str = "Diagnosis failed"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
        )
