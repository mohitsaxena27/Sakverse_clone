from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, BigInteger
from sqlalchemy.sql import func
from database import Base


class OriginalIntent(Base):
    __tablename__ = "original_intent"

    id = Column(Integer, primary_key=True, index=True)
    intent = Column(Text, nullable=False)
    created_by = Column(String(100), nullable=False)
    created_time = Column(DateTime, server_default=func.now())
    updated_time = Column(DateTime, server_default=func.now(), onupdate=func.now())
    automated = Column(String(100), nullable=False)
    testcase_id = Column(Integer, nullable=False)
    version = Column(String(45), nullable=False)
    project_id= Column(Integer, nullable=False)

class PlannedIntent(Base):
    __tablename__ = "planned_intent"

    id = Column(Integer, primary_key=True, index=True)
    user_intent_id = Column(Integer, ForeignKey("original_intent.id"), nullable=False)

    step_type = Column(String(50), nullable=False)
    intent = Column(Text, nullable=False)
    target = Column(Text, nullable=True)
    value = Column(Text, nullable=True)

    created_date = Column(DateTime, server_default=func.now())
    updated_date = Column(DateTime, server_default=func.now(), onupdate=func.now())

    created_by = Column(String(100), nullable=False)
    updated_by = Column(String(100), nullable=False)
    execution_status = Column(String(50), default="PENDING")
    execution_order = Column(Integer, nullable=False)
    enabled = Column(Boolean, nullable=False)


class ExecutionStep(Base):
    __tablename__ = "execution_steps"

    id = Column(Integer, primary_key=True, autoincrement=True)

    planned_intent_id = Column(
        Integer,
        ForeignKey("planned_intent.id"),
        nullable=False
    )

    action = Column(String(50), nullable=False)
    target = Column(String(255), nullable=True)
    value = Column(String(255), nullable=True)

    execution_status = Column(String(20), nullable=False)

    error_details = Column(Text, nullable=True)
    screenshot = Column(String(255), nullable=True)

    created = Column(DateTime, default=datetime.utcnow)
    updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ExecuteResponse(BaseModel):
    execution_id: int
    status: str


class UpdatePlannedIntentRequest(BaseModel):
    intent: Optional[str] = None
    target: Optional[str] = None
    value: Optional[str] = None
    enabled: Optional[bool] = True


class UpdateExecutionStepRequest(BaseModel):
    target: Optional[str] = None
    value: Optional[str] = None



class ExecutionRun(Base):
    __tablename__ = "execution_run"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Original test case
    execution_id = Column(
        Integer,
        ForeignKey("original_intent.id"),
        nullable=False,
        index=True
    )

    batch_session_id = Column(String(100), nullable=False, index=True)

    testcase_session_id = Column(String(100), nullable=False, unique=True)

    suite_execution_id = Column(Integer, nullable=True)

    row_number = Column(Integer, nullable=False, default=0)
    parent_execution_run_id = Column(
        Integer,
        ForeignKey("execution_run.id"),
        nullable=True
    )

    status = Column(String(20), nullable=False)

    started_at = Column(DateTime)

    completed_at = Column(DateTime)

class SuiteExecutionStep(Base):
    __tablename__ = "suite_execution_step"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    batch_session_id = Column(String(100), nullable=False, index=True)
    execution_id = Column(BigInteger, nullable=False, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    data_row_id = Column(Integer, nullable=False)

    planned_intent_id = Column(BigInteger, nullable=True, index=True)

    action = Column(String(100), nullable=True)
    target = Column(Text, nullable=True)
    value = Column(Text, nullable=True)

    status = Column(String(30), nullable=False)

    screenshot = Column(Text, nullable=True)
    log_error = Column(Text, nullable=True)

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )

class StepResultResponse(BaseModel):
    step_execution_id: int
    planned_intent_id: Optional[int] = None
    action: Optional[str] = None
    target: Optional[str] = None
    value: Optional[str] = None
    status: str
    screenshot: Optional[str] = None
    log_error: Optional[str] = None
    created_at: Optional[str] = None


class TestcaseExecutionResponse(BaseModel):
    execution_id: int
    data_row_id: int
    session_id: str
    status: str
    steps: List[StepResultResponse]


class BatchExecutionResponse(BaseModel):
    batch_session_id: str
    status: str
    total_testcases: int
    total_steps: int
    testcases: List[TestcaseExecutionResponse]

class TestSuite(Base):
    __tablename__ = "test_suite"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    suite_name = Column(
        String(200),
        nullable=False,
        unique=True
    )

    description = Column(
        Text,
        nullable=True
    )

    status = Column(
        String(30),
        nullable=False,
        default="ACTIVE"
    )

    created_by = Column(
        String(100),
        nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )
    project_id = Column(
        Integer,
        nullable=False,
    )

class TestSuiteItem(Base):
    __tablename__ = "test_suite_item"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    suite_id = Column(
        BigInteger,
        nullable=False,
        index=True
    )

    execution_id = Column(
        BigInteger,
        nullable=False
    )

    data_row_id = Column(
        Integer,
        nullable=False
    )

    execution_order = Column(
        Integer,
        nullable=False,
        default=1
    )

    enabled = Column(
        Boolean,
        nullable=False,
        default=True
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )

class SuiteExecution(Base):
    __tablename__ = "suite_execution"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    suite_id = Column(
        BigInteger,
        nullable=False,
        index=True
    )

    batch_session_id = Column(
        String(100),
        nullable=False,
        unique=True,
        index=True
    )

    status = Column(
        String(30),
        nullable=False,
        default="RECEIVED"
    )

    total_testcases = Column(
        Integer,
        nullable=False,
        default=0
    )

    started_at = Column(
        DateTime,
        nullable=True
    )

    completed_at = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )

class SuiteItemRequest(BaseModel):
        execution_id: int
        data_row_id: int
        execution_order: int
        enabled: bool = True

class CreateSuiteRequest(BaseModel):
        suite_name: str
        description: Optional[str] = None
        created_by: Optional[str] = None
        items: List[SuiteItemRequest]
        project_id:int
