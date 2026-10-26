/**
 * Project Controller
 * Handles all project-related operations including:
 * - Project assignment and management
 * - User story operations
 * - JIRA integration
 * - Test case management
 */

import axios from 'axios';
import { getSession } from './sessionStore.js';
import dotenv from 'dotenv'
import FormData from 'form-data';
import fs from 'fs';
import multer from 'multer';


dotenv.config();

// API endpoints and credentials configuration
const baseIP = process.env.BASE_IP       // Main API endpoint
const javaIP = process.env.JAVA_IP       // Java service endpoint
const Jusername = process.env.USERNAME_JIRA  // JIRA authentication
const Jpassword = process.env.PASSWORD_JIRA
const Jurl = process.env.JIRA_URL

const upload = multer({ dest: 'uploads/' }).array('files');

 

export const getAssignedProjects = async (req, res) => {
  const session = req.session;

  try {
    const response = await axios.get(`${javaIP}/api/assigned-projects`, {
      headers: {
        Authorization: `Bearer ${session.token}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Failed to fetch projects:', error.message);
    res.status(500).json({ message: 'Error fetching assigned projects' });
  }
};


export const getJiraDetails = async (req, res) => {
  const sessionId = req.cookies?.sessionId;
  const { pr_id } = req.params;

  if (!pr_id) {
    return res.status(400).json({ message: 'Missing required parameter: pr_id' });
  }
  if (!sessionId) {
    return res.status(401).json({ message: 'Unauthorized: Missing sessionId cookie' });
  }

  const session = getSession(sessionId);
  if (!session || !session.token) {
    return res.status(402).json({ message: 'Unauthorized: No session token found' });
  }

  try {
    const response = await axios.get(`${baseIP}/ticket_list/${pr_id}`, {
headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Failed to fetch Jira details:', error.message);
    res.status(500).json({ message: 'Error fetching Jira details' });
  }
};


export const nextStep = async (req, res) => {
  const sessionId = req.cookies?.sessionId;
  const { user_story_ref } = req.params;

  if (!user_story_ref) {
    return res.status(400).json({ message: 'Missing required parameter: user_story_ref' });
  }

  if (!sessionId) {
    return res.status(401).json({ message: 'Unauthorized: Missing sessionId cookie' });
  }

  const session = getSession(sessionId);
  if (!session || !session.token) {
    return res.status(402).json({ message: 'Unauthorized: No session token found' });
  }

  try {
    const response = await axios.post(`${baseIP}/next/${user_story_ref}`, {}, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Failed to fetch Jira details:', error.message);
    res.status(500).json({ message: 'Error fetching Jira details' });
  }
};



export const US_List = async (req, res) => {
  const session = req.session;
  const { pr_id } = req.query;

  if (!pr_id) {
    return res.status(400).json({ message: 'Missing required parameter: pr_id' });
  }

  try {
    const response = await axios.get(`${baseIP}/get_list_user_story_details`, {
      params: { pr_id },
      headers: {
        Authorization: `Bearer ${session.token}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Failed to fetch user story details:', error.message);
    res.status(500).json({ message: 'Error fetching user story details' });
  }
};

export const Get_update = async (req, res) => {
  const session = req.session;
  const { pr_id, selectedStoryId } = req.query; // both expected in query params

  // Validate required parameters
  if (!pr_id || !selectedStoryId) {
    return res.status(400).json({
      message: 'Missing required parameters: pr_id and selectedStoryId',
    });
  }

  try {
    // Call external API with required params
    const response = await axios.get(`${baseIP}/get_update/`, {
      params: {
        pr_id,
        user_story_ref: selectedStoryId,
      },
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    // Send back the response
    res.json(response.data);
  } catch (error) {
    console.error('Failed to fetch user story update:', error.message);
    res.status(500).json({
      message: 'Error fetching user story update',
    });
  }
};

export const Get_testcase = async (req, res) => {
  const session = req.session;
  const { pr_id, selectedStoryId, testcaseid } = req.query;

  // Validate all required params
  if (!pr_id || !selectedStoryId || !testcaseid) {
    return res.status(400).json({
      message: 'Missing required parameters: pr_id, selectedStoryId, and testcaseid',
    });
  }

  try {
    // Call the existing API to get full data
    const response = await axios.get(`${baseIP}/get_update/`, {
      params: {
        pr_id,
        user_story_ref: selectedStoryId,
      },
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    // Find the specific test case by ID
    const testCaseIdNum = parseInt(testcaseid);
    const testCase = response.data?.message?.test_cases?.find(
      (tc) => tc.id === testCaseIdNum
    );

    if (testCase) {
      return res.json(testCase);
    } else {
      return res.status(404).json({ message: 'Test case not found' });
    }
  } catch (error) {
    console.error('Error fetching test case:', error.message);
    res.status(500).json({
      message: 'Internal server error while fetching test case',
    });
  }
};


//get requirement table list
export const requirement_List = async (req, res) => {
  const session = req.session;
  const { pr_id, selectedStoryId } = req.query; // both expected in query params

  // Validate required parameters
  if (!pr_id || !selectedStoryId) {
    return res.status(400).json({
      message: 'Missing required parameters: pr_id and selectedStoryId',
    });
  }

  try {
    // Call external API with required params
    // const response = await axios.get(`${baseIP}/get_update/`, {
    const response = await axios.get(`${baseIP}/getDashBoard/`, {
      params: {
        pr_id,
        user_story_ref: selectedStoryId,
      },
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    // Send back the response
    res.json(response.data);
  } catch (error) {
    console.error('Failed to fetch user story update:', error.message);
    res.status(500).json({
      message: 'Error fetching user story update',
    });
  }
};


export const Download_Excel = async (req, res) => {
  const session = req.session;
  const { pr_id, selectedStoryId } = req.query;

  if (!pr_id || !selectedStoryId) {
    return res.status(400).json({ message: 'Missing required parameters: pr_id and selectedStoryId' });
  }

  try {
    const response = await axios.get(`${baseIP}/download-excel`, {
      params: {
        pr_id,
        user_story_id: selectedStoryId, // this matches your Postman request format
      },
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
      responseType: 'stream', // required to stream the Excel file
    });

    // Set headers so the client gets a download prompt
    res.setHeader('Content-Disposition', 'attachment; filename="user_story_data.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Pipe the file stream directly to the client
    response.data.pipe(res);
  } catch (error) {
    console.error('Failed to download Excel file:', error.message);
    res.status(500).json({ message: 'Error downloading Excel file' });
  }
};


export const us_submit = async (req, res) => {
  const session = req.session;
  const { pr_id, user_input, key ,autopilot} = req.body;

  // Allow partial data but require at least user_input to be non-empty
  if (!user_input || user_input.trim() === '') {
    return res.status(400).json({ message: 'user_input is required and cannot be empty' });
  }

  try {
    const payload = {};

    if (pr_id) payload.pr_id = pr_id;
    if (user_input) payload.user_input = user_input;
    if (key) payload.key = key;
    if (autopilot) payload.autopilot = autopilot;

    const response = await axios.post(`${baseIP}/process`, payload, {
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Failed to process request:', error.message);
    res.status(500).json({ message: 'Error processing the request' });
  }
};



export const jira = async (req, res) => {
  const username = Jusername;
  const password = Jpassword;
  const url = Jurl;

  const headers = {
      'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
      'Content-Type': 'application/json',
  };

  try {
      const response = await fetch(url, { method: 'GET', headers });
      if (!response.ok) {
          return res.status(response.status).json({ error: 'Failed to fetch data' });
      }
      const data = await response.json();
      res.json(data);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
};



export const updateQnA = async (req, res) => {
  const session = req.session;
  const { id, answer } = req.body;

  if (!id || !answer) {
    return res.status(400).json({ message: 'Missing required body fields:id , answer' });
  }

  try {
    const response = await axios.post(`${baseIP}/update_qna`, {
      id,
      answer
    }, {
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Failed to process request:', error.message);
    res.status(500).json({ message: 'Error processing the request' });
  }
};


export const acceptTestCase = async (req, res) => {
  const session = req.session;
  const { test_case_id, accepted } = req.body;

  // Validate test_case_id
  if (!Number.isInteger(test_case_id)) {
    return res.status(400).json({
      success: false,
      message: "test_case_id must be an integer"
    });
  }

  // Validate accepted strictly boolean
  if (typeof accepted !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "accepted must be true or false only"
    });
  }

  try {
    const response = await axios.post(
      `${baseIP}/update_review_status`,
      {
        test_case_id,
        accepted
      },
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: accepted
        ? "Test case accepted successfully"
        : "Test case unaccepted successfully",
      data: response.data
    });

  } catch (error) {
    console.error("Failed to process request:", error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data?.message || "Upstream API error",
        error: error.response.data
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error while updating review status"
    });
  }
};
export const updateUserStory = async (req, res) => {
  const session = req.session;
  const { id, pre_requsite, summary, actions, test_data, acceptance_criteria } = req.body;

  // Validate required fields
  if (!id || (!pre_requsite && !summary && !actions && !test_data && !acceptance_criteria)) {
    return res.status(400).json({
      message: 'Missing required fields: id and at least one user story attribute (pre_requsite, summary, actions, test_data, acceptance_criteria)'
    });
  }

  try {
    const response = await axios.post(`${baseIP}/update_userstory`, {
      id,
      pre_requsite,
      summary,
      actions,
      test_data,
      acceptance_criteria
    }, {
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Failed to update user story:', error.message);
    res.status(500).json({ message: 'Error updating user story' });
  }
};

export const updateRequirement = async (req, res) => {
  const session = req.session;
  const { id, detail, type, data, test_steps } = req.body;

  // Validate required fields
  if (!id || (!detail && !type && !data && !test_steps)) {
    return res.status(400).json({
      message: 'Missing required fields: id and at least one attribute (detail, type, data, test_steps)'
    });
  }

  try {
    const response = await axios.post(`${baseIP}/update_requirement`, {
      id,
      detail,
      type,
      data,
      test_steps
    }, {
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Failed to update requirement:', error.message);
    res.status(500).json({ message: 'Error updating requirement' });
  }
};

export const updateTestCase = async (req, res) => {
  const session = req.session;
  const {id,summary,test_steps,expected_result,test_data,regression,tobeautomate} = req.body;

  // Validate required fields
  if (!id) {
    return res.status(400).json({
      message: "Missing required field: id"
    });
  }

  if (summary === undefined && test_steps === undefined && expected_result === undefined && test_data === undefined && regression === undefined && tobeautomate === undefined) {
    return res.status(400).json({
      message:
        "At least one editable field must be provided: summary, test_steps, expected_result, test_data, regression, tobeautomate"
    });
  }

  try {
    const response = await axios.post(
      `${baseIP}/update_testcase`,
      { id, summary, test_steps, expected_result,test_data, regression,tobeautomate},

      {
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Failed to update test case:", error.message);
    res.status(500).json({ message: "Error updating test case" });
  }
};


export const publishTestCase = async (req, res) => {
  const session = req.session;

  if (!session?.token) {
    return res.status(401).json({
      message: "Unauthorized. Missing session token.",
    });
  }

  try {
    const {
      userstory_ref_id,
      plan_id,
      suite_id,
      testcases,
      ...optionalFields
    } = req.body;


    const missingFields = [];

    if (!userstory_ref_id) missingFields.push("userstory_ref_id");
    if (!Array.isArray(testcases) || testcases.length === 0)
      missingFields.push("testcases");

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required field(s): ${missingFields.join(", ")}`,
      });
    }

    /* ==========================
       BUILD PAYLOAD DYNAMICALLY
    ========================== */

    const payload = {
      userstory_ref_id: Number(userstory_ref_id),
      plan_id: String(plan_id),
      suite_id: String(suite_id),
      testcases: testcases.map(Number),
      ...optionalFields, // dynamically include any other optional fields
    };

    /* ==========================
       CALL EXTERNAL API
    ========================== */

    const response = await axios.post(
      `${baseIP}/publish_testcase`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Test cases published successfully",
      data: response.data,
    });
  } catch (error) {
    console.error(
      "Failed to publish test case:",
      error.message,
      error.response?.data
    );

    return res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.message ||
        "Error publishing test case",
    });
  }
};



export const publishUserStory = async (req, res) => {
  const sessionId = req.cookies?.sessionId;
  const { userstory_ref_id, project_id } = req.body;

  if (!userstory_ref_id || !project_id) {
    return res.status(400).json({
      message: 'Missing required field: userstory_ref_id or project_id'
    });
  }

const session = getSession(sessionId);
  if (!session || !session.token) {
    return res.status(402).json({ message: 'Unauthorized: No session token found' });
  }

  try {
    const response = await axios.post(`${baseIP}/append_user_story`, {
      userstory_ref_id,
      project_id
    }, {
     headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    // 👇 Add this to get the real reason
    if (error.response) {
      console.error('❌ Backend failed - status:', error.response.status);
      console.error('❌ Backend error data:', error.response.data);
    } else if (error.request) {
      console.error('❌ No response received:', error.request);
    } else {
      console.error('❌ Axios config error:', error.message);
    }

    res.status(500).json({ message: 'Error publishing user story' });
  }
};




export const getTestConfiguration = async (req, res) => {
  const sessionId = req.cookies?.sessionId;
  const { userstory_ref_id } = req.params;

  if (!userstory_ref_id) {
    return res.status(400).json({ message: 'Missing required parameter: userstory_ref_id' });
  }
  if (!sessionId) {
    return res.status(401).json({ message: 'Unauthorized: Missing sessionId cookie' });
  }

  const session = getSession(sessionId);
  if (!session || !session.token) {
    return res.status(402).json({ message: 'Unauthorized: No session token found' });
  }

  try {
    const response = await axios.get(`${baseIP}/fetch_configuration/${userstory_ref_id}`, {
    // const response = await axios.get(`https://bc685c8a-9ca5-48f3-a5f8-d9a6e1594dcb.mock.pstmn.io/testConfig`, {
headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Failed to fetch Jira details:', error.message);
    res.status(500).json({ message: 'Error fetching Test Configurations' });
  }
};

  export const Ado_fetch_testsuite = async (req, res) => {
    const sessionId = req.cookies?.sessionId;
    const { userstory_ref_id,plan_id } = req.params;

    if (!userstory_ref_id) {
      return res.status(400).json({ message: 'Missing required parameter: userstory_ref_id' });
    }
    if (!plan_id) {
      return res.status(400).json({ message: 'Missing required parameter: plan_id' });
    }
    if (!sessionId) {
      return res.status(401).json({ message: 'Unauthorized: Missing sessionId cookie' });
    }

    const session = getSession(sessionId);
    if (!session || !session.token) {
      return res.status(402).json({ message: 'Unauthorized: No session token found' });
    }

    try {
      const response = await axios.get(`${baseIP}/fetch_testsuite/${userstory_ref_id}/${plan_id}`, {
  headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });

      res.json(response.data);
    } catch (error) {
      console.error('Failed to fetch Ado Test Suite:', error.message);
      res.status(500).json({ message: 'Error fetching Test Configurations' });
    }
  };


  export const Ado_fetch_testplans = async (req, res) => {
    const sessionId = req.cookies?.sessionId;
    const { userstory_ref_id } = req.params;

    if (!userstory_ref_id) {
      return res.status(400).json({ message: 'Missing required parameter: userstory_ref_id' });
    }
    if (!sessionId) {
      return res.status(401).json({ message: 'Unauthorized: Missing sessionId cookie' });
    }

    const session = getSession(sessionId);
    if (!session || !session.token) {
      return res.status(402).json({ message: 'Unauthorized: No session token found' });
    }

    try {
      const response = await axios.get(`${baseIP}/fetch_testplans/${userstory_ref_id}`, {
  headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });

      res.json(response.data);
    } catch (error) {
      console.error('Failed to fetch Jira details:', error.message);
      res.status(500).json({ message: 'Error fetching Test Configurations' });
    }
  };


  export const Ado_fetch_testdata = async (req, res) => {
  const sessionId = req.cookies?.sessionId;
  const { userstory_ref_id } = req.params;

  if (!userstory_ref_id) {
    return res.status(400).json({
      message: "Missing required parameter: userstory_ref_id",
    });
  }

  if (!sessionId) {
    return res.status(401).json({
      message: "Unauthorized: Missing sessionId cookie",
    });
  }

  const session = getSession(sessionId);
  if (!session?.token) {
    return res.status(401).json({
      message: "Unauthorized: No session token found",
    });
  }

  try {
    const planResponse = await axios.get(
      `${baseIP}/fetch_testplans/${userstory_ref_id}`,
      {
        headers: { Authorization: `Bearer ${session.token}` },
      }
    );

    const plans = planResponse.data?.plans?.plans || [];

    const plansWithSuites = await Promise.all(
      plans.map(async (plan) => {
        try {
          const suiteResponse = await axios.get(
            `${baseIP}/fetch_testsuite/${userstory_ref_id}/${plan.id}`,
            {
              headers: { Authorization: `Bearer ${session.token}` },
            }
          );

          return {
            ...plan,
            suites: suiteResponse.data?.suite || [],
          };
        } catch (error) {
          console.error(
            `Failed to fetch suite for plan ${plan.id}`,
            error.message
          );

          return {
            ...plan,
            suites: [],
          };
        }
      })
    );
    return res.status(200).json({
      success: true,
      plans: {
        count: plansWithSuites.length,
        plans: plansWithSuites,
      },
    });
  } catch (error) {
    console.error("Failed to fetch ADO test data:", error.message);

    return res.status(500).json({
      success: false,
      message: "Error fetching ADO test data",
    });
  }
};


export const us_submit_v2 = (req, res) => {
  const session = req.session;

  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(500).json({ message: 'File upload error', error: err.message });
    }

    const { data, pr_id, user_input, autopilot, key, additional_context } = req.body;
    const files = req.files;

    // Validate only mandatory fields
    if (!pr_id || !user_input || !autopilot) {
      return res.status(400).json({
        message: 'pr_id, user_input, and autopilot are mandatory fields',
      });
    }

    try {
      const form = new FormData();

      // Append mandatory fields
      form.append('pr_id', pr_id);
      form.append('user_input', user_input);
      form.append('autopilot', autopilot);

      // Append optional fields
      if (key) form.append('key', key);
      if (additional_context) form.append('additional_context', additional_context);

      // Append JSON data if provided
      if (data) {
        const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
        console.log('Appending JSON data:', JSON.stringify(jsonData, null, 2));
        form.append('data', JSON.stringify(jsonData), { contentType: 'application/json' });
      }

      // Append files if any
      if (files && files.length > 0) {
        files.forEach(file => {
          console.log('Appending file:', file.originalname);
          form.append('files', fs.createReadStream(file.path), {
            filename: file.originalname,
            contentType: file.mimetype,
          });
        });
      }

      // Send request to Java backend
      const response = await axios.post(`${baseIP}/process/v2`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${session.token}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      // Cleanup uploaded files
      if (files) files.forEach(file => fs.existsSync(file.path) && fs.unlinkSync(file.path));

      res.json({
        message: response.data,
        // request_id: response.data.request_id,
      });

    } catch (error) {
      console.error('Failed to onboard project:', error.response?.data || error.message);

      if (files) files.forEach(file => fs.existsSync(file.path) && fs.unlinkSync(file.path));

      res.status(error.response?.status || 500).json({
        message: error.response?.data?.message || 'Error onboarding project',
      });
    }
  });
};

