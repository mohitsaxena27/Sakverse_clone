# models.py - plain SQLAlchemy models (for FastAPI)
from sqlalchemy import Column, Integer, String, DateTime, LargeBinary, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from config import Config

Base = declarative_base()


class Data(Base):
    __tablename__ = 'data'
    id = Column(Integer, primary_key=True)
    table_id = Column(Integer, nullable=True)
    data = Column(LargeBinary, nullable=True)
    created = Column(DateTime, default=datetime.utcnow)
    updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Repository(Base):
    __tablename__ = 'repository'
    id = Column(Integer, primary_key=True)
    name = Column(String(45), nullable=True)
    created = Column(DateTime, default=datetime.utcnow)
    updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Table(Base):
    __tablename__ = 'table'
    id = Column(Integer, primary_key=True)
    repo_id = Column(Integer, nullable=True)
    table_name = Column(String(45), nullable=True)
    schema = Column(JSON)
    created = Column(DateTime, default=datetime.utcnow)
    updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Table_View(Base):
    __tablename__ = 'table_view'
    id = Column(Integer, primary_key=True)
    table_id = Column(Integer, nullable=True)
    table_view = Column(Text, nullable=True)


# SQLAlchemy engine and session maker for application use
DATABASE_URL = os.getenv('SQLALCHEMY_DATABASE_URI', Config.SQLALCHEMY_DATABASE_URI)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

