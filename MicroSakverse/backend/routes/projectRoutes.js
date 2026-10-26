import express from 'express';
import { verifySession } from '../middleware/authMiddleware.js';
import  {checkProjectAccess, checkSession}  from '../middleware/checkProjectAccess.js';
import {    US_List, 
            Get_update, 
            Download_Excel, 
            us_submit, 
            jira, 
            updateQnA,  
            acceptTestCase , 
            updateUserStory, 
            updateRequirement,
            updateTestCase,
            publishTestCase,
            requirement_List,
            getJiraDetails,
            publishUserStory,
            nextStep,
            Get_testcase,
            getTestConfiguration,
            Ado_fetch_testplans,
            Ado_fetch_testsuite,
            Ado_fetch_testdata ,
            us_submit_v2
        }
from '../controllers/projectController.js'; 




const router = express.Router();

router.get('/us_list',checkSession, verifySession , checkProjectAccess, US_List);
router.get('/Get_update',checkSession, verifySession , checkProjectAccess, Get_update);
router.get('/Get_testcase',checkSession, verifySession , checkProjectAccess, Get_testcase);
router.get('/requirement_list',checkSession, verifySession , checkProjectAccess, requirement_List);
router.get('/DownloadUserstory',checkSession, verifySession , checkProjectAccess, Download_Excel);
router.post('/us_submit',checkSession, verifySession , us_submit,checkProjectAccess); 
// router.get('/externalstories/:pr_id', checkSession, verifySession, checkProjectAccess, getJiraDetails);
router.get('/externalstories/:pr_id', getJiraDetails,verifySession);
router.post('/nextStep/:user_story_ref', nextStep);
router.get('/jira', jira);
router.post('/Accept_Testcase',checkSession, verifySession, acceptTestCase); 
router.post('/updateQueries',checkSession, verifySession, updateQnA); 
router.post('/update_us',checkSession, verifySession, updateUserStory); 
router.post('/update_r',checkSession, verifySession, updateRequirement);
router.post('/update_tc',checkSession, verifySession, updateTestCase); 
router.post('/publish',checkSession, verifySession, publishTestCase); 
router.post('/appendUS' ,publishUserStory,verifySession ); 
router.get('/TestConfigurations/:userstory_ref_id', getTestConfiguration,verifySession);
router.get('/Ado_fetch_testplans/:userstory_ref_id', Ado_fetch_testplans,verifySession);
router.get('/Ado_fetch_testsuite/:userstory_ref_id/:plan_id', Ado_fetch_testsuite,verifySession);
router.get('/Ado_fetch_testdata/:userstory_ref_id',Ado_fetch_testdata,verifySession);
router.post('/us_submit_v2',checkSession, verifySession , us_submit_v2,checkProjectAccess,verifySession); 

export default router;