import asyncio
import html
import os
from dotenv import load_dotenv
import sys
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict
from typing import List, Dict, Any, Optional, Literal

import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import logging
import json
from datetime import datetime
from fastapi.responses import HTMLResponse, FileResponse
import html
from batch_execution import ParallelExecutionRequest, BatchExecutionRequest, ExecutionItem
from browser_contaner import start_browser_container, connect_with_retry
from chrome_streamer import ChromeStreamer
from database import SessionLocal
from logging_config import setup_logging
from models import ExecutionStep, ExecuteResponse, OriginalIntent, PlannedIntent, UpdatePlannedIntentRequest, \
    UpdateExecutionStepRequest, SuiteExecutionStep, CreateSuiteRequest, TestSuite, TestSuiteItem, SuiteExecution
from planner import TestPlanner
from playwright_executor import PlaywrightExecutor

from playwright.sync_api import sync_playwright

from result_publisher import AzureDevOpsTestPublisher
from screenshot_compressor import compress_base64_image

if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
from repositories import save_original_intent, save_planned_intents

load_dotenv()
# -------------------------
# App Initialization
# -------------------------
app = FastAPI(
    title="GenAI Test Execution API",
    description="API to execute AI-planned Playwright test cases",
    version="1.0.0"
)

setup_logging()


# -------------------------
# Request / Response Models
# -------------------------
class TestExecutionRequest(BaseModel):
    instruction: str
    id: int
    projectId: int = None
    row_number: Optional[int] = None


class TestExecutionResponse(BaseModel):
    status: str
    plan: dict
    results: List[Dict[str, Any]]


class CloneExecutionRequest(BaseModel):
    instruction: str
    testcase_id: int
    source_execution_id: int  # execution to copy from
    row_number: Optional[int] = None


# -------------------------
# Core Execution Function
# -------------------------
# def run_test_execution(instruction: str):
#     planner = TestPlanner()
#     db = SessionLocal()
#     planned_step_by_intent = None
#     try:
#         # -------------------------
#         # Store Initial Instructions
#         # -------------------------
#         original_intent = save_original_intent(
#             db=db,
#             intent=instruction,
#             created_by="API_USER"
#         )
#         plan = planner.generate_plan(instruction)
#
#         logging.info("Generated Plan")
#         logging.info(json.dumps(plan, indent=2))
#         # -------------------------
#         # Store Plan
#         # -------------------------
#         planned_steps = save_planned_intents(
#             db=db,
#             user_intent_id=original_intent.id,
#             plan_steps=plan.get("steps", []),
#             created_by="API_USER"
#         )
#         db.flush()
#
#         # BUILD MAP WHILE SESSION IS ACTIVE
#         planned_step_by_intent = {
#             step.intent: step.id
#             for step in planned_steps
#         }
#         print("Planned Steps", planned_steps)
#         db.commit()
#     except Exception:
#         db.rollback()
#         print("Something goes wrong")
#         raise
#
#     finally:
#         db.close()
#         print("DB Close Finally")
#     with sync_playwright() as p:
#         context = p.chromium.launch_persistent_context(
#             user_data_dir=r"C:\Users\local.admin\AppData\Local\Google\Chrome\User Data\Default",
#             headless=False,
#             args=["--disable-blink-features=AutomationControlled"]
#         )
#
#         page = context.pages[0] if context.pages else context.new_page()
#
#         executor = PlaywrightExecutor(page)
#
#         results = executor.execute(plan,sessionid)
#
#         # context.close()
#         # -------------------------
#         # Store Execution Results
#         # -------------------------
#         # db = SessionLocal()
#         try:
#             save_execution_steps(
#                 db=db,
#                 planned_steps=planned_step_by_intent,
#                 execution_results=results
#             )
#             db.commit()
#         except Exception:
#             db.rollback()
#             raise
#         finally:
#             db.close()
#     return plan, results
SUITES = {
    "SMOKE": [
        29, 23, 27, 84, 86, 88, 87, 41, 58, 69,
        70, 71, 72, 47, 49, 73, 75, 77, 76, 40,
        39, 68, 80, 78, 67, 83, 85, 57, 60, 89
    ]
}


def create_stealth_page(browser):
    headless = os.getenv("HEADLESS", "False").lower() == "true"

    if headless:
        # Full stealth mode needed for headless
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.pages[0] if context.pages else context.new_page()
        page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            window.chrome = {runtime: {}};
            const q = window.navigator.permissions.query;
            window.navigator.permissions.query = (p) => p.name === 'notifications' ? Promise.resolve({state: Notification.permission}) : q(p);
            Object.defineProperty(navigator, 'plugins', {get: () => [1,2,3,4,5]});
            Object.defineProperty(navigator, 'languages', {get: () => ['en-US','en']});
        """)
    else:
        # Headful mode — no stealth needed
        context = browser.new_context()
        page = context.pages[0] if context.pages else context.new_page()

    return context, page


def save_execution_steps(db, planned_steps, execution_results):
    for result in execution_results:
        # print("Here is the result",result)
        planned_intent_id = planned_steps.get(result["step"])

        if not planned_intent_id:
            raise ValueError(
                f"No planned step found for intent: {result['step']}"
            )

        execution_step = ExecutionStep(
            planned_intent_id=planned_intent_id,
            action=result["step_type"],
            target=result.get("target"),
            value=result.get("data"),
            execution_status=result["status"],
            error_details=result.get("error_details"),
            screenshot=result.get("screenshot")
        )

        db.add(execution_step)

    db.commit()





@app.post("/execute-test")
def execute_test(
        request: TestExecutionRequest,
        background_tasks: BackgroundTasks
):
    if not request.instruction.strip():
        raise HTTPException(status_code=400, detail="Instruction cannot be empty")

    db = SessionLocal()
    session_id = str(uuid.uuid4())
    print("Unique Session ID", session_id)
    try:
        existing_execution = None

        # 1️⃣ Check if ID exists
        if request.id:
            existing_execution = db.query(OriginalIntent).filter(
                OriginalIntent.testcase_id == request.id
            ).first()

            print("Exiting ", existing_execution)

        if existing_execution:

            # 2️⃣ If instruction same → reuse plan
            if existing_execution.intent.strip() == request.instruction.strip():
                background_tasks.add_task(
                    run_execution_only_async,  # 🔥 execute only
                    existing_execution.id,
                    session_id,
                    request.row_number
                )
                return {
                    "execution_id": existing_execution.id,
                    "status": "InProgress",
                    "session_id": session_id
                }
            else:
                # db.query(PlannedIntent).filter(
                #     PlannedIntent.user_intent_id == existing_execution.id
                # ).delete(synchronize_session=False)
                #
                # db.commit()

                # 2️⃣ Update original execution
                existing_execution.intent = request.instruction
                existing_execution.automated = "InProgress"
                existing_execution.version = int(existing_execution.version) + 1  # optional versioning
                db.commit()
                db.refresh(existing_execution)
                background_tasks.add_task(
                    run_execution_only_async,
                    existing_execution.id,
                    session_id,
                    request.row_number
                )

                return {
                    "execution_id": existing_execution.id,
                    "status": "RECEIVED",
                    "session_id": session_id
                }
        else:
            original = save_original_intent(
                db=db,
                intent=request.instruction,
                created_by="API_USER",
                automated="RECEIVED",
                testcase_id=request.id,
                project_id=request.projectId,
                version="1"
            )

            db.commit()
            db.refresh(original)

            background_tasks.add_task(
                run_test_execution_async,
                original.id,
                request.instruction,
                session_id,
                request.row_number
            )

            return {
                "execution_id": original.id,
                "status": "RECEIVED",
                "session_id": session_id
            }
    except Exception as e:
        print("Get and Error", e)
    finally:
        db.close()


@app.post("/clone-execution")
def clone_execution(
        request: CloneExecutionRequest
):
    db = SessionLocal()

    try:

        # ---------------------------------
        # Validate source execution exists
        # ---------------------------------
        source_execution = (
            db.query(OriginalIntent)
            .filter(OriginalIntent.id == request.source_execution_id)
            .first()
        )

        if not source_execution:
            raise HTTPException(
                status_code=404,
                detail="Source execution not found"
            )

        # ---------------------------------
        # Create new Original Intent
        # ---------------------------------
        new_original = OriginalIntent(
            intent=request.instruction,
            created_by="API_USER",
            automated="CLONED",
            testcase_id=request.testcase_id,
            version="1"
        )

        db.add(new_original)
        db.flush()  # generate ID

        new_execution_id = new_original.id

        # ---------------------------------
        # Fetch planned intents
        # ---------------------------------
        source_plans = (
            db.query(PlannedIntent)
            .filter(
                PlannedIntent.user_intent_id ==
                request.source_execution_id
            )
            .all()
        )

        plan_mapping = {}

        # ---------------------------------
        # Clone Planned Intents
        # ---------------------------------
        for plan in source_plans:
            cloned_plan = PlannedIntent(
                user_intent_id=new_execution_id,
                step_type=plan.step_type,
                intent=plan.intent,
                target=plan.target,
                value=plan.value,
                created_by="API_USER",
                updated_by="API_USER",
                execution_status="PENDING",
                execution_order=plan.execution_order,
                enabled=plan.enabled
            )

            db.add(cloned_plan)
            db.flush()

            plan_mapping[plan.id] = cloned_plan.id

        # ---------------------------------
        # Clone Execution Steps
        # ---------------------------------
        for old_plan_id, new_plan_id in plan_mapping.items():

            source_steps = (
                db.query(ExecutionStep)
                .filter(
                    ExecutionStep.planned_intent_id ==
                    old_plan_id
                )
                .all()
            )

            for step in source_steps:
                cloned_step = ExecutionStep(
                    planned_intent_id=new_plan_id,
                    action=step.action,
                    target=step.target,
                    value=step.value,
                    execution_status="PENDING",
                    error_details=None,
                    screenshot=None,

                )

                db.add(cloned_step)

        db.commit()

        return {
            "status": "SUCCESS",
            "new_execution_id": new_execution_id,
            "copied_plans": len(plan_mapping)
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        db.close()


def run_execution_only_async(execution_id: int, sessionid: str, row_number: int):
    db = SessionLocal()
    print("Comming to Execute as it found the plan")
    try:
        execution = db.query(OriginalIntent).filter(
            OriginalIntent.id == execution_id
        ).first()
        print("Execution", execution)
        if not execution:
            print("Execution aborted as no execution", execution)
            return
        planned_steps = db.query(PlannedIntent).filter(
            PlannedIntent.user_intent_id == execution_id,
            PlannedIntent.enabled.is_(True)
        ).order_by(PlannedIntent.execution_order.asc()).all()
        print("Extracted plan", planned_steps)
        if not planned_steps:
            # execution.automated = "FAILED_NO_PLAN_FOUND"
            # db.commit()
            # return
            original = db.get(OriginalIntent, execution_id)
            original.automated = "PLANNING"
            db.commit()
            planner = TestPlanner()
            plan = planner.generate_plan(original.intent)
            planned_steps1 = save_planned_intents(
                db=db,
                user_intent_id=execution_id,
                plan_steps=plan["steps"],
                created_by="API_USER"
            )
            db.commit()
            planned_steps = db.query(PlannedIntent).filter(
                PlannedIntent.user_intent_id == execution_id,
                PlannedIntent.enabled.is_(True)
            ).order_by(PlannedIntent.execution_order.asc()).all()
            print("Extracted plan", planned_steps)

        execution.automated = "RUNNING"
        db.commit()

        # planned_map = {step.intent: step.id for step in planned_steps}
        plan = {
            "steps": [
                {
                    "intent": step.intent,
                    "step_type": step.step_type,
                    "value": step.value,
                    "planned_intent_id": step.id
                }
                for step in planned_steps
            ]
        }
        # print("Updated Plan", plan)
        container, endpoint = start_browser_container()
        with sync_playwright() as p:
            # context = p.chromium.launch_persistent_context(
            #     user_data_dir=r"C:\Users\local.admin\AppData\Local\Google\Chrome\User Data\Default",
            #     headless=False
            # )
            #################################
            print("Dockers detail", container, endpoint)
            # browser = connect_with_retry(p, endpoint)
            # context = browser.new_context()
            # page = context.pages[0] if context.pages else context.new_page()
            browser = connect_with_retry(p, endpoint)
            context, page = create_stealth_page(browser)
            print("Print Browser and Page", browser, context, page)
            #########################################
            # contexts = browser.contexts
            # context = contexts[0] if contexts else browser.new_context()
            #
            # # Get or create page safely
            # pages = context.pages
            # page = pages[0] if pages else context.new_page()
            page.set_default_timeout(15000)  # applies to click, fill, wait_for_selector
            page.set_default_navigation_timeout(30000)
            # except Exception as e:
            #     print("Exception:",e)
            # if not page:
            #     raise ValueError("Playwright page is not initialized")
            # else:
            print("Run till Here")
            executor = PlaywrightExecutor(page)
            results = executor.execute(plan, sessionid, row_number)
            # print("Execution results", results)
            page.close()
            context.close()
            browser.close()
            if container:
                try:
                    container.stop(timeout=5)
                    container.remove(force=True)
                    print("Container cleaned:", container.id)
                except Exception as cleanup_error:
                    print("Cleanup failed:", cleanup_error)
        # execution = db.query(OriginalIntent).filter(
        #     OriginalIntent.id == execution_id
        # ).first()

        try:
            execution = db.query(OriginalIntent).filter(
                OriginalIntent.id == execution_id
            ).first()

            execution.automated = "COMPLETED"

            db.commit()


        except Exception as e:
            print("Get1 and Error", e)
    except Exception as e:
        print("Get2 and Error", e)
    finally:
        # execution = db.query(OriginalIntent).filter(
        #     OriginalIntent.id == execution_id
        # ).first()
        # execution.automated = "Failed"
        # db.commit()
        # db.close()
        print("In Finally")


def run_execution_only_async_suite(execution_id: int, sessionid: str, row_number: int, batch_session_id: str):
    db = SessionLocal()
    print("Comming to Execute as it found the plan")
    try:
        execution = db.query(OriginalIntent).filter(
            OriginalIntent.id == execution_id
        ).first()
        print("Execution", execution)
        if not execution:
            print("Execution aborted as no execution", execution)
            return
        planned_steps = db.query(PlannedIntent).filter(
            PlannedIntent.user_intent_id == execution_id,
            PlannedIntent.enabled.is_(True)
        ).order_by(PlannedIntent.execution_order.asc()).all()
        print("Extracted plan", planned_steps)
        if not planned_steps:
            # execution.automated = "FAILED_NO_PLAN_FOUND"
            # db.commit()
            # return
            original = db.get(OriginalIntent, execution_id)
            original.automated = "PLANNING"
            db.commit()
            planner = TestPlanner()
            plan = planner.generate_plan(original.intent)
            planned_steps1 = save_planned_intents(
                db=db,
                user_intent_id=execution_id,
                plan_steps=plan["steps"],
                created_by="API_USER"
            )
            db.commit()
            planned_steps = db.query(PlannedIntent).filter(
                PlannedIntent.user_intent_id == execution_id,
                PlannedIntent.enabled.is_(True)
            ).order_by(PlannedIntent.execution_order.asc()).all()
            print("Extracted plan", planned_steps)

        execution.automated = "RUNNING"
        db.commit()

        # planned_map = {step.intent: step.id for step in planned_steps}
        plan = {
            "steps": [
                {
                    "intent": step.intent,
                    "step_type": step.step_type,
                    "value": step.value,
                    "planned_intent_id": step.id
                }
                for step in planned_steps
            ]
        }
        # print("Updated Plan", plan)
        container, endpoint = start_browser_container()
        with sync_playwright() as p:
            # context = p.chromium.launch_persistent_context(
            #     user_data_dir=r"C:\Users\local.admin\AppData\Local\Google\Chrome\User Data\Default",
            #     headless=False
            # )
            #################################
            print("Dockers detail", container, endpoint)
            # browser = connect_with_retry(p, endpoint)
            # context = browser.new_context()
            # page = context.pages[0] if context.pages else context.new_page()
            browser = connect_with_retry(p, endpoint)
            context, page = create_stealth_page(browser)
            print("Print Browser and Page", browser, context, page)
            #########################################
            # contexts = browser.contexts
            # context = contexts[0] if contexts else browser.new_context()
            #
            # # Get or create page safely
            # pages = context.pages
            # page = pages[0] if pages else context.new_page()
            page.set_default_timeout(15000)  # applies to click, fill, wait_for_selector
            page.set_default_navigation_timeout(30000)
            # except Exception as e:
            #     print("Exception:",e)
            # if not page:
            #     raise ValueError("Playwright page is not initialized")
            # else:
            print("Run till Here")
            executor = PlaywrightExecutor(page)
            results = executor.suiteexecute(
                plan=plan,
                sessionid=sessionid,
                row_number=row_number,
                execution_id=execution_id,
                batch_session_id=batch_session_id
            )
            # print("Execution results", results)
            page.close()
            context.close()
            browser.close()
            if container:
                try:
                    container.stop(timeout=5)
                    container.remove(force=True)
                    print("Container cleaned:", container.id)
                except Exception as cleanup_error:
                    print("Cleanup failed:", cleanup_error)
        # execution = db.query(OriginalIntent).filter(
        #     OriginalIntent.id == execution_id
        # ).first()

        try:
            execution = db.query(OriginalIntent).filter(
                OriginalIntent.id == execution_id
            ).first()

            execution.automated = "COMPLETED"

            db.commit()


        except Exception as e:
            print("Get1 and Error", e)
        return results
    except Exception as e:
        print("Get2 and Error", e)
    finally:
        # execution = db.query(OriginalIntent).filter(
        #     OriginalIntent.id == execution_id
        # ).first()
        # execution.automated = "Failed"
        # db.commit()
        # db.close()
        print("In Finally")


def run_test_execution_async(original_intent_id: int, instruction: str, sessionid: str, row_number: int):
    db = SessionLocal()
    original = None
    try:
        # Update execution state
        original = db.get(OriginalIntent, original_intent_id)
        original.automated = "PLANNING"
        db.commit()

        planner = TestPlanner()
        plan = planner.generate_plan(instruction)

        planned_steps = save_planned_intents(
            db=db,
            user_intent_id=original_intent_id,
            plan_steps=plan["steps"],
            created_by="API_USER"
        )

        db.commit()

        original.automated = "RUNNING"
        plan = {
            "steps": [
                {
                    "intent": step.intent,
                    "step_type": step.step_type,
                    "value": step.value,
                    "planned_intent_id": step.id
                }
                for step in planned_steps
            ]
        }
        db.commit()
        container, endpoint = start_browser_container()
        with sync_playwright() as p:
            # context = p.chromium.launch_persistent_context(
            #     user_data_dir=r"C:\Users\local.admin\AppData\Local\Google\Chrome\User Data\Default",
            #     headless=True
            # )
            # # context = p.chromium.launch(headless=True)
            # browser = connect_with_retry(p, endpoint)
            # # browser = p.chromium.launch(headless=True)
            # context = browser.new_context()
            # page = context.pages[0] if context.pages else context.new_page()
            browser = connect_with_retry(p, endpoint)
            context, page = create_stealth_page(browser)
            page.set_default_timeout(15000)
            page.set_default_navigation_timeout(30000)
            # page = context.pages[0] if context.pages else context.new_page()
            # page.set_default_timeout(15000)  # applies to click, fill, wait_for_selector
            # page.set_default_navigation_timeout(30000)
            if not page:
                raise ValueError("Playwright page is not initialized")
            else:
                executor = PlaywrightExecutor(page)
                results = executor.execute(plan, sessionid, row_number)
                page.close()
                context.close()
                browser.close()
                if container:
                    try:
                        container.stop(timeout=5)
                        container.remove(force=True)
                        print("Container cleaned:", container.id)
                    except Exception as cleanup_error:
                        print("Cleanup failed:", cleanup_error)
           
           
        original.automated = "COMPLETED"
        db.commit()

    except Exception as e:
        original.automated = "FAILED"
        db.commit()
        logging.exception("Execution failed")

    finally:
        db.close()


@app.get("/execution-result/{execution_id}")
def get_execution_result(execution_id: int):
    db = SessionLocal()
    try:
        # -------------------------
        # Fetch original intent
        # -------------------------
        original = db.get(OriginalIntent, execution_id)
        if not original:
            raise HTTPException(status_code=404, detail="Execution not found")

        # -------------------------
        # Status mapping
        # -------------------------
        status_map = {
            "COMPLETED": "SUCCESS",
            "FAILED": "FAILED",
            "CLONED": "CLONED",
        }
        response_status = status_map.get(
            original.automated,
            "IN_PROGRESS"
        )

        # -------------------------
        # Build PLAN
        # -------------------------
        planned_steps = (
            db.query(PlannedIntent)
            .filter(PlannedIntent.user_intent_id == execution_id)
            .order_by(PlannedIntent.execution_order)
            .all()
        )

        plan_steps = []
        for step in planned_steps:
            plan_steps.append({
                "step": step.execution_order,
                "step_type": step.step_type,
                "intent": step.intent,
                "target": step.target,
                "value": step.value,
                "step_id": step.id,
                "execution_status": step.execution_status,
                "enabled": step.enabled
            })

        plan = {"steps": plan_steps}

        # -------------------------
        # Build RESULTS
        # -------------------------
        execution_steps = (
            db.query(ExecutionStep, PlannedIntent)
            .join(
                PlannedIntent,
                ExecutionStep.planned_intent_id == PlannedIntent.id
            )
            .filter(PlannedIntent.user_intent_id == execution_id)
            .order_by(PlannedIntent.execution_order)
            .all()
        )

        results = []
        for exec_step, planned_step in execution_steps:
            result = {
                "id": planned_step.id,
                "execution_order": planned_step.execution_order,
                "step": planned_step.intent,
                "step_type": exec_step.action,
                "status": exec_step.execution_status
            }

            # if exec_step.target:
            result["target"] = exec_step.target
            # if exec_step.value:
            result["data"] = exec_step.value
            if exec_step.error_details:
                result["error"] = exec_step.error_details
            if exec_step.screenshot:
                result["screenshot"] = exec_step.screenshot

            results.append(result)

        return {
            "status": response_status,
            "plan": plan,
            "results": results
        }

    finally:
        db.close()


@app.post("/add-step")
def add_step(payload: dict):
    db = SessionLocal()
    user_intent_id = payload["user_intent_id"]
    insert_position = payload["insert_position"]

    # Step 1: Get max order
    max_order = db.query(PlannedIntent) \
        .filter(PlannedIntent.user_intent_id == user_intent_id) \
        .count()

    # Validation
    if insert_position < 1 or insert_position > max_order + 1:
        raise HTTPException(status_code=400, detail="Invalid insert position")

    # Step 2: Shift existing steps
    db.query(PlannedIntent) \
        .filter(
        PlannedIntent.user_intent_id == user_intent_id,
        PlannedIntent.execution_order >= insert_position
    ) \
        .update(
        {PlannedIntent.execution_order: PlannedIntent.execution_order + 1},
        synchronize_session=False
    )

    # Step 3: Insert new step
    new_step = PlannedIntent(
        user_intent_id=user_intent_id,
        step_type=payload["step_type"],
        intent=payload["intent"],
        target=payload.get("target"),
        value=payload.get("value"),
        execution_order=insert_position,
        created_by="user",
        updated_by="system",
        enabled=True

    )

    db.add(new_step)
    db.commit()
    db.close()

    return {"message": "Step inserted successfully"}


@app.delete("/delete-step/{step_id}")
def delete_step(step_id: int):
    db = SessionLocal()
    try:
        # Step 1: Fetch step
        step = db.query(PlannedIntent) \
            .filter(PlannedIntent.id == step_id) \
            .first()

        if not step:
            raise HTTPException(status_code=404, detail="Step not found")

        user_intent_id = step.user_intent_id
        deleted_order = step.execution_order
        db.query(ExecutionStep).filter(
            ExecutionStep.planned_intent_id == step_id
        ).delete(synchronize_session=False)
        # Step 2: Delete step
        db.delete(step)

        # Step 3: Shift remaining steps
        db.query(PlannedIntent) \
            .filter(
            PlannedIntent.user_intent_id == user_intent_id,
            PlannedIntent.execution_order > deleted_order
        ) \
            .update(
            {
                PlannedIntent.execution_order:
                    PlannedIntent.execution_order - 1
            },
            synchronize_session=False
        )

        db.commit()

        return {"message": "Step deleted and reordered successfully"}

    except Exception as e:
        db.rollback()
        db.close()
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/move-step/{step_id}")
def move_step(step_id: int, new_order: int):
    db = SessionLocal()
    try:
        # Step 1: Fetch current step
        step = (
            db.query(PlannedIntent)
            .filter(PlannedIntent.id == step_id)
            .first()
        )

        if not step:
            raise HTTPException(status_code=404, detail="Step not found")

        current_order = step.execution_order
        user_intent_id = step.user_intent_id

        # Step 2: Validate new order
        max_order = (
            db.query(PlannedIntent)
            .filter(PlannedIntent.user_intent_id == user_intent_id)
            .count()
        )

        if new_order < 1 or new_order > max_order:
            raise HTTPException(
                status_code=400,
                detail=f"New order must be between 1 and {max_order}"
            )

        if new_order == current_order:
            return {"message": "Step already in requested position"}

        # Step 3: Shift steps
        if new_order < current_order:
            # Moving UP: shift middle steps DOWN
            db.query(PlannedIntent).filter(
                PlannedIntent.user_intent_id == user_intent_id,
                PlannedIntent.execution_order >= new_order,
                PlannedIntent.execution_order < current_order
            ).update(
                {
                    PlannedIntent.execution_order:
                        PlannedIntent.execution_order + 1
                },
                synchronize_session=False
            )

        else:
            # Moving DOWN: shift middle steps UP
            db.query(PlannedIntent).filter(
                PlannedIntent.user_intent_id == user_intent_id,
                PlannedIntent.execution_order <= new_order,
                PlannedIntent.execution_order > current_order
            ).update(
                {
                    PlannedIntent.execution_order:
                        PlannedIntent.execution_order - 1
                },
                synchronize_session=False
            )

        # Step 4: Put selected step in new position
        step.execution_order = new_order

        db.commit()

        return {
            "message": f"Step moved from {current_order} to {new_order}"
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.patch("/planned-intent/{step_id}")
def update_planned_intent(step_id: int, request: UpdatePlannedIntentRequest):
    db = SessionLocal()
    print("request received", request)
    try:
        step = db.query(PlannedIntent).filter(
            PlannedIntent.id == step_id
        ).first()

        if not step:
            raise HTTPException(
                status_code=404,
                detail="Planned step not found"
            )

        # Update only provided fields
        if request.intent is not None:
            step.intent = request.intent

        if request.target is not None:
            step.target = request.target

        if request.value is not None:
            step.value = request.value
        step.enabled = request.enabled
        step.updated_by = "User"
        # Step 3: Delete existing execution records
        # db.query(ExecutionStep).filter(
        #     ExecutionStep.planned_intent_id == step_id
        # ).delete(synchronize_session=False)

        db.commit()
        db.refresh(step)

        # db.commit()
        # db.refresh(step)

        return {
            "message": "Planned intent updated successfully",
            "step_id": step.id,
            "intent": step.intent,
            "target": step.target,
            "value": step.value,
            "enabled": step.enabled
        }

    finally:
        db.close()


@app.patch("/execution-step/{step_id}")
def update_execution_step(step_id: int, request: UpdateExecutionStepRequest):
    db = SessionLocal()
    try:
        # Fetch existing record
        execution_step = (
            db.query(ExecutionStep)
            .filter(ExecutionStep.planned_intent_id == step_id)
            .first()
        )

        if not execution_step:
            raise HTTPException(
                status_code=404,
                detail=f"ExecutionStep with id {step_id} not found"
            )

        # Update only provided fields
        if request.target is not None:
            execution_step.target = request.target

        if request.value is not None:
            execution_step.value = request.value

        db.commit()
        db.refresh(execution_step)

        return {
            "message": "Execution step updated successfully",
            "step_id": execution_step.id,
            "target": execution_step.target,
            "value": execution_step.value
        }

    finally:
        db.close()


def map_execution_status(raw_status):
    status_map = {
        "COMPLETED": "SUCCESS",
        "SUCCESS": "SUCCESS",
        "PASSED": "SUCCESS",

        "FAILED": "FAILED",
        "ERROR": "FAILED",
        "CLONED": "CLONED",

        "IN_PROGRESS": "IN_PROGRESS",
        "RUNNING": "IN_PROGRESS",
        "PENDING": "IN_PROGRESS",
        None: "IN_PROGRESS"
    }

    return status_map.get(raw_status, "IN_PROGRESS")


# def fetch_execution_result(db, execution_id: int):
#
#     original = db.get(OriginalIntent, execution_id)
#
#     if not original:
#         return {
#             "execution_id": execution_id,
#             "status": "NOT_FOUND",
#             "raw_status": None,
#             "summary": {
#                 "total_steps": 0,
#                 "passed": 0,
#                 "failed": 0,
#                 "in_progress": 0
#             },
#             "steps": [],
#             "error": "Execution not found"
#         }
#
#     response_status = map_execution_status(original.automated)
#
#     planned_steps = (
#         db.query(PlannedIntent)
#         .filter(PlannedIntent.user_intent_id == execution_id)
#         .order_by(PlannedIntent.execution_order)
#         .all()
#     )
#
#     execution_steps = (
#         db.query(ExecutionStep)
#         .join(
#             PlannedIntent,
#             ExecutionStep.planned_intent_id == PlannedIntent.id
#         )
#         .filter(PlannedIntent.user_intent_id == execution_id)
#         .all()
#     )
#
#     execution_map = {
#         step.planned_intent_id: step
#         for step in execution_steps
#     }
#
#     steps = []
#
#     passed_count = 0
#     failed_count = 0
#     in_progress_count = 0
#
#     for planned_step in planned_steps:
#
#         exec_step = execution_map.get(planned_step.id)
#
#         if exec_step:
#             step_status = exec_step.execution_status
#         else:
#             step_status = planned_step.execution_status or "PENDING"
#
#         normalized_step_status = map_execution_status(step_status)
#
#         if normalized_step_status == "SUCCESS":
#             passed_count += 1
#         elif normalized_step_status == "FAILED":
#             failed_count += 1
#         else:
#             in_progress_count += 1
#
#         steps.append({
#             "planned_step_id": planned_step.id,
#             "execution_step_id": exec_step.id if exec_step else None,
#             "execution_order": planned_step.execution_order,
#             "intent": planned_step.intent,
#             "step_type": planned_step.step_type,
#             "planned_target": planned_step.target,
#             "planned_value": planned_step.value,
#             "actual_action": exec_step.action if exec_step else None,
#             "actual_target": exec_step.target if exec_step else None,
#             "actual_data": exec_step.value if exec_step else None,
#             "status": normalized_step_status,
#             "raw_status": step_status,
#             "error": exec_step.error_details if exec_step else None,
#             "screenshot": exec_step.screenshot if exec_step else None,
#             "enabled": planned_step.enabled
#         })
#
#     return {
#         "execution_id": execution_id,
#         "status": response_status,
#         "raw_status": original.automated,
#         "summary": {
#             "total_steps": len(steps),
#             "passed": passed_count,
#             "failed": failed_count,
#             "in_progress": in_progress_count
#         },
#         "steps": steps
#     }
def extract_execution_summary(intent_value):
    """
    Extract only summary from OriginalIntent.intent.

    Supports:
    1. JSON string: {"summary": "...", "test_data": [...]}
    2. Dict object
    3. Plain text fallback
    """

    if not intent_value:
        return ""

    # If already dict
    if isinstance(intent_value, dict):
        return intent_value.get("summary", "")

    # If stored as JSON string
    if isinstance(intent_value, str):
        try:
            parsed = json.loads(intent_value)

            if isinstance(parsed, dict):
                return parsed.get("summary", intent_value)

            return intent_value

        except Exception:
            # fallback if it is plain text, not valid JSON
            return intent_value

    return str(intent_value)


def fetch_execution_result(db, execution_id: int):
    original = db.get(OriginalIntent, execution_id)

    if not original:
        return {
            "execution_id": execution_id,
            "execution_summary": "",
            "status": "NOT_FOUND",
            "raw_status": None,
            "summary": {
                "total_steps": 0,
                "passed": 0,
                "failed": 0,
                "in_progress": 0
            },
            "steps": [],
            "error": "Execution not found"
        }

    response_status = map_execution_status(original.automated)

    planned_steps = (
        db.query(PlannedIntent)
        .filter(PlannedIntent.user_intent_id == execution_id)
        .order_by(PlannedIntent.execution_order)
        .all()
    )

    execution_steps = (
        db.query(ExecutionStep)
        .join(
            PlannedIntent,
            ExecutionStep.planned_intent_id == PlannedIntent.id
        )
        .filter(PlannedIntent.user_intent_id == execution_id)
        .all()
    )

    execution_map = {
        step.planned_intent_id: step
        for step in execution_steps
    }

    steps = []

    passed_count = 0
    failed_count = 0
    in_progress_count = 0

    for planned_step in planned_steps:

        exec_step = execution_map.get(planned_step.id)

        # --------------------------------------------------
        # Step status must come from ExecutionStep only
        # --------------------------------------------------
        if exec_step and exec_step.execution_status:
            step_status = exec_step.execution_status
        else:
            step_status = "PENDING"

        normalized_step_status = map_execution_status(step_status)

        if normalized_step_status == "SUCCESS":
            passed_count += 1
        elif normalized_step_status == "FAILED":
            failed_count += 1
        else:
            in_progress_count += 1

        steps.append({
            "planned_step_id": planned_step.id,
            "execution_step_id": exec_step.id if exec_step else None,
            "execution_order": planned_step.execution_order,
            "intent": planned_step.intent,
            "step_type": planned_step.step_type,
            "planned_target": planned_step.target,
            "planned_value": planned_step.value,
            "actual_action": exec_step.action if exec_step else None,
            "actual_target": exec_step.target if exec_step else None,
            "actual_data": exec_step.value if exec_step else None,

            # Raw status directly from ExecutionStep
            "status": step_status,

            # Normalized status only for summary/UI color
            "normalized_status": normalized_step_status,

            "error": exec_step.error_details if exec_step else None,
            "screenshot": exec_step.screenshot if exec_step else None,
            "enabled": planned_step.enabled
        })

    return {
        "execution_id": execution_id,

        # --------------------------------------------------
        # Summary from OriginalIntent.intent
        # --------------------------------------------------
        "execution_summary": extract_execution_summary(original.intent),

        "status": response_status,
        "raw_status": original.automated,
        "summary": {
            "total_steps": len(steps),
            "passed": passed_count,
            "failed": failed_count,
            "in_progress": in_progress_count
        },
        "steps": steps
    }


# def extract_execution_summary(intent_value):
#     if not intent_value:
#         return ""
#
#     if isinstance(intent_value, dict):
#         return intent_value.get("summary", "")
#
#     if isinstance(intent_value, str):
#         try:
#             parsed = json.loads(intent_value)
#             if isinstance(parsed, dict):
#                 return parsed.get("summary", intent_value)
#             return intent_value
#         except Exception:
#             return intent_value
#
#     return str(intent_value)
def fetch_suite_execution_results_bulk(db, execution_ids: list[int]):
    # --------------------------------------------------
    # 1. Fetch all original intents in one query
    # --------------------------------------------------
    originals = (
        db.query(OriginalIntent)
        .filter(OriginalIntent.id.in_(execution_ids))
        .all()
    )

    original_map = {
        original.id: original
        for original in originals
    }

    # --------------------------------------------------
    # 2. Fetch all planned steps in one query
    # --------------------------------------------------
    planned_steps = (
        db.query(PlannedIntent)
        .filter(PlannedIntent.user_intent_id.in_(execution_ids))
        .order_by(
            PlannedIntent.user_intent_id,
            PlannedIntent.execution_order
        )
        .all()
    )

    planned_by_execution = defaultdict(list)
    planned_id_to_execution_id = {}

    for step in planned_steps:
        planned_by_execution[step.user_intent_id].append(step)
        planned_id_to_execution_id[step.id] = step.user_intent_id

    planned_ids = list(planned_id_to_execution_id.keys())

    # --------------------------------------------------
    # 3. Fetch all execution steps in one query
    # --------------------------------------------------
    execution_steps = []

    if planned_ids:
        execution_steps = (
            db.query(ExecutionStep)
            .filter(ExecutionStep.planned_intent_id.in_(planned_ids))
            .all()
        )

    execution_by_planned_id = {
        step.planned_intent_id: step
        for step in execution_steps
    }

    # --------------------------------------------------
    # 4. Build response in memory
    # --------------------------------------------------
    execution_results = []

    for execution_id in execution_ids:

        original = original_map.get(execution_id)

        if not original:
            execution_results.append({
                "execution_id": execution_id,
                "execution_summary": "",
                "status": "NOT_FOUND",
                "raw_status": None,
                "summary": {
                    "total_steps": 0,
                    "passed": 0,
                    "failed": 0,
                    "in_progress": 0
                },
                "steps": [],
                "error": "Execution not found"
            })
            continue

        response_status = map_execution_status(original.automated)

        steps = []

        passed_count = 0
        failed_count = 0
        in_progress_count = 0

        for planned_step in planned_by_execution.get(execution_id, []):

            exec_step = execution_by_planned_id.get(planned_step.id)

            # Step status strictly from ExecutionStep.execution_status
            if exec_step and exec_step.execution_status:
                step_status = exec_step.execution_status
            else:
                step_status = "PENDING"

            normalized_step_status = map_execution_status(step_status)

            if normalized_step_status == "SUCCESS":
                passed_count += 1
            elif normalized_step_status == "FAILED":
                failed_count += 1
            else:
                in_progress_count += 1

            steps.append({
                "planned_step_id": planned_step.id,
                "execution_step_id": exec_step.id if exec_step else None,
                "execution_order": planned_step.execution_order,
                "intent": planned_step.intent,
                "step_type": planned_step.step_type,
                "planned_target": planned_step.target,
                "planned_value": planned_step.value,
                "actual_action": exec_step.action if exec_step else None,
                "actual_target": exec_step.target if exec_step else None,
                "actual_data": exec_step.value if exec_step else None,
                "status": step_status,
                "normalized_status": normalized_step_status,
                "error": exec_step.error_details if exec_step else None,

                # Important: this may be heavy
                "screenshot": exec_step.screenshot if exec_step else None,

                "enabled": planned_step.enabled
            })

        execution_results.append({
            "execution_id": execution_id,
            "execution_summary": extract_execution_summary(original.intent),
            "status": response_status,
            "raw_status": original.automated,
            "summary": {
                "total_steps": len(steps),
                "passed": passed_count,
                "failed": failed_count,
                "in_progress": in_progress_count
            },
            "steps": steps
        })

    return execution_results


def get_badge_class(status):
    normalized = map_execution_status(status)

    if normalized == "SUCCESS":
        return "badge-success"
    elif normalized == "FAILED":
        return "badge-failed"
    elif status == "NOT_FOUND":
        return "badge-not-found"
    else:
        return "badge-progress"


def get_status_class(status):
    normalized = map_execution_status(status)

    if normalized == "SUCCESS":
        return "success"
    elif normalized == "FAILED":
        return "failed"
    else:
        return "progress"


def build_base64_image_html(base64_string):
    if not base64_string:
        return ""

    # If DB already stores full data URI, use it directly
    if base64_string.startswith("data:image"):
        image_src = base64_string
    else:
        # Default png
        image_src = f"data:image/png;base64,{base64_string}"

    return f"""
        <details>
            <summary class="screenshot-summary">View Screenshot</summary>
            <img class="screenshot-img" src="{image_src}" />
        </details>
    """


# def generate_suite_html_report(suite_name: str, execution_results: list):
#
#     generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
#
#     total_executions = len(execution_results)
#
#     passed_executions = 0
#     failed_executions = 0
#     in_progress_executions = 0
#     not_found_executions = 0
#
#     total_steps = 0
#     passed_steps = 0
#     failed_steps = 0
#     in_progress_steps = 0
#
#     for execution in execution_results:
#
#         if execution["status"] == "SUCCESS":
#             passed_executions += 1
#         elif execution["status"] == "FAILED":
#             failed_executions += 1
#         elif execution["status"] == "NOT_FOUND":
#             not_found_executions += 1
#         else:
#             in_progress_executions += 1
#
#         total_steps += execution["summary"]["total_steps"]
#         passed_steps += execution["summary"]["passed"]
#         failed_steps += execution["summary"]["failed"]
#         in_progress_steps += execution["summary"]["in_progress"]
#
#     html = f"""
# <!DOCTYPE html>
# <html>
# <head>
#     <meta charset="UTF-8">
#     <title>{suite_name} Execution Report</title>
#
#     <style>
#         body {{
#             font-family: Arial, sans-serif;
#             background: #0f172a;
#             color: #e5e7eb;
#             margin: 0;
#             padding: 24px;
#         }}
#
#         .container {{
#             max-width: 1400px;
#             margin: auto;
#         }}
#
#         .header {{
#             background: linear-gradient(135deg, #1e293b, #111827);
#             padding: 24px;
#             border-radius: 16px;
#             margin-bottom: 24px;
#             border: 1px solid #334155;
#         }}
#
#         h1 {{
#             margin: 0;
#             color: #ffffff;
#         }}
#
#         .sub-title {{
#             color: #94a3b8;
#             margin-top: 8px;
#         }}
#
#         .summary-grid {{
#             display: grid;
#             grid-template-columns: repeat(4, 1fr);
#             gap: 16px;
#             margin-bottom: 24px;
#         }}
#
#         .card {{
#             background: #1e293b;
#             padding: 20px;
#             border-radius: 14px;
#             border: 1px solid #334155;
#         }}
#
#         .card-title {{
#             color: #94a3b8;
#             font-size: 14px;
#             margin-bottom: 8px;
#         }}
#
#         .card-value {{
#             font-size: 28px;
#             font-weight: bold;
#             color: #ffffff;
#         }}
#
#         .success {{
#             color: #22c55e;
#             font-weight: bold;
#         }}
#
#         .failed {{
#             color: #ef4444;
#             font-weight: bold;
#         }}
#
#         .progress {{
#             color: #f59e0b;
#             font-weight: bold;
#         }}
#
#         .not-found {{
#             color: #a855f7;
#             font-weight: bold;
#         }}
#
#         .execution-block {{
#             background: #111827;
#             border: 1px solid #334155;
#             border-radius: 16px;
#             margin-bottom: 24px;
#             overflow: hidden;
#         }}
#
#         .execution-header {{
#             display: flex;
#             justify-content: space-between;
#             align-items: center;
#             padding: 16px 20px;
#             background: #1e293b;
#             border-bottom: 1px solid #334155;
#         }}
#
#         .execution-title {{
#             font-size: 18px;
#             font-weight: bold;
#         }}
#
#         .badge {{
#             padding: 6px 12px;
#             border-radius: 999px;
#             font-size: 13px;
#             font-weight: bold;
#         }}
#
#         .badge-success {{
#             background: rgba(34, 197, 94, 0.15);
#             color: #22c55e;
#             border: 1px solid rgba(34, 197, 94, 0.4);
#         }}
#
#         .badge-failed {{
#             background: rgba(239, 68, 68, 0.15);
#             color: #ef4444;
#             border: 1px solid rgba(239, 68, 68, 0.4);
#         }}
#
#         .badge-progress {{
#             background: rgba(245, 158, 11, 0.15);
#             color: #f59e0b;
#             border: 1px solid rgba(245, 158, 11, 0.4);
#         }}
#
#         .badge-not-found {{
#             background: rgba(168, 85, 247, 0.15);
#             color: #a855f7;
#             border: 1px solid rgba(168, 85, 247, 0.4);
#         }}
#
#         table {{
#             width: 100%;
#             border-collapse: collapse;
#         }}
#
#         th {{
#             background: #020617;
#             color: #cbd5e1;
#             text-align: left;
#             padding: 12px;
#             font-size: 13px;
#         }}
#
#         td {{
#             padding: 12px;
#             border-top: 1px solid #334155;
#             vertical-align: top;
#             font-size: 13px;
#             color: #e5e7eb;
#         }}
#
#         tr:hover {{
#             background: #1e293b;
#         }}
#
#         .error-box {{
#             color: #fecaca;
#             background: rgba(239, 68, 68, 0.12);
#             border: 1px solid rgba(239, 68, 68, 0.35);
#             padding: 8px;
#             border-radius: 8px;
#             max-width: 400px;
#             white-space: pre-wrap;
#         }}
#
#         .screenshot-link {{
#             color: #38bdf8;
#             text-decoration: none;
#         }}
#
#         .footer {{
#             text-align: center;
#             color: #64748b;
#             margin-top: 32px;
#             font-size: 13px;
#         }}
#
#         @media print {{
#             body {{
#                 background: #ffffff;
#                 color: #000000;
#             }}
#
#             .header, .card, .execution-block {{
#                 background: #ffffff;
#                 color: #000000;
#                 border: 1px solid #cccccc;
#             }}
#
#             th {{
#                 background: #eeeeee;
#                 color: #000000;
#             }}
#
#             td {{
#                 color: #000000;
#             }}
#         }}
#     </style>
# </head>
#
# <body>
# <div class="container">
#
#     <div class="header">
#         <h1>{suite_name} Suite Execution Report</h1>
#         <div class="sub-title">Generated At: {generated_at}</div>
#     </div>
#
#     <div class="summary-grid">
#         <div class="card">
#             <div class="card-title">Total Executions</div>
#             <div class="card-value">{total_executions}</div>
#         </div>
#
#         <div class="card">
#             <div class="card-title">Passed Executions</div>
#             <div class="card-value success">{passed_executions}</div>
#         </div>
#
#         <div class="card">
#             <div class="card-title">Failed Executions</div>
#             <div class="card-value failed">{failed_executions}</div>
#         </div>
#
#         <div class="card">
#             <div class="card-title">In Progress</div>
#             <div class="card-value progress">{in_progress_executions}</div>
#         </div>
#     </div>
#
#     <div class="summary-grid">
#         <div class="card">
#             <div class="card-title">Total Steps</div>
#             <div class="card-value">{total_steps}</div>
#         </div>
#
#         <div class="card">
#             <div class="card-title">Passed Steps</div>
#             <div class="card-value success">{passed_steps}</div>
#         </div>
#
#         <div class="card">
#             <div class="card-title">Failed Steps</div>
#             <div class="card-value failed">{failed_steps}</div>
#         </div>
#
#         <div class="card">
#             <div class="card-title">In Progress Steps</div>
#             <div class="card-value progress">{in_progress_steps}</div>
#         </div>
#     </div>
# """
#
#     for execution in execution_results:
#
#         status = execution["status"]
#
#         if status == "SUCCESS":
#             badge_class = "badge-success"
#         elif status == "FAILED":
#             badge_class = "badge-failed"
#         elif status == "NOT_FOUND":
#             badge_class = "badge-not-found"
#         else:
#             badge_class = "badge-progress"
#
#         html += f"""
#     <div class="execution-block">
#         <div class="execution-header">
#             <div class="execution-title">Execution ID: {execution["execution_id"]}</div>
#             <div class="badge {badge_class}">{status}</div>
#         </div>
#
#         <table>
#             <thead>
#                 <tr>
#                     <th>Order</th>
#                     <th>Intent</th>
#                     <th>Step Type</th>
#                     <th>Planned Target</th>
#                     <th>Actual Action</th>
#                     <th>Status</th>
#                     <th>Error</th>
#                     <th>Screenshot</th>
#                 </tr>
#             </thead>
#             <tbody>
# """
#
#         if execution["status"] == "NOT_FOUND":
#             html += f"""
#                 <tr>
#                     <td colspan="8">
#                         <div class="error-box">{execution.get("error", "Execution not found")}</div>
#                     </td>
#                 </tr>
# """
#         else:
#             for step in execution["steps"]:
#
#                 step_status = step["status"]
#
#                 if step_status == "SUCCESS":
#                     step_status_class = "success"
#                 elif step_status == "FAILED":
#                     step_status_class = "failed"
#                 else:
#                     step_status_class = "progress"
#
#                 error_html = ""
#                 if step.get("error"):
#                     error_html = f'<div class="error-box">{step.get("error")}</div>'
#
#                 screenshot_html = ""
#                 if step.get("screenshot"):
#                     screenshot_html = f'<a class="screenshot-link" href="{step.get("screenshot")}" target="_blank">View</a>'
#
#                 html += f"""
#                 <tr>
#                     <td>{step.get("execution_order", "")}</td>
#                     <td>{step.get("intent", "")}</td>
#                     <td>{step.get("step_type", "")}</td>
#                     <td>{step.get("planned_target", "") or ""}</td>
#                     <td>{step.get("actual_action", "") or ""}</td>
#                     <td class="{step_status_class}">{step_status}</td>
#                     <td>{error_html}</td>
#                     <td>{screenshot_html}</td>
#                 </tr>
# """
#
#         html += """
#             </tbody>
#         </table>
#     </div>
# """
#
#     html += f"""
#     <div class="footer">
#         Report generated by AI QA Execution Engine | Suite: {suite_name}
#     </div>
#
# </div>
# </body>
# </html>
# """
#
#     return html, {
#         "total_executions": total_executions,
#         "passed_executions": passed_executions,
#         "failed_executions": failed_executions,
#         "in_progress_executions": in_progress_executions,
#         "not_found_executions": not_found_executions,
#         "total_steps": total_steps,
#         "passed_steps": passed_steps,
#         "failed_steps": failed_steps,
#         "in_progress_steps": in_progress_steps
#     }
def format_step_status(status):
    """
    Converts raw status like PASSED, FAILED, IN_PROGRESS
    into display text like Passed, Failed, In Progress.
    """

    if not status:
        return "Pending"

    status = str(status).strip()

    status_map = {
        "PASSED": "Passed",
        "PASS": "Passed",
        "SUCCESS": "Passed",
        "COMPLETED": "Passed",

        "FAILED": "Failed",
        "FAIL": "Failed",
        "ERROR": "Failed",

        "IN_PROGRESS": "In Progress",
        "RUNNING": "In Progress",
        "PENDING": "Pending"
    }

    upper_status = status.upper()

    return status_map.get(
        upper_status,
        status.replace("_", " ").title()
    )


def get_step_status_class(status):
    """
    Returns CSS class based on raw execution status.
    """

    if not status:
        return "progress"

    upper_status = str(status).strip().upper()

    if upper_status in ["PASSED", "PASS", "SUCCESS", "COMPLETED"]:
        return "success"

    if upper_status in ["FAILED", "FAIL", "ERROR"]:
        return "failed"

    return "progress"


def generate_suite_html_report(suite_name: str, execution_results: list):
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    total_executions = len(execution_results)

    passed_executions = 0
    failed_executions = 0
    in_progress_executions = 0
    not_found_executions = 0

    total_steps = 0
    passed_steps = 0
    failed_steps = 0
    in_progress_steps = 0

    for execution in execution_results:

        if execution["status"] == "SUCCESS":
            passed_executions += 1
        elif execution["status"] == "FAILED":
            failed_executions += 1
        elif execution["status"] == "NOT_FOUND":
            not_found_executions += 1
        else:
            in_progress_executions += 1

        total_steps += execution["summary"]["total_steps"]
        passed_steps += execution["summary"]["passed"]
        failed_steps += execution["summary"]["failed"]
        in_progress_steps += execution["summary"]["in_progress"]

    html_report = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{html.escape(suite_name)} Execution Report</title>

    <style>
        body {{
            font-family: Arial, sans-serif;
            background: #0f172a;
            color: #e5e7eb;
            margin: 0;
            padding: 24px;
        }}

        .container {{
            max-width: 1500px;
            margin: auto;
        }}

        .header {{
            background: linear-gradient(135deg, #1e293b, #111827);
            padding: 24px;
            border-radius: 16px;
            margin-bottom: 24px;
            border: 1px solid #334155;
        }}

        h1 {{
            margin: 0;
            color: #ffffff;
        }}

        .sub-title {{
            color: #94a3b8;
            margin-top: 8px;
        }}

        .summary-grid {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 24px;
        }}

        .card {{
            background: #1e293b;
            padding: 20px;
            border-radius: 14px;
            border: 1px solid #334155;
        }}

        .card-title {{
            color: #94a3b8;
            font-size: 14px;
            margin-bottom: 8px;
        }}

        .card-value {{
            font-size: 28px;
            font-weight: bold;
            color: #ffffff;
        }}

        .success {{
             color: #22c55e;
             font-weight: bold;
        }}

        .failed {{
             color: #ef4444;
             font-weight: bold;
        }}

        .progress {{
            color: #f59e0b;
            font-weight: bold;
        }}

        .not-found {{
            color: #a855f7;
            font-weight: bold;
        }}

        .accordion {{
            background: #111827;
            border: 1px solid #334155;
            border-radius: 16px;
            margin-bottom: 16px;
            overflow: hidden;
        }}

        .accordion summary {{
            cursor: pointer;
            list-style: none;
        }}

        .accordion summary::-webkit-details-marker {{
            display: none;
        }}

        .accordion-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 18px 20px;
            background: #1e293b;
            border-bottom: 1px solid #334155;
        }}

        .accordion-title {{
            display: flex;
            flex-direction: column;
            gap: 6px;
        }}

        .execution-title {{
            font-size: 18px;
            font-weight: bold;
            color: #ffffff;
        }}

        .execution-summary {{
            font-size: 13px;
            color: #94a3b8;
            max-width: 900px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }}

        .accordion-meta {{
            display: flex;
            gap: 12px;
            align-items: center;
        }}

        .step-summary {{
            color: #cbd5e1;
            font-size: 13px;
        }}

        .badge {{
            padding: 6px 12px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: bold;
        }}

        .badge-success {{
            background: rgba(34, 197, 94, 0.15);
            color: #22c55e;
            border: 1px solid rgba(34, 197, 94, 0.4);
        }}

        .badge-failed {{
            background: rgba(239, 68, 68, 0.15);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.4);
        }}

        .badge-progress {{
            background: rgba(245, 158, 11, 0.15);
            color: #f59e0b;
            border: 1px solid rgba(245, 158, 11, 0.4);
        }}

        .badge-not-found {{
            background: rgba(168, 85, 247, 0.15);
            color: #a855f7;
            border: 1px solid rgba(168, 85, 247, 0.4);
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
        }}

        th {{
            background: #020617;
            color: #cbd5e1;
            text-align: left;
            padding: 12px;
            font-size: 13px;
        }}

        td {{
            padding: 12px;
            border-top: 1px solid #334155;
            vertical-align: top;
            font-size: 13px;
            color: #e5e7eb;
        }}

        tr:hover {{
            background: #1e293b;
        }}

        .error-box {{
            color: #fecaca;
            background: rgba(239, 68, 68, 0.12);
            border: 1px solid rgba(239, 68, 68, 0.35);
            padding: 8px;
            border-radius: 8px;
            max-width: 420px;
            white-space: pre-wrap;
        }}

        .screenshot-summary {{
            color: #38bdf8;
            cursor: pointer;
            font-size: 13px;
            font-weight: bold;
        }}

        .screenshot-img {{
            margin-top: 10px;
            max-width: 420px;
            max-height: 260px;
            border-radius: 10px;
            border: 1px solid #334155;
            display: block;
        }}

        .footer {{
            text-align: center;
            color: #64748b;
            margin-top: 32px;
            font-size: 13px;
        }}

        @media print {{
            body {{
                background: #ffffff;
                color: #000000;
            }}

            .header, .card, .accordion {{
                background: #ffffff;
                color: #000000;
                border: 1px solid #cccccc;
            }}

            .accordion-header {{
                background: #f3f4f6;
            }}

            th {{
                background: #eeeeee;
                color: #000000;
            }}

            td {{
                color: #000000;
            }}
        }}
    </style>
</head>

<body>
<div class="container">

    <div class="header">
        <h1>{html.escape(suite_name)} Suite Execution Report</h1>
        <div class="sub-title">Generated At: {html.escape(generated_at)}</div>
    </div>

    <div class="summary-grid">
        <div class="card">
            <div class="card-title">Total Executions</div>
            <div class="card-value">{total_executions}</div>
        </div>

        <div class="card">
            <div class="card-title">Passed Executions</div>
            <div class="card-value success">{passed_executions}</div>
        </div>

        <div class="card">
            <div class="card-title">Failed Executions</div>
            <div class="card-value failed">{failed_executions}</div>
        </div>

        <div class="card">
            <div class="card-title">In Progress</div>
            <div class="card-value progress">{in_progress_executions}</div>
        </div>
    </div>
"""

    for execution in execution_results:

        execution_id = execution.get("execution_id", "")
        execution_summary = html.escape(str(execution.get("execution_summary", "") or ""))
        status = execution.get("status", "IN_PROGRESS")

        badge_class = get_badge_class(status)

        total = execution["summary"]["total_steps"]
        passed = execution["summary"]["passed"]
        failed = execution["summary"]["failed"]
        progress = execution["summary"]["in_progress"]

        html_report += f"""
    <details class="accordion">
        <summary>
            <div class="accordion-header">
                <div class="accordion-title">
                    <div class="execution-title">Execution ID: {execution_id}</div>
                    <div class="execution-summary">{execution_summary}</div>
                </div>
            <div class="accordion-meta">

                    <div class="badge {badge_class}">{html.escape(str(status))}</div>
                </div>

            </div>
        </summary>
"""

        if execution["status"] == "NOT_FOUND":
            error_text = html.escape(str(execution.get("error", "Execution not found")))
            html_report += f"""
        <div style="padding: 16px;">
            <div class="error-box">{error_text}</div>
        </div>
"""
        else:
            html_report += """
        <table>
            <thead>
                <tr>
                    <th>Order</th>
                    <th>Intent</th>
                    <th>Step Type</th>
                    <th>Planned Target</th>
                    <th>Actual Action</th>
                    <th>Status</th>
                    <th>Error/Logs</th>
                    <th>Screenshot</th>
                </tr>
            </thead>
            <tbody>
"""

            for step in execution["steps"]:

                step_status = step.get("status", "PENDING")
                step_status_class = get_status_class(step_status)

                intent = html.escape(str(step.get("intent", "") or ""))
                step_type = html.escape(str(step.get("step_type", "") or ""))
                planned_target = html.escape(str(step.get("planned_target", "") or ""))
                actual_action = html.escape(str(step.get("actual_action", "") or ""))
                error_text = html.escape(str(step.get("error", "") or ""))

                error_html = ""
                if error_text:
                    error_html = f'<div class="error-box">{error_text}</div>'

                screenshot_html = build_base64_image_html(step.get("screenshot"))
                display_step_status = format_step_status(step_status)
                step_status_class = get_step_status_class(step_status)
                html_report += f"""
                <tr>
                    <td>{step.get("execution_order", "")}</td>
                    <td>{intent}</td>
                    <td>{step_type}</td>
                    <td>{planned_target}</td>
                    <td>{actual_action}</td>
                    <td class="{step_status_class}">{html.escape(display_step_status)}</td>
                    <td>{error_html}</td>
                    <td>{screenshot_html}</td>
                </tr>
"""

            html_report += """
            </tbody>
        </table>
"""

        html_report += """
    </details>
"""

    html_report += f"""
    <div class="footer">
        Report generated by AI QA Execution Engine | Suite: {html.escape(suite_name)}
    </div>

</div>
</body>
</html>
"""

    return html_report, {
        "total_executions": total_executions,
        "passed_executions": passed_executions,
        "failed_executions": failed_executions,
        "in_progress_executions": in_progress_executions,
        "not_found_executions": not_found_executions,
        "total_steps": total_steps,
        "passed_steps": passed_steps,
        "failed_steps": failed_steps,
        "in_progress_steps": in_progress_steps
    }


@app.get("/suite-report/{suite_name}")
def generate_suite_report(suite_name: str):
    suite_name = suite_name.upper()

    if suite_name not in SUITES:
        raise HTTPException(
            status_code=404,
            detail=f"Suite '{suite_name}' not found"
        )

    execution_ids = SUITES[suite_name]

    with SessionLocal() as db:
        execution_results = fetch_suite_execution_results_bulk(
            db=db,
            execution_ids=execution_ids
        )

        html_report, summary = generate_suite_html_report(
            suite_name=suite_name,
            execution_results=execution_results
        )

        report_dir = "reports"
        os.makedirs(report_dir, exist_ok=True)

        report_file_name = f"{suite_name}_execution_report.html"
        report_path = os.path.join(report_dir, report_file_name)

        with open(report_path, "w", encoding="utf-8") as file:
            file.write(html_report)

        return {
            "suite_name": suite_name,
            "execution_ids": execution_ids,
            "summary": summary,
            "report_path": report_path,
            "view_report_api": f"/suite-report/{suite_name}/view",
            "download_report_api": f"/suite-report/{suite_name}/download"
        }


@app.get("/suite-report/{suite_name}/view", response_class=HTMLResponse)
def view_suite_report(suite_name: str):
    suite_name = suite_name.upper()

    report_path = os.path.join(
        "reports",
        f"{suite_name}_execution_report.html"
    )

    if not os.path.exists(report_path):
        raise HTTPException(
            status_code=404,
            detail="Report not generated yet. Please call /suite-report/{suite_name} first."
        )

    with open(report_path, "r", encoding="utf-8") as file:
        html_content = file.read()

    return HTMLResponse(content=html_content)


@app.get("/suite-report/{suite_name}/download")
def download_suite_report(suite_name: str):
    suite_name = suite_name.upper()

    report_path = os.path.join(
        "reports",
        f"{suite_name}_execution_report.html"
    )

    if not os.path.exists(report_path):
        raise HTTPException(
            status_code=404,
            detail="Report not generated yet. Please call /suite-report/{suite_name} first."
        )

    return FileResponse(
        path=report_path,
        filename=f"{suite_name}_execution_report.html",
        media_type="text/html"
    )


def run_Suite(
        execution_id: int,
        sessionid: str,
        row_number: int
):
    db = SessionLocal()
    print("Executing the Test Suite with execution id", execution_id)
    container, endpoint = start_browser_container()
    try:
        execution = db.query(OriginalIntent).filter(
            OriginalIntent.id == execution_id
        ).first()
        print("Execution", execution)
        if not execution:
            print("Execution aborted as no execution", execution)
            return
        planned_steps = db.query(PlannedIntent).filter(
            PlannedIntent.user_intent_id == execution_id,
            PlannedIntent.enabled.is_(True)
        ).order_by(PlannedIntent.execution_order.asc()).all()
        print("Extracted plan", planned_steps)

        execution.automated = "RUNNING"
        db.commit()

        # planned_map = {step.intent: step.id for step in planned_steps}
        plan = {
            "steps": [
                {
                    "intent": step.intent,
                    "step_type": step.step_type,
                    "value": step.value,
                    "planned_intent_id": step.id
                }
                for step in planned_steps
            ]
        }
        # print("Updated Plan", plan)

        with sync_playwright() as p:
            # context = p.chromium.launch_persistent_context(
            #     user_data_dir=r"C:\Users\local.admin\AppData\Local\Google\Chrome\User Data\Default",
            #     headless=False
            # )
            #################################
            print("Dockers detail", container, endpoint)
            browser = connect_with_retry(p, endpoint)
            context = browser.new_context()
            page = context.pages[0] if context.pages else context.new_page()
            print("Print Browser and Page", browser, context, page)
            #########################################
            # contexts = browser.contexts
            # context = contexts[0] if contexts else browser.new_context()
            #
            # # Get or create page safely
            # pages = context.pages
            # page = pages[0] if pages else context.new_page()
            page.set_default_timeout(60000)  # applies to click, fill, wait_for_selector
            page.set_default_navigation_timeout(60000)
            # except Exception as e:
            #     print("Exception:",e)
            # if not page:
            #     raise ValueError("Playwright page is not initialized")
            # else:
            print("Run till Here")
            executor = PlaywrightExecutor(page)
            results = executor.execute(plan, sessionid, row_number)
            page.close()
            context.close()
            browser.close()
            if container:
                try:
                    container.stop(timeout=5)
                    container.remove(force=True)
                    print("Container cleaned:", container.id)
                except Exception as cleanup_error:
                    print("Cleanup failed:", cleanup_error)
        # execution = db.query(OriginalIntent).filter(
        #     OriginalIntent.id == execution_id
        # ).first()

        try:
            execution = db.query(OriginalIntent).filter(
                OriginalIntent.id == execution_id
            ).first()

            execution.automated = "COMPLETED"

            db.commit()
        except Exception as e:
            print("Get1 and Error", e)
    except Exception as e:
        print("Get2 and Error", e)
        container.stop(timeout=5)
        container.remove(force=True)
        print("Container cleaned:", container.id)
    finally:
        # execution = db.query(OriginalIntent).filter(
        #     OriginalIntent.id == execution_id
        # ).first()
        # execution.automated = "Failed"
        # db.commit()
        # db.close()
        print("In Finally")
        # print("Get2 and Error", e)

        # container.stop(timeout=5)
        # container.remove(force=True)


def run_batch_execution_async(executions: list[ExecutionItem], batch_session_id: str):
    print("Batch Execution Started:", batch_session_id, "Started at", datetime.utcnow())

    for execution in executions:
        testcase_session_id = str(uuid.uuid4())
        execution_id = execution.execution_id
        row_number = execution.data_row_id
        print(
            f"Running execution_id={execution_id}, "
            f"batch_session_id={batch_session_id}, "
            f"testcase_session_id={testcase_session_id}"
            f"Data Row ID={row_number}"
        )

        try:
            run_Suite(
                execution_id=execution_id,
                sessionid=testcase_session_id,
                row_number=row_number
            )

        except Exception as e:
            print(f"Execution failed for ID {execution_id}: {e}")

            db = SessionLocal()
            try:
                execution = db.query(OriginalIntent).filter(
                    OriginalIntent.id == execution_id
                ).first()

                if execution:
                    execution.automated = "FAILED"
                    db.commit()

            finally:
                db.close()

    print("Batch Execution Started:", batch_session_id, "Completed at", datetime.utcnow())


############################################################################
@app.post("/execute-test-batch")
def execute_test_batch(
        request: BatchExecutionRequest,
        background_tasks: BackgroundTasks
):
    if not request.executions:
        raise HTTPException(status_code=400, detail="Execution list cannot be empty")

    batch_session_id = str(uuid.uuid4())

    background_tasks.add_task(
        run_batch_execution_async,
        request.executions,
        batch_session_id,
    )

    return {
        "batch_session_id": batch_session_id,
        "status": "BATCH_RECEIVED",
        "total_testcases": len(request.executions),
        "execution_ids": request.executions
    }


def run_parallel_execution_async(
        executions: list[ExecutionItem],
        batch_session_id: str,
        max_parallel: int = 6
):
    print("Parallel Batch Started:", batch_session_id)

    max_parallel = min(max_parallel, 6)  # force max 4
    failed_count = 0
    completed_count = 0
    with ThreadPoolExecutor(max_workers=max_parallel) as executor:
        futures = {}

        for execution in executions:
            testcase_session_id = str(uuid.uuid4())

            future = executor.submit(
                run_execution_only_async_suite,
                execution.execution_id,
                testcase_session_id,
                execution.data_row_id,
                batch_session_id
            )

            futures[future] = execution

        for future in as_completed(futures):
            execution_item = futures[future]

            execution_id = (
                execution_item.execution_id
            )

            data_row_id = (
                execution_item.data_row_id
            )
            try:
                results = future.result()
                completed_count += 1
                print(f"Execution completed: {execution_id}")
                has_failed = any(
                    result.get("status") == "failed"
                    for result in results
                )

                if has_failed:
                    failed_count += 1

                print(
                    f"Execution completed: "
                    f"execution={execution_id}, "
                    f"row={data_row_id}, "
                    f"failed={has_failed}"
                )

            except Exception as e:
                failed_count += 1

                print(
                    f"Execution failed: "
                    f"execution={execution_id}, "
                    f"row={data_row_id}, "
                    f"error={e}"
                )
                db = SessionLocal()
                try:
                    execution = db.query(OriginalIntent).filter(
                        OriginalIntent.id == execution_id
                    ).first()

                    if execution:
                        execution.automated = "FAILED"
                        db.commit()
                except Exception as db_error:

                    db.rollback()

                    print(
                        "Failed updating "
                        "OriginalIntent:",
                        db_error
                    )

                finally:
                    db.close()

    if failed_count == 0:

        final_status = "COMPLETED"

    elif completed_count == 0:

        final_status = "FAILED"

    elif failed_count > 0:

        final_status = "PARTIAL"

    else:
        final_status = "COMPLETED"
    update_suite_execution_status(
        batch_session_id=batch_session_id,
        status=final_status
    )
    print(
        "Parallel Batch Completed:",
        batch_session_id,
        "status=",
        final_status
    )


@app.post("/execute-test-parallel")
def execute_test_parallel(
        request: ParallelExecutionRequest,
        background_tasks: BackgroundTasks
):
    if not request.executions:
        raise HTTPException(status_code=400, detail="Execution list cannot be empty")

    batch_session_id = str(uuid.uuid4())

    background_tasks.add_task(
        run_parallel_execution_async,
        request.executions,
        batch_session_id,
        request.max_parallel
    )

    return {
        "batch_session_id": batch_session_id,
        "status": "PARALLEL_BATCH_RECEIVED",
        "total_testcases": len(request.executions),
        "max_parallel": request.max_parallel,
        "execution_ids": request.executions
    }


@app.post("/execute-suite/{suite_id}")
def execute_suite_api(
        suite_id: int,
        background_tasks: BackgroundTasks,
        max_parallel: int = 6
):
    db = SessionLocal()

    try:

        # =====================================================
        # Get suite
        # =====================================================

        suite = (
            db.query(TestSuite)
            .filter(
                TestSuite.id == suite_id,
                TestSuite.status == "ACTIVE"
            )
            .first()
        )

        if not suite:
            raise HTTPException(
                status_code=404,
                detail="Suite not found or inactive"
            )

        # =====================================================
        # Get enabled items
        # =====================================================

        suite_items = (
            db.query(TestSuiteItem)
            .filter(
                TestSuiteItem.suite_id == suite_id,
                TestSuiteItem.enabled.is_(True)
            )
            .order_by(
                TestSuiteItem.execution_order.asc()
            )
            .all()
        )

        if not suite_items:
            raise HTTPException(
                status_code=400,
                detail="Suite has no enabled testcases"
            )

        # =====================================================
        # Build execution list
        # =====================================================

        executions = [
            ExecutionItem(
                execution_id=item.execution_id,
                data_row_id=item.data_row_id
            )
            for item in suite_items
        ]

        # =====================================================
        # Generate batch session
        # =====================================================

        batch_session_id = str(uuid.uuid4())

        # =====================================================
        # Create SuiteExecution
        # =====================================================

        suite_execution = SuiteExecution(
            suite_id=suite_id,
            batch_session_id=batch_session_id,
            status="RUNNING",
            total_testcases=len(executions),
            started_at=datetime.utcnow()
        )

        db.add(suite_execution)

        db.commit()

        # =====================================================
        # Start your EXISTING executor
        # =====================================================

        background_tasks.add_task(
            run_parallel_execution_async,
            executions,
            batch_session_id,
            max_parallel
        )

        return {
            "suite_id": suite_id,
            "suite_execution_id": suite_execution.id,
            "batch_session_id": batch_session_id,
            "status": "SUITE_EXECUTION_STARTED",
            "total_testcases": len(executions),
            "max_parallel": min(max_parallel, 6)
        }

    finally:

        db.close()


def update_suite_execution_status(
        batch_session_id: str,
        status: str
):
    db = SessionLocal()

    try:

        suite_execution = (
            db.query(SuiteExecution)
            .filter(
                SuiteExecution.batch_session_id ==
                batch_session_id
            )
            .first()
        )

        if not suite_execution:
            print(
                "SuiteExecution not found:",
                batch_session_id
            )

            return

        suite_execution.status = status

        if status in (
                "COMPLETED",
                "FAILED",
                "PARTIAL"
        ):
            suite_execution.completed_at = (
                datetime.utcnow()
            )

        db.commit()

        print(
            f"Suite execution updated: "
            f"{batch_session_id} -> {status}"
        )

    except Exception as e:

        db.rollback()

        print(
            "Failed to update suite execution:",
            e
        )

    finally:

        db.close()


########################### Siute Creation APIs ####################################
def create_test_suite(
        request: CreateSuiteRequest
):
    db = SessionLocal()

    try:

        # --------------------------------------------
        # Check duplicate suite
        # --------------------------------------------

        existing = (
            db.query(TestSuite)
            .filter(
                TestSuite.suite_name ==
                request.suite_name
            )
            .first()
        )

        if existing:
            raise ValueError(
                f"Suite already exists: "
                f"{request.suite_name}"
            )

        # --------------------------------------------
        # Create suite
        # --------------------------------------------

        suite = TestSuite(
            suite_name=request.suite_name,
            description=request.description,
            created_by=request.created_by,
            status="ACTIVE",
            project_id=request.project_id

        )

        db.add(suite)
        db.flush()

        # --------------------------------------------
        # Create suite items
        # --------------------------------------------

        for item in request.items:
            suite_item = TestSuiteItem(
                suite_id=suite.id,
                execution_id=item.execution_id,
                data_row_id=item.data_row_id,
                execution_order=item.execution_order,
                enabled=item.enabled
            )

            db.add(suite_item)

        db.commit()

        db.refresh(suite)

        return suite.id

    except Exception:

        db.rollback()
        raise

    finally:

        db.close()


@app.post("/test-suites")
def create_suite(
        request: CreateSuiteRequest
):
    try:

        suite_id = create_test_suite(request)

        return {
            "suite_id": suite_id,
            "suite_name": request.suite_name,
            "status": "CREATED",
            "total_items": len(request.items)
        }

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.get("/test-suites")
def get_all_test_suites(
        project_id: int
):
    db = SessionLocal()

    try:

        # --------------------------------------------------
        # Base query
        # --------------------------------------------------

        query = db.query(TestSuite)

        # --------------------------------------------------
        # Project filter
        # --------------------------------------------------

        if project_id is not None:
            query = query.filter(
                TestSuite.project_id == project_id
            )

        # --------------------------------------------------
        # Status filter
        # --------------------------------------------------

        # --------------------------------------------------
        # Get suites
        # --------------------------------------------------

        suites = (
            query
            .order_by(
                TestSuite.created_at.desc()
            )
            .all()
        )

        # --------------------------------------------------
        # Response
        # --------------------------------------------------

        return {

            "total_suites": len(suites),

            "suites": [

                {
                    "suite_id": suite.id,

                    "suite_name":
                        suite.suite_name,

                    "project_id":
                        suite.project_id,

                    "description":
                        suite.description,

                    "status":
                        suite.status,

                    "created_by":
                        suite.created_by,

                    "created_at": (
                        suite.created_at.isoformat()
                        if suite.created_at
                        else None
                    ),

                    "updated_at": (
                        suite.updated_at.isoformat()
                        if suite.updated_at
                        else None
                    )
                }

                for suite in suites
            ]
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        db.close()


def execute_suite(
        suite_id: int,
        max_parallel: int = 6
):
    db = SessionLocal()

    try:

        # =====================================================
        # 1. Get suite
        # =====================================================

        suite = (
            db.query(TestSuite)
            .filter(
                TestSuite.id == suite_id,
                TestSuite.status == "ACTIVE"
            )
            .first()
        )

        if not suite:
            raise ValueError(
                f"Suite not found or inactive: {suite_id}"
            )

        # =====================================================
        # 2. Get enabled suite items
        # =====================================================

        suite_items = (
            db.query(TestSuiteItem)
            .filter(
                TestSuiteItem.suite_id == suite_id,
                TestSuiteItem.enabled.is_(True)
            )
            .order_by(
                TestSuiteItem.execution_order.asc()
            )
            .all()
        )

        if not suite_items:
            raise ValueError(
                f"No enabled testcases found "
                f"for suite {suite_id}"
            )

        # =====================================================
        # 3. Build ExecutionItem list
        # =====================================================

        executions = []

        for item in suite_items:
            executions.append(
                ExecutionItem(
                    execution_id=item.execution_id,
                    data_row_id=item.data_row_id
                )
            )

        # =====================================================
        # 4. Generate batch session ID
        # =====================================================

        batch_session_id = str(uuid.uuid4())

        # =====================================================
        # 5. Create SuiteExecution record
        # =====================================================

        suite_execution = SuiteExecution(
            suite_id=suite_id,
            batch_session_id=batch_session_id,
            status="RECEIVED",
            total_testcases=len(executions)
        )

        db.add(suite_execution)

        db.commit()

        db.refresh(suite_execution)

        # =====================================================
        # 6. Return execution information
        # =====================================================

        return {
            "suite_id": suite_id,
            "suite_execution_id": suite_execution.id,
            "batch_session_id": batch_session_id,
            "total_testcases": len(executions),
            "max_parallel": min(max_parallel, 6),
            "executions": [
                {
                    "execution_id": item.execution_id,
                    "data_row_id": item.data_row_id
                }
                for item in executions
            ]
        }

    except Exception:

        db.rollback()
        raise

    finally:

        db.close()


########################### Execution Reporting API's #####################################
def get_batch_execution_results(
        batch_session_id: str
):
    db = SessionLocal()

    try:

        # ------------------------------------------------
        # Get all step execution records for this batch
        # ------------------------------------------------

        rows = (
            db.query(SuiteExecutionStep)
            .filter(
                SuiteExecutionStep.batch_session_id == batch_session_id
            )
            .order_by(
                SuiteExecutionStep.execution_id.asc(),
                SuiteExecutionStep.data_row_id.asc(),
                SuiteExecutionStep.id.asc()
            )
            .all()
        )

        # ------------------------------------------------
        # Batch does not exist
        # ------------------------------------------------

        if not rows:
            return None

        # ------------------------------------------------
        # Build testcase hierarchy
        #
        # execution_id + data_row_id + session_id
        # represents one actual testcase execution
        # ------------------------------------------------

        testcase_map = {}

        for row in rows:

            testcase_key = (
                row.execution_id,
                row.data_row_id,
                row.session_id
            )

            # --------------------------------------------
            # Create testcase entry
            # --------------------------------------------

            if testcase_key not in testcase_map:
                testcase_map[testcase_key] = {
                    "execution_id": row.execution_id,
                    "data_row_id": row.data_row_id,
                    "session_id": row.session_id,
                    "status": "passed",
                    "steps": []
                }

            # --------------------------------------------
            # Add step
            # --------------------------------------------

            testcase_map[testcase_key]["steps"].append({

                "step_execution_id": row.id,

                "planned_intent_id": row.planned_intent_id,

                "action": row.action,

                "target": row.target,

                "value": row.value,

                "status": row.status,

                "screenshot": row.screenshot,

                "log_error": row.log_error,

                "created_at": (
                    row.created_at.isoformat()
                    if row.created_at
                    else None
                )
            })

            # --------------------------------------------
            # Calculate testcase status
            # --------------------------------------------

            if row.status == "failed":

                testcase_map[testcase_key]["status"] = "failed"

            elif (
                    row.status == "skipped"
                    and testcase_map[testcase_key]["status"] != "failed"
            ):

                testcase_map[testcase_key]["status"] = "skipped"

        # ------------------------------------------------
        # Convert dictionary to list
        # ------------------------------------------------

        testcases = list(testcase_map.values())

        # ------------------------------------------------
        # Calculate batch status
        # ------------------------------------------------

        if any(
                testcase["status"] == "failed"
                for testcase in testcases
        ):

            batch_status = "FAILED"

        elif any(
                testcase["status"] == "skipped"
                for testcase in testcases
        ):

            batch_status = "PARTIAL"

        else:

            batch_status = "PASSED"

        # ------------------------------------------------
        # Calculate total steps
        # ------------------------------------------------

        total_steps = sum(
            len(testcase["steps"])
            for testcase in testcases
        )

        # ------------------------------------------------
        # Final response
        # ------------------------------------------------

        return {
            "batch_session_id": batch_session_id,
            "status": batch_status,
            "total_testcases": len(testcases),
            "total_steps": total_steps,
            "testcases": testcases
        }

    finally:

        db.close()


@app.get("/execution-results/{batch_session_id}")
def get_execution_results(
        batch_session_id: str
):
    result = get_batch_execution_results(
        batch_session_id
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"No execution results found for batch {batch_session_id}"
        )

    return result


def execution_report(batch_session_id: str):
    # --------------------------------------------------
    # Get execution results
    # --------------------------------------------------

    result = get_batch_execution_results(
        batch_session_id
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No execution results found "
                f"for batch: {batch_session_id}"
            )
        )

    # --------------------------------------------------
    # Convert Python object to JSON
    #
    # This will be embedded into JavaScript.
    # --------------------------------------------------

    execution_json = json.dumps(
        result,
        ensure_ascii=False
    )

    # --------------------------------------------------
    # Generate HTML
    # --------------------------------------------------

    html_content = f"""
<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        Test Execution Report
    </title>


    <style>

        * {{
            box-sizing: border-box;
        }}


        body {{

            margin: 0;

            font-family:
                Arial,
                Helvetica,
                sans-serif;

            background: #f5f7fa;

            color: #1f2937;
        }}


        .container {{

            max-width: 1500px;

            margin: 30px auto;

            padding: 0 20px;
        }}


        /* ======================================
           HEADER
        ====================================== */

        .header {{

            background: white;

            border-radius: 10px;

            padding: 25px;

            margin-bottom: 20px;

            box-shadow:
                0 2px 8px rgba(0,0,0,0.08);
        }}


        .header h1 {{

            margin: 0 0 12px 0;

            font-size: 28px;
        }}


        .batch-id {{

            font-size: 14px;

            color: #6b7280;

            word-break: break-all;
        }}


        /* ======================================
           SUMMARY
        ====================================== */

        .summary {{

            display: grid;

            grid-template-columns:
                repeat(4, 1fr);

            gap: 15px;

            margin-bottom: 25px;
        }}


        .summary-card {{

            background: white;

            border-radius: 10px;

            padding: 20px;

            box-shadow:
                0 2px 8px rgba(0,0,0,0.06);
        }}


        .summary-title {{

            font-size: 13px;

            color: #6b7280;

            margin-bottom: 8px;
        }}


        .summary-value {{

            font-size: 28px;

            font-weight: bold;
        }}


        /* ======================================
           STATUS
        ====================================== */

        .status {{

            display: inline-block;

            padding: 5px 12px;

            border-radius: 20px;

            font-size: 12px;

            font-weight: bold;
        }}


        .status-passed {{

            background: #dcfce7;

            color: #166534;
        }}


        .status-failed {{

            background: #fee2e2;

            color: #991b1b;
        }}


        .status-skipped {{

            background: #fef3c7;

            color: #92400e;
        }}


        .status-partial {{

            background: #fef3c7;

            color: #92400e;
        }}


        /* ======================================
           TESTCASE
        ====================================== */

        .testcase {{

            background: white;

            border-radius: 10px;

            margin-bottom: 15px;

            box-shadow:
                0 2px 8px rgba(0,0,0,0.06);

            overflow: hidden;
        }}


        .testcase-header {{

            padding: 18px 20px;

            display: flex;

            justify-content: space-between;

            align-items: center;

            cursor: pointer;

            border-bottom:
                1px solid #e5e7eb;
        }}


        .testcase-header:hover {{

            background: #f9fafb;
        }}


        .testcase-title {{

            display: flex;

            align-items: center;

            gap: 15px;
        }}


        .arrow {{

            font-size: 16px;

            transition:
                transform 0.2s;
        }}


        .arrow.open {{

            transform:
                rotate(90deg);
        }}


        .testcase-id {{

            font-weight: bold;

            font-size: 16px;
        }}


        .testcase-meta {{

            color: #6b7280;

            font-size: 13px;

            margin-top: 5px;
        }}


        .testcase-body {{

            display: none;

            padding: 20px;
        }}


        .testcase-body.open {{

            display: block;
        }}


        /* ======================================
           SESSION
        ====================================== */

        .session {{

            border:
                1px solid #e5e7eb;

            border-radius: 8px;

            overflow: hidden;
        }}


        .session-header {{

            padding: 14px 16px;

            background: #f9fafb;

            display: flex;

            justify-content: space-between;

            align-items: center;
        }}


        .session-info {{

            font-size: 13px;
        }}


        .session-id {{

            color: #6b7280;

            word-break: break-all;
        }}


        /* ======================================
           TABLE
        ====================================== */

        .table-container {{

            overflow-x: auto;
        }}


        .steps {{

            width: 100%;

            border-collapse:
                collapse;

            min-width: 1100px;
        }}


        .steps th {{

            background: #f3f4f6;

            text-align: left;

            padding: 11px;

            font-size: 12px;

            color: #4b5563;
        }}


        .steps td {{

            padding: 11px;

            border-top:
                1px solid #e5e7eb;

            vertical-align: top;

            font-size: 13px;
        }}


        .target {{

            max-width: 250px;

            word-break: break-word;
        }}


        .value {{

            max-width: 200px;

            word-break: break-word;
        }}


        .log-error {{

            max-width: 350px;

            white-space: pre-wrap;

            word-break: break-word;
        }}


        /* ======================================
           SCREENSHOT
        ====================================== */

        .screenshot {{

            width: 110px;

            height: 75px;

            object-fit: cover;

            border:
                1px solid #d1d5db;

            border-radius: 5px;

            cursor: pointer;
        }}


        .screenshot:hover {{

            opacity: 0.8;
        }}


        /* ======================================
           MODAL
        ====================================== */

        .modal {{

            display: none;

            position: fixed;

            z-index: 1000;

            left: 0;

            top: 0;

            width: 100%;

            height: 100%;

            background:
                rgba(0,0,0,0.85);

            align-items: center;

            justify-content: center;
        }}


        .modal img {{

            max-width: 90%;

            max-height: 90%;

            object-fit: contain;
        }}


        .modal-close {{

            position: absolute;

            top: 20px;

            right: 30px;

            color: white;

            font-size: 35px;

            cursor: pointer;
        }}


        /* ======================================
           RESPONSIVE
        ====================================== */

        @media (max-width: 900px) {{

            .summary {{

                grid-template-columns:
                    repeat(2, 1fr);
            }}
        }}


        @media (max-width: 600px) {{

            .summary {{

                grid-template-columns: 1fr;
            }}
        }}

    </style>

</head>


<body>


<div class="container">


    <!-- =====================================
         HEADER
    ====================================== -->

    <div class="header">

        <h1>
            Test Execution Report
        </h1>

        <div class="batch-id">

            Batch Session ID:

            <strong id="batchId"></strong>

        </div>


        <div style="margin-top: 12px;">

            Batch Status:

            <span id="batchStatus"></span>

        </div>

    </div>


    <!-- =====================================
         SUMMARY
    ====================================== -->

    <div class="summary">


        <div class="summary-card">

            <div class="summary-title">
                Testcases
            </div>

            <div
                class="summary-value"
                id="totalTestcases"
            >
                0
            </div>

        </div>


        <div class="summary-card">

            <div class="summary-title">
                Total Steps
            </div>

            <div
                class="summary-value"
                id="totalSteps"
            >
                0
            </div>

        </div>


        <div class="summary-card">

            <div class="summary-title">
                Passed
            </div>

            <div
                class="summary-value"
                id="passedCount"
            >
                0
            </div>

        </div>


        <div class="summary-card">

            <div class="summary-title">
                Failed
            </div>

            <div
                class="summary-value"
                id="failedCount"
            >
                0
            </div>

        </div>

    </div>


    <!-- =====================================
         TESTCASES
    ====================================== -->

    <div id="testcases"></div>


</div>


<!-- =====================================
     IMAGE MODAL
====================================== -->

<div
    class="modal"
    id="imageModal"
>

    <span
        class="modal-close"
        onclick="closeImage()"
    >
        &times;
    </span>


    <img
        id="modalImage"
        src=""
        alt="Screenshot"
    >

</div>


<script>


    /*
     * Python injects the API result here.
     */

    const executionData =
        {execution_json};


    /* =====================================
       STATUS
    ===================================== */

    function getStatusHtml(status) {{

        if (!status) {{
            return "";
        }}

        const normalized =
            status.toLowerCase();

        let cssClass =
            "status-passed";


        if (normalized === "failed") {{

            cssClass =
                "status-failed";

        }} else if (
            normalized === "skipped"
        ) {{

            cssClass =
                "status-skipped";

        }} else if (
            normalized === "partial"
        ) {{

            cssClass =
                "status-partial";
        }}


        return `
            <span
                class="status ${{cssClass}}"
            >
                ${{status.toUpperCase()}}
            </span>
        `;
    }}


    /* =====================================
       HTML ESCAPE
    ===================================== */

    function escapeHtml(value) {{

        if (
            value === null ||
            value === undefined
        ) {{
            return "";
        }}


        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }}


    /* =====================================
       LOAD REPORT
    ===================================== */

    function loadReport(data) {{

        document.getElementById(
            "batchId"
        ).textContent =
            data.batch_session_id;


        document.getElementById(
            "batchStatus"
        ).innerHTML =
            getStatusHtml(data.status);


        document.getElementById(
            "totalTestcases"
        ).textContent =
            data.total_testcases;


        document.getElementById(
            "totalSteps"
        ).textContent =
            data.total_steps;


        let passed = 0;

        let failed = 0;


        data.testcases.forEach(
            testcase => {{

                if (
                    testcase.status === "passed"
                ) {{
                    passed++;
                }}


                if (
                    testcase.status === "failed"
                ) {{
                    failed++;
                }}

            }}
        );


        document.getElementById(
            "passedCount"
        ).textContent =
            passed;


        document.getElementById(
            "failedCount"
        ).textContent =
            failed;


        const container =
            document.getElementById(
                "testcases"
            );


        container.innerHTML = "";


        data.testcases.forEach(
            (testcase, index) => {{

                container.appendChild(
                    createTestcase(
                        testcase,
                        index
                    )
                );

            }}
        );

    }}


    /* =====================================
       CREATE TESTCASE
    ===================================== */

    function createTestcase(
        testcase,
        index
    ) {{

        const testcaseDiv =
            document.createElement("div");


        testcaseDiv.className =
            "testcase";


        const header =
            document.createElement("div");


        header.className =
            "testcase-header";


        header.innerHTML = `

            <div class="testcase-title">

                <span
                    class="arrow"
                    id="arrow-${{index}}"
                >
                    ▶
                </span>


                <div>

                    <div class="testcase-id">

                        Testcase
                        #${{testcase.execution_id}}

                    </div>


                    <div
                        class="testcase-meta"
                    >

                        Data Row:
                        ${{testcase.data_row_id}}

                        &nbsp; | &nbsp;

                        Session:
                        ${{escapeHtml(
                            testcase.session_id
                        )}}

                    </div>

                </div>

            </div>


            <div>

                ${{getStatusHtml(
                    testcase.status
                )}}

            </div>
        `;


        const body =
            document.createElement("div");


        body.className =
            "testcase-body";


        header.onclick = function() {{

            body.classList.toggle(
                "open"
            );


            document.getElementById(
                `arrow-${{index}}`
            ).classList.toggle(
                "open"
            );

        }};


        /*
         * Session
         */

        const session =
            document.createElement("div");


        session.className =
            "session";


        session.innerHTML = `

            <div
                class="session-header"
            >

                <div class="session-info">

                    <strong>
                        Data Row:
                    </strong>

                    ${{testcase.data_row_id}}

                    <br>

                    <strong>
                        Session:
                    </strong>

                    <span class="session-id">

                        ${{escapeHtml(
                            testcase.session_id
                        )}}

                    </span>

                </div>


                <div>

                    ${{getStatusHtml(
                        testcase.status
                    )}}

                </div>

            </div>
        `;


        /*
         * Table
         */

        const table =
            document.createElement("table");


        table.className =
            "steps";


        table.innerHTML = `

            <thead>

                <tr>

                    <th>
                        Step
                    </th>

                    <th>
                        Planned Step
                    </th>

                    <th>
                        Action
                    </th>

                    <th>
                        Target
                    </th>

                    <th>
                        Value
                    </th>

                    <th>
                        Status
                    </th>

                    <th>
                        Screenshot
                    </th>

                    <th>
                        Log / Error
                    </th>

                </tr>

            </thead>


            <tbody></tbody>
        `;


        const tbody =
            table.querySelector(
                "tbody"
            );


        testcase.steps.forEach(
            (step, stepIndex) => {{

                const tr =
                    document.createElement("tr");


                let screenshotHtml =
                    "-";


                if (step.screenshot) {{

                    let imageSource =
                        step.screenshot;


                    if (
                        !imageSource.startsWith(
                            "data:image"
                        ) &&
                        !imageSource.startsWith(
                            "http"
                        )
                    ) {{

                        imageSource =
                            "data:image/png;base64," +
                            imageSource;
                    }}


                    screenshotHtml = `

                        <img
                            class="screenshot"
                            src="${{imageSource}}"
                            onclick="showImage(
                                '${{imageSource}}'
                            )"
                            alt="Screenshot"
                        >

                    `;
                }}


                tr.innerHTML = `

                    <td>

                        <strong>
                            ${{stepIndex + 1}}
                        </strong>

                        <br>

                        <small>

                            ID:
                            ${{step.step_execution_id}}

                        </small>

                    </td>


                    <td>

                        ${{step.planned_intent_id ?? "-"}}

                    </td>


                    <td>

                        ${{escapeHtml(
                            step.action ?? "-"
                        )}}

                    </td>


                    <td class="target">

                        ${{escapeHtml(
                            step.target ?? "-"
                        )}}

                    </td>


                    <td class="value">

                        ${{escapeHtml(
                            step.value ?? "-"
                        )}}

                    </td>


                    <td>

                        ${{getStatusHtml(
                            step.status
                        )}}

                    </td>


                    <td>

                        ${{screenshotHtml}}

                    </td>


                    <td class="log-error">

                        ${{escapeHtml(
                            step.log_error ?? "-"
                        )}}

                    </td>

                `;


                tbody.appendChild(tr);

            }}
        );


        const tableContainer =
            document.createElement("div");


        tableContainer.className =
            "table-container";


        tableContainer.appendChild(
            table
        );


        session.appendChild(
            tableContainer
        );


        body.appendChild(
            session
        );


        testcaseDiv.appendChild(
            header
        );


        testcaseDiv.appendChild(
            body
        );


        return testcaseDiv;

    }}


    /* =====================================
       SCREENSHOT MODAL
    ===================================== */

    function showImage(src) {{

        document.getElementById(
            "modalImage"
        ).src = src;


        document.getElementById(
            "imageModal"
        ).style.display =
            "flex";
    }}


    function closeImage() {{

        document.getElementById(
            "imageModal"
        ).style.display =
            "none";
    }}


    /* =====================================
       INITIALIZE
    ===================================== */

    loadReport(executionData);


</script>


</body>

</html>
"""

    return HTMLResponse(
        content=html_content,
        status_code=200
    )


@app.get(
    "/execution-report/{batch_session_id}",
    response_class=HTMLResponse
)
def execution_report(batch_session_id: str):
    db = SessionLocal()

    try:

        # ============================================================
        # 1. Get all execution steps for this batch
        # ============================================================

        rows = (
            db.query(SuiteExecutionStep)
            .filter(
                SuiteExecutionStep.batch_session_id == batch_session_id
            )
            .order_by(
                SuiteExecutionStep.execution_id.asc(),
                SuiteExecutionStep.data_row_id.asc(),
                SuiteExecutionStep.id.asc()
            )
            .all()
        )

        print(
            f"REPORT: batch={batch_session_id}, "
            f"rows found={len(rows)}"
        )

        # ============================================================
        # 2. If nothing has been stored yet
        # ============================================================

        if not rows:
            return HTMLResponse(
                content=f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Execution Report</title>

                    <style>
                        body {{
                            font-family: Arial;
                            background: #f5f7fa;
                            padding: 40px;
                        }}

                        .box {{
                            background: white;
                            padding: 30px;
                            border-radius: 10px;
                            max-width: 800px;
                            margin: auto;
                        }}

                        .warning {{
                            color: #92400e;
                            background: #fef3c7;
                            padding: 15px;
                            border-radius: 6px;
                        }}
                    </style>
                </head>

                <body>

                    <div class="box">

                        <h2>
                            Test Execution Report
                        </h2>

                        <p>
                            Batch Session ID:
                            <strong>
                                {html.escape(batch_session_id)}
                            </strong>
                        </p>

                        <div class="warning">

                            No execution steps have been stored
                            for this batch yet.

                            <br><br>

                            The parallel execution may still be running.

                        </div>

                    </div>

                </body>
                </html>
                """,
                status_code=200
            )

        # ============================================================
        # 3. Build testcase hierarchy
        #
        # execution_id
        #       |
        #       +--- data_row_id
        #                 |
        #                 +--- steps
        # ============================================================

        testcase_map = {}

        for row in rows:

            key = (
                row.execution_id,
                row.data_row_id,
                row.session_id
            )

            if key not in testcase_map:
                testcase_map[key] = {
                    "execution_id": row.execution_id,
                    "data_row_id": row.data_row_id,
                    "session_id": row.session_id,
                    "status": "PASSED",
                    "steps": []
                }

            # --------------------------------------------------------
            # Add step
            # --------------------------------------------------------

            testcase_map[key]["steps"].append(row)

            # --------------------------------------------------------
            # Testcase status
            # --------------------------------------------------------

            if row.status and row.status.lower() == "failed":

                testcase_map[key]["status"] = "FAILED"

            elif (
                    row.status
                    and row.status.lower() == "skipped"
                    and testcase_map[key]["status"] != "FAILED"
            ):

                testcase_map[key]["status"] = "SKIPPED"

        testcases = list(testcase_map.values())

        # ============================================================
        # 4. Calculate summary
        # ============================================================

        total_testcases = len(testcases)

        total_steps = len(rows)

        passed_testcases = sum(
            1
            for testcase in testcases
            if testcase["status"] == "PASSED"
        )

        failed_testcases = sum(
            1
            for testcase in testcases
            if testcase["status"] == "FAILED"
        )

        skipped_testcases = sum(
            1
            for testcase in testcases
            if testcase["status"] == "SKIPPED"
        )

        # ============================================================
        # 5. Batch status
        # ============================================================

        if failed_testcases > 0:

            batch_status = "FAILED"

        elif skipped_testcases > 0:

            batch_status = "PARTIAL"

        else:

            batch_status = "PASSED"

        # ============================================================
        # 6. Helper functions
        # ============================================================

        def status_html(status):

            if not status:
                status = "UNKNOWN"

            status_upper = status.upper()

            css_class = "passed"

            if status_upper == "FAILED":
                css_class = "failed"

            elif status_upper == "SKIPPED":
                css_class = "skipped"

            elif status_upper == "PARTIAL":
                css_class = "partial"

            return f"""
                <span class="status {css_class}">
                    {html.escape(status_upper)}
                </span>
            """

        # ============================================================
        # 7. Build testcase HTML
        # ============================================================

        testcase_html = ""

        for index, testcase in enumerate(testcases):

            execution_id = testcase["execution_id"]
            data_row_id = testcase["data_row_id"]
            session_id = testcase["session_id"]
            testcase_status = testcase["status"]

            steps_html = ""

            for step_number, row in enumerate(
                    testcase["steps"],
                    start=1
            ):

                # ----------------------------------------------------
                # Screenshot
                # ----------------------------------------------------

                screenshot_html = "-"

                if row.screenshot:

                    screenshot = row.screenshot

                    if not screenshot.startswith(
                            "data:image"
                    ):
                        screenshot = (
                                "data:image/png;base64,"
                                + screenshot
                        )

                    # Escape single quote for JS
                    screenshot_js = (
                        screenshot
                        .replace("\\", "\\\\")
                        .replace("'", "\\'")
                    )

                    screenshot_html = f"""
                        <img
                            class="screenshot"
                            src="{html.escape(screenshot)}"
                            onclick="showImage('{screenshot_js}')"
                            alt="Screenshot"
                        >
                    """

                # ----------------------------------------------------
                # Values
                # ----------------------------------------------------

                target = (
                    html.escape(str(row.target))
                    if row.target is not None
                    else "-"
                )

                value = (
                    html.escape(str(row.value))
                    if row.value is not None
                    else "-"
                )

                action = (
                    html.escape(str(row.action))
                    if row.action is not None
                    else "-"
                )

                log_error = (
                    html.escape(str(row.log_error))
                    if row.log_error is not None
                    else "-"
                )

                planned_intent_id = (
                    str(row.planned_intent_id)
                    if row.planned_intent_id is not None
                    else "-"
                )

                step_status = (
                    row.status
                    if row.status
                    else "UNKNOWN"
                )

                steps_html += f"""

                    <tr>

                        <td>
                            <strong>
                                {step_number}
                            </strong>

                            <br>

                            <small>
                                ID: {row.id}
                            </small>
                        </td>

                        <td>
                            {planned_intent_id}
                        </td>

                        <td>
                            {action}
                        </td>

                        <td class="target">
                            {target}
                        </td>

                        <td class="value">
                            {value}
                        </td>

                        <td>
                            {status_html(step_status)}
                        </td>

                        <td>
                            {screenshot_html}
                        </td>

                        <td class="log-error">
                            {log_error}
                        </td>

                    </tr>
                """

            # --------------------------------------------------------
            # Testcase block
            # --------------------------------------------------------

            testcase_html += f"""

                <div class="testcase">

                    <div
                        class="testcase-header"
                        onclick="toggleTestcase({index})"
                    >

                        <div class="testcase-title">

                            <span
                                class="arrow"
                                id="arrow-{index}"
                            >
                                ▶
                            </span>

                            <div>

                                <div class="testcase-id">

                                    Execution ID:
                                    {execution_id}

                                </div>

                                <div class="testcase-meta">

                                    Data Row:
                                    {data_row_id}

                                    &nbsp; | &nbsp;

                                    Session:
                                    {html.escape(str(session_id))}

                                </div>

                            </div>

                        </div>

                        <div>

                            {status_html(testcase_status)}

                        </div>

                    </div>


                    <div
                        class="testcase-body"
                        id="body-{index}"
                    >

                        <div class="session-info">

                            <strong>
                                Execution ID:
                            </strong>
                            {execution_id}

                            &nbsp;&nbsp;

                            <strong>
                                Data Row:
                            </strong>
                            {data_row_id}

                            &nbsp;&nbsp;

                            <strong>
                                Session:
                            </strong>

                            {html.escape(str(session_id))}

                        </div>


                        <div class="table-container">

                            <table class="steps">

                                <thead>

                                    <tr>

                                        <th>
                                            Step
                                        </th>

                                        <th>
                                            Planned Step
                                        </th>

                                        <th>
                                            Action
                                        </th>

                                        <th>
                                            Target
                                        </th>

                                        <th>
                                            Value
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Screenshot
                                        </th>

                                        <th>
                                            Log / Error
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {steps_html}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>
            """

        # ============================================================
        # 8. Complete HTML
        # ============================================================

        html_content = f"""

<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        Test Execution Report
    </title>


    <style>

        * {{
            box-sizing: border-box;
        }}


        body {{

            margin: 0;

            font-family:
                Arial,
                Helvetica,
                sans-serif;

            background: #f5f7fa;

            color: #1f2937;
        }}


        .container {{

            max-width: 1500px;

            margin: 30px auto;

            padding: 0 20px;
        }}


        .header {{

            background: white;

            border-radius: 10px;

            padding: 25px;

            margin-bottom: 20px;

            box-shadow:
                0 2px 8px rgba(0,0,0,0.08);
        }}


        .header h1 {{

            margin: 0 0 12px 0;

            font-size: 28px;
        }}


        .batch-id {{

            color: #6b7280;

            font-size: 14px;

            word-break: break-all;
        }}


        .summary {{

            display: grid;

            grid-template-columns:
                repeat(5, 1fr);

            gap: 15px;

            margin-bottom: 25px;
        }}


        .summary-card {{

            background: white;

            border-radius: 10px;

            padding: 20px;

            box-shadow:
                0 2px 8px rgba(0,0,0,0.06);
        }}


        .summary-title {{

            font-size: 13px;

            color: #6b7280;

            margin-bottom: 8px;
        }}


        .summary-value {{

            font-size: 28px;

            font-weight: bold;
        }}


        .status {{

            display: inline-block;

            padding: 5px 12px;

            border-radius: 20px;

            font-size: 12px;

            font-weight: bold;
        }}


        .passed {{

            background: #dcfce7;

            color: #166534;
        }}


        .failed {{

            background: #fee2e2;

            color: #991b1b;
        }}


        .skipped {{

            background: #fef3c7;

            color: #92400e;
        }}


        .partial {{

            background: #fef3c7;

            color: #92400e;
        }}


        .testcase {{

            background: white;

            border-radius: 10px;

            margin-bottom: 15px;

            box-shadow:
                0 2px 8px rgba(0,0,0,0.06);

            overflow: hidden;
        }}


        .testcase-header {{

            padding: 18px 20px;

            display: flex;

            justify-content: space-between;

            align-items: center;

            cursor: pointer;

            border-bottom:
                1px solid #e5e7eb;
        }}


        .testcase-header:hover {{

            background: #f9fafb;
        }}


        .testcase-title {{

            display: flex;

            align-items: center;

            gap: 15px;
        }}


        .arrow {{

            transition:
                transform 0.2s;

            font-size: 16px;
        }}


        .arrow.open {{

            transform:
                rotate(90deg);
        }}


        .testcase-id {{

            font-weight: bold;

            font-size: 16px;
        }}


        .testcase-meta {{

            color: #6b7280;

            font-size: 13px;

            margin-top: 5px;
        }}


        .testcase-body {{

            display: none;

            padding: 20px;
        }}


        .testcase-body.open {{

            display: block;
        }}


        .session-info {{

            padding: 12px;

            background: #f9fafb;

            border-radius: 6px;

            margin-bottom: 15px;

            font-size: 13px;

            word-break: break-all;
        }}


        .table-container {{

            overflow-x: auto;
        }}


        .steps {{

            width: 100%;

            border-collapse: collapse;

            min-width: 1100px;
        }}


        .steps th {{

            background: #f3f4f6;

            padding: 11px;

            text-align: left;

            font-size: 12px;

            color: #4b5563;
        }}


        .steps td {{

            padding: 11px;

            border-top:
                1px solid #e5e7eb;

            vertical-align: top;

            font-size: 13px;
        }}


        .target {{

            max-width: 250px;

            word-break: break-word;
        }}


        .value {{

            max-width: 200px;

            word-break: break-word;
        }}


        .log-error {{

            max-width: 350px;

            white-space: pre-wrap;

            word-break: break-word;
        }}


        .screenshot {{

            width: 110px;

            height: 75px;

            object-fit: cover;

            border-radius: 5px;

            border:
                1px solid #d1d5db;

            cursor: pointer;
        }}


        .screenshot:hover {{

            opacity: 0.8;
        }}


        .modal {{

            display: none;

            position: fixed;

            z-index: 9999;

            left: 0;

            top: 0;

            width: 100%;

            height: 100%;

            background:
                rgba(0,0,0,0.85);

            align-items: center;

            justify-content: center;
        }}


        .modal img {{

            max-width: 90%;

            max-height: 90%;

            object-fit: contain;
        }}


        .modal-close {{

            position: absolute;

            top: 20px;

            right: 30px;

            color: white;

            font-size: 40px;

            cursor: pointer;
        }}


        @media (max-width: 1000px) {{

            .summary {{

                grid-template-columns:
                    repeat(2, 1fr);
            }}
        }}


        @media (max-width: 600px) {{

            .summary {{

                grid-template-columns: 1fr;
            }}
        }}

    </style>

</head>


<body>


<div class="container">


    <!-- ======================================
         HEADER
    ======================================= -->

    <div class="header">

        <h1>
            Test Execution Report
        </h1>

        <div class="batch-id">

            Batch Session ID:

            <strong>
                {html.escape(batch_session_id)}
            </strong>

        </div>

        <div style="margin-top: 12px;">

            Batch Status:

            {status_html(batch_status)}

        </div>

    </div>


    <!-- ======================================
         SUMMARY
    ======================================= -->

    <div class="summary">


        <div class="summary-card">

            <div class="summary-title">
                Testcases
            </div>

            <div class="summary-value">
                {total_testcases}
            </div>

        </div>


        <div class="summary-card">

            <div class="summary-title">
                Total Steps
            </div>

            <div class="summary-value">
                {total_steps}
            </div>

        </div>


        <div class="summary-card">

            <div class="summary-title">
                Passed
            </div>

            <div class="summary-value">
                {passed_testcases}
            </div>

        </div>


        <div class="summary-card">

            <div class="summary-title">
                Failed
            </div>

            <div class="summary-value">
                {failed_testcases}
            </div>

        </div>


        <div class="summary-card">

            <div class="summary-title">
                Skipped
            </div>

            <div class="summary-value">
                {skipped_testcases}
            </div>

        </div>

    </div>


    <!-- ======================================
         TESTCASES
    ======================================= -->

    {testcase_html}


</div>


<!-- ======================================
     IMAGE MODAL
======================================= -->

<div
    class="modal"
    id="imageModal"
>

    <span
        class="modal-close"
        onclick="closeImage()"
    >
        &times;
    </span>

    <img
        id="modalImage"
        src=""
        alt="Screenshot"
    >

</div>


<script>


function toggleTestcase(index)
{{

    const body =
        document.getElementById(
            "body-" + index
        );

    const arrow =
        document.getElementById(
            "arrow-" + index
        );


    if (body.classList.contains("open"))
    {{

        body.classList.remove("open");

        arrow.classList.remove("open");

    }}
    else
    {{

        body.classList.add("open");

        arrow.classList.add("open");

    }}

}}


function showImage(src)
{{

    document.getElementById(
        "modalImage"
    ).src = src;


    document.getElementById(
        "imageModal"
    ).style.display = "flex";

}}


function closeImage()
{{

    document.getElementById(
        "imageModal"
    ).style.display = "none";

}}


</script>


</body>

</html>
"""

        return HTMLResponse(
            content=html_content,
            status_code=200
        )

    except Exception as e:

        print(
            f"Error generating execution report: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        db.close()


@app.get(
    "/test-suites/{suite_id}/report",
    response_class=HTMLResponse
)
def get_suite_html_report(
        suite_id: int,
        suite_execution_id: Optional[int] = None
):
    db = SessionLocal()

    try:

        # ==========================================================
        # 1. Validate Suite
        # ==========================================================

        suite = (
            db.query(TestSuite)
            .filter(
                TestSuite.id == suite_id
            )
            .first()
        )

        if not suite:
            raise HTTPException(
                status_code=404,
                detail=f"Suite {suite_id} not found"
            )

        # ==========================================================
        # 2. Get Suite Execution
        #
        # If suite_execution_id is supplied:
        #     get that particular execution
        #
        # Otherwise:
        #     get latest execution
        # ==========================================================

        query = (
            db.query(SuiteExecution)
            .filter(
                SuiteExecution.suite_id == suite_id
            )
        )

        if suite_execution_id is not None:
            query = query.filter(
                SuiteExecution.id ==
                suite_execution_id
            )

        suite_execution = (
            query
            .order_by(
                SuiteExecution.created_at.desc()
            )
            .first()
        )

        if not suite_execution:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"No execution found for "
                    f"suite {suite_id}"
                )
            )

        # ==========================================================
        # 3. Get Batch ID
        # ==========================================================

        batch_session_id = (
            suite_execution.batch_session_id
        )

        # ==========================================================
        # 4. Get all execution steps
        # ==========================================================

        rows = (
            db.query(SuiteExecutionStep)
            .filter(
                SuiteExecutionStep.batch_session_id ==
                batch_session_id
            )
            .order_by(
                SuiteExecutionStep.execution_id.asc(),
                SuiteExecutionStep.data_row_id.asc(),
                SuiteExecutionStep.id.asc()
            )
            .all()
        )

        print(
            f"Suite Report: "
            f"suite={suite_id}, "
            f"suite_execution={suite_execution.id}, "
            f"batch={batch_session_id}, "
            f"steps={len(rows)}"
        )

        # ==========================================================
        # 5. If execution hasn't produced results yet
        # ==========================================================

        if not rows:
            return HTMLResponse(
                content=f"""
                <!DOCTYPE html>

                <html>

                <head>

                    <title>
                        Suite Execution Report
                    </title>

                    <style>

                        body {{
                            font-family: Arial;
                            background: #f5f7fa;
                            padding: 40px;
                        }}

                        .container {{
                            max-width: 900px;
                            margin: auto;
                        }}

                        .card {{
                            background: white;
                            padding: 30px;
                            border-radius: 10px;
                            box-shadow:
                                0 2px 8px
                                rgba(0,0,0,0.08);
                        }}

                        .status {{
                            display: inline-block;
                            padding: 6px 14px;
                            border-radius: 20px;
                            font-weight: bold;
                        }}

                        .running {{
                            background: #dbeafe;
                            color: #1e40af;
                        }}

                        .failed {{
                            background: #fee2e2;
                            color: #991b1b;
                        }}

                        .completed {{
                            background: #dcfce7;
                            color: #166534;
                        }}

                    </style>

                </head>

                <body>

                    <div class="container">

                        <div class="card">

                            <h1>
                                Suite Execution Report
                            </h1>

                            <p>
                                <strong>
                                    Suite:
                                </strong>

                                {html.escape(
                    suite.suite_name
                )}
                            </p>

                            <p>
                                <strong>
                                    Suite ID:
                                </strong>

                                {suite.id}
                            </p>

                            <p>
                                <strong>
                                    Execution ID:
                                </strong>

                                {suite_execution.id}
                            </p>

                            <p>
                                <strong>
                                    Batch Session:
                                </strong>

                                {html.escape(
                    batch_session_id
                )}
                            </p>

                            <p>

                                Status:

                                <span class="status running">

                                    {html.escape(
                    suite_execution.status
                )}

                                </span>

                            </p>

                            <hr>

                            <h3>
                                No execution steps available yet.
                            </h3>

                            <p>
                                The suite may still be running.
                            </p>

                            <p>
                                Total expected testcases:
                                <strong>
                                    {suite_execution.total_testcases}
                                </strong>
                            </p>

                        </div>

                    </div>

                </body>

                </html>
                """,
                status_code=200
            )

        # ==========================================================
        # 6. Build testcase hierarchy
        # ==========================================================

        testcase_map = {}

        for row in rows:

            key = (
                row.execution_id,
                row.data_row_id,
                row.session_id
            )

            if key not in testcase_map:
                testcase_map[key] = {

                    "execution_id":
                        row.execution_id,

                    "data_row_id":
                        row.data_row_id,

                    "session_id":
                        row.session_id,

                    "status":
                        "PASSED",

                    "steps": []

                }

            testcase_map[key]["steps"].append(row)

            # ------------------------------------------------------
            # Determine testcase status
            # ------------------------------------------------------

            if (
                    row.status
                    and row.status.lower() == "failed"
            ):

                testcase_map[key]["status"] = "FAILED"

            elif (
                    row.status
                    and row.status.lower() == "skipped"
                    and testcase_map[key]["status"] != "FAILED"
            ):

                testcase_map[key]["status"] = "SKIPPED"

        testcases = list(
            testcase_map.values()
        )

        # ==========================================================
        # 7. Summary
        # ==========================================================

        total_testcases = len(testcases)

        total_steps = len(rows)

        passed_testcases = sum(
            1
            for testcase in testcases
            if testcase["status"] == "PASSED"
        )

        failed_testcases = sum(
            1
            for testcase in testcases
            if testcase["status"] == "FAILED"
        )

        skipped_testcases = sum(
            1
            for testcase in testcases
            if testcase["status"] == "SKIPPED"
        )

        # ==========================================================
        # 8. Batch status
        # ==========================================================

        if failed_testcases > 0:

            report_status = "FAILED"

        elif skipped_testcases > 0:

            report_status = "PARTIAL"

        else:

            report_status = "PASSED"

        # ==========================================================
        # 9. Status HTML
        # ==========================================================

        def status_html(status):

            if not status:
                status = "UNKNOWN"

            status_upper = status.upper()

            css_class = "passed"

            if status_upper == "FAILED":

                css_class = "failed"

            elif status_upper == "SKIPPED":

                css_class = "skipped"

            elif status_upper == "PARTIAL":

                css_class = "partial"

            elif status_upper == "RUNNING":

                css_class = "running"

            return f"""
                <span
                    class="status {css_class}"
                >
                    {html.escape(status_upper)}
                </span>
            """

        # ==========================================================
        # 10. Generate testcase HTML
        # ==========================================================

        testcase_html = ""

        for index, testcase in enumerate(
                testcases
        ):

            execution_id = (
                testcase["execution_id"]
            )

            data_row_id = (
                testcase["data_row_id"]
            )

            session_id = (
                testcase["session_id"]
            )

            testcase_status = (
                testcase["status"]
            )

            steps_html = ""

            for step_number, row in enumerate(
                    testcase["steps"],
                    start=1
            ):

                # --------------------------------------------------
                # Screenshot
                # --------------------------------------------------

                screenshot_html = "-"

                if row.screenshot:

                    screenshot = row.screenshot

                    if not screenshot.startswith(
                            "data:image"
                    ):
                        screenshot = (
                                "data:image/png;base64,"
                                + screenshot
                        )

                    screenshot_js = (
                        screenshot
                        .replace("\\", "\\\\")
                        .replace("'", "\\'")
                    )

                    screenshot_html = f"""

                        <img
                            class="screenshot"
                            src="{html.escape(
                        screenshot
                    )}"
                            onclick="showImage(
                                '{screenshot_js}'
                            )"
                            alt="Screenshot"
                        >

                    """

                # --------------------------------------------------
                # Fields
                # --------------------------------------------------

                action = (
                    html.escape(str(row.action))
                    if row.action is not None
                    else "-"
                )

                target = (
                    html.escape(str(row.target))
                    if row.target is not None
                    else "-"
                )

                value = (
                    html.escape(str(row.value))
                    if row.value is not None
                    else "-"
                )

                log_error = (
                    html.escape(str(row.log_error))
                    if row.log_error is not None
                    else "-"
                )

                planned_intent_id = (
                    str(row.planned_intent_id)
                    if row.planned_intent_id is not None
                    else "-"
                )

                step_status = (
                    row.status
                    if row.status
                    else "UNKNOWN"
                )

                # --------------------------------------------------
                # Step HTML
                # --------------------------------------------------

                steps_html += f"""

                    <tr>

                        <td>

                            <strong>
                                {step_number}
                            </strong>

                            <br>

                            <small>
                                ID: {row.id}
                            </small>

                        </td>


                        <td>
                            {planned_intent_id}
                        </td>


                        <td>
                            {action}
                        </td>


                        <td class="target">
                            {target}
                        </td>


                        <td class="value">
                            {value}
                        </td>


                        <td>
                            {status_html(
                    step_status
                )}
                        </td>


                        <td>
                            {screenshot_html}
                        </td>


                        <td class="log-error">
                            {log_error}
                        </td>

                    </tr>

                """

            # ------------------------------------------------------
            # Testcase
            # ------------------------------------------------------

            testcase_html += f"""

                <div class="testcase">

                    <div
                        class="testcase-header"
                        onclick="toggleTestcase(
                            {index}
                        )"
                    >

                        <div class="testcase-title">

                            <span
                                class="arrow"
                                id="arrow-{index}"
                            >
                                ▶
                            </span>


                            <div>

                                <div class="testcase-id">

                                    Execution ID:
                                    {execution_id}

                                </div>


                                <div
                                    class="testcase-meta"
                                >

                                    Data Row:
                                    {data_row_id}

                                    &nbsp; | &nbsp;

                                    Session:

                                    {html.escape(
                str(session_id)
            )}

                                </div>

                            </div>

                        </div>


                        <div>

                            {status_html(
                testcase_status
            )}

                        </div>

                    </div>


                    <div
                        class="testcase-body"
                        id="body-{index}"
                    >

                        <div
                            class="session-info"
                        >

                            <strong>
                                Execution ID:
                            </strong>

                            {execution_id}

                            &nbsp;&nbsp;


                            <strong>
                                Data Row:
                            </strong>

                            {data_row_id}

                            &nbsp;&nbsp;


                            <strong>
                                Session:
                            </strong>

                            {html.escape(
                str(session_id)
            )}

                        </div>


                        <div
                            class="table-container"
                        >

                            <table class="steps">

                                <thead>

                                    <tr>

                                        <th>
                                            Step
                                        </th>

                                        <th>
                                            Planned Step
                                        </th>

                                        <th>
                                            Action
                                        </th>

                                        <th>
                                            Target
                                        </th>

                                        <th>
                                            Value
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Screenshot
                                        </th>

                                        <th>
                                            Log / Error
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {steps_html}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

            """

        # ==========================================================
        # 11. Final HTML
        # ==========================================================

        html_content = f"""

<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<title>
    {html.escape(suite.suite_name)}
    - Execution Report
</title>


<style>

* {{
    box-sizing: border-box;
}}


body {{

    margin: 0;

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    background: #f5f7fa;

    color: #1f2937;
}}


.container {{

    max-width: 1500px;

    margin: 30px auto;

    padding: 0 20px;
}}


.header {{

    background: white;

    border-radius: 10px;

    padding: 25px;

    margin-bottom: 20px;

    box-shadow:
        0 2px 8px rgba(0,0,0,0.08);
}}


.header h1 {{

    margin: 0 0 10px 0;

    font-size: 28px;
}}


.metadata {{

    color: #6b7280;

    font-size: 14px;

    line-height: 1.8;
}}


.summary {{

    display: grid;

    grid-template-columns:
        repeat(5, 1fr);

    gap: 15px;

    margin-bottom: 25px;
}}


.summary-card {{

    background: white;

    border-radius: 10px;

    padding: 20px;

    box-shadow:
        0 2px 8px rgba(0,0,0,0.06);
}}


.summary-title {{

    font-size: 13px;

    color: #6b7280;

    margin-bottom: 8px;
}}


.summary-value {{

    font-size: 28px;

    font-weight: bold;
}}


.status {{

    display: inline-block;

    padding: 5px 12px;

    border-radius: 20px;

    font-size: 12px;

    font-weight: bold;
}}


.passed {{

    background: #dcfce7;

    color: #166534;
}}


.failed {{

    background: #fee2e2;

    color: #991b1b;
}}


.skipped {{

    background: #fef3c7;

    color: #92400e;
}}


.partial {{

    background: #fef3c7;

    color: #92400e;
}}


.running {{

    background: #dbeafe;

    color: #1e40af;
}}


.testcase {{

    background: white;

    border-radius: 10px;

    margin-bottom: 15px;

    box-shadow:
        0 2px 8px rgba(0,0,0,0.06);

    overflow: hidden;
}}


.testcase-header {{

    padding: 18px 20px;

    display: flex;

    justify-content: space-between;

    align-items: center;

    cursor: pointer;

    border-bottom:
        1px solid #e5e7eb;
}}


.testcase-header:hover {{

    background: #f9fafb;
}}


.testcase-title {{

    display: flex;

    align-items: center;

    gap: 15px;
}}


.arrow {{

    font-size: 16px;

    transition:
        transform 0.2s;
}}


.arrow.open {{

    transform:
        rotate(90deg);
}}


.testcase-id {{

    font-weight: bold;

    font-size: 16px;
}}


.testcase-meta {{

    color: #6b7280;

    font-size: 13px;

    margin-top: 5px;
}}


.testcase-body {{

    display: none;

    padding: 20px;
}}


.testcase-body.open {{

    display: block;
}}


.session-info {{

    padding: 12px;

    background: #f9fafb;

    border-radius: 6px;

    margin-bottom: 15px;

    font-size: 13px;

    word-break: break-all;
}}


.table-container {{

    overflow-x: auto;
}}


.steps {{

    width: 100%;

    border-collapse:
        collapse;

    min-width: 1100px;
}}


.steps th {{

    background: #f3f4f6;

    padding: 11px;

    text-align: left;

    font-size: 12px;

    color: #4b5563;
}}


.steps td {{

    padding: 11px;

    border-top:
        1px solid #e5e7eb;

    vertical-align: top;

    font-size: 13px;
}}


.target {{

    max-width: 250px;

    word-break: break-word;
}}


.value {{

    max-width: 200px;

    word-break: break-word;
}}


.log-error {{

    max-width: 350px;

    white-space: pre-wrap;

    word-break: break-word;
}}


.screenshot {{

    width: 110px;

    height: 75px;

    object-fit: cover;

    border-radius: 5px;

    border:
        1px solid #d1d5db;

    cursor: pointer;
}}


.screenshot:hover {{

    opacity: 0.8;
}}


.modal {{

    display: none;

    position: fixed;

    z-index: 9999;

    left: 0;

    top: 0;

    width: 100%;

    height: 100%;

    background:
        rgba(0,0,0,0.85);

    align-items: center;

    justify-content: center;
}}


.modal img {{

    max-width: 90%;

    max-height: 90%;

    object-fit: contain;
}}


.modal-close {{

    position: absolute;

    top: 20px;

    right: 30px;

    color: white;

    font-size: 40px;

    cursor: pointer;
}}


@media (max-width: 1000px) {{

    .summary {{

        grid-template-columns:
            repeat(2, 1fr);
    }}

}}


@media (max-width: 600px) {{

    .summary {{

        grid-template-columns: 1fr;
    }}

}}

</style>

</head>


<body>


<div class="container">


<!-- =====================================================
     HEADER
====================================================== -->

<div class="header">

    <h1>

        {html.escape(suite.suite_name)}

        - Test Execution Report

    </h1>


    <div class="metadata">

        <strong>
            Suite ID:
        </strong>

        {suite.id}

        &nbsp;&nbsp;|&nbsp;&nbsp;


        <strong>
            Suite Execution ID:
        </strong>

        {suite_execution.id}

        &nbsp;&nbsp;|&nbsp;&nbsp;


        <strong>
            Batch Session:
        </strong>

        {html.escape(batch_session_id)}

        <br>


        <strong>
            Suite Status:
        </strong>

        {status_html(
            suite_execution.status
        )}

    </div>

</div>


<!-- =====================================================
     SUMMARY
====================================================== -->

<div class="summary">


    <div class="summary-card">

        <div class="summary-title">
            Testcases
        </div>

        <div class="summary-value">
            {total_testcases}
        </div>

    </div>


    <div class="summary-card">

        <div class="summary-title">
            Total Steps
        </div>

        <div class="summary-value">
            {total_steps}
        </div>

    </div>


    <div class="summary-card">

        <div class="summary-title">
            Passed
        </div>

        <div class="summary-value">
            {passed_testcases}
        </div>

    </div>


    <div class="summary-card">

        <div class="summary-title">
            Failed
        </div>

        <div class="summary-value">
            {failed_testcases}
        </div>

    </div>


    <div class="summary-card">

        <div class="summary-title">
            Skipped
        </div>

        <div class="summary-value">
            {skipped_testcases}
        </div>

    </div>

</div>


<!-- =====================================================
     TESTCASES
====================================================== -->

{testcase_html}


</div>


<!-- =====================================================
     IMAGE MODAL
====================================================== -->

<div
    class="modal"
    id="imageModal"
>

    <span
        class="modal-close"
        onclick="closeImage()"
    >
        &times;
    </span>


    <img
        id="modalImage"
        src=""
        alt="Screenshot"
    >

</div>


<script>


function toggleTestcase(index)
{{

    const body =
        document.getElementById(
            "body-" + index
        );

    const arrow =
        document.getElementById(
            "arrow-" + index
        );


    body.classList.toggle("open");

    arrow.classList.toggle("open");

}}


function showImage(src)
{{

    document.getElementById(
        "modalImage"
    ).src = src;


    document.getElementById(
        "imageModal"
    ).style.display = "flex";

}}


function closeImage()
{{

    document.getElementById(
        "imageModal"
    ).style.display = "none";

}}


</script>


</body>

</html>

"""

        return HTMLResponse(
            content=html_content,
            status_code=200
        )

    except HTTPException:

        raise

    except Exception as e:

        print(
            "Error generating suite report:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        db.close()


# @app.get("/test-suites/{suite_id}/report/json")
# def get_suite_json_report(
#         suite_id: int,
#         suite_execution_id: Optional[int] = None
# ):
#
#     db = SessionLocal()
#
#     try:
#
#         # ==========================================================
#         # 1. Get Suite
#         # ==========================================================
#
#         suite = (
#             db.query(TestSuite)
#             .filter(
#                 TestSuite.id == suite_id
#             )
#             .first()
#         )
#
#         if not suite:
#
#             raise HTTPException(
#                 status_code=404,
#                 detail=f"Suite {suite_id} not found"
#             )
#
#         # ==========================================================
#         # 2. Get Suite Execution
#         #
#         # Specific execution if supplied,
#         # otherwise latest execution
#         # ==========================================================
#
#         query = (
#             db.query(SuiteExecution)
#             .filter(
#                 SuiteExecution.suite_id == suite_id
#             )
#         )
#
#         if suite_execution_id is not None:
#
#             query = query.filter(
#                 SuiteExecution.id ==
#                 suite_execution_id
#             )
#
#         suite_execution = (
#             query
#             .order_by(
#                 SuiteExecution.created_at.desc()
#             )
#             .first()
#         )
#
#         if not suite_execution:
#
#             raise HTTPException(
#                 status_code=404,
#                 detail=(
#                     f"No execution found for "
#                     f"suite {suite_id}"
#                 )
#             )
#
#         # ==========================================================
#         # 3. Batch Session ID
#         # ==========================================================
#
#         batch_session_id = (
#             suite_execution.batch_session_id
#         )
#
#         # ==========================================================
#         # 4. Get execution steps
#         # ==========================================================
#
#         rows = (
#             db.query(SuiteExecutionStep)
#             .filter(
#                 SuiteExecutionStep.batch_session_id ==
#                 batch_session_id
#             )
#             .order_by(
#                 SuiteExecutionStep.execution_id.asc(),
#                 SuiteExecutionStep.data_row_id.asc(),
#                 SuiteExecutionStep.id.asc()
#             )
#             .all()
#         )
#
#         # ==========================================================
#         # 5. Build testcase hierarchy
#         # ==========================================================
#
#         testcase_map = {}
#
#         for row in rows:
#
#             key = (
#                 row.execution_id,
#                 row.data_row_id,
#                 row.session_id
#             )
#
#             if key not in testcase_map:
#
#                 testcase_map[key] = {
#
#                     "execution_id":
#                         row.execution_id,
#
#                     "data_row_id":
#                         row.data_row_id,
#
#                     "session_id":
#                         row.session_id,
#
#                     "status":
#                         "PASSED",
#
#                     "steps": []
#
#                 }
#
#             # ------------------------------------------------------
#             # Add step
#             # ------------------------------------------------------
#
#             testcase_map[key]["steps"].append({
#
#                 "step_id":
#                     row.id,
#
#                 "planned_intent_id":
#                     row.planned_intent_id,
#
#                 "action":
#                     row.action,
#
#                 "target":
#                     row.target,
#
#                 "value":
#                     row.value,
#
#                 "status":
#                     row.status,
#
#                 "screenshot":
#                     row.screenshot,
#
#                 "log_error":
#                     row.log_error,
#
#                 "created_at": (
#                     row.created_at.isoformat()
#                     if row.created_at
#                     else None
#                 )
#
#             })
#
#             # ------------------------------------------------------
#             # Determine testcase status
#             # ------------------------------------------------------
#
#             if (
#                 row.status
#                 and row.status.lower() == "failed"
#             ):
#
#                 testcase_map[key]["status"] = "FAILED"
#
#             elif (
#                 row.status
#                 and row.status.lower() == "skipped"
#                 and testcase_map[key]["status"] != "FAILED"
#             ):
#
#                 testcase_map[key]["status"] = "SKIPPED"
#
#         # ==========================================================
#         # 6. Convert map to list
#         # ==========================================================
#
#         testcases = list(
#             testcase_map.values()
#         )
#
#         # ==========================================================
#         # 7. Calculate summary
#         # ==========================================================
#
#         total_testcases = len(testcases)
#
#         total_steps = len(rows)
#
#         passed_testcases = sum(
#             1
#             for testcase in testcases
#             if testcase["status"] == "PASSED"
#         )
#
#         failed_testcases = sum(
#             1
#             for testcase in testcases
#             if testcase["status"] == "FAILED"
#         )
#
#         skipped_testcases = sum(
#             1
#             for testcase in testcases
#             if testcase["status"] == "SKIPPED"
#         )
#
#         # ==========================================================
#         # 8. Determine report status
#         # ==========================================================
#
#         if failed_testcases > 0:
#
#             report_status = "FAILED"
#
#         elif skipped_testcases > 0:
#
#             report_status = "PARTIAL"
#
#         elif total_testcases == 0:
#
#             # If execution is still running
#             # and no steps have been stored yet
#
#             if suite_execution.status == "RUNNING":
#
#                 report_status = "RUNNING"
#
#             else:
#
#                 report_status = (
#                     suite_execution.status
#                     or "UNKNOWN"
#                 )
#
#         else:
#
#             report_status = "PASSED"
#
#         # ==========================================================
#         # 9. Return JSON
#         # ==========================================================
#
#         return {
#
#             # ------------------------------------------------------
#             # Suite
#             # ------------------------------------------------------
#
#             "suite": {
#
#                 "suite_id":
#                     suite.id,
#
#                 "suite_name":
#                     suite.suite_name,
#
#                 "description":
#                     suite.description,
#
#                 "status":
#                     suite.status
#
#             },
#
#             # ------------------------------------------------------
#             # Suite Execution
#             # ------------------------------------------------------
#
#             "suite_execution": {
#
#                 "suite_execution_id":
#                     suite_execution.id,
#
#                 "batch_session_id":
#                     batch_session_id,
#
#                 "status":
#                     suite_execution.status,
#
#                 "report_status":
#                     report_status,
#
#                 "total_testcases":
#                     suite_execution.total_testcases,
#
#                 "actual_testcases":
#                     total_testcases,
#
#                 "started_at": (
#                     suite_execution.started_at.isoformat()
#                     if suite_execution.started_at
#                     else None
#                 ),
#
#                 "completed_at": (
#                     suite_execution.completed_at.isoformat()
#                     if suite_execution.completed_at
#                     else None
#                 ),
#
#                 "created_at": (
#                     suite_execution.created_at.isoformat()
#                     if suite_execution.created_at
#                     else None
#                 )
#
#             },
#
#             # ------------------------------------------------------
#             # Summary
#             # ------------------------------------------------------
#
#             "summary": {
#
#                 "total_testcases":
#                     total_testcases,
#
#                 "total_steps":
#                     total_steps,
#
#                 "passed":
#                     passed_testcases,
#
#                 "failed":
#                     failed_testcases,
#
#                 "skipped":
#                     skipped_testcases
#
#             },
#
#             # ------------------------------------------------------
#             # Testcases
#             # ------------------------------------------------------
#
#             "testcases":
#                 testcases
#
#         }
#
#     except HTTPException:
#
#         raise
#
#     except Exception as e:
#
#         print(
#             "Error generating suite JSON report:",
#             e
#         )
#
#         raise HTTPException(
#             status_code=500,
#             detail=str(e)
#         )
#
#     finally:
#
#         db.close()
@app.get("/test-suites/{suite_id}/report/json")
def get_suite_json_report(
        suite_id: int,
        suite_execution_id: Optional[int] = None,
        screenshot_mode: Literal[
            "none",
            "failed",
            "all"
        ] = "failed"
):
    db = SessionLocal()

    try:

        return build_suite_execution_report(
            db=db,
            suite_id=suite_id,
            suite_execution_id=suite_execution_id,
            screenshot_mode=screenshot_mode
        )

    finally:

        db.close()


def get_execution_summary(intent_value):
    """
    Extract summary from OriginalIntent.intent.

    If intent_value contains JSON:
        {"summary": "...", ...}

    return only the summary.

    If it is normal text, return it as-is.
    """

    if not intent_value:
        return None

    # Already a dictionary
    if isinstance(intent_value, dict):
        return intent_value.get(
            "summary",
            str(intent_value)
        )

    # JSON stored as string
    if isinstance(intent_value, str):

        try:

            parsed = json.loads(intent_value)

            if isinstance(parsed, dict):
                return parsed.get(
                    "summary",
                    intent_value
                )

        except (json.JSONDecodeError, TypeError):

            # Normal text, not JSON
            pass

        return intent_value

    return str(intent_value)


def build_suite_execution_report(
        db,
        suite_id: int,
        suite_execution_id: Optional[int] = None,
        screenshot_mode: str = "failed"
):
    if screenshot_mode not in (
            "none",
            "failed",
            "all"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid screenshot_mode. "
                "Allowed values: none, failed, all"
            )
        )
    # ==========================================================
    # 1. Get Suite
    # ==========================================================

    suite = (
        db.query(TestSuite)
        .filter(
            TestSuite.id == suite_id
        )
        .first()
    )

    if not suite:
        raise HTTPException(
            status_code=404,
            detail=f"Suite {suite_id} not found"
        )

    # ==========================================================
    # 2. Get Suite Execution
    # ==========================================================

    query = (
        db.query(SuiteExecution)
        .filter(
            SuiteExecution.suite_id == suite_id
        )
    )

    if suite_execution_id is not None:
        query = query.filter(
            SuiteExecution.id ==
            suite_execution_id
        )

    suite_execution = (
        query
        .order_by(
            SuiteExecution.created_at.desc()
        )
        .first()
    )

    if not suite_execution:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No execution found for "
                f"suite {suite_id}"
            )
        )

    batch_session_id = (
        suite_execution.batch_session_id
    )

    # ==========================================================
    # 3. Get execution steps
    # ==========================================================

    rows = (
        db.query(SuiteExecutionStep)
        .filter(
            SuiteExecutionStep.batch_session_id ==
            batch_session_id
        )
        .order_by(
            SuiteExecutionStep.execution_id.asc(),
            SuiteExecutionStep.data_row_id.asc(),
            SuiteExecutionStep.id.asc()
        )
        .all()
    )

    # ==========================================================
    # 4. Collect all IDs
    # ==========================================================

    execution_ids = {
        row.execution_id
        for row in rows
        if row.execution_id is not None
    }

    planned_intent_ids = {
        row.planned_intent_id
        for row in rows
        if row.planned_intent_id is not None
    }

    # ==========================================================
    # 5. Fetch OriginalIntent values
    #
    # execution_id -> actual intent
    # ==========================================================

    execution_map = {}

    if execution_ids:
        original_intents = (
            db.query(OriginalIntent)
            .filter(
                OriginalIntent.id.in_(
                    execution_ids
                )
            )
            .all()
        )

        execution_map = {
            item.id: get_execution_summary(item.intent)
            for item in original_intents
        }

    # ==========================================================
    # 6. Fetch PlannedIntent values
    #
    # planned_intent_id -> actual planned intent
    # ==========================================================

    planned_intent_map = {}

    if planned_intent_ids:
        planned_intents = (
            db.query(PlannedIntent)
            .filter(
                PlannedIntent.id.in_(
                    planned_intent_ids
                )
            )
            .all()
        )

        planned_intent_map = {
            item.id: item.intent
            for item in planned_intents
        }

    # ==========================================================
    # 7. Build testcase hierarchy
    # ==========================================================

    testcase_map = {}

    for row in rows:

        key = (
            row.execution_id,
            row.data_row_id,
            row.session_id
        )

        if key not in testcase_map:
            testcase_map[key] = {

                # ------------------------------------------------
                # Internal ID
                # ------------------------------------------------

                "execution_id":
                    row.execution_id,

                # ------------------------------------------------
                # Actual business intent
                # ------------------------------------------------

                "execution_intent":
                    execution_map.get(
                        row.execution_id,
                        f"Execution {row.execution_id}"
                    ),

                "data_row_id":
                    row.data_row_id,

                "session_id":
                    row.session_id,

                "status":
                    "PASSED",

                "steps": []

            }

        # ======================================================
        # Actual Planned Intent
        # ======================================================

        planned_intent = (
            planned_intent_map.get(
                row.planned_intent_id,
                (
                    f"Planned Step "
                    f"{row.planned_intent_id}"
                )
                if row.planned_intent_id
                else None
            )
        )

        # ======================================================
        # Add Step
        # ======================================================
        screenshot_value = None

        if screenshot_mode == "all":

            # screenshot_value = row.screenshot
            screenshot_value = compress_base64_image(
                row.screenshot,
                max_width=1280,
                quality=60
            )

        elif screenshot_mode == "failed":

            if (
                    row.status
                    and row.status.lower() == "failed"
            ):
                # screenshot_value = row.screenshot
                screenshot_value = compress_base64_image(
                    row.screenshot,
                    max_width=1280,
                    quality=60
                )

        elif screenshot_mode == "none":

            screenshot_value = None

        testcase_map[key]["steps"].append({

            # Keep internal ID available if needed
            "step_id":
                row.id,

            "planned_intent_id":
                row.planned_intent_id,

            # Actual planned intent
            "planned_intent":
                planned_intent,

            "action":
                row.action,

            "target":
                row.target,

            "value":
                row.value,

            "status":
                row.status,

            "screenshot":
                screenshot_value,

            "log_error":
                row.log_error,

            "created_at": (
                row.created_at.isoformat()
                if row.created_at
                else None
            )

        })

        # ======================================================
        # Determine testcase status
        # ======================================================

        if (
                row.status
                and row.status.lower() == "failed"
        ):

            testcase_map[key]["status"] = "FAILED"

        elif (
                row.status
                and row.status.lower() == "skipped"
                and testcase_map[key]["status"] != "FAILED"
        ):

            testcase_map[key]["status"] = "SKIPPED"

    # ==========================================================
    # 8. Convert to list
    # ==========================================================

    testcases = list(
        testcase_map.values()
    )

    # ==========================================================
    # 9. Summary
    # ==========================================================

    total_testcases = len(testcases)

    total_steps = len(rows)

    passed_testcases = sum(
        1
        for testcase in testcases
        if testcase["status"] == "PASSED"
    )

    failed_testcases = sum(
        1
        for testcase in testcases
        if testcase["status"] == "FAILED"
    )

    skipped_testcases = sum(
        1
        for testcase in testcases
        if testcase["status"] == "SKIPPED"
    )

    # ==========================================================
    # 10. Report status
    # ==========================================================

    if failed_testcases > 0:

        report_status = "FAILED"

    elif skipped_testcases > 0:

        report_status = "PARTIAL"

    elif total_testcases == 0:

        report_status = (
                suite_execution.status
                or "UNKNOWN"
        )

    else:

        report_status = "PASSED"

    # ==========================================================
    # 11. Final report object
    # ==========================================================

    return {

        "suite": {

            "suite_id":
                suite.id,

            "suite_name":
                suite.suite_name,

            "description":
                suite.description,

            "status":
                suite.status

        },

        "suite_execution": {

            "suite_execution_id":
                suite_execution.id,

            "batch_session_id":
                batch_session_id,

            "status":
                suite_execution.status,

            "report_status":
                report_status,

            "total_testcases":
                suite_execution.total_testcases,

            "actual_testcases":
                total_testcases,

            "started_at": (
                suite_execution.started_at.isoformat()
                if suite_execution.started_at
                else None
            ),

            "completed_at": (
                suite_execution.completed_at.isoformat()
                if suite_execution.completed_at
                else None
            ),

            "created_at": (
                suite_execution.created_at.isoformat()
                if suite_execution.created_at
                else None
            )

        },

        "summary": {

            "total_testcases":
                total_testcases,

            "total_steps":
                total_steps,

            "passed":
                passed_testcases,

            "failed":
                failed_testcases,

            "skipped":
                skipped_testcases

        },

        "testcases":
            testcases
    }


if __name__ == "__main__":
    uvicorn.run(
        "main2:app",  # 👈 IMPORTANT: pass as string (module:app)
        host="0.0.0.0",
        port=6666,
        loop="asyncio"  # match your CLI
    )