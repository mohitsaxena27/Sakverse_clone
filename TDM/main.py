from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
import json
import ast
import io
import pandas as pd
import os
from typing import List
from sqlalchemy.orm.attributes import flag_modified

from models import SessionLocal, engine, Base, Data, Repository, Table, Table_View
from schemas import (
    DataIn,
    DataOut,
    RepositoryIn,
    RepositoryOut,
    TableIn,
    TableOut,
    CreateTableIn,
    RepositoriesResponse,
    TablesResponse,
    TableDataResponse, Column,
)

# create tables if not exist
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dependency: get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def decode_data_blob(blob):
    try:
        return json.loads(blob.decode('utf-8'))
    except Exception:
        return {}


@app.get('/api/repositories', response_model=RepositoriesResponse)
def get_repositories(db: Session = Depends(get_db)):
    repos = db.query(Repository).all()
    result = []
    for repo in repos:
        tables = db.query(Table).filter(Table.repo_id == repo.id).all()
        table_list = [{'table_id': t.id, 'table_name': t.table_name} for t in tables]
        result.append({'repo_id': repo.id, 'repo_name': repo.name, 'tables': table_list})
    return {'repositories': result}


@app.get('/api/tables/{id}', response_model=TablesResponse)
def get_tables(id: int, db: Session = Depends(get_db)):
    tables = db.query(Table).filter(Table.repo_id == id).all()
    return {'tables': [{'table_id': t.id, 'table_name': t.table_name} for t in tables]}


@app.get('/api/tabledata/{id}', response_model=TableDataResponse)
def get_tabledata(id: int, db: Session = Depends(get_db)):
    table1 = db.query(Table).filter(Table.id == id).first()
    if not table1:
        raise HTTPException(status_code=404, detail='Table not found')

    table_view_obj = db.query(Table_View).filter(Table_View.table_id == id).first()
    table_view = None
    if table_view_obj and table_view_obj.table_view:
        try:
            table_view = ast.literal_eval(table_view_obj.table_view)
        except Exception:
            table_view = None

    if table_view:
        headers = table_view
        table_schema = {
            'additionalProperties': False,
            'properties': {field: {'type': 'string'} for field in headers},
            'view': table_view,
            'type': 'object'
        }
    else:
        table_schema = table1.schema
        headers = list(table_schema.get('properties', {}).keys())

    # fetch data ordered by id
    datas = db.query(Data).filter(Data.table_id == id).order_by(Data.id).all()

    result = []
    for idx, row in enumerate(datas, start=1):
        content = decode_data_blob(row.data) if row.data else {}
        result.append({'row_number': idx, 'data_id': row.id, 'content': content})

    return {'header': table_schema, 'data': result}


@app.post('/data', response_model=DataOut)
def create_data(payload: DataIn, db: Session = Depends(get_db)):
    table = db.query(Table).filter(Table.id == payload.table_id).first()
    if not table:
        raise HTTPException(status_code=400, detail='Invalid table ID')
    # validate with jsonschema if needed - skipping for brevity
    new = Data(table_id=payload.table_id, data=json.dumps(payload.data).encode('utf-8'))
    db.add(new)
    db.commit()
    db.refresh(new)
    return {'id': new.id, 'table_id': new.table_id, 'data': payload.data}


@app.get('/data/{id}')
def get_data_by_id(id: int, db: Session = Depends(get_db)):
    data = db.query(Data).filter(Data.id == id).all()
    result = []
    for d in data:
        result.append({'data_id': d.id, 'content': decode_data_blob(d.data)})
    return {'data': result}


@app.put('/data/{id}')
def update_data(id: int, payload: dict, db: Session = Depends(get_db)):
    d = db.query(Data).get(id)
    if not d:
        raise HTTPException(status_code=404, detail='Data not found')
    # assume payload contains 'data' dict
    new_content = payload.get('data')
    if new_content is None:
        raise HTTPException(status_code=400, detail='Missing data')
    d.data = json.dumps(new_content).encode('utf-8')
    db.commit()
    db.refresh(d)
    return {'id': d.id, 'data': new_content}


@app.delete('/data/{id}')
def delete_data(id: int, db: Session = Depends(get_db)):
    d = db.query(Data).get(id)
    if not d:
        raise HTTPException(status_code=404, detail='Data not found')
    db.delete(d)
    db.commit()
    return {'message': 'Data deleted successfully'}


@app.post('/upload_excel', response_model=dict)
def upload_excel(table_id: int = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(status_code=400, detail='Invalid table ID')
    try:
        df = pd.read_excel(file.file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    data_to_insert = [{k: str(v) for k, v in record.items()} for record in df.to_dict(orient='records')]
    for row in data_to_insert:
        # TODO: validate row against table.schema
        new = Data(table_id=table.id, data=json.dumps(row).encode('utf-8'))
        db.add(new)
    db.commit()
    return {'message': 'Data uploaded successfully'}


@app.get('/download/{id}')
def download_excel(id: int, db: Session = Depends(get_db)):
    # reuse tabledata to get rows
    api_result = get_tabledata(id, db)
    headers = list(api_result['header'].get('properties', {}).keys()) if api_result['header'] else []
    if api_result and api_result['header'].get('view'):
        headers = api_result['header']['view']
    rows = []
    for item in api_result['data']:
        rows.append([item['content'].get(h, '') for h in headers])
    df = pd.DataFrame(rows, columns=headers)
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Data')
    buf.seek(0)
    return StreamingResponse(buf, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', headers={
        'Content-Disposition': 'attachment; filename=data_grid.xlsx'
    })


# Repository / Table CRUD
@app.post('/repository', response_model=RepositoryOut)
def create_repository(payload: RepositoryIn, db: Session = Depends(get_db)):
    existing = db.query(Repository).filter(Repository.name == payload.name).first()
    if existing:
        return {'id': existing.id, 'name': existing.name}
    new = Repository(name=payload.name)
    db.add(new)
    db.commit()
    db.refresh(new)
    return {'id': new.id, 'name': new.name}


@app.get('/repository', response_model=List[RepositoryOut])
def list_repositories(db: Session = Depends(get_db)):
    repos = db.query(Repository).all()
    return repos


@app.post('/table', response_model=TableOut)
def create_table(payload: TableIn, db: Session = Depends(get_db)):
    # payload.schema_ holds the schema content (alias 'schema')
    new = Table(table_name=payload.table_name, repo_id=payload.repo_id, schema=payload.schema_)
    db.add(new)
    db.commit()
    db.refresh(new)
    return {'id': new.id, 'table_name': new.table_name}

# @app.patch("/table/{table_id}/columns")
# def add_column(
#     table_id: int,
#     column: Column,
#     db: Session = Depends(get_db)
# ):
#     table = db.query(Table).filter(Table.id == table_id).first()
#
#     if not table:
#         raise HTTPException(404, "Table not found")
#
#     schema = table.schema or {}
#     schema.setdefault("columns", []).append(column.model_dump())
#
#     table.schema = schema
#
#     db.commit()
#     db.refresh(table)
#
#     return table.schema
@app.patch("/table/{table_id}/columns")
def add_column(
        table_id: int,
        column: Column,
        db: Session = Depends(get_db)
):
    table = db.query(Table).filter(Table.id == table_id).first()

    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    schema = table.schema or {}

    properties = schema.setdefault("properties", {})

    # Prevent duplicate columns
    if column.name in properties:
        raise HTTPException(
            status_code=400,
            detail=f"Column '{column.name}' already exists."
        )

    properties[column.name] = {
        "type": column.type
    }

    table.schema = schema
    flag_modified(table, "schema")
    table_view = db.query(Table_View).filter(Table_View.table_id == table.id).first()
    if table_view:
        try:
            column_order = ast.literal_eval(table_view.table_view or "[]")
        except Exception:
            column_order = []  # Avoid duplicates
        if column.name not in column_order:
            column_order.append(column.name)
        table_view.table_view = str(column_order)

    db.commit()
    db.refresh(table)

    return table.schema
@app.delete("/table/{table_id}/columns/{column_name}")
def remove_column(
    table_id: int,
    column_name: str,
    db: Session = Depends(get_db)
):
    table = db.query(Table).filter(Table.id == table_id).first()

    if not table:
        raise HTTPException(404, "Table not found")

    schema = table.schema or {}

    schema["columns"] = [
        c for c in schema.get("columns", [])
        if c["name"] != column_name
    ]

    table.schema = schema

    db.commit()
    db.refresh(table)

    return table.schema

@app.get('/table', response_model=List[TableOut])
def list_tables(db: Session = Depends(get_db)):
    tables = db.query(Table).all()
    return tables


@app.delete('/table/{id}')
def delete_table(id: int, db: Session = Depends(get_db)):
    """Delete table by ID"""
    table = db.query(Table).get(id)
    if not table:
        raise HTTPException(status_code=404, detail='Table not found')
    db.delete(table)
    db.commit()
    return {'message': 'Table deleted successfully'}

@app.delete('/repository/{id}')
def delete_repo(id: int, db: Session = Depends(get_db)):
    """Delete table by ID"""
    repo = db.query(Repository).get(id)
    if not repo:
        raise HTTPException(status_code=404, detail='Table not found')
    db.delete(repo)
    db.commit()
    return {'message': 'Repository deleted successfully'}

@app.post('/createtable', response_model=TableOut)
def create_table_from_columns(payload: CreateTableIn, db: Session = Depends(get_db)):
    """Create table with columns as comma-separated string; auto-generates schema"""
    # Parse comma-separated columns
    columns = [col.strip() for col in payload.columns.split(',')]
    
    # Check if table already exists
    existing = db.query(Table).filter(Table.table_name == payload.table_name).first()
    if existing:
        raise HTTPException(status_code=400, detail='Table already exists')
    
    # Build JSON schema
    schema = {
        'type': 'object',
        'properties': {col: {'type': 'string'} for col in columns},
        'additionalProperties': False
    }
    
    # Create table
    new = Table(table_name=payload.table_name, repo_id=payload.repo_id, schema=schema)
    db.add(new)
    db.commit()
    db.refresh(new)
    
    return {'id': new.id, 'table_name': new.table_name, 'repo_id': new.repo_id, 'schema_': new.schema}


# Automation endpoints
@app.get('/{repo_name}/{table_name}/{row_number}/{column_name}')
def get_column_value(repo_name: str, table_name: str, row_number: int, column_name: str, db: Session = Depends(get_db)):
    repo = db.query(Repository).filter(Repository.name == repo_name).first()
    if not repo:
        raise HTTPException(status_code=404, detail='Repository not found')
    table = db.query(Table).filter(Table.repo_id == repo.id, Table.table_name == table_name).first()
    if not table:
        raise HTTPException(status_code=404, detail='Table not found')
    datas = db.query(Data).filter(Data.table_id == table.id).order_by(Data.id).all()
    if row_number < 1 or row_number > len(datas):
        raise HTTPException(status_code=404, detail='Row not found')
    row = datas[row_number - 1]
    try:
        row_data = json.loads(row.data.decode('utf-8'))
    except Exception:
        raise HTTPException(status_code=500, detail='Corrupted data')
    if column_name not in row_data:
        raise HTTPException(status_code=404, detail='Column not found')
    return {'repo': repo_name, 'table': table_name, 'row_number': row_number, 'data_id': row.id, 'column': column_name, 'value': row_data[column_name]}


@app.patch('/repository/{repo_name}/table/{table_name}/row/{row_number}/column/{column_name}')
def update_column_value(repo_name: str, table_name: str, row_number: int, column_name: str, payload: dict, db: Session = Depends(get_db)):
    print("coming here")
    new_value = payload.get('value')
    if new_value is None:
        raise HTTPException(status_code=400, detail='Missing value')
    repo = db.query(Repository).filter(Repository.name == repo_name).first()
    if not repo:
        raise HTTPException(status_code=404, detail='Repository not found')
    table = db.query(Table).filter(Table.repo_id == repo.id, Table.table_name == table_name).first()
    if not table:
        raise HTTPException(status_code=404, detail='Table not found')
    datas = db.query(Data).filter(Data.table_id == table.id).order_by(Data.id).all()
    if row_number < 1 or row_number > len(datas):
        raise HTTPException(status_code=404, detail='Row not found')
    row = datas[row_number - 1]
    try:
        row_data = json.loads(row.data.decode('utf-8'))
    except Exception:
        raise HTTPException(status_code=500, detail='Corrupted data')
    schema_columns = table.schema.get('properties', {}) if table.schema else {}
    if column_name not in schema_columns:
        raise HTTPException(status_code=400, detail='Invalid column as per schema')
    row_data[column_name] = str(new_value)
    row.data = json.dumps(row_data).encode('utf-8')
    db.commit()
    return {'message': 'Column updated successfully', 'row_number': row_number, 'data_id': row.id, 'updated_value': new_value}

