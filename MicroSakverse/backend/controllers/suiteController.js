import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SUITE_API_BASE = process.env.NGROK_URL;

// ─────────────────────────────────────────────
// CREATE SUITE
// POST /test-suites?project_id=1
// ─────────────────────────────────────────────
export const CreateSuite = async (req, res) => {
  const session = req.session;
  const { project_id } = req.query;
  const body = req.body;

  if (!project_id) {
    return res.status(400).json({ 
      message: 'Missing project_id query parameter' 
    });
  }

  if (!body?.suite_name) {
    return res.status(400).json({ 
      message: 'Missing suite_name in request body' 
    });
  }

  if (!body?.items || !Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({ 
      message: 'Items array is required and must not be empty' 
    });
  }

  try {
    const response = await axios.post(
      `${SUITE_API_BASE}/test-suites`,
      body,
      {
        params: { project_id },
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('CreateSuite error:', error.message);
    res.status(500).json({ 
      message: 'Error creating test suite',
      error: error.response?.data || error.message
    });
  }
};

// ─────────────────────────────────────────────
// GET SUITE LIST
// GET /test-suites?project_id=1
// ─────────────────────────────────────────────
export const GetSuiteList = async (req, res) => {
  const session = req.session;
  const { project_id } = req.query;

  if (!project_id) {
    return res.status(400).json({ 
      message: 'Missing project_id query parameter' 
    });
  }

  try {
    const response = await axios.get(
      `${SUITE_API_BASE}/test-suites`,
      {
        params: { project_id },
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('GetSuiteList error:', error.message);
    res.status(500).json({ 
      message: 'Error fetching test suites',
      error: error.response?.data || error.message
    });
  }
};

// ─────────────────────────────────────────────
// EXECUTE SUITE
// POST /execute-suite/{suite_id}?max_parallel={Parallel configuration up to 6}
// ─────────────────────────────────────────────
export const ExecuteSuite = async (req, res) => {
  const session = req.session;
  const { suite_id } = req.params;
  const { max_parallel } = req.query;

  if (!suite_id) {
    return res.status(400).json({ 
      message: 'Missing suite_id parameter' 
    });
  }

  // Validate max_parallel is between 1 and 6
  if (max_parallel) {
    const parallel = parseInt(max_parallel);
    if (isNaN(parallel) || parallel < 1 || parallel > 6) {
      return res.status(400).json({ 
        message: 'max_parallel must be a number between 1 and 6' 
      });
    }
  }

  try {
    const response = await axios.post(
      `${SUITE_API_BASE}/execute-suite/${suite_id}`,
      null,
      {
        params: { max_parallel: max_parallel || 1 },
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('ExecuteSuite error:', error.message);
    res.status(500).json({ 
      message: 'Error executing test suite',
      error: error.response?.data || error.message
    });
  }
};

// ─────────────────────────────────────────────
// GET SUITE REPORT (JSON)
// GET /test-suites/:suite_id/report/json
// ─────────────────────────────────────────────
export const GetSuiteReportJson = async (req, res) => {
  const session = req.session;
  const { suite_id } = req.params;
  const { screenshot_mode } = req.query;

  if (!suite_id) {
    return res.status(400).json({ 
      message: 'Missing suite_id parameter' 
    });
  }

  try {
    // Build URL with optional screenshot_mode parameter
    let url = `${SUITE_API_BASE}/test-suites/${suite_id}/report/json`;
    if (screenshot_mode) {
      url += `?screenshot_mode=${screenshot_mode}`;
    }

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('GetSuiteReportJson error:', error.message);
    res.status(500).json({ 
      message: 'Error fetching suite report',
      error: error.response?.data || error.message
    });
  }
};

// Also export as default if needed
export default {
  CreateSuite,
  GetSuiteList,
  ExecuteSuite,
  GetSuiteReportJson
};