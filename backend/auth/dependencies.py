"""
FastAPI Dependencies for Authentication
=======================================
Provides reusable dependencies for protecting routes.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from .database import get_users_collection
from .security import decode_access_token

# OAuth2 scheme - looks for "Authorization: Bearer <token>" header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Dependency to get the current authenticated user.
    
    Validates the JWT token and returns the user document.
    Use this to protect routes that require authentication.
    
    Args:
        token: JWT token from Authorization header
        
    Returns:
        dict: User document from MongoDB
        
    Raises:
        HTTPException: 401 if token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Decode the token
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    # Get user from database
    users_collection = await get_users_collection()
    user = await users_collection.find_one({"username": username})
    
    if user is None:
        raise credentials_exception
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    return user


async def get_current_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency to get the current user and verify they are an admin.
    
    Use this to protect admin-only routes.
    
    Args:
        current_user: User from get_current_user dependency
        
    Returns:
        dict: User document (if they are an admin)
        
    Raises:
        HTTPException: 403 if user is not an admin
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user
