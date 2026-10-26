from pydantic import BaseModel
from typing import List, Optional


class IngestRequest(BaseModel):
    project_id: int

class QueryRequest(BaseModel):
    project_id: int
    query: str
    context:str
    chunk: Optional[int] = None

class AddKnowledgeRequest(BaseModel):
    project_id: int
    knowledge: str
