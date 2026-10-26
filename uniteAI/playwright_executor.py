import base64
import json
import os
import re
import time
from datetime import datetime

import requests
from dotenv import load_dotenv
from playwright.sync_api import expect

from chrome_streamer import ChromeStreamer
from database import SessionLocal
from logging_config import setup_logging
import asyncio
from ax_utils import find_ax_candidates
from locator_resolver import LocatorResolver
from config import SCREENSHOT_DIR
from models import ExecutionStep, SuiteExecutionStep
from script_generatory import scriptGenerator
from url_resolver import URLResolver
load_dotenv()
BASE_URL = os.getenv("TDM_URL")

ASSERTION_ROLES = {
    # feedback
    "alert",
    "status",
    "log",
    "progressbar",

    # navigation
    "link",
    "navigation",
    "menu",
    "menubar",
    "menuitem",
    "tab",
    "tabpanel",

    # selection / state
    "option",
    "listbox",
    "listitem",
    "treeitem",
    "row",
    "cell",
    "columnheader",

    # content
    "heading",
    "main",
    "region",
    "article",
    "complementary",

    # forms
    "textbox",
    "searchbox",
    "combobox",
    "checkbox",
    "radio",
    "button",

    # generic fallback
    "generic"
}

CLICKABLE_ROLES = {
    "button",
    "link",
    "checkbox",
    "radio",
    "combobox",
    "option"  # 🔥 REQUIRED for Salesforce menus
}

EXPANDABLE_ROLES = {
    "combobox",
    "button"
}

INPUT_ROLES = {
    "textbox",
    "combobox"  # 🔥 combobox is input via selection
}

ASSERTABLE_ROLES = ASSERTION_ROLES

AX_ROLE_MAP = {
    # Input-like
    "textField": "textbox",
    "searchBox": "textbox",
    "comboBox": "combobox",

    # Clickable
    "pushButton": "button",
    "toggleButton": "button",
    "link": "link",
    "checkBox": "checkbox",
    "radioButton": "radio",
    "option": "option",  # 🔥 ADD THIS

    # Semantic / assertion
    "staticText": "generic",
    "text": "generic",
    "group": "generic",
    "status": "status",
    "alert": "alert"
}

def get_assertable_elements(tree):
    assertable = []
    ASSERTION_ROLES = {"alert", "status", "generic"}

    def walk(nodes):
        for n in nodes:
            role = normalize_role(n.get("role"))  # 🔥 FIX
            name = n.get("name")

            if role in ASSERTION_ROLES and name:
                n["role"] = role  # normalize in-place
                assertable.append(n)

            if n.get("children"):
                walk(n["children"])

    walk(tree)
    return assertable

def get_node_name(node):
    """
    Extract visible / semantic text from an Accessibility node.
    Covers name, value, description, and aria-live text.
    """

    # 1️⃣ Primary: name
    name = node.get("name")
    if isinstance(name, dict):
        val = name.get("value")
        if val:
            return str(val).strip()
    elif isinstance(name, str) and name.strip():
        return name.strip()

    # 2️⃣ Fallback: value (very common for aria-live errors)
    value = node.get("value")
    if isinstance(value, dict):
        val = value.get("value")
        if val:
            return str(val).strip()
    elif isinstance(value, str) and value.strip():
        return value.strip()

    # 3️⃣ Fallback: description
    desc = node.get("description")
    if isinstance(desc, dict):
        val = desc.get("value")
        if val:
            return str(val).strip()
    elif isinstance(desc, str) and desc.strip():
        return desc.strip()

    # 4️⃣ Last resort: aria-label / aria-labelledby
    for prop in node.get("properties", []):
        if prop.get("name") in ["aria-label", "aria-labelledby"]:
            prop_val = prop.get("value")
            if isinstance(prop_val, dict):
                val = prop_val.get("value")
                if val:
                    return str(val).strip()
            elif isinstance(prop_val, str) and prop_val.strip():
                return prop_val.strip()

    return ""

def extract_actionable_data(node):
    return {
        "nodeId": node.get("nodeId"),
        "role": node.get("role"),
        "name": get_node_name(node),
        "backendDOMNodeId": node.get("backendDOMNodeId")
    }

def build_hierarchical_tree(nodes):
    lookup = {}
    roots = []

    for n in nodes:
        lookup[n["nodeId"]] = {**n, "children": []}

    for n in nodes:
        parent = n.get("parentId")
        if parent and parent in lookup:
            lookup[parent]["children"].append(lookup[n["nodeId"]])
        else:
            roots.append(lookup[n["nodeId"]])

    return roots

def normalize_role(role):
    if isinstance(role, dict):
        role = role.get("value")
    if isinstance(role, str):
        role = role.strip()
    return AX_ROLE_MAP.get(role, role)

def get_actionable_elements(tree):
    actionable = []
    INTERACTIVE_ROLES = {
        "textbox", "button", "link", "checkbox", "radio", "combobox"
    }

    def walk(nodes):
        for n in nodes:
            role = normalize_role(n.get("role"))
            name = n.get("name")

            if role in INTERACTIVE_ROLES and name:
                n["role"] = role  # normalize in-place
                actionable.append(n)

            if n.get("children"):
                walk(n["children"])

    walk(tree)
    return actionable

def simplify_for_ai(tree, actionable_elements):
    """
    Create a simplified version for AI/automation
    Includes:
    - actionable elements
    - assertable elements (error/status messages)
    - structural nodes
    """

    simplified = []
    ASSERTION_ROLES = {"alert", "status", "generic"}

    def traverse(nodes, depth=0):
        for node in nodes:
            name = node.get("name")

            raw_role = node.get("role")
            normalized_role = normalize_role(raw_role)

            # ✅ SAFE inclusion logic (NO dict-in-set)
            include_node = (
                    bool(name)
                    or normalized_role in ["RootWebArea", "LayoutTable"]
                    or normalized_role in ASSERTION_ROLES
            )

            if include_node:
                simplified_node = {
                    "nodeId": node.get("nodeId"),
                    "role": normalized_role,  # 🔥 always string for LLM
                    "name": name,
                    "depth": depth
                }

                # Preserve DOM linkage
                if "backendDOMNodeId" in node:
                    simplified_node["backendDOMNodeId"] = node["backendDOMNodeId"]

                # Preserve semantic / aria properties
                if "properties" in node and node["properties"]:
                    simplified_node["properties"] = node["properties"]

                simplified.append(simplified_node)

            if node.get("children"):
                traverse(node["children"], depth + 1)

    traverse(tree)
    print("Simplified Tree", simplified)
    return simplified

def should_include_node(node):
    # if node.get("ignored", False):
    #     return False
    role = node.get("role")
    if role in ["none", "presentation", "LayoutTable", "LineBreak"]:
        return False
    if role == "generic" and not get_node_name(node):
        return False
    return True

def get_llm_ready_dom(page) -> str:
    return page.evaluate("""
    () => {
        const body = document.body.cloneNode(true);

        // 1. Remove scripts, styles, svg, noscript
        body.querySelectorAll('script, style, noscript, svg').forEach(e => e.remove());

        // 2. Remove hidden elements
        body.querySelectorAll('[hidden], [aria-hidden="true"]').forEach(e => e.remove());

        body.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            if (
                style.display === 'none' ||
                style.visibility === 'hidden' ||
                style.opacity === '0'
            ) {
                el.remove();
            }
        });

        // 3. Remove HTML comments (VERY IMPORTANT)
        const walker = document.createTreeWalker(
            body,
            NodeFilter.SHOW_COMMENT,
            null,
            false
        );

        const commentsToRemove = [];
        while (walker.nextNode()) {
            commentsToRemove.push(walker.currentNode);
        }

        commentsToRemove.forEach(comment => comment.remove());

        return body.innerHTML;
    }
    """)

def is_dot_pattern(raw_data):
        return (
                isinstance(raw_data, str) and
                raw_data.startswith("{") and
                raw_data.endswith("}") and
                "." in raw_data[1:-1]
        )

def is_get_var_pattern(raw_data):
    return (
        isinstance(raw_data, str) and
        raw_data.startswith("get_var(") and
        raw_data.endswith(")")
    )

def extract_var_name(raw_data):
    match = re.match(r'get_var\(["\'](.+?)["\']\)', raw_data)
    return match.group(1) if match else None

def get_tdm_value(raw_data, row_number=""):
        try:
            raw_data = raw_data.replace("${row_number}", str(row_number))
            # Step 1: extract a.b.c
            inner = raw_data[1:-1]  # "a.b.c"
            parts = inner.split(".")  # ["a", "b", "c"]

            # Step 2: build API URL
            # Example → http://.../P&P Dev/a/b/c
            url = f"{BASE_URL}/P&P Dev/" + "/".join(parts)

            # Step 3: call API
            response = requests.get(url, timeout=10)

            if response.status_code != 200:
                return raw_data  # fallback

            data = response.json()

            # Step 4: return "value" from response
            print("Data Read From TDM",raw_data)
            return data.get("value", raw_data)

        except Exception:
            return raw_data  # safe fallback

def set_tdm_value(raw_data,value):
    try:
        # Step 1: extract a.b.c
        inner = raw_data[1:-1]  # "a.b.c"
        parts = inner.split(".")  # ["a", "b", "c"]

        # Step 2: build API URL
        url = f"{BASE_URL}/P&P Dev/" + "/".join(parts)

        # Step 3: prepare payload
        payload = {
            "value": value
        }

        # Step 4: call PATCH API
        response = requests.patch(url, json=payload, timeout=10)

        # Step 5: validate response
        if response.status_code not in [200, 204]:
            print(f"PATCH failed: {response.status_code}, {response.text}")
            return False

        print("Data Updated in TDM", raw_data, "→", value)
        return True

    except Exception as e:
        print("PATCH Exception:", str(e))
        return False


class PlaywrightExecutor:
    def __init__(self, page):
        os.makedirs(SCREENSHOT_DIR, exist_ok=True)
        self.resolver = LocatorResolver()
        self.url_resolver = URLResolver()
        self.page = page
        self.scriptgenerator = scriptGenerator()
        self.runtime_context = {}
        # self.vector_store = ChunkVectorStore()
        setup_logging()

    def set_var(self, key, value):
        self.runtime_context[key] = value

    def get_var(self, key, default=None):
        return self.runtime_context.get(key, default)

    def _switch_stream_to_page(self, page, sessionid, old_streamer=None):
        """
        Move ChromeStreamer from the current CDP target to another Playwright page.
        """

        # Stop existing streamer
        if old_streamer:
            try:
                old_streamer.stop()
            except Exception as e:
                print("Error stopping old streamer:", e)

        # Create a new CDP session for the selected tab
        new_session = page.context.new_cdp_session(page)

        new_session.send("Accessibility.enable")
        new_session.send("DOM.enable")

        # Start streamer on the new tab
        new_streamer = ChromeStreamer(
            new_session,
            sessionid
        )

        new_streamer.start()

        print("Streaming switched to:", page.url)

        return new_session, new_streamer

    def execute(self, plan, sessionid, row_number):
        streamer = None
        session = None
        logs = None
        db = SessionLocal()

        results = []
        execution_failed = False
        try:



            session = self.page.context.new_cdp_session(self.page)
            session.send("Accessibility.enable")
            session.send("DOM.enable")

            streamer = ChromeStreamer(session, sessionid)
            streamer.start()
            self.page.wait_for_load_state("domcontentloaded", timeout=30000)
            active_page = self.page
            NO_SELECTOR_STEPS = {"screenshot", "wait"}

            for idx, step in enumerate(plan["steps"]):

                step_type = step["step_type"]
                intent = step["intent"]
                # value = step.get("value")
                raw_value = step["value"]
                # value = get_tdm_value(raw_value) if is_dot_pattern(raw_value) else raw_value
                if is_dot_pattern(raw_value):
                    raw_value = raw_value.replace("${row_number}", str(row_number))
                    value = get_tdm_value(raw_value)

                elif isinstance(raw_value, str) and raw_value.startswith("get_var(") and raw_value.endswith(")"):

                    match = re.match(r'get_var\(["\'](.+?)["\']\)', raw_value)
                    if match:
                        value = self.get_var(match.group(1))
                    else:
                        value = raw_value  # fallback if malformed

                else:
                    value = raw_value
                print("CALCulate",value)
                planned_intent_id = step["planned_intent_id"]
                screenshot_base64 = None
                selector = None
                frame = None
                locator = None
                ActualIntent = intent
                if step_type == "selection" and value is not None:
                    intent = f"{intent} with value {value}"

                # ------------------------------------
                # SKIP IF PREVIOUS FAILED
                # ------------------------------------
                if execution_failed:
                    results.append({
                        "step": ActualIntent,
                        "status": "skipped"
                    })
                    continue

                try:

                    # ------------------------------------
                    # FIRST STEP NAVIGATION
                    # ------------------------------------
                    if idx == 0 or step_type == "navigation":
                        navigate_if_needed(self.page, step)
                        self.page.wait_for_timeout(1500)
                        screenshot_bytes = self.page.screenshot(full_page=False)
                        screenshot_base64 = base64.b64encode(screenshot_bytes).decode("utf-8")

                        self._store_execution(
                            planned_intent_id,
                            step_type,
                            None,
                            value,
                            "passed",
                            None,
                            screenshot_base64

                        )
                        continue

                    # ------------------------------------
                    # NO SELECTOR STEPS
                    # ------------------------------------
                    if step_type in NO_SELECTOR_STEPS:

                        screenshot_path = None

                        if step_type == "wait":
                            self.page.wait_for_timeout(int(value) * 1000)
                            screenshot_bytes = self.page.screenshot(full_page=False)
                            screenshot_base64 = base64.b64encode(screenshot_bytes).decode("utf-8")

                        elif step_type == "screenshot":
                            screenshot_bytes = self.page.screenshot(full_page=False)
                            screenshot_base64 = base64.b64encode(screenshot_bytes).decode("utf-8")

                        self._store_execution(
                            planned_intent_id,
                            step_type,
                            None,
                            value,
                            "passed",
                            None,
                            screenshot_base64
                        )
                        continue

                    # ------------------------------------
                    # 1️⃣ CHECK DB FOR EXISTING SELECTOR
                    # ------------------------------------
                    existing_step = (
                        db.query(ExecutionStep)
                        .filter(
                            ExecutionStep.planned_intent_id == planned_intent_id,
                            ExecutionStep.target.isnot(None)
                        )
                        .order_by(ExecutionStep.id.desc())
                        .first()
                    )

                    if existing_step and existing_step.target:

                        selector = existing_step.target
                        print("♻️ Reusing selector from DB",selector)

                        # frame, locator = validate_selector_for_step(
                        #     self.page, selector, step_type
                        # )
                        #
                        # if not frame:
                        #     print("⚠️ Stored selector invalid. Regenerating.")
                        #     selector = None

                    # ------------------------------------
                    # 2️⃣ GENERATE NEW SELECTOR IF NEEDED
                    # ------------------------------------
                    else:
                        if step_type not in ["assertion", "custom","read"]:
                            print("⚡ Generating new selector")

                            json_output = wait_and_collect_accessibility_tree(
                                self.page,
                                session,
                                max_retries=3,
                                wait_between_retries=5000
                            )

                            ax_nodes = [
                                normalize_ax_node(n)
                                for n in json_output["pageStructure"]
                            ]

                            filtered = filter_nodes_for_step(ax_nodes, step_type)
                            llm_dump = build_llm_dump(filtered)

                            selector = resolve_with_dump(
                                self.page,
                                self.resolver,
                                intent,
                                llm_dump
                            )

                            selector = normalize_assertion_selector(selector)

                            frame, locator = validate_selector_for_step(
                                self.page,
                                selector,
                                step_type
                            )

                            if not selector or not frame:
                                raise Exception("Unable to generate valid selector")
                        else:
                            print("Script Generation for ",step_type)
                            json_output = wait_and_collect_accessibility_tree(
                                self.page,
                                session=session,
                                max_retries=3,
                                wait_between_retries=5000
                            )

                            ax_nodes = [
                                normalize_ax_node(n)
                                for n in json_output["pageStructure"]
                            ]

                            llm_dump = build_llm_dump(ax_nodes)
                            script = self.scriptgenerator.generate_assertion_script(intent=intent, page=self.page,
                                                                                    llm_dum=llm_dump)
                            selector = script
                            print("Generated Script", selector)

                    # ------------------------------------
                    # ACTION EXECUTION
                    # ------------------------------------
                    locator = resolve_locator_across_frames(self.page, selector)
                    print("Resolved Locator ", locator)
                    # locator.wait_for(state="visible", timeout=30000)
                    if step_type == "action":
                        smart_click(locator, self.page, timeout=30000)
                        # locator.click(timeout=30000)
                        self.page.wait_for_timeout(5000)

                    elif step_type == "input":

                        locator.type(value, timeout=30000)
                        self.page.wait_for_timeout(5000)

                    elif step_type == "expand":
                        if is_native_select(self.page, selector):
                            pass
                        else:
                            locator.click(timeout=30000)
                            self.page.wait_for_timeout(5000)

                    elif step_type == "selection":

                        # Case 1: Native <option>
                        if locator.evaluate("el => el.tagName === 'OPTION'"):
                            select_handle = locator.evaluate_handle("el => el.closest('select')")
                            if not select_handle:
                                raise Exception("Option found but no parent <select>")

                            select_handle.select_option(label=value)
                            self.page.wait_for_timeout(5000)

                        # Case 2: Direct <select>
                        elif locator.evaluate("el => el.tagName === 'SELECT'"):
                            locator.select_option(label=value)
                            self.page.wait_for_timeout(5000)

                        # Case 3: Custom dropdown
                        else:
                            locator.click()
                            self.page.wait_for_timeout(5000)

                    elif step_type == "assertion" or "custom" or "read":
                        # print("Script Generation for ", step_type,"With Script",selector)
                        print("At time of Execution: ",selector)
                        logs, active_page, page_changed = self._run_custom_script(
                            script=selector,
                            step=step,
                            locator=locator,
                            selector=selector,
                            row_number=row_number
                        )
                        self.page.wait_for_timeout(5000)
                        if page_changed:
                            print("🔄 Page changed. Switching streamer...")

                            session, streamer = self._switch_stream_to_page(
                                page=active_page,
                                sessionid=sessionid,
                                old_streamer=streamer
                            )

                            print("✅ Streamer now attached to:", active_page.url)

                    screenshot_bytes = active_page.screenshot(full_page=True)
                    screenshot_base64 = base64.b64encode(screenshot_bytes).decode("utf-8")

                    # self._store_execution(
                    #     planned_intent_id,
                    #     step_type,
                    #     selector,
                    #     value,
                    #     "passed",
                    #     "\n".join(logs) if isinstance(logs, list) else str(logs),
                    #     screenshot_base64
                    # )

                    # print("Step Type:", step_type, " Status:", status, "Logs:", logs, "log_text", log_text)
                    log_text = "\n".join(logs) if isinstance(logs, list) else str(logs)

                    # Determine status based on presence of 'error' (case-insensitive)
                    status = "failed" if "error" in log_text.lower() else "passed"
                    print("Step Type:", step_type, " Status:", status, "Logs:", logs, "log_text", log_text)

                    results.append({
                        "step": ActualIntent,
                        "step_type": step_type,
                        "target": selector,
                        "data": value,
                        "status": status,
                        "error": log_text,
                        "screenshot": screenshot_base64
                    })
                    # ------------------------------------
                    # STORE SUCCESS
                    # ------------------------------------
                    self._store_execution(
                        planned_intent_id,
                        step_type,
                        selector,
                        value,
                        status,
                        log_text,
                        screenshot_base64
                    )
                    log_text = None
                    logs = None

                    # results.append({
                    #     "step": ActualIntent,
                    #     "step_type": step_type,
                    #     "target": value,
                    #     "data": selector,
                    #     "status": "failed",
                    #     "error": None,
                    #     "screenshot": screenshot_base64
                    # })

                except Exception as e:
                    execution_failed = True
                    error_msg = str(e)
                    screenshot_bytes = self.page.screenshot(full_page=True)
                    screenshot_base64 = base64.b64encode(screenshot_bytes).decode("utf-8")
                    self._store_execution(
                        planned_intent_id=planned_intent_id,
                        action=step_type,
                        target=selector,
                        value=value,
                        status="failed",
                        error=error_msg,
                        screenshot=screenshot_base64

                    )
                    results.append({
                        "step": ActualIntent,
                        "step_type": step_type,
                        "target": selector,
                        "data": value,
                        "status": "failed",
                        "error": error_msg,
                        "screenshot": screenshot_base64
                    })
            streamer.stop()
            return results
        except Exception as e:
            if streamer:
                streamer.stop()
            db.close()
            raise ValueError("Browser Crashed. Retry")

        finally:
            if streamer:
                streamer.stop()
            db.close()

    def wait_for_screen_transition(self, timeout=30000):
        try:
            # Wait for DOM to be ready
            self.page.wait_for_load_state(
                "domcontentloaded",
                timeout=timeout
            )
        except Exception:
            pass

        try:
            # Wait until network activity settles
            self.page.wait_for_load_state(
                "networkidle",
                timeout=timeout
            )
        except Exception:
            # Some applications continuously make API calls,
            # so networkidle may never happen.
            pass

        # Small stabilization period
        self.page.wait_for_timeout(300)
    def suiteexecute(
            self,
            plan,
            sessionid,
            row_number,
            execution_id,
            batch_session_id
    ):

        logs = None
        db = SessionLocal()
        timeout = 60000

        results = []
        execution_failed = False
        try:
            session = self.page.context.new_cdp_session(self.page)

            self.page.wait_for_load_state("domcontentloaded", timeout=30000)

            NO_SELECTOR_STEPS = {"screenshot", "wait"}
            value = None
            for idx, step in enumerate(plan["steps"]):
                step_type = step["step_type"]
                intent = step["intent"]
                # value = step.get("value")
                raw_value = step["value"]
                # value = get_tdm_value(raw_value) if is_dot_pattern(raw_value) else raw_value
                if is_dot_pattern(raw_value):
                    raw_value = raw_value.replace("${row_number}", str(row_number))
                    value = get_tdm_value(raw_value)

                elif isinstance(raw_value, str) and raw_value.startswith("get_var(") and raw_value.endswith(")"):

                    match = re.match(r'get_var\(["\'](.+?)["\']\)', raw_value)
                    if match:
                        value = self.get_var(match.group(1))
                    else:
                        value = raw_value  # fallback if malformed

                else:
                    value = raw_value
                print("CALCulate", value)
                planned_intent_id = step["planned_intent_id"]
                screenshot_base64 = None
                selector = None
                frame = None
                locator = None
                ActualIntent = intent
                if step_type == "selection" and value is not None:
                    intent = f"{intent} with value {value}"

                # ------------------------------------
                # SKIP IF PREVIOUS FAILED
                # ------------------------------------
                if execution_failed:
                    results.append({
                        "step": ActualIntent,
                        "status": "skipped"
                    })
                    continue

                try:

                    # ------------------------------------
                    # FIRST STEP NAVIGATION
                    # ------------------------------------
                    if idx == 0 or step_type == "navigation":
                        navigate_if_needed(self.page, step)
                        self.page.wait_for_load_state("domcontentloaded", timeout=timeout)
                        self.page.wait_for_timeout(1500)
                        screenshot_bytes = self.page.screenshot(full_page=False)
                        screenshot_base64 = base64.b64encode(screenshot_bytes).decode("utf-8")

                        self.store_suite_execution_step(
                            batch_session_id=batch_session_id,
                            execution_id=execution_id,
                            session_id=sessionid,
                            data_row_id=row_number,
                            planned_intent_id=planned_intent_id,
                            action=step_type,
                            target=selector,
                            value=value,
                            status="passed",
                            screenshot=screenshot_base64,
                            log_error=None
                        )
                        continue

                    # ------------------------------------
                    # NO SELECTOR STEPS
                    # ------------------------------------
                    if step_type in NO_SELECTOR_STEPS:

                        screenshot_path = None

                        if step_type == "wait":
                            self.page.wait_for_timeout(int(value) * 1000)
                            screenshot_bytes = self.page.screenshot(full_page=False)
                            screenshot_base64 = base64.b64encode(screenshot_bytes).decode("utf-8")

                        elif step_type == "screenshot":
                            screenshot_bytes = self.page.screenshot(full_page=False)
                            screenshot_base64 = base64.b64encode(screenshot_bytes).decode("utf-8")

                        self.store_suite_execution_step(
                            batch_session_id=batch_session_id,
                            execution_id=execution_id,
                            session_id=sessionid,
                            data_row_id=row_number,
                            planned_intent_id=planned_intent_id,
                            action=step_type,
                            target=selector,
                            value=value,
                            status="passed",
                            screenshot=screenshot_base64,
                            log_error=None
                        )
                        continue

                    # ------------------------------------
                    # 1️⃣ CHECK DB FOR EXISTING SELECTOR
                    # ------------------------------------
                    existing_step = (
                        db.query(ExecutionStep)
                        .filter(
                            ExecutionStep.planned_intent_id == planned_intent_id,
                            ExecutionStep.target.isnot(None)
                        )
                        .order_by(ExecutionStep.id.desc())
                        .first()
                    )

                    if existing_step:
                        selector = existing_step.target
                        print("♻️ Reusing selector from DB", selector)
                    else:
                        if step_type not in ["assertion", "custom", "read"]:
                            print("⚡ Generating new selector")

                            json_output = wait_and_collect_accessibility_tree(
                                self.page,
                                session,
                                max_retries=3,
                                wait_between_retries=5000
                            )

                            ax_nodes = [
                                normalize_ax_node(n)
                                for n in json_output["pageStructure"]
                            ]

                            filtered = filter_nodes_for_step(ax_nodes, step_type)
                            llm_dump = build_llm_dump(filtered)

                            selector = resolve_with_dump(
                                self.page,
                                self.resolver,
                                intent,
                                llm_dump
                            )

                            selector = normalize_assertion_selector(selector)

                            frame, locator = validate_selector_for_step(
                                self.page,
                                selector,
                                step_type
                            )

                            if not selector or not frame:
                                raise Exception("Unable to generate valid selector")
                        else:
                            print("Script Generation for ", step_type)
                            json_output = wait_and_collect_accessibility_tree(
                                self.page,
                                session=session,
                                max_retries=3,
                                wait_between_retries=5000
                            )

                            ax_nodes = [
                                normalize_ax_node(n)
                                for n in json_output["pageStructure"]
                            ]

                            llm_dump = build_llm_dump(ax_nodes)
                            script = self.scriptgenerator.generate_assertion_script(intent=intent, page=self.page,
                                                                                    llm_dum=llm_dump)
                            selector = script
                            print("Generated Script", selector)
                    #
                    # # ------------------------------------
                    # ACTION EXECUTION
                    # ------------------------------------
                    locator = resolve_locator_across_frames(self.page, selector)
                    print("Resolved Locator ", locator)
                    VISIBILITY_TIMEOUT = 30000
                    # locator.wait_for(state="visible", timeout=30000)
                    if step_type == "action":
                        try:
                            locator.wait_for(state="visible", timeout=VISIBILITY_TIMEOUT)
                            self.page.wait_for_timeout(500)
                            self.wait_for_screen_transition(timeout=timeout)
                            smart_click(locator, self.page, timeout=timeout)
                            self.wait_for_screen_transition(timeout=timeout)

                            # self.page.wait_for_load_state("domcontentloaded", timeout=timeout)
                            # locator.click(timeout=30000)
                            # self.page.wait_for_timeout(1000)
                        except Exception as e:
                            print("Smart Click Failed, trying regular click", e)
                            # locator.click(timeout=30000)
                            # self.page.wait_for_timeout(1500)
                            logs.append(f"Error :Smart click failed, fallback to regular click: {str(e)}")

                    elif step_type == "input":
                        try:
                            locator.wait_for(state="visible", timeout=VISIBILITY_TIMEOUT)
                            self.page.wait_for_timeout(500)
                            self.wait_for_screen_transition(timeout=timeout)
                            locator.type(value, timeout=timeout)
                            # self.page.wait_for_timeout(1500)
                            self.wait_for_screen_transition(timeout=timeout)
                        except Exception as e:
                            print("Typing Failed, trying fill", e)
                            # locator.fill(value, timeout=30000)
                            # self.page.wait_for_timeout(1500)
                            logs.append(f"Error: Typing failed, fallback to fill: {str(e)}")

                    elif step_type == "expand":
                        if is_native_select(self.page, selector):
                            pass
                        else:
                            try:
                                locator.wait_for(state="visible", timeout=VISIBILITY_TIMEOUT)
                                self.page.wait_for_timeout(500)
                                self.wait_for_screen_transition(timeout=timeout)
                                locator.click(timeout=timeout)
                                self.wait_for_screen_transition(timeout=timeout)
                                # self.page.wait_for_load_state("domcontentloaded", timeout=timeout)
                                # self.page.wait_for_timeout(1500)
                            except Exception as e:
                                print("Expand Click Failed, trying smart click", e)
                                # smart_click(locator, self.page, timeout=30000)
                                logs.append(f"Error: Expand click failed, fallback to smart click: {str(e)}")
                                # self.page.wait_for_timeout(1500)

                    elif step_type == "selection":

                        # Case 1: Native <option>
                        if locator.evaluate("el => el.tagName === 'OPTION'"):
                            try:
                                locator.wait_for(state="visible", timeout=VISIBILITY_TIMEOUT)
                                self.page.wait_for_timeout(500)
                                self.wait_for_screen_transition(timeout=timeout)
                                select_handle = locator.evaluate_handle("el => el.closest('select')")
                                if not select_handle:
                                    raise Exception("Option found but no parent <select>")

                                select_handle.select_option(label=value, timeout=timeout)
                                # self.page.wait_for_load_state("domcontentloaded", timeout=timeout)
                                # self.page.wait_for_timeout(1500)
                                self.wait_for_screen_transition(timeout=timeout)
                            except Exception as e:
                                print("Selection Failed, trying smart click", e)
                                # smart_click(locator, self.page, timeout=30000)
                                logs.append(f"Error: Expand click failed, fallback to smart click: {str(e)}")
                                # self.page.wait_for_timeout(1500)

                        # Case 2: Direct <select>
                        elif locator.evaluate("el => el.tagName === 'SELECT'"):
                            try:
                                locator.wait_for(state="visible", timeout=VISIBILITY_TIMEOUT)
                                self.page.wait_for_timeout(500)
                                self.wait_for_screen_transition(timeout=timeout)
                                locator.select_option(label=value, timeout=timeout)
                                # self.page.wait_for_timeout(1500)
                                self.wait_for_screen_transition(timeout=timeout)
                            except Exception as e:
                                print("Select Option Failed, trying smart click", e)
                                # smart_click(locator, self.page, timeout=30000)
                                logs.append(f"Error: Select option failed, fallback to smart click: {str(e)}")
                                # self.page.wait_for_timeout(1500)

                        # Case 3: Custom dropdown
                        else:
                            try:
                                locator.wait_for(state="visible", timeout=VISIBILITY_TIMEOUT)
                                self.page.wait_for_timeout(500)
                                self.wait_for_screen_transition(timeout=timeout)
                                locator.click(timeout=timeout)
                                self.wait_for_screen_transition(timeout=timeout)
                                # self.page.wait_for_load_state("domcontentloaded", timeout=timeout)
                                # self.page.wait_for_timeout(1500)
                            except Exception as e:
                                print("Dropdown Click Failed, trying smart click", e)
                                # smart_click(locator, self.page, timeout=30000)
                                logs.append(f"Error: Dropdown click failed, fallback to smart click: {str(e)}")
                                # self.page.wait_for_timeout(1500)

                    elif step_type == "assertion" or "custom" or "read":
                        # print("Script Generation for ", step_type,"With Script",selector)
                        print("At time of Execution: ", selector)
                        # self.page.wait_for_load_state("domcontentloaded", timeout=timeout)
                        self.page.wait_for_timeout(500)
                        self.wait_for_screen_transition(timeout=timeout)

                        logs = self._run_custom_script(
                            script=selector,
                            step=step,
                            locator=locator,
                            selector=selector,
                            row_number=row_number
                        )
                        # self.page.wait_for_timeout(1500)
                        # self.page.wait_for_load_state("domcontentloaded", timeout=timeout)
                        self.wait_for_screen_transition(timeout=timeout)
                    screenshot_bytes = self.page.screenshot(full_page=True)
                    screenshot_base64 = base64.b64encode(screenshot_bytes).decode("utf-8")

                    # self._store_execution(
                    #     planned_intent_id,
                    #     step_type,
                    #     selector,
                    #     value,
                    #     "passed",
                    #     "\n".join(logs) if isinstance(logs, list) else str(logs),
                    #     screenshot_base64
                    # )

                    # print("Step Type:", step_type, " Status:", status, "Logs:", logs, "log_text", log_text)
                    log_text = "\n".join(logs) if isinstance(logs, list) else str(logs)

                    # Determine status based on presence of 'error' (case-insensitive)
                    status = "failed" if "error" in log_text.lower() else "passed"
                    print("Step Type:", step_type, " Status:", status, "Logs:", logs, "log_text", log_text)

                    results.append({
                        "step": ActualIntent,
                        "step_type": step_type,
                        "target": selector,
                        "data": value,
                        "status": status,
                        "error": log_text,
                        "screenshot": screenshot_base64
                    })
                    # ------------------------------------
                    # STORE SUCCESS
                    # ------------------------------------
                    self.store_suite_execution_step(
                        batch_session_id=batch_session_id,
                        execution_id=execution_id,
                        session_id=sessionid,
                        data_row_id=row_number,
                        planned_intent_id=planned_intent_id,
                        action=step_type,
                        target=selector,
                        value=value,
                        status=status,
                        screenshot=screenshot_base64,
                        log_error=log_text
                    )
                    log_text = None
                    logs = None

                    # results.append({
                    #     "step": ActualIntent,
                    #     "step_type": step_type,
                    #     "target": value,
                    #     "data": selector,
                    #     "status": "failed",
                    #     "error": None,
                    #     "screenshot": screenshot_base64
                    # })

                except Exception as e:
                    execution_failed = True
                    error_msg = str(e)
                    screenshot_bytes = self.page.screenshot(full_page=True)
                    screenshot_base64 = base64.b64encode(screenshot_bytes).decode("utf-8")
                    self.store_suite_execution_step(
                        batch_session_id=batch_session_id,
                        execution_id=execution_id,
                        session_id=sessionid,
                        data_row_id=row_number,
                        planned_intent_id=planned_intent_id,
                        action=step_type,
                        target=selector,
                        value=value,
                        status="failed",
                        screenshot=screenshot_base64,
                        log_error=error_msg
                    )
                    results.append({
                        "step": ActualIntent,
                        "step_type": step_type,
                        "target": selector,
                        "data": value,
                        "status": "failed",
                        "error": error_msg,
                        "screenshot": screenshot_base64
                    })
            # streamer.stop()
            return results
        except Exception as e:
            # if streamer:
            #     streamer.stop()
            db.close()
            raise ValueError("Browser Crashed. Retry")

        finally:
            # if streamer:
            #     streamer.stop()
            db.close()

    def _run_custom_script(self, script: str, step: dict, locator=None, selector=None, row_number=""):
        logs = []
        script = script.replace("${row_number}", str(row_number)) if row_number else script
        print("Script From DB", script)
        active_page = self.page  # Default to the current page
        original_page = self.page
        def custom_print(*args):
            logs.append(" ".join(str(a) for a in args))

        def tdm_fetch(raw_data):
            return get_tdm_value(raw_data, row_number)

        scope = {
            "page": self.page,
            "context": self.page.context,
            "locator": locator,
            "selector": selector,
            "step": step,
            "value": step.get("value"),
            "print": custom_print,
            "self": self,
            "asyncio": asyncio,
            "expect": expect,
            "set_var": self.set_var,
            "get_var": self.get_var,
            "vars": self.runtime_context,
            "tdm_fetch": tdm_fetch,
            "tdm_store": set_tdm_value,
            "__builtins__": __builtins__,
        }
        try:
            exec(script, scope)
            active_page = scope.get("page", self.page)
            page_changed = active_page != original_page

            print("Original page:", original_page.url)
            print("Active page:", active_page.url)
            print("Page changed:", page_changed)

            print("Active Page:", active_page.url)
            print("Total Tabs:", len(active_page.context.pages))
            print("Logs from Execution:", logs)
        except Exception as e:
            logs.append(f"ERROR: {str(e)}")
            active_page = original_page
            page_changed = False

        return logs, active_page, page_changed

    def _store_execution(
            self,
            planned_intent_id,
            action,
            target,
            value,
            status,
            error,
            screenshot,
    ):
        db = SessionLocal()
        try:
            # 🔎 Check if record already exists
            existing_execution = (
                db.query(ExecutionStep)
                .filter(ExecutionStep.planned_intent_id == planned_intent_id)
                .first()
            )

            if existing_execution:
                print("Trying to update Execution Record with", value)
                # ✅ UPDATE existing record
                existing_execution.action = action
                existing_execution.target = target
                existing_execution.value = value
                existing_execution.execution_status = status
                existing_execution.error_details = error
                existing_execution.screenshot = screenshot
                existing_execution.updated = datetime.utcnow()

            else:
                # ✅ INSERT new record
                print("Trying to Insert Execution Record with", value)
                new_execution = ExecutionStep(
                    planned_intent_id=planned_intent_id,
                    action=action,
                    target=target,
                    value=value,
                    execution_status=status,
                    error_details=error,
                    screenshot=screenshot,
                    created=datetime.utcnow()
                )
                db.add(new_execution)

            db.commit()

        except Exception as e:
            print("Exception Thrown", e)
            db.rollback()
            raise e

        finally:
            db.close()

    def store_suite_execution_step(
            self,
            batch_session_id: str,
            execution_id: int,
            session_id: str,
            data_row_id: int,
            planned_intent_id: int,
            action: str,
            target: str = None,
            value=None,
            status: str = "passed",
            screenshot: str = None,
            log_error: str = None
    ):
        """
        Store one test-step execution result in suite_execution_step.
        """

        db = SessionLocal()

        try:

            step_result = SuiteExecutionStep(
                batch_session_id=batch_session_id,
                execution_id=execution_id,
                session_id=session_id,
                data_row_id=data_row_id,

                planned_intent_id=planned_intent_id,

                action=action,
                target=target,
                value=str(value) if value is not None else None,

                status=status,

                screenshot=screenshot,
                log_error=log_error
            )

            db.add(step_result)
            db.commit()
            db.refresh(step_result)

            print(
                f"Execution step stored successfully | "
                f"batch={batch_session_id} | "
                f"execution={execution_id} | "
                f"row={data_row_id} | "
                f"planned_step={planned_intent_id} | "
                f"status={status}"
            )

            return step_result.id

        except Exception as e:

            db.rollback()

            print(
                f"Failed to store execution step | "
                f"execution={execution_id} | "
                f"planned_step={planned_intent_id} | "
                f"error={e}"
            )

            raise

        finally:
            db.close()

def navigate_if_needed(page, step):
    """
        Handles first navigation step safely.
        """
    target = step.get("target", "")
    # value = step.get("value", "")
    raw_value = step.get("value", "")
    value = get_tdm_value(raw_value) if is_dot_pattern(raw_value) else raw_value

    raw_value2 = step.get("target", "")
    target = get_tdm_value(raw_value2) if is_dot_pattern(raw_value2) else raw_value
    print("CALCulate", target)
    # Case 1: Explicit URL
    if value and value.startswith("http"):
        page.goto(value, timeout=60000)
        page.wait_for_load_state("domcontentloaded")
        return True

    # Case 2: Target looks like URL
    if target.startswith("http"):
        page.goto(target, timeout=60000)
        page.wait_for_load_state("domcontentloaded")
        return True

    return False

def wait_and_collect_accessibility_tree(
        page,
        session,
        max_retries=3,
        wait_between_retries=1500
):
    last_exception = None
    print(session)
    for attempt in range(max_retries):
        try:
            # -----------------------------
            # SMART PAGE WAIT
            # -----------------------------
            print("Attempt ", attempt)
            # page.wait_for_load_state("domcontentloaded")
            # page.wait_for_load_state("networkidle")

            # SPA stabilization
            page.wait_for_timeout(2000)

            # -----------------------------
            # AX TREE EXTRACTION
            # -----------------------------
            full_tree = session.send("Accessibility.getFullAXTree")

            all_processed_nodes = [
                extract_actionable_data(n)
                for n in full_tree.get("nodes", [])
                if should_include_node(n)
            ]

            print("Processed Node (Root):", all_processed_nodes)

            # -----------------------------
            # FRAME AX EXTRACTION
            # -----------------------------
            for frame in page.frames:
                try:
                    frame_session = page.context.new_cdp_session(frame)
                    frame_tree = frame_session.send("Accessibility.getFullAXTree")

                    processed_nodes = [
                        {
                            **extract_actionable_data(n),
                            "frame_url": frame.url,
                            "frame_name": frame.name
                        }
                        for n in frame_tree.get("nodes", [])
                        if should_include_node(n)
                    ]

                    # ✅ FIX: use extend instead of append
                    all_processed_nodes.extend(processed_nodes)

                except Exception as e:
                    print(f"Skipping frame {frame.url} due to error:", e)
                    continue

            # -----------------------------
            # FINAL VALIDATION
            # -----------------------------
            if not all_processed_nodes:
                raise ValueError("No actionable nodes found in any frame or root")
            hierarchical_tree = build_hierarchical_tree(all_processed_nodes)
            # print("Hierarchical Tree", processed_nodes)

            # actionable_elements = get_actionable_elements(hierarchical_tree)
            # simplified_tree = simplify_for_ai(hierarchical_tree, actionable_elements)
            actionable_elements = get_actionable_elements(hierarchical_tree)
            assertable_elements=None
            # print("Actionable Elements", actionable_elements)
            try:
                assertable_elements = get_assertable_elements(hierarchical_tree)
                # print("Assertable Elements", assertable_elements)
            except Exception as e:
                print("❌ get_assertable_elements crashed:", e)
            simplified_tree = simplify_for_ai(hierarchical_tree, actionable_elements)

            json_output = json.dumps({
                "pageStructure": simplified_tree,
                "actionableElements": actionable_elements,
                "assertableElements": assertable_elements
            }, indent=2, ensure_ascii=False)
            # print("Json Dump",json_output)

            INTERACTIVE_ROLES = {"textbox", "button", "link", "checkbox", "combobox", "radio"}

            has_interactive = any(
                node.get("role") in INTERACTIVE_ROLES
                for node in simplified_tree
            )

            if not has_interactive:
                raise ValueError("No interactive UI elements detected in AX tree")

            # return json_output
            return {
                "pageStructure": simplified_tree,
                "actionableElements": actionable_elements,
                "assertableElements": assertable_elements
            }

        except Exception as e:
            last_exception = e
            print("Actionable elements empty", last_exception)
            if attempt < max_retries - 1:
                page.wait_for_timeout(wait_between_retries)
            else:
                raise last_exception

def ax_hint_for_intent(intent, ax_nodes):
    candidates = find_ax_candidates(intent, ax_nodes)
    if not candidates:
        return None
    for c in candidates:
        if c["role"] in ("button", "link", "menuitem", "textbox", "combobox"):
            return c["name"]
    return candidates[0]["name"]

def should_refresh_dump(step_type, idx, page_dirty):
    if idx == 0:
        return True
    if page_dirty:
        return True
    if step_type in ("navigation", "expand", "selection"):
        return True
    return False

def is_selector_valid(page, selector):
    if not selector or not isinstance(selector, str):
        return False
    try:
        page.locator(selector)  # just construct
        return True
    except Exception:
        return False

def resolve_with_dump(page, resolver, intent, dump):
    selector = resolver.resolve(intent, dump)
    if selector and is_selector_valid(page, selector):
        return selector
    return None

def handle_assertion(self, step):
    intent = step["intent"].lower()
    target = step.get("target", "").lower()

    # Case 1: Error message assertion
    if "error" in intent or "error" in target:
        try:
            error_locator = self.page.locator(
                "#error, .loginError, [role='alert'], [aria-live]"
            )

            # ⏳ IMPORTANT: wait for visibility
            error_locator.wait_for(state="visible", timeout=5000)

            text = error_locator.inner_text().strip()

            if text:
                return {
                    "step": step["intent"],
                    "step_type": "assertion",
                    "status": "passed",
                    "actual": text
                }
            else:
                raise Exception("Error element visible but empty")

        except Exception as e:
            return {
                "step": step["intent"],
                "step_type": "assertion",
                "status": "failed",
                "reason": str(e)
            }

def normalize_assertion_selector(selector: str) -> str:
    if selector.startswith("role=statictext"):
        return "css=[aria-live]"
    return selector

OPERATION_CAPABILITIES = {
    "input": {"roles": {"textbox", "searchbox", "combobox"}},
    "action": {"roles": {"button", "link", "menuitem"}},
    "navigation": {"roles": {"button", "link"}},
    "expand": {"roles": {"button", "menuitem"}},
    "selection": {"roles": {"option", "menuitem", "listitem"}},
    "assertion": {"roles": {"alert", "status", "heading", "text"}}
}

def safe_name(ax_node):
    name = ax_node.get("name")
    if isinstance(name, dict):
        return name.get("value", "")
    if isinstance(name, str):
        return name
    return ""

def normalize_ax_node(ax_node):
    role = normalize_role(ax_node.get("role"))

    expanded = ax_node.get("expanded")

    return {
        "role": role,
        "name": safe_name(ax_node),
        "value": ax_node.get("value", {}).get("value")
        if isinstance(ax_node.get("value"), dict)
        else ax_node.get("value"),
        "disabled": ax_node.get("disabled", False),
        "expanded": expanded,
        "domNodeId": ax_node.get("backendDOMNodeId"),

        # 🔥 CAPABILITIES
        "clickable": role in CLICKABLE_ROLES,
        "input_capable": role in {"textbox", "combobox"},
        "expandable": role in {"combobox", "button"} and expanded is not None,
        "assertable": role in ASSERTION_ROLES
    }

def filter_nodes_for_step(ax_nodes, step_type):
    filtered = []

    for node in ax_nodes:
        if node.get("disabled"):
            continue
        role = node.get("role")
        clickable = node.get("clickable", False)
        input_capable = node.get("input_capable", False)
        expandable = node.get("expandable", False)
        assertable = node.get("assertable", False)
        readable_roles = [
            "text", "label", "heading", "link", "button",
            "checkbox", "radio", "textbox", "combobox"
        ]
        if step_type == "input":
            if not node["input_capable"]:
                continue

        elif step_type == "expand":
            if not (
                    expandable or
                    (role == "combobox" and clickable)
            ):
                continue
            # if not node["expandable"]:
            #     continue

        elif step_type in ("action", "navigation", "selection"):
            if not node["clickable"]:
                continue

        elif step_type == "assertion":
            if not node["assertable"]:
                continue
        elif step_type == "read":
            # Read if:
            # - explicitly assertable OR
            # - has readable role OR
            # - contains text/value/attribute
            if not (
                    assertable or
                    role in readable_roles or
                    node.get("text") or
                    node.get("value") or
                    node.get("attributes")
            ):
                continue

        elif step_type == "custom":
            # Include all actionable + assertable
            if not (
                    clickable or
                    input_capable or
                    expandable or
                    assertable
            ):
                continue
        filtered.append(node)

    return filtered

def build_llm_dump(nodes):
    return [
        {
            "role": n["role"],
            "label": n["name"],
            "value": n["value"],
            "domNodeId": n["domNodeId"]
        }
        for n in nodes
    ]

def validate_selector_for_step(page, selector, step_type):
    try:
        if page.is_closed():
            return None, None

        for frame in page.frames:
            try:
                locator = frame.locator(selector)

                if locator.count() == 0:
                    continue

                role = locator.get_attribute("role")

                # ---------------- INPUT ----------------
                if step_type == "input":
                    is_valid = (
                            locator.evaluate(
                                "el => el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable"
                            )
                            or role == "combobox"
                    )
                    if is_valid:
                        return frame, locator

                # ---------------- EXPAND ----------------
                elif step_type == "expand":
                    is_valid = (
                            locator.evaluate(
                                "el => el.tagName === 'SELECT'"
                            )
                            or role in {"option", "combobox", "button"}
                    )
                    if is_valid:
                        return frame, locator

                # ---------------- SELECTION ----------------
                elif step_type == "selection":
                    if role in {"option", "menuitem", "combobox", "button"}:
                        return frame, locator

                # ---------------- ACTION / NAVIGATION ----------------
                elif step_type in ("action", "navigation"):
                    if locator.is_visible():
                        return frame, locator

                # ---------------- DEFAULT ----------------
                else:
                    return frame, locator

            except Exception:
                continue

        return None, None

    except Exception:
        return None, None

def is_native_select(page, selector) -> bool:
    try:
        return page.locator(selector).evaluate(
            "el => el.tagName === 'SELECT'"
        )
    except Exception:
        return False

def is_option(page, selector):
    try:
        return page.locator(selector).evaluate("el => el.tagName === 'OPTION'")
    except Exception:
        return False

def get_parent_select_selector(page, option_selector):
    option = page.locator(option_selector)
    select_handle = option.evaluate_handle("el => el.closest('select')")
    if not select_handle:
        return None
    return select_handle

def resolve_locator_across_frames(page, selector, timeout=3000, overall_timeout=10000):
    end_time = time.time() + (overall_timeout / 1000)

    while time.time() < end_time:
        for frame in page.frames:
            try:
                locator = frame.locator(selector).first
                if locator.count() > 0:
                    print("Count of Locator", locator.count())
                    locator.wait_for(state="visible", timeout=timeout)
                    return locator
            except TimeoutError:
                continue
            except Exception:
                continue

        # Small polling delay
        page.wait_for_timeout(300)

    return None

def smart_click(locator, page, timeout=30000):
    # Get visible text (safe for buttons)
    try:
        button_text = locator.inner_text(timeout=timeout).strip()

        if "Calculate" in button_text:
            print("Using manual mouse event strategy for Calculate button")
            locator.click(timeout=timeout, force=True)
        else:
            print("Using normal click")
            locator.click(timeout=timeout)
    except Exception as e:
        print("Using normal click")
        locator.click(timeout=timeout)

    page.wait_for_timeout(500)

def build_assertion_prompt(intent, selector, expected_value=None):
    return f"""
You are a Playwright Python automation expert.

Generate ONLY valid Python Playwright assertion code.

Context:
- Variable page already exists
- Variable locator already exists
- Intent: {intent}
- Selector: {selector}
- Expected Value: {expected_value}

Rules:
- Use Playwright expect() whenever possible
- Use locator for element assertions
- Use page for title/url assertions
- Return executable Python code only
"""


