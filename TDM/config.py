# config.py
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Database (can be overridden via environment)
    SQLALCHEMY_DATABASE_URI = os.getenv('SQLALCHEMY_DATABASE_URI', 'mysql+mysqlconnector://root:admin@localhost:3306/tdm')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Application host/port
    HOST = os.getenv('APP_HOST', '0.0.0.0')
    PORT = int(os.getenv('APP_PORT', 5555))

    # Base URL used when the app needs to call its own API endpoints
    API_BASE_URL = os.getenv('API_BASE_URL', f'http://localhost:{PORT}')

    # Uploads
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', os.path.join(os.getcwd(), 'uploads'))
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 50 * 1024 * 1024))  # default 50MB

    # Allowed upload extensions (comma-separated env var)
    ALLOWED_EXTENSIONS = set(os.getenv('ALLOWED_EXTENSIONS', 'xls,xlsx').split(','))

    # Other operational settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'change-me')
    DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() in ('1', 'true', 'yes')

