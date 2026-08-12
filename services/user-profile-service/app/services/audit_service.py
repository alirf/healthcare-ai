"""Audit logging service for HIPAA compliance."""
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import ProfileAuditLog


class AuditService:
    """Service for logging all access to protected health information."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def log_action(
        self,
        user_id: UUID,
        action: str,
        table_name: str,
        record_id: Optional[UUID] = None,
        old_values: Optional[dict] = None,
        new_values: Optional[dict] = None,
        performed_by: Optional[UUID] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> ProfileAuditLog:
        """Log an action on protected health information.
        
        Args:
            user_id: The patient/doctor whose data was accessed
            action: One of: create, update, delete, view
            table_name: The database table affected
            record_id: The specific record ID
            old_values: Previous values (for updates/deletes)
            new_values: New values (for creates/updates)
            performed_by: User who performed the action (defaults to user_id)
            ip_address: Client IP address
            user_agent: Client user agent string
            
        Returns:
            The created audit log entry
        """
        log = ProfileAuditLog(
            user_id=user_id,
            action=action,
            table_name=table_name,
            record_id=record_id,
            old_values=old_values,
            new_values=new_values,
            performed_by=performed_by or user_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(log)
        await self.db.flush()
        return log
    
    async def log_view(
        self,
        user_id: UUID,
        table_name: str,
        performed_by: UUID,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> ProfileAuditLog:
        """Convenience method for logging data views."""
        return await self.log_action(
            user_id=user_id,
            action="view",
            table_name=table_name,
            performed_by=performed_by,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    async def log_create(
        self,
        user_id: UUID,
        table_name: str,
        record_id: UUID,
        new_values: dict,
        performed_by: UUID,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> ProfileAuditLog:
        """Convenience method for logging creates."""
        return await self.log_action(
            user_id=user_id,
            action="create",
            table_name=table_name,
            record_id=record_id,
            new_values=new_values,
            performed_by=performed_by,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    async def log_update(
        self,
        user_id: UUID,
        table_name: str,
        record_id: UUID,
        old_values: dict,
        new_values: dict,
        performed_by: UUID,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> ProfileAuditLog:
        """Convenience method for logging updates."""
        return await self.log_action(
            user_id=user_id,
            action="update",
            table_name=table_name,
            record_id=record_id,
            old_values=old_values,
            new_values=new_values,
            performed_by=performed_by,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    async def log_delete(
        self,
        user_id: UUID,
        table_name: str,
        record_id: UUID,
        old_values: dict,
        performed_by: UUID,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> ProfileAuditLog:
        """Convenience method for logging deletes."""
        return await self.log_action(
            user_id=user_id,
            action="delete",
            table_name=table_name,
            record_id=record_id,
            old_values=old_values,
            performed_by=performed_by,
            ip_address=ip_address,
            user_agent=user_agent,
        )