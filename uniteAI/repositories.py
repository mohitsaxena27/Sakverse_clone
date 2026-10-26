from sqlalchemy.orm import Session
from models import OriginalIntent, PlannedIntent


def save_original_intent(
    db: Session,
    intent: str,
    testcase_id:int,
    created_by: str = "User",
    automated:str = "PENDING",
    version:str ="V1",
    project_id:int=0
) -> OriginalIntent:
    record = OriginalIntent(
        intent=intent,
        created_by=created_by,
        automated=automated,
        testcase_id=testcase_id,
        version=version,
        project_id=project_id
    )
    db.add(record)
    db.flush()  # gets ID without commit
    return record


def save_planned_intents(
    db: Session,
    user_intent_id: int,
    plan_steps: list,
    created_by: str = "SYSTEM"

):
    planned_records = []

    for step in plan_steps:
        planned_records.append(
            PlannedIntent(
                user_intent_id=user_intent_id,
                step_type=step.get("step_type"),
                intent=step.get("intent"),
                target=step.get("target"),
                value=step.get("value"),
                created_by=created_by,
                updated_by=created_by,
                execution_status="PENDING",
                execution_order=step.get("step"),
                enabled=True

            )
        )

    db.add_all(planned_records)
    db.flush()   # 🔥 IDs are assigned here
    print("Planned records",planned_records)

    return planned_records
