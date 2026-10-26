import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()
HOST = os.getenv("host")
USER = os.getenv("user")
PASSWORD = os.getenv("password")
DATABASE = os.getenv("database")
PORT = int(os.getenv("port"))
DATABASE_URL = f"mysql+pymysql://{USER}:{PASSWORD}@{HOST}:{PORT}/{DATABASE}"

engine = create_engine(
    DATABASE_URL,
    pool_size=25,  # base connections always available
    max_overflow=50,  # extra burst connections
    pool_timeout=60,  # wait longer before failing
    pool_pre_ping=True,  # avoid stale connections
    pool_recycle=1800
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()
