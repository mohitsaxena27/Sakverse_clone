import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from models import IngestRequest, QueryRequest, AddKnowledgeRequest
from chroma_handler import ingest_documents, query_documents, add_knowledge, rag_pipeline, rag_chunk, \
    delete_project_collection
from utilities import TokenData, get_current_user

app = FastAPI(title="Project-Aware ChromaDB API")

@app.post("/ingest")
def ingest_api(req: IngestRequest,user: TokenData = Depends(get_current_user)):
    print("here",req)
    username = user.username
    roles = user.roles
    print(user.token)
    print("i am here for sure")
    print(req)
    return ingest_documents(req,user.token)

@app.post("/query")
def query_api(req: QueryRequest,user: TokenData = Depends(get_current_user)):
    try:
        print("I am here")
        return rag_pipeline(req,user.token)
    except Exception as e:
        return e

@app.post("/add-knowledge")
def add_knowledge_api(req: AddKnowledgeRequest):
    return add_knowledge(req)



@app.post("/get_chunk")
def get_chunk(req: QueryRequest):
    try:
        print("I am here")
        return rag_chunk(req)
    except Exception as e:
        return e

@app.post("/delete_collection")
def delete_collection_api(req: IngestRequest, user: TokenData = Depends(get_current_user)):
    print("Delete request received for:", req.project_id)
    return delete_project_collection(req, user.token)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=4444, reload=True)
    # uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)