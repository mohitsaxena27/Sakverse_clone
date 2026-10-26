from pathlib import Path

import tiktoken
from docx import Document
from sentence_transformers import SentenceTransformer
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics import silhouette_score
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import matplotlib.pyplot as plt
from langchain_text_splitters import RecursiveCharacterTextSplitter

from others.Docs_Chunck import extract_chunks_clean

# Load embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Load .docx and extract cleaned paragraphs
def extract_paragraphs(docx_path):
    chunks = extract_chunks_clean(docx_path)
    return chunks

def count_tokens(text: str, model: str = "gpt-3.5-turbo") -> int:
    enc = tiktoken.encoding_for_model(model)
    return len(enc.encode(text))

# Compute semantic embeddings
def get_embeddings(text_list):
    return model.encode(text_list)

# Semantic Chunking using cosine similarity threshold
def chunk_semantically(paragraphs, threshold=0.7):
    embeddings = get_embeddings(paragraphs)
    chunks = []
    current_chunk = [paragraphs[0]]

    for i in range(1, len(paragraphs)):
        sim = cosine_similarity([embeddings[i]], [embeddings[i-1]])[0][0]
        if sim > threshold:
            current_chunk.append(paragraphs[i])
        else:
            chunks.append(" ".join(current_chunk))
            current_chunk = [paragraphs[i]]

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks
def find_best_n_clusters(paragraphs, min_k=2, max_k=10):
    embeddings = get_embeddings(paragraphs)
    scores = []

    for k in range(min_k, min(max_k, len(paragraphs))):
        clustering = AgglomerativeClustering(n_clusters=k, metric='cosine', linkage='average')
        labels = clustering.fit_predict(embeddings)
        score = silhouette_score(embeddings, labels, metric='cosine')
        scores.append((k, score))

    # Plot the scores
    # ks, ss = zip(*scores)
    # plt.plot(ks, ss, marker='o')
    # plt.xlabel('Number of Clusters')
    # plt.ylabel('Silhouette Score')
    # plt.title('Silhouette Score vs Number of Clusters')
    # plt.show()

    best_k = max(scores, key=lambda x: x[1])[0]
    return best_k
# Main function to run everything
def semantic_chunk_docx(docx_path, threshold=0.7):
    paragraphs = extract_paragraphs(docx_path)
    texts = [c["content"] for c in paragraphs]
    best_k = find_best_n_clusters(texts, min_k=2, max_k=10)
    # chunks = chunk_semantically(paragraphs, threshold=threshold)
    index_clusters  = chunk_by_clustering(texts, n_clusters=best_k)
    final_chunks = []
    for text_group in index_clusters:
        combined_text = " ".join(text_group)
        parts = split_cluster(combined_text, chunk_size=512, chunk_overlap=200)

        for part in parts:
            final_chunks.append({
                "content": part,
                "filename": docx_path
            })
    return final_chunks


def chunk_by_clustering(paragraphs, n_clusters=5):
    embeddings = get_embeddings(paragraphs)
    clustering = AgglomerativeClustering(n_clusters=n_clusters, metric='cosine', linkage='average')
    labels = clustering.fit_predict(embeddings)

    clusters = {}
    for idx, label in enumerate(labels):
        clusters.setdefault(label, []).append(paragraphs[idx])

    # Combine cluster contents into chunks
    # print("Printing Cluster values \n***********\n",clusters.values(),"\n***************\n")
    return list(clusters.values())

def split_cluster(cluster_text, chunk_size=1024, chunk_overlap=128):
    splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        encoding_name="cl100k_base",
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""]
    )
    return splitter.split_text(cluster_text)

# def hybrid_chunking(all_text, initial_parts=10,
#                     max_chunk_tokens=1024, overlap=128):
#     # Initial rough split (by e.g. paragraphs)
#     initial_texts = all_text.split("\n\n")
#     # Semantic clustering
#     clusters = chunk_by_clustering(initial_texts, n_clusters=initial_parts)
#     final_chunks = []
#     for clust in clusters:
#         # Token-size controlled splitting
#         parts = split_cluster(clust, chunk_size=max_chunk_tokens, chunk_overlap=overlap)
#         final_chunks.extend(parts)
#     return final_chunks
# Example usage
# if __name__ == "__main__":
#     docx_path = Path(__file__).resolve().parent.parent / "data" / "colt" / "CIC User Guide_v0.3.docx"
#
#     chunks = semantic_chunk_docx(docx_path, threshold=0.75)
#     # chunks = hybrid_chunking(text,
#     #                          initial_parts=8,
#     #                          max_chunk_tokens=512,
#     #                          overlap=64)
#     for i, chunk in enumerate(chunks):
#         content = chunk["content"]
#         filename = chunk.get("filename", "<unknown>")
#
#         print(f"\n--- Chunk {i + 1} ---")
#         print(f"Filename: {filename}")
#         print(content)
#         print("Token count:", count_tokens(content))
