import requests
import json


url = "https://app.testiny.io/api/v1/testcase/bulk"

payload = json.dumps([
  {
    "title": "A Descriptive Title for 1",
    "project_id": 1,
    "sort_index":20,
    "template": "TEXT",
    "precondition_text": "Pre text",
    "content_text": "ID from TCG",
    "steps_text": "Step text",
    "expected_result_text": "Expected text",
    "priority": 1,
    "status": "READY",
    "testcase_type": "FUNCTIONAL"
  },
{
    "title": "A Descriptive Title for 2",
    "project_id": 1,
    "sort_index":65,
    "template": "TEXT",
    "precondition_text": "Pre text",
    "content_text": "ID from TCG",
    "steps_text": "Step text",
    "expected_result_text": "Expected text",
    "priority": 1,
    "status": "READY",
    "testcase_type": "FUNCTIONAL"
  }
])
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Api-Key': 'tny_vs7ls5sPrlePqMClNILb544OsWknYEuQmbMTkBjFUmLGAvJd'
}

response = requests.request("POST", url, headers=headers, data=payload)

print(response.text)