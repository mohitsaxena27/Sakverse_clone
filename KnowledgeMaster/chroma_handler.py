import json
import os
import re
import shutil
import time
import uuid
import sqlite3
from typing import List, Dict

# from http.client import HTTPException
from fastapi import HTTPException
import requests
import numpy as np
import torch
from chromadb import Client, PersistentClient
from chromadb.config import Settings
from dotenv import load_dotenv
from fastapi import Depends
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer, util
from datetime import datetime, UTC

from Con_Content import export_space_locally
from adaptor.llm.llm_config import LLMConfig
from models import IngestRequest, QueryRequest, AddKnowledgeRequest
from db_utils import get_folder_path, fetch_projects_from_db
from document_loader import read_documents_from_folder
from config import CHROMA_PERSIST_DIR, EMBEDDING_MODEL_NAME
from sentence_transformers import SentenceTransformer

from others.LLMPublisher import LLMAdapterFactory
from utilities import TokenData, get_current_user, fetch_config_from_api

# from others.langraph import app
chroma_path = os.getenv("CHROMA_DIR", "./chroma_storage")
chroma_client = PersistentClient(path=chroma_path)

# Downloads once and caches locally
# model = SentenceTransformer('intfloat/e5-base-v2')

model = SentenceTransformer('BAAI/bge-large-en-v1.5')

# model = SentenceTransformer("all-MiniLM-L6-v2")

def ingest_documents(req: IngestRequest, token):
    project_name, manual_repo = fetch_projects_from_db(req.project_id)
    # folder_path = fetch_projects_from_db(req.project_id)
    # folder_path = fetch_projects_from_db(req.project_id)
    print("Manual Repo",manual_repo)
    print("project_name", project_name)
    load_dotenv()
    try:

        auth_url = os.getenv("AUTH_URL")

        print(token)

        api_url = auth_url + "/api/integrations/project/" + str(req.project_id) + "/KM"
        bearer_token = token
        headers = {
            "Authorization": f"Bearer {bearer_token}"
        }
        # 1) Fetch the config JSON from your API
        config_json = fetch_config_from_api(api_url, headers=headers)

        print(config_json)
        keydetails = json.loads(config_json)
        URL = keydetails["url"]
        USERNAME = keydetails["username"]
        PASSWORD = keydetails["password"]

        SPACE = keydetails["config"]["space"]
        export_space_locally(URL, USERNAME, PASSWORD, SPACE, manual_repo)

    except Exception as e:
        print("Nothing to Load from KM", e)

    KNOWLEDGE_DATA_DIR = os.getenv("KNOWLEDGE_DATA_DIR")
    print("KNOWLEDGE_DATA_DIR",KNOWLEDGE_DATA_DIR)
    folder_path = os.path.join(KNOWLEDGE_DATA_DIR, manual_repo)
    print("project Folder", folder_path)
    if not folder_path or not os.path.exists(folder_path):
        raise HTTPException(status_code=404, detail="Project folder not found.")
    docs = read_documents_from_folder(folder_path)
    print("*************", docs)
    if not docs:
        raise HTTPException(status_code=400, detail="No documents found in folder.")

    collection = chroma_client.get_or_create_collection(name="Project-" + str(req.project_id),
        metadata={"hnsw:space": "cosine"})


    print("******Collection Name for this Project*******", collection, " & ", "*************")
    splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
            chunk_size=600,
            chunk_overlap=100,
            separators=[
        "\n\n\n",            # Major section breaks
        "\n\n",              # Paragraph breaks
        "\n",                # Line breaks (for lists/tables)
        ". ",                # Sentence boundaries
        "; ",                # Semi-colon separated clauses
        " ",                 # Fallback
        ""                   # Final fallback
    ]
        )
    total_chunks = 0
    for idx, doc in enumerate(docs):

        content = doc['content'].strip()
        if not content:
            continue  # Skip empty content
        chunks = splitter.split_text(content)
        print(f"[INFO] Processing file: {doc['filename']} -> {len(chunks)} chunks")
        if not chunks:
            continue
        chunk_embeddings = model.encode(
            chunks, batch_size=8, normalize_embeddings=True, show_progress_bar=False
        ).tolist()

        ids = [str(uuid.uuid4()) for _ in chunks]
        metadatas = [{
            "source_file": doc["filename"],
            "project_id": req.project_id,
            "reference_type": "seed",
            "source": "ingest",
            "created_date": datetime.now(UTC).isoformat() + "Z"
        } for _ in chunks]

        collection.add(
            embeddings=chunk_embeddings,
            documents=chunks,
            metadatas=metadatas,
            ids=ids
        )

        total_chunks += len(chunks)
        print(f"[INFO] Processed: {doc['filename']} -> {len(chunks)} chunks")



        #     embedding = model.encode(chunk, normalize_embeddings=True).tolist()
        #     metadata = {
        #                     "source_file": doc["filename"],
        #                     "project_id": req.project_id,
        #                     "reference_type": "seed",
        #                     "source": "ingest",
        #                     "created_date": datetime.now(UTC).isoformat() + "Z"
        #                 }
        #
        #     doc_id = str(uuid.uuid4())
        # # print("********\n",embedding,"\n*************",metadata,"\n*************",content,"\n*************",doc_id,"\n*************")
        #     collection.add(
        #         embeddings=[embedding],
        #         documents=[content],
        #         metadatas=[metadata],
        #         ids=doc_id
        #     )
    DB_PATH = os.path.join(chroma_path, "chroma.sqlite3")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    collection_id = collection.id
    query = f"""
                   SELECT id AS segment_id, type, scope
                   FROM segments
                   WHERE collection = '{collection_id}' AND scope = 'VECTOR';
                   """

    cursor.execute(query)
    rows = cursor.fetchall()
    directoryName=""

    for r in rows:
        directoryName=r[0]
        print(f"Segment ID: {r[0]} | Type: {r[1]} | Scope: {r[2]}")

    # ---------------------------
    # Clean up
    # ---------------------------
    conn.close()
    # embeddings = model.encode(docs).tolist()
    #
    # collection.add(
    #     documents=docs,
    #     embeddings=embeddings,
    #     ids=[f"seed_{i}" for i in range(len(docs))],
    #     metadatas=[{"reference_type":"seed","source": "ingest", "project_id": req.project_id} for _ in docs]
    # )

    return {"message": f"Ingested {len(docs)} documents for {req.project_id}", "vectorstore": f"{directoryName}","collectionname":"Project-" + str(req.project_id)}


def rag_pipeline(user_question,token):
    load_dotenv()
    print("I am here")
    auth_url = os.getenv("AUTH_URL")

    print(token)
    # query_emb = model.encode(user_question.query, convert_to_tensor=True)
    results = query_documents(user_question)
    all_chunks = results['documents'][0]
    embeddings = results["embeddings"][0]

    # mmr_chunks = mmr(query_emb, embeddings, all_chunks, top_k=5, lambda_param=0.6)
    context_text = "\n".join(all_chunks)
    pr_id=user_question.project_id
    prompt = build_prompt(context_text, user_question.query)
    messages=[
        {"role": "user", "content": prompt}
    ]
    api_url = auth_url + "/api/integrations/project/" + str(pr_id) + "/LLM"
    bearer_token = token
    headers = {
        "Authorization": f"Bearer {bearer_token}"
    }
    # 1) Fetch the config JSON from your API
    config_json = fetch_config_from_api(api_url, headers=headers)
    print(config_json)
    print(messages)
    answer=run_llm_pipeline_text(config_json,messages)
    print("Complete Answer\n",answer,"\n")
    # answer = call_llm(prompt)
    # if is_answer_incomplete(answer, user_question.query):
    #     print("[Fallback triggered]")
    #     fallback_context = "\n".join(mmr_chunks + all_chunks[5:15])
    #     prompt = build_prompt(context_text, user_question.query)
    #     answer = call_llm(prompt)
    cleaned_answer = re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL).strip()
    safe_results = {
        "documents": results.get("documents", []),
        "metadatas": results.get("metadatas", [])
    }
    return {"answer": cleaned_answer,
            "retrieval_results": safe_results,  # raw retriever output
            "context_used": context_text}


def rag_chunk(user_question):
    print("I am here")
    query_emb = model.encode(user_question.query, convert_to_tensor=True)
    results = query_documents(user_question)
    all_chunks = results['documents'][0]
    embeddings = results["embeddings"][0]

    mmr_chunks = mmr(query_emb, embeddings, all_chunks, top_k=5, lambda_param=0.6)
    context_text = "\n".join(mmr_chunks)
    # prompt = build_prompt(context_text, user_question.query)
    # answer = call_llm(prompt)
    # # if is_answer_incomplete(answer, user_question.query):
    # #     print("[Fallback triggered]")
    # #     fallback_context = "\n".join(mmr_chunks + all_chunks[5:15])
    # #     prompt = build_prompt(context_text, user_question.query)
    # #     answer = call_llm(prompt)
    return {"chunk": context_text}


# def rag_pipeline2(user_question):
#     query_emb = model.encode(user_question.query, convert_to_tensor=True)
#     results = query_documents(user_question)
#     all_chunks = results['documents'][0]
#     embeddings = results["embeddings"][0]
#
#     mmr_chunks = mmr(query_emb, embeddings, all_chunks, top_k=5, lambda_param=0.6)
#     context_text = "\n".join(mmr_chunks)
#
#     result = app.invoke(user_question.query,context_text)
#     print(result)
#     print("\nFinal Answer:\n", result["answer"])

def call_llm(prompt, max_tokens=8048):
    payload = {
        "model": "qwen3:8b",
        "prompt": prompt,
        "max_tokens": max_tokens
    }
    response = requests.post(f"http://10.154.2.98:11434/v1/completions", json=payload)
    response.raise_for_status()
    return response.json()["choices"][0]["text"].strip()



def run_llm_pipeline_text(config_json: str, messages: List[Dict]) -> str:
    """
    The main entry point: accepts config JSON and messages, runs the selected adapter.
    """
    config_data = json.loads(config_json)
    config = LLMConfig(config_data)
    adapter = LLMAdapterFactory.get_adapter(config)
    return adapter.run(messages)

def query_documents(req: QueryRequest):
    print(req.project_id)
    print(req.query)
    chunk_number = 15
    if req.chunk is not None:
        chunk_number = req.chunk

    try:
        collection = chroma_client.get_collection(name="Project-" + str(req.project_id))
    except:
        raise HTTPException(status_code=404, detail="Project collection not found.")

    # embedding = model.encode([req.query], normalize_embeddings=True).tolist()
    embedding = model.encode(req.query, normalize_embeddings=True)
    results = collection.query(
        query_embeddings=[embedding.tolist()],
        n_results=chunk_number,
        include=["documents", "embeddings", "metadatas"]
    )
    if not results["documents"] or not results["documents"][0]:
        print("[WARN] No documents returned by Chroma.")
        return {"documents": [], "embeddings": [], "metadatas": [], "mmr_chunks": []}

    print(f"[INFO] Retrieved {len(results['documents'][0])} chunks from Chroma")
    selected_idxs = mmr(embedding, results["embeddings"][0], lambda_mult=0.6, k=10)
    mmr_chunks = [results["documents"][0][i] for i in selected_idxs]
    # mmr_chunks = mmr(embedding, results["embeddings"][0], results["documents"][0],
    #                  top_k=10, lambda_param=0.6)
    print("\n********* MMR Chunk Detail *********\n", mmr_chunks, "\n********* End MMR Chunk Detail *********\n", )
    print("\n********* Chunk Detail *********\n", results['documents'][0], "\n********* End Chunk Detail *********\n", )
    filtered_results = {
        "documents": [[results["documents"][0][i] for i in selected_idxs]],
        "embeddings": [[results["embeddings"][0][i] for i in selected_idxs]],
        "metadatas": [[results["metadatas"][0][i] for i in selected_idxs]],
    }
    return filtered_results

    # return {
    #     "project_id": req.project_id,
    #     "query": req.query,
    #     "results": [
    #         {"document": doc, "metadata": meta}
    #         for doc, meta in zip(results["documents"][0], results["metadatas"][0])
    #     ]
    # }


def build_prompt(context, question):
    return f"""You are a highly accurate and concise information extraction assistant.

Your task is to provide a clear and specific answer strictly based on the provided context. 
- If the answer exists in the context, extract it precisely and explain briefly if needed using 
  only the given information.
- If the answer is clearly implied or stated in the context (even if wording differs), respond concisely using the information available.
- If no clear or implied answer exists, respond with exactly: 'N/A'.
  - Do not include explanations, assumptions, or instructions in this case.
  - Do not fabricate or infer beyond the provided context.
  - Strictly Include all the Key Details in you Answer so that use get full details, For Example any Data point, Key or Attributes Details and Validation points, Functional Flow related details

Context:
{context}

Question:
{question}

Answer:"""


def mmr(query_embedding, embedding_list, lambda_mult=0.5, k=5):
    """
        Compute Maximal Marginal Relevance (MMR) for selecting diverse yet relevant chunks.
        """
    if isinstance(query_embedding, list):
        query_embedding = np.array(query_embedding)
    if isinstance(embedding_list, list):
        embedding_list = np.array(embedding_list)

    sim_to_query = np.dot(embedding_list, query_embedding)
    selected = []
    candidates = list(range(len(embedding_list)))

    for _ in range(min(k, len(embedding_list))):
        if not selected:
            idx = np.argmax(sim_to_query)
            selected.append(idx)
            candidates.remove(idx)
            continue

        sim_to_selected = np.max(
            np.dot(embedding_list[candidates], embedding_list[selected].T), axis=1
        )
        mmr = lambda_mult * sim_to_query[candidates] - (1 - lambda_mult) * sim_to_selected
        idx = candidates[np.argmax(mmr)]
        selected.append(idx)
        candidates.remove(idx)

    return selected


def add_knowledge(req: AddKnowledgeRequest):
    collection = chroma_client.get_or_create_collection(name="Project-" + str(req.project_id))
    embedding = model.encode([req.knowledge]).tolist()

    unique_id = f"{req.project_id}_{int(time.time())}"
    metadata = {
        "source": "manual_addition",
        "timestamp": datetime.utcnow().isoformat(),
        "project_id": req.project_id
    }

    collection.add(
        documents=[req.knowledge],
        embeddings=embedding,
        ids=[unique_id],
        metadatas=[metadata]
    )

    return {"message": "Knowledge added successfully.", "id": unique_id}


def delete_project_collection(req: IngestRequest, token):
    """
    Deletes an existing Chroma collection for a given project ID.
    """
    # Step 1: Fetch project details from DB

    load_dotenv()
    collection_name = f"Project-{str(req.project_id)}"
    try:

        # Step 2: Try fetching the collection (to confirm existence)
        try:
            collection = chroma_client.get_collection(name=collection_name)

            DB_PATH = os.path.join(chroma_path, "chroma.sqlite3")
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            collection_id = collection.id

            query = f"""
                               SELECT id AS segment_id, type, scope
                               FROM segments
                               WHERE collection = '{collection_id}' AND scope = 'VECTOR';
                               """

            cursor.execute(query)
            rows = cursor.fetchall()

            for r in rows:
                print(f"Segment ID: {r[0]} | Type: {r[1]} | Scope: {r[2]}")

            # ---------------------------
            # Clean up
            # ---------------------------
            conn.close()
            chroma_client.delete_collection(name=collection_name)
            deleted_folders = []
            missing_folders = []
            for seg_id, seg_type, seg_scope in rows:
                folder_path = os.path.join(chroma_path, seg_id)
                if os.path.exists(folder_path):
                    try:
                        shutil.rmtree(folder_path)
                        deleted_folders.append({
                            "segment_id": seg_id,
                            "type": seg_type,
                            "scope": seg_scope,
                            "folder_path": folder_path
                        })
                        print(f"🗑️ Deleted folder: {folder_path}")
                    except Exception as e:
                        print(f"⚠️ Failed to delete {folder_path}: {e}")
                else:
                    missing_folders.append(seg_id)
                    print(f"❌ Folder not found: {folder_path}")

            # Step 4: Log & respond
            print(f"[{datetime.utcnow().isoformat()}] Deleted collection: {collection_name}")
            return {
                "status": "success",
                "project_id": req.project_id,
                "collection": collection_name,
                "deleted_at": datetime.utcnow().isoformat() + "Z"
            }
        except Exception:
            print(f"Collection '{collection_name}' not found.")
            raise HTTPException(
                status_code=404,
                detail=f"Collection '{collection_name}' not found."
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete collection for project {str(req.project_id)}: {str(e)}"
        )
