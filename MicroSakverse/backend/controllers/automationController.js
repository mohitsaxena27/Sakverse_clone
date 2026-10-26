import axios from 'axios';
import dotenv from 'dotenv';
import { generateExecutionHTML  } from '../helper/Automation/automationHelper.js';

dotenv.config();
const NGROK_URL = process.env.NGROK_URL;
const baseIP = process.env.BASE_IP;


// ─────────────────────────────────────────────
// GET TEST SCENARIO
// ─────────────────────────────────────────────
export const GetTestScenario = async (req, res) => {
  const session = req.session;
  const { projectId, selectedStoryId, testCaseId } = req.query;

  if (!projectId || !selectedStoryId || !testCaseId) {
    return res.status(400).json({
      message: 'Missing required parameters',
    });
  }

  try {
    const response = await axios.get(`${baseIP}/get_update/`, {
      params: {
        pr_id: projectId,
        user_story_ref: selectedStoryId,
      },
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    const testcases = response?.data?.message?.test_cases || [];

    const testcase = testcases.find(
      (tc) => Number(tc.id) === Number(testCaseId)
    );

    if (!testcase) {
      return res.status(404).json({
        message: 'Test case not found',
      });
    }

    return res.json(testcase);
  } catch (error) {
    console.error('GetTestScenario error:', error.message);
    return res.status(500).json({
      message: 'Error fetching test scenario',
    });
  }
};


// ─────────────────────────────────────────────
// EXECUTE TEST
// ─────────────────────────────────────────────
export const ExecuteTest = async (req, res) => {
  const session = req.session;
  const body = req.body;

  if (!body?.instruction) {
    return res.status(400).json({ message: 'Missing instruction' });
  }

  try {
    const response = await axios.post(
      `${NGROK_URL}/execute-test`,
      body,
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('ExecuteTest error:', error.message);
    res.status(500).json({ message: 'Error processing the request' });
  }
};

export const CloneTest = async (req, res) => {
  const session = req.session;
  const body = req.body;

  if (!body?.source_execution_id) {
    return res.status(400).json({ message: 'Missing source_execution_id' });
  }

  try {
    const response = await axios.post(
      `${NGROK_URL}/clone-execution`,
      body,
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('CloneTest error:', error.message);
    res.status(500).json({ message: 'Error processing the request' });
  }
};


// ─────────────────────────────────────────────
// ADD STEPS TO TEST
// ─────────────────────────────────────────────
export const AddstepsToTest = async (req, res) => {
  const session = req.session;
  const body = req.body;

  if (!body?.user_intent_id) {
    return res.status(400).json({ message: 'Missing user_intent_id' });
  }

  try {
    const response = await axios.post(
      `${NGROK_URL}/add-step`,
      body,
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('AddstepsToTest error:', error.message);
    res.status(500).json({ message: 'Error processing the request' });
  }
};


// ─────────────────────────────────────────────
// GET TEST RESULT
// Returns execution result including planned_id
// and execution_order for each step
// ─────────────────────────────────────────────
export const GetTestResult = async (req, res) => {
  const session = req.session;
  const { testID } = req.params;

  if (!testID) {
    return res.status(400).json({ message: 'Missing testID parameter' });
  }

  try {
    const response = await axios.get(
      `${NGROK_URL}/execution-result/${testID}`,
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      }
    );

    // Response now includes planned_id and execution_order per step
    res.json(response.data);
  } catch (error) {
    console.error('GetTestResult error:', error.message);
    res.status(500).json({ message: 'Error fetching test result' });
  }
};


// ─────────────────────────────────────────────
// DELETE PLANNED STEP
// DELETE /delete-step/:plannedStepId
// ─────────────────────────────────────────────
export const DeletePlannedStep = async (req, res) => {
  const session = req.session;
  const { plannedStepId } = req.params;

  if (!plannedStepId) {
    return res.status(400).json({ message: 'Missing plannedStepId parameter' });
  }

  try {
    const response = await axios.delete(
      `${NGROK_URL}/delete-step/${plannedStepId}`,
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('DeletePlannedStep error:', error.message);
    res.status(500).json({ message: 'Error deleting planned step' });
  }
};


// ─────────────────────────────────────────────
// MOVE / REORDER PLANNED STEP
// PATCH /move-step/:plannedStepId?new_order=<position>
// ─────────────────────────────────────────────
export const MovePlannedStep = async (req, res) => {
  const session = req.session;
  const { plannedStepId } = req.params;
  const { new_order } = req.query;

  if (!plannedStepId) {
    return res.status(400).json({ message: 'Missing plannedStepId parameter' });
  }

  if (new_order === undefined || new_order === null || new_order === '') {
    return res.status(400).json({ message: 'Missing new_order query parameter' });
  }

  try {
    const response = await axios.put(
      `${NGROK_URL}/move-step/${plannedStepId}`,
      null, // no request body — order is passed as query param
      {
        params: { new_order },
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('MovePlannedStep error:', error.message);
    res.status(500).json({ message: 'Error updating step order' });
  }
};


// ─────────────────────────────────────────────
// UPDATE PLANNED INTENT
// PATCH /planned-intent/:plannedStepId
// Body: { intent, target, value }
// ─────────────────────────────────────────────
export const UpdatePlannedIntent = async (req, res) => {
  const session = req.session;
  const { plannedStepId } = req.params;
  const body = req.body;

  if (!plannedStepId) {
    return res.status(400).json({ message: 'Missing plannedStepId parameter' });
  }

// if (!body ||
//   (!body.intent || !body.target || !body.value || !body.enabled )) {
//   return res.status(400).json({
//     message: 'Request body must include at least one valid field',
//   });
// }

  try {
    const response = await axios.patch(
      `${NGROK_URL}/planned-intent/${plannedStepId}`,
      body,
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('UpdatePlannedIntent error:', error.message);
    res.status(500).json({ message: 'Error updating planned intent' });
  }
};


// ─────────────────────────────────────────────
// UPDATE EXECUTION STEP DETAILS
// PATCH /execution-step/:plannedStepId
// Body: { target, value }
// ─────────────────────────────────────────────
export const UpdateExecutionStep = async (req, res) => {
  const session = req.session;
  const { plannedStepId } = req.params;
  const body = req.body;

  if (!plannedStepId) {
    return res.status(400).json({ message: 'Missing plannedStepId parameter' });
  }

  if (!body || (!body.target && !body.value)) {
    return res.status(400).json({
      message: 'Request body must include at least one of: target, value',
    });
  }

  try {
    const response = await axios.patch(
      `${NGROK_URL}/execution-step/${plannedStepId}`,
      body,
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('UpdateExecutionStep error:', error.message);
    res.status(500).json({ message: 'Error updating execution step details' });
  }
};


// Execution
export const ExecuteSuiteParallel = async (req, res) => {
  const session = req.session;
  const body = req.body;

  try {
    const response = await axios.post(
      'http://10.154.2.83:8000/execute-test-parallel',
      body,
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('ExecuteSuiteParallel error:', error.message);

    res.status(500).json({
      message: 'Error executing suite in parallel',
    });
  }
};


// ─────────────────────────────────────────────
// GET /open-suite-report
export const OpenSuiteReport = async (req, res) => {
  const session = req.session;

  try {
    const response = await axios.get(
      'http://10.154.2.83:8000/suite-report/SMOKE/view',
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('OpenSuiteReport error:', error.message);

    res.status(500).json({
      message: 'Error fetching suite report',
    });
  }
};


// export const GeneratePDFReport = async (req, res) => {
//   const session = req.session;
//   const { executionId } = req.params;

//   if (!executionId) {
//     return res.status(400).json({ message: 'Missing executionId parameter' });
//   }

//   try {
//     // First, fetch the execution result
//     const response = await axios.get(
//       `${NGROK_URL}/execution-result/${executionId}`,
//       {
//         headers: {
//           Authorization: `Bearer ${session.token}`,
//         },
//       }
//     );

//     const data = response.data;
    
//     // Generate PDF from the data
//     const pdfBuffer = await generateExecutionPDF(data, executionId);

//     // Set headers for PDF download
//     const filename = `execution_report_${executionId}_${Date.now()}.pdf`;
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
//     res.setHeader('Content-Length', pdfBuffer.length);
    
//     res.send(pdfBuffer);
//   } catch (error) {
//     console.error('GeneratePDFReport error:', error.message);
//     res.status(500).json({ 
//       message: 'Error generating PDF report',
//       error: error.response?.data || error.message
//     });
//   }
// };

export const GenerateReport = async (req, res) => {
  try {
    const payload = req.body;

    // Validate that payload has results
    if (!payload || !payload.results) {
      return res.status(400).json({ 
        message: 'Invalid payload. "results" array is required' 
      });
    }

    // Generate HTML report
    const htmlContent = generateExecutionHTML(payload);

    // Send HTML response
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="execution_report_${Date.now()}.html"`);
    res.send(htmlContent);

  } catch (error) {
    console.error('GenerateReport error:', error.message);
    res.status(500).json({ 
      message: 'Error generating report',
      error: error.message
    });
  }
};