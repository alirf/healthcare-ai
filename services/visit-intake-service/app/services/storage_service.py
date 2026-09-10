"""Object storage service for visit file attachments (MinIO/S3-compatible)."""
import uuid

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from fastapi import UploadFile

from app.config import get_settings
from app.exceptions import InvalidFileError, FileTooLargeError


class StorageService:
    """Service for uploading/managing files exchanged inside visit messages."""

    def __init__(self):
        settings = get_settings()
        self.settings = settings

        protocol = "https" if settings.MINIO_SECURE else "http"
        endpoint_url = f"{protocol}://{settings.MINIO_ENDPOINT}"

        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
            config=Config(signature_version="s3v4"),
            region_name="us-east-1",
        )
        self.bucket = settings.MINIO_BUCKET_NAME
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        try:
            self.client.head_bucket(Bucket=self.bucket)
        except ClientError as e:
            if e.response["Error"]["Code"] == "404":
                self.client.create_bucket(Bucket=self.bucket)
            else:
                raise

    def validate_file(self, file: UploadFile) -> None:
        if file.content_type not in self.settings.ALLOWED_ATTACHMENT_TYPES:
            raise InvalidFileError(
                f"Invalid file type: {file.content_type}. "
                f"Allowed types: {', '.join(self.settings.ALLOWED_ATTACHMENT_TYPES)}"
            )

    async def upload_attachment(self, file: UploadFile, visit_id: str) -> dict:
        """Upload a file attachment for a visit message.

        Returns a dict with attachment metadata ready to pass to VisitService.add_message.
        """
        self.validate_file(file)
        content = await file.read()

        max_size = self.settings.MAX_ATTACHMENT_SIZE_MB * 1024 * 1024
        if len(content) > max_size:
            raise FileTooLargeError(self.settings.MAX_ATTACHMENT_SIZE_MB)

        ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
        object_key = f"visits/{visit_id}/attachments/{uuid.uuid4()}.{ext}"

        self.client.put_object(
            Bucket=self.bucket,
            Key=object_key,
            Body=content,
            ContentType=file.content_type,
            Metadata={"uploaded-by": "visit-intake-service", "visit-id": visit_id},
        )

        url = self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": object_key},
            ExpiresIn=3600 * 24 * 7,
        )

        return {
            "attachment_name": file.filename,
            "attachment_content_type": file.content_type,
            "attachment_size": len(content),
            "attachment_key": object_key,
            "attachment_url": url,
        }

    def get_file_url(self, object_key: str, expires_in: int = 3600 * 24 * 7) -> str | None:
        """Fresh presigned URL (stored URLs expire, so regenerate on read)."""
        try:
            return self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": object_key},
                ExpiresIn=expires_in,
            )
        except ClientError:
            return None

    async def delete_file(self, object_key: str) -> bool:
        try:
            self.client.delete_object(Bucket=self.bucket, Key=object_key)
            return True
        except ClientError:
            return False
