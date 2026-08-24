from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from .config import settings


client: AsyncIOMotorClient | None = None


async def connect_db() -> None:
    global client
    client = AsyncIOMotorClient(settings.MONGODB_URI, tz_aware=True)
    await client[settings.DB_NAME]["token_blacklist"].create_index(
        "expires_at", expireAfterSeconds=0
    )

    print("Connected to MongoDB")


async def close_db() -> None:
    global client

    if client is not None:
        client.close()
        client = None


def get_db() -> AsyncIOMotorDatabase:
    if client is None:
        raise RuntimeError("MongoDB client is not initialized")

    return client[settings.DB_NAME]