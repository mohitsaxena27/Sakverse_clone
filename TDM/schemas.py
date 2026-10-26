# schemas.py - Pydantic models for FastAPI
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


# Pydantic v2 compatible models. Use model_config to enable from_attributes (formerly orm_mode)
class DataIn(BaseModel):
    table_id: Optional[int]
    data: Dict[str, Any]


class DataOut(BaseModel):
    id: int
    table_id: Optional[int]
    data: Dict[str, Any]

    model_config = {"from_attributes": True}


class RepositoryIn(BaseModel):
    name: str


class RepositoryOut(BaseModel):
    id: int
    name: Optional[str]

    model_config = {"from_attributes": True}


class TableIn(BaseModel):
    table_name: str
    repo_id: int
    # 'schema' shadows BaseModel.schema; keep external JSON key as 'schema' via alias
    schema_: Dict[str, Any] = Field(..., alias="schema")

    model_config = {"populate_by_name": True}

class Column(BaseModel):
    name: str
    type: str

class TableOut(BaseModel):
    id: int
    table_name: Optional[str]
    repo_id: Optional[int]
    schema_: Optional[Dict[str, Any]] = Field(None, alias="schema")

    model_config = {"from_attributes": True, "populate_by_name": True}


# Additional response models
class TableSummary(BaseModel):
    table_id: int
    table_name: Optional[str]


class RepositoryWithTables(BaseModel):
    repo_id: int
    repo_name: Optional[str]
    tables: List[TableSummary]


class RepositoriesResponse(BaseModel):
    repositories: List[RepositoryWithTables]


class TablesResponse(BaseModel):
    tables: List[TableSummary]


class TableDataRow(BaseModel):
    row_number: int
    data_id: int
    content: Dict[str, Any]


class TableDataResponse(BaseModel):
    header: Dict[str, Any]
    data: List[TableDataRow]


class CreateTableIn(BaseModel):
    """Simpler table creation accepting columns as comma-separated string"""
    table_name: str
    repo_id: int
    columns: str  # comma-separated column names like "A,B,C"


