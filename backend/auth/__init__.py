"""
Auth Module
===========
Handles authentication, authorization, and database connections.
"""

from .database import get_database, get_users_collection
from .security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token
)
from .dependencies import get_current_user, get_current_admin_user

__all__ = [
    "get_database",
    "get_users_collection",
    "verify_password",
    "get_password_hash",
    "create_access_token",
    "decode_access_token",
    "get_current_user",
    "get_current_admin_user"
]
