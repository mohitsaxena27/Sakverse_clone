import os

from dotenv import load_dotenv
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import json
from config import LLM_MODEL, OLLAMA_BASE_URL
from logging_config import setup_logging
import logging


class TestPlanner:
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
        setup_logging()
        self.prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                """
        You are a QA test planner.

        Your job is to convert the user request into structured UI test steps with extracted test data

        Return ONLY valid JSON.
        DO NOT explain.
        DO NOT use selectors.
        DO NOT assume technical details.
        DO NOT merge multiple actions into one step.

        Use the following step_type values ONLY:
        - navigation   (page-level navigation)
        - expand       (Click on element to show hidden UI like dropdowns, lookups, menus)
        - selection    (choose from a visible list)
        - input        (enter free text)
        - action       (click buttons,links like Save, Login, Next)
        - read         (read visible text)
        - assertion    (verification)
        - wait         (pause execution for a specific duration when explicitly requested)
        - screenshot  (capture screen)

        Rules:
        - Use 'expand' BEFORE 'selection' for dropdowns, picklists, and lookups.
        - Use 'input' ONLY for free text fields.
        - Use 'selection' ONLY after options are visible.
        - Use 'wait' ONLY when the user explicitly requests to wait for a specific time.
        - For 'wait', use the duration in seconds in the "value" field.
        - Each step must represent ONE user intent.
        - Targets must be user-visible labels or concepts.
        - Values are optional and used only for input or selection.
        - DO NOT plan any Assertion which is not specifically asked as part of given task
        - Always Plan to take the screenshot as the Last step
        - Do not the add any number if times until user has specifically asked. For example Click 'Mark Status as Complete' third time is an invalid intent
        - Important 'expand' always comes with 'selection'. if no 'selection' possible then use 'action' instead of 'expand'
        - If User asked to select any option from drop down in given task then Always used 'expand' and 'selection' approach


        Schema:
        {{
          "steps": [
            {{
              "step": number,
              "step_type": "navigation | expand | selection | input | action | read | assertion | wait | screenshot",
              "intent": "plain English description of what the user wants to do",
              "target": "user-visible element or concept",
              "value": "optional value (for input or selection or URL only)"
            }}
          ]
        }}
        """
            ),
            ("human", "{input}")
        ])
        self.chain = self.prompt | self.llm | StrOutputParser()

    def generate_plan(self, instruction: str) -> dict:
        return json.loads(self.chain.invoke({"input": instruction}))
