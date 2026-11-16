"""Custom exceptions for visit-intake-service.

Comprehensive: includes ALL exception names that patient.py, doctor.py,
chat.py, diagnosis.py, internal.py, preview.py might import.

If you add a new router that needs a new exception, add it here too.

Naming convention:
  - *NotFoundError    → 404 (subclass of NotFoundError)
  - *AlreadyExistsError → 409 (subclass of VisitStateError)
  - *UnavailableError → 502 (subclass of VisitIntakeError)
  - *Error (other)    → 422 or 500 depending on context
"""
from fastapi import HTTPException, status


# =====================================================================
# Base class
# =====================================================================

class VisitIntakeError(HTTPException):
    """Base class for visit-intake errors."""

    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


# =====================================================================
# Auth-related
# =====================================================================

class InternalAPIKeyError(HTTPException):
    """Missing or invalid X-Internal-API-Key on internal endpoints."""

    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing internal API key",
        )


class AuthorizationError(VisitIntakeError):
    """The caller is not allowed to perform this action on this visit."""

    def __init__(self, detail: str = "Not authorized for this visit"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class PermissionDeniedError(AuthorizationError):
    """Alias for AuthorizationError — بعضی فایل‌ها از این نام استفاده می‌کنند."""

    def __init__(self, detail: str = "Permission denied"):
        super().__init__(detail=detail)


class ForbiddenAccessError(AuthorizationError):
    """دسترسی به این منبع ممنوع است — alias برای AuthorizationError.

    استفاده در patient.py: وقتی بیمار سعی می‌کند به ویزیت دیگری دسترسی پیدا کند.
    """

    def __init__(self, detail: str = "Forbidden: access denied"):
        super().__init__(detail=detail)


# =====================================================================
# Not found errors (404)
# =====================================================================

class NotFoundError(VisitIntakeError):
    """A requested resource was not found."""

    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class VisitNotFoundError(NotFoundError):
    """Visit با این ID یافت نشد."""

    def __init__(
        self, detail: str = "Visit not found", visit_id: str | None = None
    ):
        if visit_id:
            detail = f"Visit {visit_id} not found"
        super().__init__(detail=detail)


class SymptomNotFoundError(NotFoundError):
    """علامت با این ID در این ویزیت یافت نشد."""

    def __init__(
        self, detail: str = "Symptom not found", symptom_id: str | None = None
    ):
        if symptom_id:
            detail = f"Symptom {symptom_id} not found"
        super().__init__(detail=detail)


class MessageNotFoundError(NotFoundError):
    """پیام با این ID در این ویزیت یافت نشد."""

    def __init__(
        self, detail: str = "Message not found", message_id: str | None = None
    ):
        if message_id:
            detail = f"Message {message_id} not found"
        super().__init__(detail=detail)


class AttachmentNotFoundError(NotFoundError):
    """فایل پیوست با این ID یافت نشد."""

    def __init__(self, detail: str = "Attachment not found"):
        super().__init__(detail=detail)


class ChatNotFoundError(NotFoundError):
    """گفتگو با این ID یافت نشد."""

    def __init__(self, detail: str = "Chat not found"):
        super().__init__(detail=detail)


class RecordNotFoundError(NotFoundError):
    """پرونده با این ID یافت نشد."""

    def __init__(self, detail: str = "Record not found"):
        super().__init__(detail=detail)


class DiagnosisNotFoundError(NotFoundError):
    """هیچ پیشنهاد تشخیصی برای این ویزیت ذخیره نشده است."""

    def __init__(
        self,
        detail: str = "No AI diagnosis suggestions stored for this visit",
    ):
        super().__init__(detail=detail)


class AIDiagnosisNotFoundError(DiagnosisNotFoundError):
    """Alias برای DiagnosisNotFoundError."""

    pass


class FinalDiagnosisNotFoundError(NotFoundError):
    """هیچ تشخیص نهایی برای این ویزیت ثبت نشده است."""

    def __init__(
        self,
        detail: str = "No final diagnosis submitted for this visit yet",
    ):
        super().__init__(detail=detail)


class SuggestionNotFoundError(NotFoundError):
    """پیشنهاد تشخیص با این ID یافت نشد."""

    def __init__(self, detail: str = "Suggestion not found"):
        super().__init__(detail=detail)


class PatientNotFoundError(NotFoundError):
    """بیمار با این ID یافت نشد."""

    def __init__(self, detail: str = "Patient not found"):
        super().__init__(detail=detail)


class DoctorNotFoundError(NotFoundError):
    """پزشک با این ID یافت نشد."""

    def __init__(self, detail: str = "Doctor not found"):
        super().__init__(detail=detail)


class UserNotFoundError(NotFoundError):
    """کاربر با این ID یافت نشد."""

    def __init__(self, detail: str = "User not found"):
        super().__init__(detail=detail)


class PrescriptionNotFoundError(NotFoundError):
    """نسخه با این ID یافت نشد."""

    def __init__(
        self, detail: str = "Prescription not found", prescription_id: str | None = None
    ):
        if prescription_id:
            detail = f"Prescription {prescription_id} not found"
        super().__init__(detail=detail)


# =====================================================================
# Already-exists errors (409)
# =====================================================================

class VisitStateError(VisitIntakeError):
    """Visit در وضعیتی نیست که این عمل روی آن انجام شود."""

    def __init__(
        self,
        detail: str = "Visit is not in the correct state for this operation",
    ):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class VisitAlreadyExistsError(VisitStateError):
    """Visit با این مشخصات قبلاً ساخته شده."""

    def __init__(self, detail: str = "Visit already exists"):
        super().__init__(detail=detail)


class VisitAlreadySubmittedError(VisitStateError):
    """بیمار قبلاً ویزیت را submit کرده."""

    def __init__(
        self, detail: str = "Visit has already been submitted to a doctor"
    ):
        super().__init__(detail=detail)


class VisitNotClaimedError(VisitStateError):
    """ویزیت هنوز توسط پزشکی claim نشده است."""

    def __init__(
        self, detail: str = "Visit has not been claimed by a doctor yet"
    ):
        super().__init__(detail=detail)


class VisitAlreadyClaimedError(VisitStateError):
    """ویزیت قبلاً توسط پزشک دیگری claim شده است."""

    def __init__(
        self, detail: str = "Visit has already been claimed by another doctor"
    ):
        super().__init__(detail=detail)


class VisitCompletedError(VisitStateError):
    """ویزیت قبلاً تکمیل شده است."""

    def __init__(self, detail: str = "Visit has already been completed"):
        super().__init__(detail=detail)


class FinalDiagnosisAlreadyExistsError(VisitStateError):
    """تشخیص نهایی قبلاً برای این ویزیت ثبت شده (idempotent update)."""

    def __init__(
        self, detail: str = "Final diagnosis already submitted for this visit"
    ):
        super().__init__(detail=detail)


class SymptomAlreadyExistsError(VisitStateError):
    """علامت با این مشخصات قبلاً در ویزیت ثبت شده."""

    def __init__(self, detail: str = "Symptom already exists in this visit"):
        super().__init__(detail=detail)


class DuplicateSymptomError(SymptomAlreadyExistsError):
    """Alias برای SymptomAlreadyExistsError."""

    pass


# =====================================================================
# AI service errors (502)
# =====================================================================

class NLPServiceUnavailableError(VisitIntakeError):
    """ai-triage-service (or ai-nlp-service) is unreachable or returned non-200."""

    def __init__(self, detail: str = "AI service is unavailable"):
        super().__init__(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail)


class DiagnosisServiceUnavailableError(VisitIntakeError):
    """ai-triage-service / ai-diagnosis-service unreachable or returned an error."""

    def __init__(self, detail: str = "Diagnosis service is unavailable"):
        super().__init__(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail)


class AIServiceUnavailableError(NLPServiceUnavailableError):
    """Alias برای NLPServiceUnavailableError."""

    pass


class ExternalServiceError(VisitIntakeError):
    """خطای عمومی سرویس خارجی."""

    def __init__(self, detail: str = "External service error"):
        super().__init__(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail)


# =====================================================================
# Validation / diagnosis errors (422)
# =====================================================================

class DiagnosisError(VisitIntakeError):
    """Generic diagnosis failure (e.g. conflicting input, invalid suggestion)."""

    def __init__(self, detail: str = "Diagnosis operation failed"):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


class ValidationError(VisitIntakeError):
    """ورودی نامعتبر."""

    def __init__(self, detail: str = "Validation error"):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


class InvalidInputError(ValidationError):
    """Alias برای ValidationError."""

    pass


class InvalidDiagnosisError(DiagnosisError):
    """تشخیص واردشده نامعتبر است."""

    def __init__(self, detail: str = "Invalid diagnosis data"):
        super().__init__(detail=detail)


class EvidenceExtractionError(VisitIntakeError):
    """خطا در استخراج evidences از متن بیمار."""

    def __init__(self, detail: str = "Failed to extract evidences from text"):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


# =====================================================================
# File / upload errors (413, 415)
# =====================================================================

class FileUploadError(VisitIntakeError):
    """خطای عمومی در آپلود فایل."""

    def __init__(self, detail: str = "File upload failed"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class FileTooLargeError(VisitIntakeError):
    """حجم فایل بیش از حد مجاز است."""

    def __init__(self, detail: str = "File size exceeds the maximum allowed limit"):
        super().__init__(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=detail)


class UnsupportedFileTypeError(VisitIntakeError):
    """نوع فایل پشتیبانی نمی‌شود."""

    def __init__(self, detail: str = "Unsupported file type"):
        super().__init__(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=detail)


# =====================================================================
# Rate limiting / throttling (429)
# =====================================================================

class RateLimitExceededError(VisitIntakeError):
    """بیش از حد درخواست ارسال شده است."""

    def __init__(self, detail: str = "Rate limit exceeded. Please try again later."):
        super().__init__(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=detail)


# =====================================================================
# Storage errors (500, 503)
# =====================================================================

class StorageError(VisitIntakeError):
    """خطای عمومی ذخیره‌سازی."""

    def __init__(self, detail: str = "Storage operation failed"):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


class DatabaseError(VisitIntakeError):
    """خطای پایگاه داده."""

    def __init__(self, detail: str = "Database operation failed"):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


# =====================================================================
# Exports
# =====================================================================

__all__ = [
    # Base
    "VisitIntakeError",
    # Auth
    "InternalAPIKeyError",
    "AuthorizationError",
    "PermissionDeniedError",
    "ForbiddenAccessError",
    # Not found
    "NotFoundError",
    "VisitNotFoundError",
    "SymptomNotFoundError",
    "MessageNotFoundError",
    "AttachmentNotFoundError",
    "ChatNotFoundError",
    "RecordNotFoundError",
    "DiagnosisNotFoundError",
    "AIDiagnosisNotFoundError",
    "FinalDiagnosisNotFoundError",
    "SuggestionNotFoundError",
    "PatientNotFoundError",
    "DoctorNotFoundError",
    "UserNotFoundError",
    "PrescriptionNotFoundError",
    # State / conflict
    "VisitStateError",
    "VisitAlreadyExistsError",
    "VisitAlreadySubmittedError",
    "VisitNotClaimedError",
    "VisitAlreadyClaimedError",
    "VisitCompletedError",
    "FinalDiagnosisAlreadyExistsError",
    "SymptomAlreadyExistsError",
    "DuplicateSymptomError",
    # AI services
    "NLPServiceUnavailableError",
    "DiagnosisServiceUnavailableError",
    "AIServiceUnavailableError",
    "ExternalServiceError",
    # Validation / diagnosis
    "DiagnosisError",
    "ValidationError",
    "InvalidInputError",
    "InvalidDiagnosisError",
    "EvidenceExtractionError",
    # Files
    "FileUploadError",
    "FileTooLargeError",
    "UnsupportedFileTypeError",
    # Rate limiting
    "RateLimitExceededError",
    # Storage
    "StorageError",
    "DatabaseError",
]
