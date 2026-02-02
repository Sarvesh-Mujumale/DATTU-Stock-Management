"""
Reset User Session
==================
Use this script if a user gets 'stuck' in a logged-in state and cannot log out.
This manually clears the session flag in the database.

Usage:
    python scripts/reset_user_session.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def reset_session():
    print("\n" + "="*50)
    print("  DATTU_BILL - Reset User Session")
    print("="*50)
    
    username = input("\nEnter username to reset: ").strip()
    
    if not username:
        print("❌ Username is required.")
        return

    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["dattu_bill"]
    users_collection = db["users"]
    
    # Check if user exists
    user = await users_collection.find_one({"username": username})
    if not user:
        print(f"❌ User '{username}' not found.")
        return
        
    # Reset session
    result = await users_collection.update_one(
        {"username": username},
        {
            "$set": {
                "is_logged_in": False,
                "last_activity": None
            }
        }
    )
    
    if result.modified_count > 0:
        print(f"✅ Successfully reset session for user '{username}'.")
        print("   The user can now log in again.")
    else:
        print(f"ℹ️  User '{username}' was not logged in.")
    
    client.close()
    print()

if __name__ == "__main__":
    asyncio.run(reset_session())
