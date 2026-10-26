# README.md
# Project-Aware ChromaDB API

## Description
A FastAPI-based microservice that allows you to ingest, query, and update knowledge in ChromaDB, organized by project.

## Endpoints
- `POST /ingest`: Ingest text files from a project folder
- `POST /query`: Query a specific project's documents
- `POST /add-knowledge`: Add new knowledge manually to a project

## Run the server
```bash
pip install -r requirements.txt
uvicorn chroma_project_api.main:app --reload