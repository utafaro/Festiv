from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

client: AsyncIOMotorClient = None

async def connect_db():
    global client
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    await client[settings.DB_NAME]["token_blacklist"].create_index(
        "expires_at", expireAfterSeconds=0
    )
    print("✅ Connecté à MongoDB Atlas")

async def close_db():
    global client
    if client:
        client.close()

def get_db():
    return client[settings.DB_NAME]