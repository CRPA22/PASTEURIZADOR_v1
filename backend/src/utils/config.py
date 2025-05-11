import os
from dotenv import load_dotenv
load_dotenv()

BASE_URL = os.getenv("AWS_API_URL")
