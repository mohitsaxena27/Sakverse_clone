from pydantic import BaseModel
from typing import List
import uuid

# class BatchExecutionRequest(BaseModel):
#     execution_ids: List[int]
#
# class ParallelExecutionRequest(BaseModel):
#     execution_ids: List[int]
#     max_parallel: int = 6

class ExecutionItem(BaseModel):
    execution_id: int
    data_row_id: int

class BatchExecutionRequest(BaseModel):
    executions: List[ExecutionItem]

class ParallelExecutionRequest(BaseModel):
    executions: List[ExecutionItem]
    max_parallel: int = 6