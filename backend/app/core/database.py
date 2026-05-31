# from motor.motor_asyncio import AsyncIOMotorClient
# import os
# from dotenv import load_dotenv

# load_dotenv()

# MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
# client = AsyncIOMotorClient(MONGO_URI)

# # Trỏ tới Database
# db = client["booklab247_db"]
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Tải cấu hình từ file .env
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "booklab247")
print("🚀 ĐANG KẾT NỐI TỚI LINK:", MONGO_URL)

# Khởi tạo kết nối
client = AsyncIOMotorClient(MONGO_URL)
db = client[DATABASE_NAME]