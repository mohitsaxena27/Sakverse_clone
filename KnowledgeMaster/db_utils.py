import os
import mysql.connector
from dotenv import load_dotenv
project_folder_map = {
    "proj_001": "./data/colt",
    "proj_002": "./data/dem"
}
def get_folder_path(project_id: str) -> str:

    return project_folder_map.get(project_id)


def fetch_projects_from_db(project_id: str):
    # Establish database connection
    # Establish database connection
    load_dotenv()
    DB_host = os.getenv("DB_host")  # e.g., "localhost"
    DB_user = os.getenv("DB_user")  # e.g., "root"
    DB_password = os.getenv("DB_password")  # Your MySQL password
    DB_database = os.getenv("DB_database")  # The name of the database
    DB_port = int(os.getenv("DB_port"))

    conn = mysql.connector.connect(
        host=DB_host,  # e.g., "localhost"
        user=DB_user,  # e.g., "root"
        password=DB_password,  # Your MySQL password
        database=DB_database,  # The name of the database
        port=DB_port
    )
    cursor = conn.cursor()

    # Query to fetch project details
    query = f"""SELECT project_name, manual_repo FROM authservice.project where project_type='Manual' and id={project_id} and (manual_repo IS NOT NULL AND manual_repo != '')"""
    cursor.execute(query)

    projects = cursor.fetchone()

    # Close connection
    cursor.close()
    conn.close()

    return projects
