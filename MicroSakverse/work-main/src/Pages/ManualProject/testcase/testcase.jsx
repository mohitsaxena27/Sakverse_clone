import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';


const APIURL = import.meta.env.VITE_API_URL;
const PORT = import.meta.env.VITE_BACKEND_PORT;

// Correct template literal
const API_BASE = `/sakverse`;

const TestCasePage = () => {
  const [searchParams] = useSearchParams();
  const [testCase, setTestCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pr_id = searchParams.get('pr_id');
  const selectedStoryId = searchParams.get('selectedStoryId');
  const testcaseid = searchParams.get('testcaseid');

  useEffect(() => {
    const fetchTestCase = async () => {
      if (!pr_id || !selectedStoryId || !testcaseid) {
        setError('Missing required query parameters');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/project/Get_testcase?pr_id=${pr_id}&selectedStoryId=${selectedStoryId}&testcaseid=${testcaseid}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );
        if (!response.ok) throw new Error('Failed to fetch test case');
        const data = await response.json();
        setTestCase(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTestCase();
  }, [pr_id, selectedStoryId, testcaseid]);

  // Priority badge styling
  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading test case details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-xl shadow-md border border-red-100">
          <div className="flex items-center justify-center text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-center text-xl font-semibold text-gray-800 mb-2">Error Loading Test Case</h2>
          <p className="text-center text-gray-600 bg-red-50 p-3 rounded-lg">{error}</p>
          <p className="text-center text-gray-500 text-sm mt-4">
            Please verify the parameters and try again
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className=" min-h-screen  bg-gradient-to-br from-gray-50 to-gray-100 py-8 pt-12">
      <div className="w-full mx-auto">
        {/* Header Card */}
        <div className="bg-white  shadow-lg overflow-hidden mb-6 border border-gray-200">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center pt-16">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Test Case Details
              </h1>
              <div className="mt-2 flex flex-wrap items-center">
                <span className="bg-indigo-500/20 text-indigo-100 px-3 py-1 rounded-full text-sm font-medium mr-3 mb-2">
                  ID: #{testCase.id}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border mb-2 ${getPriorityStyle(testCase.priority)}`}>
                  Priority: {testCase.priority}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2 ${testCase.accepted ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                  {testCase.accepted ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Accepted
                    </>
                  ) : 'Pending Acceptance'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-16">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Requirement Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-start mb-4">
                <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Requirement Summary</h2>
              </div>
              <p className="text-gray-700 pl-11">{testCase.requirment_summary}</p>
            </div>

            {/* Test Details */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-start mb-4">
                <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Test Details</h2>
              </div>
              
              <div className="pl-11 space-y-5">
                <div>
                  <h3 className="font-medium text-gray-700 mb-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Technique
                  </h3>
                  <p className="text-gray-800 ml-6">{testCase.technique}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    Summary
                  </h3>
                  <p className="text-gray-800 ml-6">{testCase.summary}</p>
                </div>
              </div>
            </div>
            
            {/* Test Steps */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-start mb-4">
                <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Test Steps</h2>
              </div>
              
              <div className="pl-11">
                <ol className="space-y-3">
                  {testCase.test_steps.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <span className="bg-indigo-50 text-indigo-800 font-medium rounded-full h-6 w-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            {/* Expected Result */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-start mb-4">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Expected Result</h2>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                <p className="text-green-800 font-medium">{testCase.expected_result}</p>
              </div>
            </div>
            
            {/* Test Data */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-start mb-4">
                <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Test Data</h2>
              </div>
              
              <div className="pl-11">
                <ul className="space-y-2">
                  {testCase.test_data.map((data, index) => (
                    <li key={index} className="flex items-start">
                      <div className="bg-gray-100 rounded-full h-5 w-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <div className="h-1.5 w-1.5 bg-gray-500 rounded-full"></div>
                      </div>
                      <span className="text-gray-700">{data}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Additional Info */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Additional Information</h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="text-gray-600">Project ID</span>
                  <span className="font-medium">{pr_id}</span>
                </div>
                
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="text-gray-600">Story ID</span>
                  <span className="font-medium">{selectedStoryId}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCasePage;