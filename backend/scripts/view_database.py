"""
View Database Contents
======================
Quick script to see what's in the MongoDB database.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def view_database():
    print("\n" + "="*50)
    print("  DATTU_BILL - Database Viewer")
    print("="*50)
    
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["dattu_bill"]
    
    # Show all collections
    collections = await db.list_collection_names()
    print(f"\nCollections: {collections}")
    
    # Show users
    users_collection = db["users"]
    user_count = await users_collection.count_documents({})
    print(f"\nTotal Users: {user_count}")
    print("-"*50)
    
    async for user in users_collection.find():
        print(f"  Username: {user['username']}")
        print(f"  Email: {user['email']}")
        print(f"  Role: {user['role']}")
        print(f"  Active: {user.get('is_active', True)}")
        print(f"  Created: {user.get('created_at', 'N/A')}")
        print("-"*50)
    
    client.close()
    print()

if __name__ == "__main__":
    asyncio.run(view_database())
