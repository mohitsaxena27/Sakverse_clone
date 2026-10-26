import json
import os

from dotenv import load_dotenv
from langchain_ollama import ChatOllama
from config import LLM_MODEL, OLLAMA_BASE_URL


class URLResolver:
    load_dotenv()
    LLM_MODEL = os.getenv("LLM_MODEL")
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL")
    API_KEY = os.getenv("OLLAMA_API_KEY")
    def __init__(self):
        self.llm = ChatOllama(
            model=os.getenv("LLM_MODEL"),
            base_url=os.getenv("OLLAMA_BASE_URL"),
            temperature=0,
            client_kwargs={
                "headers": {
                    "Authorization": f"Bearer {self.API_KEY}"
                }
            }
        )

    def resolve(self, intent: str) -> str:
        prompt = f"""
You are a URL resolver.

User intent:
"{intent}"

Return ONLY valid JSON.
Do NOT explain.

Rules:
- If the intent already looks like a URL, return it unchanged
- Otherwise, return the most likely public URL
- Prefer official login pages

Return format:
{{ "url": "https://..." }}
"""

        response = self.llm.invoke(prompt)
        return json.loads(response.content)["url"]

