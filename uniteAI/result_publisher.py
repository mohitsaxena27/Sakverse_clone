import requests
import base64
from requests.auth import HTTPBasicAuth


class AzureDevOpsTestPublisher:

    def __init__(self, org_url, project, username, pat):
        """
        org_url: https://dev.azure.com/ashwanis0547/Demo%20Project
        project: Demo Project
        username: ashwanis@saksoft.com
        """
        self.org_url = org_url.rstrip("/")
        self.project = project
        self.auth = HTTPBasicAuth(username, pat)
        self.headers_json = {"Content-Type": "application/json"}
        self.api_version = "7.0"

    # -------------------------------------------------------
    # 1️⃣ Get Test Point ID
    # -------------------------------------------------------
    def get_test_point_id(self, test_case_id, test_plan_id, test_suite_id):

        url = (
            f"{self.org_url}/{self.project}/_apis/test/"
            f"Plans/{test_plan_id}/Suites/{test_suite_id}/points"
            f"?api-version=7.0"
        )

        response = requests.get(url, auth=self.auth)
        data = response.json().get("value", [])

        for point in data:
            if int(point["testCase"]["id"]) == int(test_case_id):
                return point["id"]

        raise Exception("Test Case not found in given Plan/Suite")

    # -------------------------------------------------------
    # 2️⃣ Create Test Run
    # -------------------------------------------------------
    def create_test_run(self, test_plan_id, test_point_id, run_name="Automated Run"):
        url = f"{self.org_url}/{self.project}/_apis/test/runs?api-version={self.api_version}"

        payload = {
            "name": run_name,
            "plan": {"id": test_plan_id},
            "pointIds": [test_point_id],
            "automated": True
        }

        response = requests.post(url, json=payload, auth=self.auth)

        if response.status_code not in [200, 201]:
            raise Exception(f"Failed to create test run: {response.text}")
        print("RUN CREATED RESPONSE:")
        print(response.json())
        return response.json()["id"]

    # -------------------------------------------------------
    # 3️⃣ Get Result ID from Run
    # -------------------------------------------------------
    def get_result_id(self, run_id):
        url = (
            f"{self.org_url}/{self.project}/_apis/test/runs/"
            f"{run_id}/results?api-version={self.api_version}"
        )

        response = requests.get(url, auth=self.auth)

        if response.status_code != 200:
            raise Exception(f"Failed to fetch results: {response.text}")

        results = response.json().get("value", [])

        if not results:
            raise Exception("No results found in run")

        return results[0]["id"]

    # -------------------------------------------------------
    # 4️⃣ Update Test Result (Pass / Fail)
    # -------------------------------------------------------
    def update_test_result(self, run_id, result_id, outcome, comment=""):
        """
        outcome: Passed | Failed | Blocked | NotExecuted
        """
        url = (
            f"{self.org_url}/{self.project}/_apis/test/runs/"
            f"{run_id}/results?api-version={self.api_version}"
        )

        payload = [
            {
                "id": result_id,
                "outcome": outcome,
                "comment": comment
            }
        ]

        response = requests.patch(url, json=payload, auth=self.auth)

        if response.status_code not in [200]:
            raise Exception(f"Failed to update result: {response.text}")

    # -------------------------------------------------------
    # 5️⃣ Attach File to Result
    # -------------------------------------------------------
    def attach_file_to_result(self, run_id, result_id, file_path, comment="Attachment"):

        with open(file_path, "rb") as f:
            encoded_content = base64.b64encode(f.read()).decode("utf-8")

        url = (
            f"{self.org_url}/{self.project}/_apis/test/Runs/"
            f"{run_id}/Results/{result_id}/attachments"
            f"?api-version=7.0-preview.1"
        )

        payload = {
            "stream": encoded_content,
            "fileName": file_path.split("/")[-1],
            "comment": comment,
            "attachmentType": "GeneralAttachment"
        }

        response = requests.post(url, json=payload, auth=self.auth)

        if response.status_code not in [200, 201]:
            raise Exception(f"Failed to upload attachment: {response.text}")

    # -------------------------------------------------------
    # 🚀 MASTER METHOD
    # -------------------------------------------------------
    def publish_test_result(
            self,
            test_case_id,
            test_suite_id,
            test_plan_id,
            outcome,
            comment="",
            attachment_path=None,
            run_name="Automated Execution"
    ):
        """
        Main method to publish execution result
        """

        print("Fetching Test Point ID...")
        point_id = self.get_test_point_id(test_case_id, test_plan_id, test_suite_id)
        print("Fetching Test Point ID...",point_id)

        print("Creating Test Run...")
        run_id = self.create_test_run(test_plan_id, point_id, run_name)

        print("Fetching Result ID...")
        result_id = self.get_result_id(run_id)

        print("Updating Test Result...")
        self.update_test_result(run_id, result_id, outcome, comment)

        if attachment_path:
            print("Uploading Attachment...")
            self.attach_file_to_result(run_id, result_id, attachment_path)

        print("Execution Published Successfully ✅")
        self.update_test_point_outcome(
            test_plan_id,
            test_suite_id,
            point_id,
            outcome
        )
        self.complete_test_run(run_id)
        print("Marked Execution Completed ✅")
        return {
            "run_id": run_id,
            "result_id": result_id,
            "outcome": outcome
        }

    def complete_test_run(self, run_id):

        url = (
            f"{self.org_url}/{self.project}/_apis/test/runs/"
            f"{run_id}?api-version={self.api_version}"
        )

        payload = {
            "state": "Completed"
        }

        response = requests.patch(url, json=payload, auth=self.auth)

        if response.status_code not in [200]:
            raise Exception(f"Failed to complete test run: {response.text}")

    def update_test_point_outcome(self, test_plan_id, test_suite_id, test_point_id, outcome):

        url = (
            f"{self.org_url}/{self.project}/_apis/test/Plans/"
            f"{test_plan_id}/Suites/{test_suite_id}/points/"
            f"{test_point_id}?api-version=7.0"
        )

        payload = {
            "outcome": outcome
        }

        response = requests.patch(url, json=payload, auth=self.auth)

        if response.status_code not in [200]:
            raise Exception(f"Failed to update test point: {response.text}")

# # ##############################################
# import requests
# import base64
# from requests.auth import HTTPBasicAuth
#
#
# class AzureDevOpsTestPublisher:
#
#     def __init__(self, org_url, project, username, pat):
#         self.org_url = org_url.rstrip("/")
#         self.project = project
#         self.auth = HTTPBasicAuth(username, pat)
#         self.api_version = "7.0"
#
#     # -------------------------------------------------------
#     # 1️⃣ Get Test Point ID
#     # -------------------------------------------------------
#     def get_test_point_id(self, test_case_id, test_plan_id, test_suite_id):
#
#         url = (
#             f"{self.org_url}/{self.project}/_apis/test/"
#             f"Plans/{test_plan_id}/Suites/{test_suite_id}/points"
#             f"?api-version={self.api_version}"
#         )
#
#         response = requests.get(url, auth=self.auth)
#
#         if response.status_code != 200:
#             raise Exception(f"Failed to fetch test point: {response.text}")
#
#         points = response.json().get("value", [])
#
#         for point in points:
#             if int(point["testCase"]["id"]) == int(test_case_id):
#                 return point["id"]
#
#         raise Exception("Test Case not found in given Plan/Suite")
#
#     # -------------------------------------------------------
#     # 2️⃣ Create Automated Test Run (CI Style)
#     # -------------------------------------------------------
#     # def create_test_run(self, test_plan_id, run_name="CI Automated Run"):
#     #
#     #     url = f"{self.org_url}/{self.project}/_apis/test/runs?api-version={self.api_version}"
#     #
#     #     payload = {
#     #         "name": run_name,
#     #         "plan": {"id": test_plan_id},
#     #         "automated": True,
#     #         "state": "InProgress"
#     #     }
#     #
#     #     response = requests.post(url, json=payload, auth=self.auth)
#     #
#     #     if response.status_code not in [200, 201]:
#     #         raise Exception(f"Failed to create run: {response.text}")
#     #
#     #     run_data = response.json()
#     #     print("Run Created:", run_data["id"])
#     #
#     #     return run_data["id"]
#     def create_test_run(self, run_name="CI Automated Run"):
#
#         url = f"{self.org_url}/{self.project}/_apis/test/runs?api-version=7.0"
#
#         payload = {
#             "name": run_name,
#             "automated": True,
#             "state": "InProgress"
#         }
#
#         response = requests.post(url, json=payload, auth=self.auth)
#
#         if response.status_code not in [200, 201]:
#             raise Exception(f"Failed to create run: {response.text}")
#
#         return response.json()["id"]
#
#     # -------------------------------------------------------
#     # 3️⃣ POST Result (Force New Execution Entry)
#     # -------------------------------------------------------
#     def add_test_result(self, run_id, test_point_id, outcome, comment=""):
#
#         url = (
#             f"{self.org_url}/{self.project}/_apis/test/runs/"
#             f"{run_id}/results?api-version={self.api_version}"
#         )
#
#         payload = [
#             {
#                 "testPoint": {"id": test_point_id},
#                 "outcome": outcome,
#                 "state": "Completed",
#                 "comment": comment
#             }
#         ]
#
#         response = requests.post(url, json=payload, auth=self.auth)
#
#         if response.status_code not in [200, 201]:
#             raise Exception(f"Failed to add result: {response.text}")
#
#         result_data = response.json()["value"][0]
#         print("Result Added:", result_data["id"])
#
#         return result_data["id"]
#
#     # -------------------------------------------------------
#     # 4️⃣ Attach Evidence
#     # -------------------------------------------------------
#     def attach_file_to_result(self, run_id, result_id, file_path, comment="Attachment"):
#
#         with open(file_path, "rb") as f:
#             encoded_content = base64.b64encode(f.read()).decode("utf-8")
#
#         url = (
#             f"{self.org_url}/{self.project}/_apis/test/Runs/"
#             f"{run_id}/Results/{result_id}/attachments"
#             f"?api-version=7.0-preview.1"
#         )
#
#         payload = {
#             "stream": encoded_content,
#             "fileName": file_path.split("/")[-1],
#             "comment": comment,
#             "attachmentType": "GeneralAttachment"
#         }
#
#         response = requests.post(url, json=payload, auth=self.auth)
#
#         if response.status_code not in [200, 201]:
#             raise Exception(f"Failed to upload attachment: {response.text}")
#
#         print("Attachment Uploaded")
#
#     # -------------------------------------------------------
#     # 5️⃣ Complete Run
#     # -------------------------------------------------------
#     def complete_test_run(self, run_id):
#
#         url = (
#             f"{self.org_url}/{self.project}/_apis/test/runs/"
#             f"{run_id}?api-version={self.api_version}"
#         )
#
#         payload = {"state": "Completed"}
#
#         response = requests.patch(url, json=payload, auth=self.auth)
#
#         if response.status_code != 200:
#             raise Exception(f"Failed to complete run: {response.text}")
#
#         print("Run Completed")
#
#     # -------------------------------------------------------
#     # 🚀 MASTER METHOD
#     # -------------------------------------------------------
#     def publish_test_result(
#         self,
#         test_case_id,
#         test_suite_id,
#         test_plan_id,
#         outcome,
#         comment="",
#         attachment_path=None,
#         run_name="CI Automated Run"
#     ):
#
#         print("Fetching Test Point...")
#         point_id = self.get_test_point_id(test_case_id, test_plan_id, test_suite_id)
#
#         print("Creating Run...")
#         # run_id = self.create_test_run(test_plan_id, run_name)
#         run_id = self.create_test_run(run_name)
#
#         print("Posting Result...")
#         result_id = self.add_test_result(run_id, point_id, outcome, comment)
#
#         if attachment_path:
#             print("Uploading Attachment...")
#             self.attach_file_to_result(run_id, result_id, attachment_path)
#
#         print("Completing Run...")
#         self.complete_test_run(run_id)
#
#         print("Execution Published Successfully ✅")
#
#         return {
#             "run_id": run_id,
#             "result_id": result_id,
#             "outcome": outcome
#         }
#########################################################
# import requests
# import base64
# from requests.auth import HTTPBasicAuth
#
#
# class AzureDevOpsTestPublisher:
#
#     def __init__(self, org_url, project, username, pat):
#         self.org_url = org_url.rstrip("/")
#         self.project = project
#         self.auth = HTTPBasicAuth(username, pat)
#         self.api_version = "7.0"
#
#     # -------------------------------------------------------
#     # 1️⃣ Create Independent Automated Run
#     # -------------------------------------------------------
#     def create_test_run(self, run_name):
#
#         url = f"{self.org_url}/{self.project}/_apis/test/runs?api-version={self.api_version}"
#
#         payload = {
#             "name": run_name,
#             "automated": True,
#             "state": "InProgress"
#         }
#
#         response = requests.post(url, json=payload, auth=self.auth)
#
#         if response.status_code not in [200, 201]:
#             raise Exception(f"Failed to create run: {response.text}")
#
#         run_id = response.json()["id"]
#         print("Run Created:", run_id)
#         return run_id
#
#     # -------------------------------------------------------
#     # 2️⃣ Publish Result
#     # -------------------------------------------------------
#     def add_test_result(
#         self,
#         run_id,
#         test_title,
#         automated_test_name,
#         outcome,
#         comment=""
#     ):
#
#         url = (
#             f"{self.org_url}/{self.project}/_apis/test/"
#             f"runs/{run_id}/results?api-version={self.api_version}"
#         )
#
#         payload = [
#             {
#                 "testCaseTitle": test_title,
#                 "automatedTestName": automated_test_name,
#                 "automatedTestStorage": "UNITE.Automation",
#                 "automatedTestType": "UnitTest",
#                 "outcome": outcome,
#                 "state": "Completed",
#                 "comment": comment
#             }
#         ]
#
#         response = requests.post(url, json=payload, auth=self.auth)
#
#         if response.status_code not in [200, 201]:
#             raise Exception(f"Failed to add result: {response.text}")
#
#         result_id = response.json()["value"][0]["id"]
#         print("Result Published:", result_id)
#
#         return result_id
#
#     # -------------------------------------------------------
#     # 3️⃣ Attach File
#     # -------------------------------------------------------
#     def attach_file(self, run_id, result_id, file_path, comment="Attachment"):
#
#         with open(file_path, "rb") as f:
#             encoded_content = base64.b64encode(f.read()).decode("utf-8")
#
#         url = (
#             f"{self.org_url}/{self.project}/_apis/test/"
#             f"Runs/{run_id}/Results/{result_id}/attachments"
#             f"?api-version=7.0-preview.1"
#         )
#
#         payload = {
#             "stream": encoded_content,
#             "fileName": file_path.split("/")[-1],
#             "comment": comment,
#             "attachmentType": "GeneralAttachment"
#         }
#
#         response = requests.post(url, json=payload, auth=self.auth)
#
#         if response.status_code not in [200, 201]:
#             raise Exception(f"Failed to upload attachment: {response.text}")
#
#         print("Attachment Uploaded")
#
#     # -------------------------------------------------------
#     # 4️⃣ Complete Run
#     # -------------------------------------------------------
#     def complete_run(self, run_id):
#
#         url = (
#             f"{self.org_url}/{self.project}/_apis/test/"
#             f"runs/{run_id}?api-version={self.api_version}"
#         )
#
#         payload = {"state": "Completed"}
#
#         response = requests.patch(url, json=payload, auth=self.auth)
#
#         if response.status_code != 200:
#             raise Exception(f"Failed to complete run: {response.text}")
#
#         print("Run Completed")
#
#     # -------------------------------------------------------
#     # 🚀 MASTER METHOD
#     # -------------------------------------------------------
#     def publish_test_result(
#         self,
#         test_title,
#         automated_test_name,
#         outcome,
#         comment="",
#         attachment_path=None,
#         run_name="CI Automation Run"
#     ):
#
#         run_id = self.create_test_run(run_name)
#
#         result_id = self.add_test_result(
#             run_id,
#             test_title,
#             automated_test_name,
#             outcome,
#             comment
#         )
#
#         if attachment_path:
#             self.attach_file(run_id, result_id, attachment_path)
#
#         self.complete_run(run_id)
#
#         print("CI Execution Published Successfully ✅")
#
#         return {
#             "run_id": run_id,
#             "result_id": result_id,
#             "outcome": outcome
#         }

