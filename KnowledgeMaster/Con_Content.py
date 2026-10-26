from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import html2text
import os

app = FastAPI()


class SpaceRequest(BaseModel):
    space_key: str


def export_space_locally1(URL, USERNAME, PASSWORD,SPACE, manual_repo):
    URL = URL
    USERNAME = USERNAME
    PASSWORD = PASSWORD

    SPACE = SPACE
    manual_repo = manual_repo
    KNOWLEDGE_DATA_DIR = os.getenv("KNOWLEDGE_DATA_DIR", "/mnt/Knowledge_Data")
    space_folder = os.path.join(KNOWLEDGE_DATA_DIR, manual_repo)
    #space_folder = os.path.join(r"C:\Knowledge_Data", manual_repo)
    # os.makedirs(space_folder, exist_ok=True)

    AUTH = (USERNAME,
            PASSWORD)  # Use your Atlassian API token
    HEADERS = {
        "Accept": "application/json"
    }

    def fetch_page_ids(space_key):
        all_pages = []
        start = 0
        limit = 200  # safe max

        while True:
            url = (
                f"{CONFLUENCE_BASE_URL}/rest/api/content"
                f"?spaceKey={space_key}&type=page&limit={limit}&start={start}"
            )
            response = requests.get(url, auth=AUTH, headers=HEADERS)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code,
                                    detail="Failed to fetch page list")

            data = response.json()
            results = data.get('results', [])
            all_pages.extend(results)

            if '_links' in data and 'next' in data['_links']:
                start += limit
            else:
                break

        return all_pages

    # 1️⃣ Fetch all pages with ancestors and body
    url = f"{URL}/rest/api/content?spaceKey={SPACE}&type=page&expand=body.storage,version,ancestors&limit=1000"
    response = requests.get(url, auth=AUTH, headers=HEADERS)

    print("Complete URL",url)
    print("Auth Data", AUTH)
    print("HEADERS Data", HEADERS)
    print("response Data", HEADERS)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch space {SPACE}")
    all_pages = response.json().get('results', [])

    if not all_pages:
        return {"message": f"No pages found in space {SPACE}", "hierarchy": []}

    # 2️⃣ Build page dictionary
    pages_dict = {}
    for page in all_pages:
        pages_dict[page['id']] = {
            "id": page['id'],
            "title": page['title'],
            "version": page['version']['number'],
            "content": html2text.html2text(page['body']['storage']['value']),
            "children": []
        }

    # 3️⃣ Build hierarchy using ancestors
    root_tree = []

    def find_or_create_node(parent_children, page_id, ancestor_info=None):
        """
        Find node with page_id in parent_children, or create placeholder if not exists.
        Use ancestor_info title if page is missing in pages_dict.
        """
        for node in parent_children:
            if node['id'] == page_id:
                return node
        if page_id in pages_dict:
            node = pages_dict[page_id]
        else:
            title = ancestor_info['title'] if ancestor_info and 'title' in ancestor_info else "Unknown"
            node = {"id": page_id, "title": title, "version": 0, "content": "", "children": []}
        parent_children.append(node)
        return node

    # Sort pages by number of ancestors so parents come before children
    pages_sorted = sorted(all_pages, key=lambda p: len(p.get('ancestors', [])))

    for page in pages_sorted:
        ancestors = page.get('ancestors', [])
        parent_node_list = root_tree
        for ancestor in ancestors:
            ancestor_id = ancestor['id']  # Extract ID from ancestor dict
            parent_node = find_or_create_node(parent_node_list, ancestor_id, ancestor_info=ancestor)
            parent_node_list = parent_node['children']
        # Attach the page under its parent
        parent_node_list.append(pages_dict[page['id']])

    # 4️⃣ Recursive function to save Markdown files
    def save_markdown(node, folder_path, depth=0):
        safe_title = "".join(c if c.isalnum() or c in " _-" else "_" for c in node['title'])
        filename = os.path.join(folder_path, f"{safe_title}.md")
        heading_prefix = "#" * (depth + 1)
        content_to_write = f"{heading_prefix} {node['title']}\n\n{node['content']}"
        with open(filename, "w", encoding="utf-8") as f:
            f.write(content_to_write)
        for child in node['children']:
            save_markdown(child, folder_path, depth + 1)

    for root in root_tree:
        save_markdown(root, space_folder)

    # 5️⃣ Recursive function to build hierarchy JSON
    def build_hierarchy_json(node):
        return {
            "title": node['title'],
            "version": node['version'],
            "content": node['content'],
            "children": [build_hierarchy_json(child) for child in node['children']]
        }

    hierarchy = [build_hierarchy_json(root) for root in root_tree]

    return {
        "message": f"✅ Data Fetch Completed",
        "hierarchy": hierarchy
    }


def export_space_locally(URL, USERNAME, PASSWORD, SPACE, manual_repo):

    KNOWLEDGE_DATA_DIR = os.getenv("KNOWLEDGE_DATA_DIR", "/mnt/Knowledge_Data")
    space_folder = os.path.join(KNOWLEDGE_DATA_DIR, manual_repo)
    os.makedirs(space_folder, exist_ok=True)

    AUTH = (USERNAME, PASSWORD)
    HEADERS = {"Accept": "application/json"}

    # ============================================================
    # 1️⃣ STEP 1 — Fetch ALL page IDs WITHOUT expands
    # ============================================================
    def fetch_page_ids(space_key):
        all_pages = []
        start = 0
        limit = 200

        while True:
            url = (
                f"{URL}/rest/api/content"
                f"?spaceKey={space_key}&type=page&limit={limit}&start={start}"
            )

            response = requests.get(url, auth=AUTH, headers=HEADERS)
            if response.status_code != 200:
                raise Exception(f"Failed to fetch page list for space {space_key}")

            data = response.json()
            results = data.get("results", [])
            all_pages.extend(results)

            if "_links" in data and "next" in data["_links"]:
                start += limit
            else:
                break

        return all_pages

    page_meta_list = fetch_page_ids(SPACE)
    total_pages = len(page_meta_list)

    # ============================================================
    # 2️⃣ STEP 2 — Fetch each page FULLY with expand
    # ============================================================
    def fetch_full_page(page_id):
        url = (
            f"{URL}/rest/api/content/{page_id}"
            f"?expand=body.storage,version,ancestors"
        )
        r = requests.get(url, auth=AUTH, headers=HEADERS)
        if r.status_code != 200:
            print(f"⚠ Failed to fetch full page details for {page_id}")
            return None
        return r.json()

    pages_dict = {}

    for pm in page_meta_list:
        full_page = fetch_full_page(pm["id"])
        if not full_page:
            continue

        content_html = (
            full_page.get("body", {})
                     .get("storage", {})
                     .get("value", "")
        )

        content_text = (
            html2text.html2text(content_html).strip()
            if content_html else ""
        )

        pages_dict[full_page["id"]] = {
            "id": full_page["id"],
            "title": full_page["title"],
            "version": full_page["version"]["number"],
            "content": content_text,
            "ancestors": full_page.get("ancestors", []),
            "children": []
        }

    # ============================================================
    # 3️⃣ Build hierarchy (unchanged)
    # ============================================================
    root_tree = []

    def get_node(page_id):
        return pages_dict.get(page_id)

    for page_id, page_data in pages_dict.items():

        ancestors = page_data["ancestors"]
        parent_list = root_tree

        for anc in ancestors:
            anc_id = anc["id"]
            anc_node = get_node(anc_id)

            if anc_node:
                parent_list = anc_node["children"]

        parent_list.append(page_data)

    # ============================================================
    # 4️⃣ Save Markdown files — FLAT DIRECTORY (NO SUBFOLDERS)
    # ============================================================
    def save_markdown_flat(node, depth=0):

        safe_title = "".join(
            c if c.isalnum() or c in " _-" else "_" for c in node["title"]
        )
        filename = os.path.join(
            space_folder,
            f"{safe_title}_{node['id']}.md"
        )

        heading_prefix = "#" * (depth + 1)

        yaml_header = (
            f"---\n"
            f"title: \"{node['title']}\"\n"
            f"version: {node['version']}\n"
            f"id: {node['id']}\n"
            f"---\n\n"
        )

        body_text = (
            node["content"]
            if node["content"]
            else "_(No content available in Confluence page)_"
        )

        with open(filename, "w", encoding="utf-8") as f:
            f.write(f"{yaml_header}{heading_prefix} {node['title']}\n\n{body_text}")

        # DO NOT CREATE FOLDERS — all files go into space_folder
        for child in node["children"]:
            save_markdown_flat(child, depth + 1)

    # Save all root nodes into flat folder
    for root in root_tree:
        save_markdown_flat(root)

    # ============================================================
    # 5️⃣ Hierarchy JSON unchanged
    # ============================================================
    def build_hierarchy_json(node):
        return {
            "title": node["title"],
            "id": node["id"],
            "version": node["version"],
            "children": [build_hierarchy_json(c) for c in node["children"]],
        }

    hierarchy = [build_hierarchy_json(r) for r in root_tree]

    return {
        "message": "Space export completed successfully",
        "space": SPACE,
        "total_pages": total_pages,
        "exported_pages": len(pages_dict),
        "output_folder": space_folder,
        "hierarchy": hierarchy
    }

#
# @app.post("/export_space/")
# def export_space(request: SpaceRequest):
#     space_key = request.space_key
#     space_folder = space_key
#     os.makedirs(space_folder, exist_ok=True)
#
#     # 1️⃣ Fetch all pages with ancestors and body
#     url = f"{CONFLUENCE_BASE_URL}/rest/api/content?spaceKey={space_key}&type=page&expand=body.storage,version,ancestors&limit=1000"
#     response = requests.get(url, auth=AUTH, headers=HEADERS)
#     if response.status_code != 200:
#         raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch space {space_key}")
#     all_pages = response.json().get('results', [])
#
#     if not all_pages:
#         return {"message": f"No pages found in space {space_key}", "hierarchy": []}
#
#     # 2️⃣ Build page dictionary
#     pages_dict = {}
#     for page in all_pages:
#         pages_dict[page['id']] = {
#             "id": page['id'],
#             "title": page['title'],
#             "version": page['version']['number'],
#             "content": html2text.html2text(page['body']['storage']['value']),
#             "children": []
#         }
#
#     # 3️⃣ Build hierarchy using ancestors
#     root_tree = []
#
#     def find_or_create_node(parent_children, page_id, ancestor_info=None):
#         """
#         Find node with page_id in parent_children, or create placeholder if not exists.
#         Use ancestor_info title if page is missing in pages_dict.
#         """
#         for node in parent_children:
#             if node['id'] == page_id:
#                 return node
#         if page_id in pages_dict:
#             node = pages_dict[page_id]
#         else:
#             title = ancestor_info['title'] if ancestor_info and 'title' in ancestor_info else "Unknown"
#             node = {"id": page_id, "title": title, "version": 0, "content": "", "children": []}
#         parent_children.append(node)
#         return node
#
#     # Sort pages by number of ancestors so parents come before children
#     pages_sorted = sorted(all_pages, key=lambda p: len(p.get('ancestors', [])))
#
#     for page in pages_sorted:
#         ancestors = page.get('ancestors', [])
#         parent_node_list = root_tree
#         for ancestor in ancestors:
#             ancestor_id = ancestor['id']  # Extract ID from ancestor dict
#             parent_node = find_or_create_node(parent_node_list, ancestor_id, ancestor_info=ancestor)
#             parent_node_list = parent_node['children']
#         # Attach the page under its parent
#         parent_node_list.append(pages_dict[page['id']])
#
#     # 4️⃣ Recursive function to save Markdown files
#     def save_markdown(node, folder_path, depth=0):
#         safe_title = "".join(c if c.isalnum() or c in " _-" else "_" for c in node['title'])
#         filename = os.path.join(folder_path, f"{safe_title}.md")
#         heading_prefix = "#" * (depth + 1)
#         content_to_write = f"{heading_prefix} {node['title']}\n\n{node['content']}"
#         with open(filename, "w", encoding="utf-8") as f:
#             f.write(content_to_write)
#         for child in node['children']:
#             save_markdown(child, folder_path, depth + 1)
#
#     for root in root_tree:
#         save_markdown(root, space_folder)
#
#     # 5️⃣ Recursive function to build hierarchy JSON
#     def build_hierarchy_json(node):
#         return {
#             "title": node['title'],
#             "version": node['version'],
#             "content": node['content'],
#             "children": [build_hierarchy_json(child) for child in node['children']]
#         }
#
#     hierarchy = [build_hierarchy_json(root) for root in root_tree]
#
#     return {
#         "message": f"✅ Data Fetch Completed",
#         "hierarchy": hierarchy
#     }
