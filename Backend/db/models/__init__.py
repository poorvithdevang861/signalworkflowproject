"""
Register only auth + platform RBAC models with SQLAlchemy.
"""

from db.models.platform_role import PlatformRole, PlatformPermission, PlatformRolePermission
from db.models.platform_admin import PlatformAdmin

__all__ = [
    "PlatformAdmin",
    "PlatformRole",
    "PlatformPermission",
    "PlatformRolePermission",
]
