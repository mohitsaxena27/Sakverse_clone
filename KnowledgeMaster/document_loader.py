import os
from typing import List, Tuple, Dict, Any
import pdfplumber
import pandas as pd
# from docx import Document
from typing import List
import markdown

from others.Chucking_Effective import extract_chunks_by_section, extract_chunks_from_pdf, extract_chunks_from_txt, \
    extract_chunks_from_table, extract_chunks_by_md
from others.Docs_Chunck import extract_chunks_clean
from others.semetic_chucking import semantic_chunk_docx


def read_documents_from_folder(folder_path: str) ->List[Dict[str, Any]]:
    docs = []
    for file_name in os.listdir(folder_path):
        full_path = os.path.join(folder_path, file_name)
        # if file_name.endswith(".txt") and os.path.isfile(full_path):
        #     with open(full_path, "r", encoding="utf-8") as f:
        #         docs.append(f.read())
        if file_name.endswith(".docx") and os.path.isfile(full_path):
            # docs.append(extract_chunks_clean(full_path))
            # docs.extend(semantic_chunk_docx(full_path))
            # docs.extend(extract_chunks_clean(full_path))
            docs.extend(extract_chunks_by_section(full_path))
        if file_name.endswith(".pdf") and os.path.isfile(full_path):
            # docs.append(extract_chunks_clean(full_path))
            # docs.extend(semantic_chunk_docx(full_path))
            # docs.extend(extract_chunks_clean(full_path))
            docs.extend(extract_chunks_from_pdf(full_path))
        if file_name.endswith(".txt") and os.path.isfile(full_path):
            # docs.append(extract_chunks_clean(full_path))
            # docs.extend(semantic_chunk_docx(full_path))
            # docs.extend(extract_chunks_clean(full_path))
            docs.extend(extract_chunks_from_txt(full_path))
        if file_name.endswith(".csv") and os.path.isfile(full_path):
            # docs.append(extract_chunks_clean(full_path))
            # docs.extend(semantic_chunk_docx(full_path))
            # docs.extend(extract_chunks_clean(full_path))
            docs.extend(extract_chunks_from_table(full_path))
        if file_name.endswith(".xlsx") and os.path.isfile(full_path):
            # docs.append(extract_chunks_clean(full_path))
            # docs.extend(semantic_chunk_docx(full_path))
            # docs.extend(extract_chunks_clean(full_path))
            docs.extend(extract_chunks_from_table(full_path))
        if file_name.endswith(".md") and os.path.isfile(full_path):
            # docs.append(extract_chunks_clean(full_path))
            # docs.extend(semantic_chunk_docx(full_path))
            # docs.extend(extract_chunks_clean(full_path))
            docs.extend(extract_chunks_by_md(full_path))


    return docs
    # docs = []
    # for file_name in os.listdir(folder_path):
    #     full_path = os.path.join(folder_path, file_name)
    #     if file_name.endswith(".txt") and os.path.isfile(full_path):
    #         with open(full_path, "r", encoding="utf-8") as f:
    #             docs.append((f.read(), file_name))  # store both content and filename
    # return docs

def read_txt_chunks(path):
    with open(path, 'r', encoding='utf-8') as f:
        return [line.strip() for line in f if line.strip()]

def read_pdf_chunks(path):
    chunks = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            for para in page.extract_text().split('\n\n'):
                chunks.append(para.strip())
    return chunks

# def read_docx_chunks(path):
#     doc = Document(path)
#     chunks = []
#     for para in doc.paragraphs:
#         if para.text.strip():
#             chunks.append(para.text.strip())
#     return chunks

def read_csv_chunks(path):
    df = pd.read_csv(path)
    return [row.dropna().to_json() for _, row in df.iterrows()]

def read_excel_chunks(path):
    df = pd.read_excel(path)
    return [row.dropna().to_json() for _, row in df.iterrows()]

def read_md_chunks(path):
    with open(path, 'r', encoding='utf-8') as f:
        html = markdown.markdown(f.read())
    return [para.strip() for para in html.split('\n') if para.strip()]

def read_feature_chunks(path):
    chunks = []
    current_chunk = []
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line.startswith("Scenario"):
                if current_chunk:
                    chunks.append('\n'.join(current_chunk))
                    current_chunk = []
            current_chunk.append(line)
        if current_chunk:
            chunks.append('\n'.join(current_chunk))
    return chunks
#
# def read_documents_from_folder(folder_path: str) -> List[str]:
#     docs = []
#     for file_name in os.listdir(fsolder_path):
#         full_path = os.path.join(folder_path, file_name)
#         ext = file_name.lower().split('.')[-1]
#         if not os.path.isfile(full_path):
#             continue
#
#         try:
#             if ext == 'txt':
#                 docs.extend(read_txt_chunks(full_path))
#             elif ext == 'pdf':
#                 docs.extend(read_pdf_chunks(full_path))
#             elif ext == 'docx':
#                 docs.extend(read_docx_chunks(full_path))
#             elif ext == 'csv':
#                 docs.extend(read_csv_chunks(full_path))
#             elif ext in ['xlsx', 'xls']:
#                 docs.extend(read_excel_chunks(full_path))
#             elif ext == 'md':
#                 docs.extend(read_md_chunks(full_path))
#             elif ext == 'feature':
#                 docs.extend(read_feature_chunks(full_path))
#         except Exception as e:
#             print(f"Error reading {file_name}: {e}")
#
#     return docs