import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ProjOnboard from './projOnboard';
import UserOnboard from './UserOnboard';

const Onboarding = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'home';

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8 space-y-6 text-white">
      {/* Breadcrumb Navigation */}
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center space-x-2">
          <li className="inline-flex items-center">
            <a href="/Admin" className="hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              DASHBOARD
            </a>
          </li>
          <li>
            <div className="flex items-center">
              <svg
                className="w-3 h-3 mx-2"
                aria-hidden="true"
                viewBox="0 0 6 10"
                fill="none"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 9 4-4-4-4"
                />
              </svg>
              {/* <a href="/Admin/Onboarding" className="hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                ONBOARDING
              </a> */}
            </div>
          </li>
          {activeTab !== 'home' && (
            <li>
              <div className="flex items-center">
                <svg
                  className="w-3 h-3 mx-2"
                  aria-hidden="true"
                  viewBox="0 0 6 10"
                  fill="none"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 9 4-4-4-4"
                  />
                </svg>
                <span className="text-blue-700 dark:text-blue-300 font-semibold">
                  {activeTab === 'project' ? 'PROJECT ONBOARDING' : 'USER ONBOARDING'}
                </span>
              </div>
            </li>
          )}
        </ol>
      </nav>

      {/* Conditional Rendering */}
      {activeTab === 'project' ? (
        <ProjOnboard />
      ) : activeTab === 'user' ? (
        <UserOnboard />
      ) : (
        <>
          <div className="flex justify-center text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Welcome to the Onboarding Page
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => setSearchParams({ tab: 'project' })}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition"
            >
              Project Onboarding
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'user' })}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
            >
              User Onboarding
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Onboarding;
