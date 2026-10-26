# # app.py
# import ast
# import io
# import json
# import os
# import requests
# from flask import Flask, request, jsonify, render_template, flash, url_for, redirect, send_file
# from jsonschema.exceptions import ValidationError
# from jsonschema.validators import validate
# import pandas as pd
# from sqlalchemy import func
# from werkzeug.utils import secure_filename
#
# from models import db, Data, Repository, Table, Table_View
# from schemas import DataSchema, RepositorySchema, TableSchema, ma
# from config import Config
# from flask_cors import CORS
#
# app = Flask(__name__)
#
# # Load configuration (Config reads from environment when available)
# app.config.from_object(Config)
# CORS(app)
#
# # Ensure upload folder exists and initialize extensions
# os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
# db.init_app(app)
# ma.init_app(app)
#
# # Initialize schemas
# data_schema = DataSchema()
# datas_schema = DataSchema(many=True)
# repository_schema = RepositorySchema()
# repositories_schema = RepositorySchema(many=True)
# table_schema = TableSchema()
# tables_schema = TableSchema(many=True)
#
# # Allowed extensions are read from Config (set via ALLOWED_EXTENSIONS)
#
#
# def validate_data(schema, data):
#     try:
#         validate(instance=data, schema=schema)
#     except ValidationError as e:
#         return False, str(e)
#     return True, None
#
#
# def allowed_file(filename):
#     allowed = app.config.get('ALLOWED_EXTENSIONS', {'xls', 'xlsx'})
#     return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed
#
#
# ## UI route commented out (served by templates) - index
# # @app.route('/')
# # def index():
# #     return render_template('index.html')
#
#
# ## UI route commented out (served by templates) - view_data
# # @app.route('/view-data')
# # def view_data():
# #     return render_template('view_data.html')
#
#
# @app.route('/api/repositories', methods=['GET'])
# def get_repositories():
#     repositories = Repository.query.all()
#     result = []
#
#     for repo in repositories:
#         tables = Table.query.filter_by(repo_id=repo.id).all()
#         table_list = [{'table_id': table.id, 'table_name': table.table_name} for table in tables]
#         result.append({
#             'repo_id': repo.id,
#             'repo_name': repo.name,
#             'tables': table_list
#         })
#
#     return jsonify({'repositories': result})
#
#
# @app.route('/api/tables/<int:id>', methods=['GET'])
# def get_table(id):
#     tables = Table.query.filter_by(repo_id=id).all()
#     result = []
#     for table in tables:
#         result.append({
#             'repo_id': table.repo_id,
#             'table_id': table.id,
#             'table_name': table.table_name
#         })
#     return jsonify({'tables': result})
#
#
# # @app.route('/api/tabledata/<int:id>', methods=['GET'])
# # def get_tabledata(id):
# #     table1 = Table.query.filter_by(id=id).first()
# #     datas = db.session.query(
# #         Data.id,
# #         Data.data,
# #         func.row_number().over(order_by=Data.id).label("row_num")
# #     ).filter(Data.table_id == id).all()
# #     # table_schema=None
# #     table = Table_View.query.filter_by(table_id=id).first()
# #     table_view = ast.literal_eval(table.table_view)
# #     if table_view is not None:
# #         headers = table_view
# #         table_schema = {
# #             "additionalProperties": False,
# #             "properties": {field: {"type": "string"} for field in headers},
# #             "view": table_view,
# #             "type": "object"
# #         }
# #         print("formatted Data" + json.dumps(table_schema))
# #     else:
# #         table_schema = table1.schema
# #         print("Default Data" + json.dumps(table_schema))
# #     datas = Data.query.filter_by(table_id=id).order_by(Data.id.desc()).all()
# #
# #     result = []
# #     for data in datas:
# #         result.append({
# #             'data_id': data.id,
# #             'content': json.loads(data.data)
# #
# #         })
# #     return jsonify({'header': table_schema, 'data': result})
# #
# from sqlalchemy import func
#
#
# ## Read And view
# @app.route('/api/tabledata/<int:id>', methods=['GET'])
# def get_tabledata(id):
#     # Step 1: Get table
#     table1 = Table.query.filter_by(id=id).first()
#     if not table1:
#         return jsonify({"message": "Table not found"}), 404
#
#     # Step 2: Fetch table view safely
#     table_view_obj = Table_View.query.filter_by(table_id=id).first()
#
#     table_view = None
#     if table_view_obj and table_view_obj.table_view:
#         try:
#             table_view = ast.literal_eval(table_view_obj.table_view)
#         except:
#             table_view = None
#
#     # Step 3: Build schema
#     if table_view:
#         headers = table_view
#         table_schema = {
#             "additionalProperties": False,
#             "properties": {field: {"type": "string"} for field in headers},
#             "view": table_view,
#             "type": "object"
#         }
#     else:
#         table_schema = table1.schema
#         headers = list(table_schema.get("properties", {}).keys())
#
#     # Step 4: Fetch data with row_number (IMPORTANT FIX)
#     datas = db.session.query(
#         Data.id,
#         Data.data,
#         func.row_number().over(order_by=Data.id).label("row_num")
#     ).filter(Data.table_id == id).order_by(Data.id).all()
#
#     # Step 5: Build response
#     result = []
#     for row in datas:
#         try:
#             content = json.loads(row.data.decode('utf-8'))
#         except:
#             content = {}
#
#         result.append({
#             'row_number': row.row_num,  # ✅ NEW
#             'data_id': row.id,  # ✅ stable ID
#             'content': content
#         })
#     print(jsonify({
#         'header': table_schema,
#         'data': result
#     }))
#     return jsonify({
#         'header': table_schema,
#         'data': result
#     })
#
#
# ## UI route commented out (served by templates) - datagrid
# # @app.route('/datagrid/<int:id>')
# # def datagrid(id):
# #     # Fetch data from the API (API base is configurable)
# #     api_base = app.config.get('API_BASE_URL', '').rstrip('/')
# #     url = f"{api_base}/api/tabledata/{id}"
# #     response = requests.get(url)
# #     api_data = response.json()
# #     print("Table Data", api_data)
# #     # Extract header columns from header.properties
# #     # headers = list(api_data['header']['properties'].keys())
# #     headers = ["Row Number"] + list(api_data['header']['properties'].keys())
# #     print(headers)
# #     rows = []
# #     for item in api_data['data']:
# #         row = [item.get("row_number")] + [
# #             item['content'].get(header, "") for header in headers[1:]
# #         ]
# #         rows.append(row)
# #     table = Table_View.query.filter_by(table_id=id).first()
# #     table_view = ast.literal_eval(table.table_view)
# #     if table_view is not None:
# #         headers = ["Row Number"] + table_view
# #     else:
# #         print("No view defined")
# #     # Extract rows of data
# #     rows = []
# #     for item in api_data['data']:
# #         # row = [item['content'].get(header, "") for header in headers]
# #         row = [item.get("row_number")] + [
# #             item['content'].get(header, "") for header in headers[1:]
# #         ]
# #         rows.append(row)
# #
# #     # Render the data in a grid
# #     return render_template('grid.html', headers=headers, rows=rows, table_id=id)
#
#
# ## Create New Record
# ## UI route commented out (served by templates) - dataenterygrid
# # @app.route('/dataenterygrid/<int:id>')
# # def dataenterygrid(id):
# #     # Fetch data from the API (API base is configurable)
# #     api_base = app.config.get('API_BASE_URL', '').rstrip('/')
# #     url = f"{api_base}/api/tabledata/{id}"
# #     response = requests.get(url)
# #     api_data = response.json()
# #
# #     # Extract header columns from header.properties
# #     headers = list(api_data['header']['properties'].keys())
# #     print(headers)
# #     table = Table_View.query.filter_by(table_id=id).first()
# #     table_view = ast.literal_eval(table.table_view)
# #     if table_view is not None:
# #         headers = table_view
# #     else:
# #         print("No view defined")
# #     # Extract rows of data
# #     rows = []
# #     for item in api_data['data']:
# #         row = [item['content'].get(header, "") for header in headers]
# #         rows.append(row)
# #
# #     # Render the data in a grid
# #     return render_template('dataenterygrid.html', headers=headers, table_id=id)
#
#
# ## Table Data Download
# @app.route('/download/<int:id>', methods=['GET'])
# def download_excel(id):
#     # Fetch data from the API (API base is configurable)
#     api_base = app.config.get('API_BASE_URL', '').rstrip('/')
#     url = f"{api_base}/api/tabledata/{id}"
#     response = requests.get(url)
#     api_data = response.json()
#
#     # Extract header columns from header.properties
#     headers = list(api_data['header']['properties'].keys())
#     table = Table_View.query.filter_by(table_id=id).first()
#     table_view = ast.literal_eval(table.table_view)
#     if table_view is not None:
#         headers = table_view
#     else:
#         print("No view defined")
#
#     # Extract rows of data
#     rows = []
#     for item in api_data['data']:
#         row = [item['content'].get(header, "") for header in headers]
#         rows.append(row)
#
#     # Create a pandas DataFrame from the rows and headers
#     df = pd.DataFrame(rows, columns=headers)
#
#     # Create an in-memory buffer to hold the Excel data
#     output = io.BytesIO()
#
#     # Save the DataFrame to the Excel file buffer
#     with pd.ExcelWriter(output, engine='openpyxl') as writer:
#         df.to_excel(writer, index=False, sheet_name='Data')
#
#     # Rewind the buffer's position to the start
#     output.seek(0)
#
#     # Send the Excel file as a response
#     return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
#                      download_name='data_grid.xlsx', as_attachment=True)
#
#
# # Partial and No Use-Create TDM using File Upload
# ## UI route commented out (served by templates) - upload
# # @app.route('/upload', methods=['GET', 'POST'])
# # def upload_file():
# #     if request.method == 'POST':
# #         file = request.files['file']
# #         if file and allowed_file(file.filename):
# #             filename = secure_filename(file.filename)
# #             filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
# #             file.save(filepath)
# #             df = pd.read_excel(filepath)
# #             # read header
# #             # for each remainng row
# #             # Generate Json data and insert
# #
# #             flash('File uploaded and data processed successfully!')
# #             return redirect(url_for('upload_file'))
# #         else:
# #             flash('Invalid file format. Please upload .xls or .xlsx files.')
# #     return render_template('upload.html')
#
#
# ## No Of Use
# ## UI route commented out (served by templates) - data_entry
# # @app.route('/data-entry', methods=['GET', 'POST'])
# # def data_entry():
# #     if request.method == 'POST':
# #         data = request.get_json()
# #         # Process the data (you can insert it into the database here)
# #         return jsonify({"message": "Data submitted successfully!"}), 200
# #     return render_template('data_entry.html')
#
#
# @app.route('/data-list', methods=['GET'])
# def data_list():
#     # Placeholder: replace with data fetching logic from your DB
#     data = [
#         {'id': 1, 'name': 'John', 'age': 30, 'email': 'john@example.com'},
#         {'id': 2, 'name': 'Jane', 'age': 25, 'email': 'jane@example.com'}
#     ]
#     return jsonify(data)
#
#
# ## Upload Data From Excel Sheet in A Table
# @app.route('/upload_excel', methods=['POST'])
# def upload_excel():
#     if 'file' not in request.files:
#         return jsonify({"message": "No file uploaded"}), 400
#
#     file = request.files['file']
#     table_id = request.form.get('table_id')
#
#     # Get the table schema
#     table = Table.query.filter_by(id=table_id).first()
#     if not table:
#         return jsonify({"message": "Invalid table ID"}), 400
#
#     try:
#         # Read Excel file
#         df = pd.read_excel(file)
#     except Exception as e:
#         return jsonify({"message": f"Error reading Excel file: {str(e)}"}), 500
#
#     # Convert the dataframe to list of dicts
#     data_to_insert = [{k: str(v) for k, v in record.items()} for record in df.to_dict(orient='records')]
#
#     # data_to_insert = df.to_dict(orient='records')
#
#     # Validate each row against the table's schema
#     table_schema = table.schema  # This should be a JSON schema
#
#     for row in data_to_insert:
#         is_valid, error = validate_data(table_schema, row)
#         if not is_valid:
#             return jsonify({"message": f"Invalid data in row: {row}. Error: {error}"}), 400
#
#         # Insert the valid data into the `data` table
#         new_data = Data(
#             table_id=table.id,
#             data=json.dumps(row).encode('utf-8')  # Store as binary (or you can store as JSON)
#         )
#         db.session.add(new_data)
#
#     # Commit all the rows
#     db.session.commit()
#
#     return jsonify({"message": "Data uploaded successfully"}), 200
#
#
# # CREATE OPERATIONS - Add New Data into Table
# @app.route('/data', methods=['POST'])
# def create_data():
#     table_id = request.json.get('table_id')
#     data = request.json.get('data')  # Data to be inserted (expects a dictionary)
#
#     if not table_id or not data:
#         return jsonify({"message": "Missing table_id or data"}), 400
#
#     # Fetch the table schema
#     table = Table.query.filter_by(id=table_id).first()
#     if not table:
#         return jsonify({"message": "Invalid table ID"}), 400
#
#     table_schema = table.schema  # This should be a JSON schema
#
#     # Validate the incoming data against the table schema
#     is_valid, error = validate_data(table_schema, data)
#     if not is_valid:
#         return jsonify({"message": f"Invalid data: {error}"}), 400
#
#     # If data is valid, insert into the `data` table
#     new_data = Data(
#         table_id=table_id,
#         data=json.dumps(data).encode('utf-8')  # Store the data as a binary blob
#     )
#
#     db.session.add(new_data)
#     db.session.commit()
#     return data_schema.jsonify(new_data)
#
#
# # CREATE OPERATIONS -Modify View
# @app.route('/table_view/<int:id>', methods=['POST'])
# def create_table_view(id):
#     table_id = id
#     table_view = request.json.get('data')  # Data to be inserted (expects a dictionary)
#     print(table_view)
#     # If data is valid, insert into the `data` table
#     new_data = Table_View(
#         table_id=table_id,
#         table_view=table_view  # Store the data as a binary blob
#     )
#
#     db.session.add(new_data)
#     db.session.commit()
#     return data_schema.jsonify(new_data)
#
# # CREATE OPERATIONS -Create Repo
# @app.route('/repository', methods=['POST'])
# def create_repository():
#     name = request.json.get('name')
#     existing_repo = Repository.query.filter_by(name=name).first()
#     if existing_repo:
#         return jsonify({"message": "Repository already exists"}), 200
#     new_repo = Repository(name=name)
#     db.session.add(new_repo)
#     db.session.commit()
#     return repository_schema.jsonify(new_repo)
#
# # CREATE OPERATIONS -Create Table
# @app.route('/table', methods=['POST'])
# def create_table():
#     table_name = request.json.get('table_name')
#     repo_id = request.json.get('repo_id')
#     schema = request.json.get('schema')  # Expects a JSON schema for columns
#
#     if not table_name or not repo_id:
#         return jsonify({"message": "Missing required fields"}), 400
#
#     new_table = Table(
#         table_name=table_name,
#         repo_id=repo_id,
#         schema=schema
#     )
#
#     db.session.add(new_table)
#     db.session.commit()
#     return table_schema.jsonify(new_table)
#
# ## To Check
# @app.route('/createtable', methods=['POST'])
# def create_table_ui():
#     table_name = request.json.get('table_name')
#     repo_id = request.json.get('repo_id')
#     datafrom = request.json.get('columns')  # Expects a JSON schema for columns
#     print("This is the Last of the Column passed from UI" + datafrom)
#     listofcolumns = datafrom.split(',')
#     print(listofcolumns)
#     existing_table = Table.query.filter_by(table_name=table_name)
#     if not table_name or not repo_id:
#         return jsonify({"message": "Missing required fields"}), 400
#     existing_table = Table.query.filter_by(table_name=table_name).first()
#     if existing_table:
#         return jsonify({"message": "Table already exists"}), 200
#
#     schema = {
#         "type": "object",
#         "properties": {val: {"type": "string"} for val in listofcolumns},
#         "additionalProperties": False
#     }
#     new_table = Table(
#         table_name=table_name,
#         repo_id=repo_id,
#         schema=schema
#     )
#
#     db.session.add(new_table)
#     db.session.commit()
#
#     data = {"data": str(listofcolumns)}
#     api_base = app.config.get('API_BASE_URL', '').rstrip('/')
#     url = f"{api_base}/table_view/{new_table.id}"
#     response = requests.post(url, json=data)
#     # with app.test_client() as client:
#     #     response = client.post(url_for('/api/table_view/', id=new_table.id), json=data)  # Sending data to /api1
#
#     # if response.status_code == 200:
#     #     api1_data = response.get_json()
#     #     return jsonify({
#     #         "message": "Data fetched and processed from API 1",
#     #         "api1_data": api1_data
#     #     }), 200
#     # else:
#     #     return jsonify({"error": "Failed to fetch data from API 1"}), 500
#
#     return table_schema.jsonify(new_table)
#
#
# # # READ OPERATIONS
# # @app.route('/data', methods=['GET'])
# # def get_datas():
# #     all_data = Data.query.all()
# #     return datas_schema.jsonify(all_data)
#
# ## Read Data By Data ID
# @app.route('/data/<int:id>', methods=['GET'])
# def get_data_by_id(id):
#     all_data = Data.query.filter_by(id=id)
#     return datas_schema.jsonify(all_data)
#
# ## Update Data By Data ID
# @app.route('/updatedatarecord/<int:id>', methods=['PUT'])
# def update_data_by_id(id):
#     all_data = Data.query.get_or_404(id)
#     datatobeupdated = request.json.get('data')
#     currentdata = all_data.data
#     currentdata = json.loads(currentdata)
#
#     for key, value in datatobeupdated.items():
#         currentdata[key] = value  # Update or add the key-value pair
#     all_data.data = json.dumps(currentdata).encode("utf-8")
#     db.session.commit()
#
#     updated = Data.query.get_or_404(id)
#     return jsonify(json.loads(updated.data))
#
# ## List All Repository
# @app.route('/repository', methods=['GET'])
# def get_repositories1():
#     all_repos = Repository.query.all()
#     return repositories_schema.jsonify(all_repos)
#
# ## List All Tables
# @app.route('/table', methods=['GET'])
# def get_tables():
#     all_tables = Table.query.all()
#     return tables_schema.jsonify(all_tables)
#
#
# # UPDATE OPERATIONS
# @app.route('/data/<int:id>', methods=['PUT'])
# def update_data(id):
#     data = Data.query.get_or_404(id)
#     data.table_id = request.json.get('table_id', data.table_id)
#     datatomodify = request.json.get('data')
#     key = datatomodify.get()
#     data.data = request.json.get('data', data.data)
#     db.session.commit()
#     return data_schema.jsonify(data)
#
#
# @app.route('/repository/<int:id>', methods=['PUT'])
# def update_repository(id):
#     repository = Repository.query.get_or_404(id)
#     repository.name = request.json.get('name', repository.name)
#     db.session.commit()
#     return repository_schema.jsonify(repository)
#
#
# @app.route('/table/<int:id>', methods=['PUT'])
# def update_table(id):
#     table = Table.query.get_or_404(id)
#     table.repo_id = request.json.get('repo_id', table.repo_id)
#     table.table_name = request.json.get('table_name', table.table_name)
#     table.schema = request.json.get('schema', table.schema)
#     db.session.commit()
#     return table_schema.jsonify(table)
#
#
# # DELETE OPERATIONS
# @app.route('/data/<int:id>', methods=['DELETE'])
# def delete_data(id):
#     data = Data.query.get_or_404(id)
#     db.session.delete(data)
#     db.session.commit()
#     return jsonify({"message": "Data deleted successfully"})
#
#
# @app.route('/repository/<int:id>', methods=['DELETE'])
# def delete_repository(id):
#     repository = Repository.query.get_or_404(id)
#     db.session.delete(repository)
#     db.session.commit()
#     return jsonify({"message": "Repository deleted successfully"})
#
#
# @app.route('/table/<int:id>', methods=['DELETE'])
# def delete_table(id):
#     table = Table.query.get_or_404(id)
#     db.session.delete(table)
#     db.session.commit()
#     return jsonify({"message": "Table deleted successfully"})
#
# ## For Automation -Read
# @app.route('/<string:repo_name>/<string:table_name>/<int:row_number>/<string:column_name>', methods=['GET'])
# def get_column_value(repo_name, table_name, row_number, column_name):
#
#     # Step 1: Repo
#     repo = Repository.query.filter_by(name=repo_name).first()
#     if not repo:
#         return jsonify({"message": "Repository not found"}), 404
#
#     # Step 2: Table
#     table = Table.query.filter_by(repo_id=repo.id, table_name=table_name).first()
#     if not table:
#         return jsonify({"message": "Table not found"}), 404
#
#     # Step 3: Resolve row_number → actual row
#     data_row = get_row_by_row_number(table.id, row_number)
#     if not data_row:
#         return jsonify({"message": "Row not found"}), 404
#
#     # Step 4: Parse JSON
#     try:
#         row_data = json.loads(data_row.data.decode('utf-8'))
#     except:
#         return jsonify({"message": "Corrupted data"}), 500
#
#     # Step 5: Validate column
#     if column_name not in row_data:
#         return jsonify({"message": "Column not found"}), 404
#
#     return jsonify({
#         "repo": repo_name,
#         "table": table_name,
#         "row_number": row_number,
#         "data_id": data_row.id,   # important for debugging
#         "column": column_name,
#         "value": row_data[column_name]
#     })
# ## For Automation -Update
# @app.route('/<string:repo_name>/<string:table_name>/<int:row_number>/<string:column_name>', methods=['PATCH'])
# def update_column_value(repo_name, table_name, row_number, column_name):
#
#     new_value = request.json.get("value")
#     if new_value is None:
#         return jsonify({"message": "Missing value"}), 400
#
#     # Step 1: Repo
#     repo = Repository.query.filter_by(name=repo_name).first()
#     if not repo:
#         return jsonify({"message": "Repository not found"}), 404
#
#     # Step 2: Table
#     table = Table.query.filter_by(repo_id=repo.id, table_name=table_name).first()
#     if not table:
#         return jsonify({"message": "Table not found"}), 404
#
#     # Step 3: Resolve row_number
#     data_row = get_row_by_row_number(table.id, row_number)
#     if not data_row:
#         return jsonify({"message": "Row not found"}), 404
#
#     # Step 4: Load JSON
#     try:
#         row_data = json.loads(data_row.data.decode('utf-8'))
#     except:
#         return jsonify({"message": "Corrupted data"}), 500
#
#     # Step 5: Schema validation
#     schema_columns = table.schema.get("properties", {})
#     if column_name not in schema_columns:
#         return jsonify({"message": "Invalid column as per schema"}), 400
#
#     # Step 6: Update value
#     row_data[column_name] = str(new_value)
#
#     # Step 7: Save
#     data_row.data = json.dumps(row_data).encode('utf-8')
#     db.session.commit()
#
#     return jsonify({
#         "message": "Column updated successfully",
#         "row_number": row_number,
#         "data_id": data_row.id,
#         "updated_value": new_value
#     })
# def get_row_by_row_number(table_id, row_number):
#     subquery = db.session.query(
#         Data.id,
#         func.row_number().over(order_by=Data.id).label("row_num")
#     ).filter(Data.table_id == table_id).subquery()
#
#     result = db.session.query(subquery).filter(subquery.c.row_num == row_number).first()
#
#     if not result:
#         return None
#
#     return Data.query.get(result.id)
# if __name__ == '__main__':
#     # Use HOST/PORT from config (Config reads from environment by default)
#     host = app.config.get('HOST', '0.0.0.0')
#     port = int(app.config.get('PORT', 5555))
#     app.run(host=host, port=port, debug=app.config.get('DEBUG', False))
