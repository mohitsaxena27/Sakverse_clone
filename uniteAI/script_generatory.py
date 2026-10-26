import os

from dotenv import load_dotenv
from langchain_ollama import ChatOllama
from config import LLM_MODEL, OLLAMA_BASE_URL


class scriptGenerator:
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

    def generate_assertion_script(self, intent: str, page, llm_dum) -> str:
        """
        Intent -> AX tree -> target discovery -> Python Playwright script
        """
        print("Coming here fro Script Generation")
        prompt = f"""
    You are an expert Playwright Python automation engineer.

    Given:
    1. User intent
    2. Current page accessibility dump

    Your task:
    - Identify ALL required UI validation targets
    - Map each target to either:
        - page assertion
        - locator assertion
    - Generate final executable Python Playwright script

    Intent:
    "{intent}"

    Accessibility Dump:
    {llm_dum}

    Rules:
    - Use variable name 'page'
    - Use Playwright sync API syntax
    - Use expect()
    - Generate only executable Python code
    - Use page for title/url assertions
    - Use page.locator(...) for element assertions
    - Prefer text based robust selectors
    - Include multiple assertions if needed
    - No explanation
    - Only executable code, language annotation like ```python
    - No Import Statement

    Example:
    expect(page).to_have_title("Dashboard")
    expect(page.locator("text=Logout")).to_be_visible()
    """

        response = self.llm.invoke(prompt)

        # print("Generated Script is ", strip_markdown_fences(response.content.strip()))
        return strip_markdown_fences(response.content.strip())


def strip_markdown_fences(code: str) -> str:
    lines = code.splitlines()

    cleaned = [
        line for line in lines
        if line.strip() not in ("```python", "```")
    ]

    return "\n".join(cleaned)
