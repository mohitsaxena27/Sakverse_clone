import re

import requests
from typing import TypedDict, List, Literal, Dict, Optional

from chromadb import PersistentClient
from langgraph.graph import StateGraph
from langchain_core.runnables import Runnable, RunnableLambda
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

from chroma_handler import query_documents, mmr

class QueryRequest(BaseModel):
    project_id: str
    query: str
    chunk: Optional[int] = None

def call_llm(prompt,max_tokens=2048):
    payload = {
        "model": "qwen3:8b",
        "prompt": prompt,
        "max_tokens": max_tokens
    }
    response = requests.post(f"http://10.154.2.98:11434/v1/completions", json=payload)
    response.raise_for_status()
    return response.json()["choices"][0]["text"].strip()
# === CONFIGURATION ===
EMBEDDING_ENDPOINT = "http://localhost:8000/embed"
RETRIEVAL_ENDPOINT = "http://localhost:8000/get_chunk"
LLM_COMPLETION_ENDPOINT = "http://localhost:8000/llm"
model = SentenceTransformer('all-MiniLM-L6-v2')
# === 1. Define State Schema ===
class GraphState(TypedDict, total=False):
    query: str
    refined_query: str
    documents: List[str]
    metadatas: List[Dict]
    scores: List[float]
    answer: str
    evaluation_result: str
# === 2. Define Graph Nodes ===

def rewrite_query_node(state: GraphState) -> GraphState:
    query = state["query"]
    retrieval_preview = requests.post(RETRIEVAL_ENDPOINT, json={"query": query,"project_id":"proj_001", "chunk": 3})
    print(retrieval_preview)
    response_data = retrieval_preview.json()

    detail_chunk=response_data.get("chunk")
    print("****Initial Context to understand the Query****\n",detail_chunk,"\n****End****")
    prompt = (
        f"Based on the given context from the knowledge base, rewrite the query for better retrieval for specific ask. In context context may be possible that some other details may be available:\n"
        f"---\n{detail_chunk}\n---\n\nOriginal Query: {query}\n\nRewritten Query:"
    )
    response =  call_llm(prompt)
    print("Refined Query", re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL).strip())
    return {
        **state,
        "refined_query": re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL).strip()
    }

def retrieve_docs_node(state: GraphState) -> GraphState:
    # chroma_client = PersistentClient(path="./chroma_storage")
    # collection = chroma_client.get_or_create_collection(name="proj_001")
    # response = collection.query(
    #     query_texts=state["refined_query"],
    #     n_results=3,
    #     include=["documents", "metadatas"]
    # )
    retrieval_preview = requests.post(RETRIEVAL_ENDPOINT, json={"query": state["refined_query"], "project_id": "proj_001", "chunk":5})
    response_data = retrieval_preview.json()
    print("***Context for Refined Query Context to understand the Query****\n", response_data.get("chunk"), "\n****End****")

    # response = requests.post(RETRIEVAL_ENDPOINT, json={"query": state["refined_query"], "n_results": 10})
    return {
        **state,
        "documents": response_data.get("chunk")
    }

def evaluate_answer_node(state: GraphState) -> dict[str, str] | tuple[str, dict[str, str]]:
    # context = "\n\n".join(state["documents"])
    context = state["documents"]
    prompt = f"Based on the following context, can you fully answer the query '{state['query']}'?\n\n{context}\n\nReply 'YES' or 'NO'."
    # response = requests.post(LLM_COMPLETION_ENDPOINT, json={"prompt": prompt})
    response = call_llm(prompt)
    answer = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL).strip()
    print("*** Answer to Evaluated ****\n", answer,
          "\n****End****")

    if "not sure" in answer.lower() or "don't know" in answer.lower():
        print("*** Answer****\n", "no",
              "\n****End****")
        return {"evaluation_result": "no"}  # decision branch and state update
    else:
        print("*** Answer****\n", "Yes",
              "\n****End****")
        return {"evaluation_result": "yes"}
    # return "yes" if "yes" in answer else "no"

def generate_answer_node(state: GraphState) -> GraphState:
    # context = "\n\n".join(state["documents"])
    context = state["documents"]
    prompt = f"Answer the question based on the following documents:\n\n{context}\n\nQuestion: {state['query']}"
    # response = requests.post(LLM_COMPLETION_ENDPOINT, json={"prompt": prompt})
    response = call_llm(prompt)
    print("*** Generated Answer****\n", re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL).strip(),
          "\n****End****")
    return {
        **state,
        "answer": re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL).strip()
    }

# === 3. Build the Graph ===
graph = StateGraph(GraphState)

# Register the nodes
graph.add_node("rewrite_query", rewrite_query_node)
graph.add_node("retrieve_docs", retrieve_docs_node)
graph.add_node("evaluate_answer", evaluate_answer_node)
graph.add_node("generate_answer", generate_answer_node)

# Build transitions
graph.set_entry_point("rewrite_query")
graph.add_edge("rewrite_query", "retrieve_docs")
graph.add_edge("retrieve_docs", "generate_answer")
graph.add_edge("generate_answer", "evaluate_answer")
graph.add_conditional_edges("evaluate_answer", {
    "yes": RunnableLambda(generate_answer_node),
    "no": RunnableLambda(rewrite_query_node)
})
graph.set_finish_point("generate_answer")

# === 4. Compile the Graph ===
app = graph.compile()

# === 5. Run the Graph ===
if __name__ == "__main__":
    query_input = {"query": "What the detailed test steps for New order journey for Direct routing and Operator connect"}
    result = app.invoke(query_input)
    print(result)
    print("\nFinal Answer:\n", result["answer"])
