# from datetime import datetime, UTC
# import json, os, uuid, re
# from http.client import HTTPException
# from dotenv import load_dotenv
# from sentence_transformers import SentenceTransformer
# from langchain.text_splitter import RecursiveCharacterTextSplitter
# from chromadb import PersistentClient
#
# from Con_Content import export_space_locally
# from db_utils import fetch_projects_from_db
# from document_loader import read_documents_from_folder
# from utilities import fetch_config_from_api
#
#
# def ingest_documents(req, token):
#     """
#     Improved ingestion pipeline:
#     - Downloads Confluence pages (if configured)
#     - Reads local documents
#     - Splits text into semantic chunks (~500 tokens, 100 overlap)
#     - Embeds with e5-base-v2 or bge-large-en-v1.5
#     - Stores in Chroma with cosine similarity
#     """
#     print(f"[INFO] Starting ingestion for project_id={req.project_id}")
#     load_dotenv()
#
#     CHROMA_DIR = os.getenv("CHROMA_DIR")
#     KNOWLEDGE_DATA_DIR = os.getenv("KNOWLEDGE_DATA_DIR")
#     auth_url = os.getenv("AUTH_URL")
#
#     # --- Step 1: Fetch Project Info
#     project_name, manual_repo = fetch_projects_from_db(str(req.project_id))
#
#     try:
#         api_url = f"{auth_url}/api/integrations/project/{req.project_id}/KM"
#         headers = {"Authorization": f"Bearer {token}"}
#         config_json = fetch_config_from_api(api_url, headers=headers)
#         keydetails = json.loads(config_json)
#         URL = keydetails["url"]
#         USERNAME = keydetails["username"]
#         PASSWORD = keydetails["password"]
#         SPACE = keydetails["config"]["space"]
#
#         print(f"[INFO] Exporting Confluence space {SPACE} ...")
#         export_space_locally(URL, USERNAME, PASSWORD, SPACE, manual_repo)
#     except Exception as e:
#         print(f"[WARN] Could not fetch from KM: {e}. Continuing with local files.")
#
#     # --- Step 2: Prepare Folder Path
#     folder_path = os.path.join(KNOWLEDGE_DATA_DIR, manual_repo)
#     if not folder_path or not os.path.exists(folder_path):
#         raise HTTPException("Project folder not found.")
#
#     docs = read_documents_from_folder(folder_path)
#     if not docs:
#         raise HTTPException("No documents found in folder.")
#
#     # --- Step 3: Initialize Chroma Collection
#     chroma_client = PersistentClient(path=CHROMA_DIR)
#     collection = chroma_client.get_or_create_collection(
#         name=f"Project-{req.project_id}",
#         metadata={"hnsw:space": "cosine"}
#     )
#     print(f"[INFO] Using Chroma collection: Project-{req.project_id}")
#
#     # --- Step 4: Load Better Embedding Model
#     # You can swap 'intfloat/e5-base-v2' with 'BAAI/bge-large-en-v1.5' if you have GPU memory
#     model_name = "intfloat/e5-base-v2"
#     print(f"[INFO] Loading embedding model: {model_name}")
#     model = SentenceTransformer(model_name)
#
#     # --- Step 5: Create Text Splitter
#     splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
#         chunk_size=500,
#         chunk_overlap=100,
#         separators=["\n\n", "\n", ".", " "]
#     )
#
#     total_chunks = 0
#
#     # --- Step 6: Process and Store Each Document
#     for idx, doc in enumerate(docs):
#         content = doc.get("content", "").strip()
#         if not content:
#             continue
#
#         chunks = splitter.split_text(content)
#         print(f"[INFO] Processing file: {doc['filename']} -> {len(chunks)} chunks")
#
#         for chunk in chunks:
#             if not chunk.strip():
#                 continue
#
#             embedding = model.encode(chunk, normalize_embeddings=True).tolist()
#             metadata = {
#                 "source_file": doc["filename"],
#                 "project_id": req.project_id,
#                 "reference_type": "seed",
#                 "source": "ingest",
#                 "created_date": datetime.now(UTC).isoformat() + "Z"
#             }
#
#             collection.add(
#                 embeddings=[embedding],
#                 documents=[chunk],
#                 metadatas=[metadata],
#                 ids=[str(uuid.uuid4())]
#             )
#
#             total_chunks += 1
#
#     print(f"[SUCCESS] Ingested {total_chunks} chunks from {len(docs)} documents for project {req.project_id}")
#     return {"message": f"Ingested {total_chunks} chunks from {len(docs)} documents for project {req.project_id}"}
