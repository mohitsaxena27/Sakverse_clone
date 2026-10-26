import axios from 'axios';
import dotenv from 'dotenv';
import FormData from 'form-data';
import fs from 'fs';
import multer from 'multer';

dotenv.config();

const tdmIP = process.env.TDMIP;
const upload = multer({ dest: 'uploads/' }).array('files');

// ==================== REPOSITORY APIs ====================

// GET /api/repositories - Fetch all repositories
export const getRepositories = async (req, res) => {
  const session = req.session;

  try {
    const response = await axios.get(`${tdmIP}/api/repositories`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Failed to fetch repositories:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error fetching repositories',
    });
  }
};

// POST /repository - Create new repository
export const createRepository = async (req, res) => {
  const session = req.session;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Repository name is required' });
  }

  try {
    const response = await axios.post(
      `${tdmIP}/repository`,
      { name },
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Failed to create repository:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error creating repository',
    });
  }
};

// DELETE /repository/:repoId - Delete repository
export const deleteRepository = async (req, res) => {
  const session = req.session;
  const { repoId } = req.params;

  try {
    const response = await axios.delete(`${tdmIP}/repository/${repoId}`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Failed to delete repository:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error deleting repository',
    });
  }
};

// ==================== TABLE APIs ====================

// GET /api/tabledata/:tableId - Fetch table data
export const getTableData = async (req, res) => {
  const session = req.session;
  const { tableId } = req.params;

  try {
    const response = await axios.get(`${tdmIP}/api/tabledata/${tableId}`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Failed to fetch table data:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error fetching table data',
    });
  }
};

// POST /createtable - Create new table
export const createTable = async (req, res) => {
  const session = req.session;
  const { repo_id, table_name, columns } = req.body;

  if (!repo_id || !table_name || !columns) {
    return res.status(400).json({ message: 'repo_id, table_name, and columns are required' });
  }

  try {
    const response = await axios.post(
      `${tdmIP}/createtable`,
      { repo_id, table_name, columns },
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Failed to create table:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error creating table',
    });
  }
};

// DELETE /table/:tableId - Delete table
export const deleteTable = async (req, res) => {
  const session = req.session;
  const { tableId } = req.params;

  try {
    const response = await axios.delete(`${tdmIP}/table/${tableId}`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Failed to delete table:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error deleting table',
    });
  }
};

// ==================== DATA RECORD APIs ====================

// PUT /updatedatarecord/:dataId - Update a data record
// PATCH /repository/:repoName/table/:tableName/row/:rowNumber/column/:columnName - Update a column value
export const updateDataRecord = async (req, res) => {
  const session = req.session;
  const { repoName, tableName, rowNumber, columnName } = req.params;
  const { value } = req.body;

  if (value === undefined || value === null) {
    return res.status(400).json({ message: 'Value is required' });
  }

  try {
    const response = await axios.patch(
      `${tdmIP}/repository/${repoName}/table/${tableName}/row/${rowNumber}/column/${columnName}`,
      { value },
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Failed to update data record:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error updating data record',
    });
  }
};

// POST /data - Create new data record
export const createDataRecord = async (req, res) => {
  const session = req.session;
  const { table_id, data } = req.body;

  if (!table_id || !data) {
    return res.status(400).json({ message: 'table_id and data are required' });
  }

  try {
    const response = await axios.post(
      `${tdmIP}/data`,
      { table_id, data },
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Failed to create data record:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error creating data record',
    });
  }
};

// DELETE /data/:dataId - Delete data record
export const deleteDataRecord = async (req, res) => {
  const session = req.session;
  const { dataId } = req.params;

  try {
    const response = await axios.delete(`${tdmIP}/data/${dataId}`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Failed to delete data record:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error deleting data record',
    });
  }
};

// ==================== FILE/DOWNLOAD APIs ====================

// GET /download/:tableId - Download table as XLSX
export const downloadTable = async (req, res) => {
  const session = req.session;
  const { tableId } = req.params;

  try {
    const response = await axios.get(`${tdmIP}/download/${tableId}`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
      responseType: 'stream',
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${tableId}.xlsx`);

    // Pipe the file stream to response
    response.data.pipe(res);
  } catch (error) {
    console.error('Failed to download table:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error downloading table',
    });
  }
};

// PATCH /table/:tableId/columns - Add a new column
export const addTableColumn = async (req, res) => {
  const session = req.session;
  const { tableId } = req.params;
  const { name, type } = req.body;

  if (!name || !type) {
    return res.status(400).json({
      message: "name and type are required",
    });
  }

  try {
    const response = await axios.patch(
      `${tdmIP}/table/${tableId}/columns`,
      { name, type },
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Failed to add column:", error.message);

    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || "Error adding column",
    });
  }
};