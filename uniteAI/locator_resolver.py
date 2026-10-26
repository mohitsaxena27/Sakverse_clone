import json
import os
import re

from dotenv import load_dotenv
from langchain_ollama import ChatOllama
from pydantic import BaseModel
from pydantic_core import ValidationError

from config import LLM_MODEL, OLLAMA_BASE_URL, MAX_DOM_CHARS
from logging_config import setup_logging
import logging

class SelectorResponse(BaseModel):
    selector: str
class LocatorResolver:
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

    def _clean_response(self, content: str) -> str:
        """
        Remove markdown wrappers like ```json ... ```
        """

        if not content:
            return ""

        content = content.strip()

        # Remove opening markdown
        content = re.sub(r"^```json\s*", "", content, flags=re.IGNORECASE)
        content = re.sub(r"^```\s*", "", content)

        # Remove closing markdown
        content = re.sub(r"\s*```$", "", content)

        return content.strip()

    def _parse_selector(self, content: str) -> str | None:
        """
        Parse and validate selector using Pydantic.
        """

        try:
            cleaned = self._clean_response(content)

            logging.info("Cleaned response:\n%s", cleaned)

            parsed_json = json.loads(cleaned)

            validated = SelectorResponse.model_validate(parsed_json)

            return validated.selector.strip()

        except (json.JSONDecodeError, ValidationError) as e:
            logging.warning("Validation failed: %s", str(e))
            return None

    def resolve(self, intent: str, dom: str) -> str:
        prompt = f"""
You are a UI element locator resolver and generate the valid selector for User Intent.

User intent:
"{intent}"

HTML DOM:
{dom}

Rules:
- Prefer <label> text associated with inputs
- Prefer placeholder attribute
- Prefer aria-label if exist
- Prefer data-label if exist
- Prefer title if exist
- Prefer text content for any container tags specially for div,span,a,h1,h2 etc.
- Prefer button text
- Prefer input type (email, password, text)
- Selector must match exactly ONE element
- locator should be derived from Given Element only and Valid for Playwright to interact.
- Prefer ARIA role + accessible name when available (Playwright-compatible). Avoid DOM sibling assumptions.
- If role = option, do NOT chain it under combobox. Options belong to listbox and must be located globally or under listbox
-- Selector MUST use one of the following engines ONLY:
  role=, css=, xpath=, text=, placeholder=, testid=
- NEVER use: label=, name=, id= alone
- Prefer role= selectors
- If label text is given, map it to role=textbox[name="..."]
- Do NOT use role=link unless the underlying element is an <a> tag or has explicit href/navigation behavior.
- NEVER chain locators under text= selectors.
- text= selectors represent leaf nodes and cannot be used as containers.
- NEVER append :nth or positional filters directly to role=, text=, placeholder= selectors.
- Until there is a positional disambiguation NEVER use '>> nth=N' ONLY.
- Never use ':nth-of-type(1)' in your selector

IMPORTANT:
- "StaticText" and "InlineTextBox" are AX-only roles.
- NEVER generate role=statictext.
- For error / validation messages, use:
  - css=[aria-live] if present
  - else role=alert or role=status
  - else text= with partial match
- Native HTML <select> handling:
  - If the underlying element is a native <select> (role=combobox with <select> tag):
    - You MUST return ONLY the combobox selector
    - NEVER generate role=option, text=, or css=option selectors
    - The option value/label will be provided separately by the executor

SELECTOR CONTRACT (MANDATORY):

1. Canonical selector format:
   - role=<role>[name="<accessible name>"]

2. If an accessible name is available, you MUST use:
   - role=<role>[name="X"]
   and MUST NOT use text= or css= for that element.

3. NEVER use chained text selectors, including:
   - ">> text="
   - ">> css=... >> text="
   - ":has-text()"

4. For role="option", role="menuitem", role="combobox":
   - You MUST use role=<role>[name="X"]
   - text= is FORBIDDEN for these roles.

5. text= selectors are allowed ONLY when:
   - No ARIA role exists
   - No accessible name exists
   - The element is non-interactive (assertion only)

6. If you generate a selector using ">> text=", it is INVALID.
   You must rewrite it to role[name="X"] before responding.
7. Native <select> rule (STRICT):
   - For native <select> elements:
     - The ONLY valid selector is:
       role=combobox[name="X"]
     - role=option is FORBIDDEN
     - text= is FORBIDDEN

Return ONLY JSON:
{{ "selector": "..." }}
"""
        max_retries = 3

        for attempt in range(max_retries):

            logging.info("Attempt %s/%s", attempt + 1, max_retries)

            response = self.llm.invoke(prompt)

            logging.info("Raw response:\n%s", response.content)

            selector = self._parse_selector(response.content)

            if selector:
                logging.info("Resolved selector: %s", selector)
                return selector

            logging.warning("Retrying due to invalid response format...")

        raise ValueError(
            "Failed to extract valid selector after multiple retries."
        )
