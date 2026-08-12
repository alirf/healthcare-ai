"""Object storage service for file uploads (MinIO/S3-compatible)."""
import uuid
from typing import Optional

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from fastapi import UploadFile

from app.config import get_settings
from app.exceptions import InvalidFileError, FileTooLargeError


class StorageService:
    """Service for uploading and managing files in object storage."""
    
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
        """Create bucket if it does not exist."""
        try:
            self.client.head_bucket(Bucket=self.bucket)
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "404":
                self.client.create_bucket(Bucket=self.bucket)
            else:
                raise
    
    def validate_file(self, file: UploadFile) -> None:
        """Validate uploaded file type and size."""
        # Check file type
        if file.content_type not in self.settings.ALLOWED_IMAGE_TYPES:
            raise InvalidFileError(
                f"Invalid file type: {file.content_type}. "
                f"Allowed types: {', '.join(self.settings.ALLOWED_IMAGE_TYPES)}"
            )
    
    async def upload_avatar(
        self, file: UploadFile, user_id: str, user_type: str = "patient"
    ) -> tuple[str, str]:
        """Upload an avatar image to object storage.
        
        Args:
            file: The uploaded file
            user_id: UUID of the user
            user_type: "patient" or "doctor"
            
        Returns:
            Tuple of (public_url, object_key)
        """
        self.validate_file(file)
        
        # Generate unique object key
        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        object_key = f"avatars/{user_type}s/{user_id}/{uuid.uuid4()}.{ext}"
        
        # Read file content
        content = await file.read()
        
        # Check file size
        max_size = self.settings.MAX_AVATAR_SIZE_MB * 1024 * 1024
        if len(content) > max_size:
            raise FileTooLargeError(self.settings.MAX_AVATAR_SIZE_MB)
        
        # Upload to storage
        self.client.put_object(
            Bucket=self.bucket,
            Key=object_key,
            Body=content,
            ContentType=file.content_type,
            Metadata={
                "uploaded-by": "profile-service",
                "user-id": user_id,
                "user-type": user_type,
            },
        )
        
        # Generate presigned URL (valid for 7 days)
        url = self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": object_key},
            ExpiresIn=3600 * 24 * 7,
        )
        
        return url, object_key
    
    async def delete_file(self, object_key: str) -> bool:
        """Delete a file from object storage.
        
        Returns:
            True if deleted successfully, False if not found.
        """
        try:
            self.client.delete_object(Bucket=self.bucket, Key=object_key)
            return True
        except ClientError:
            return False
    
    async def get_file_url(self, object_key: str, expires_in: int = 3600) -> Optional[str]:
        """Generate a presigned URL for accessing a file.
        
        Args:
            object_key: The storage object key
            expires_in: URL expiration time in seconds
            
        Returns:
            Presigned URL or None if object not found
        """
        try:
            url = self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": object_key},
                ExpiresIn=expires_in,
            )
            return url
        except ClientError:
            return None