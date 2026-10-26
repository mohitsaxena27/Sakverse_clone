import React from 'react'

const Failed = ({ onExecute} ) => {
  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
    <div className="bg-gray-900 border border-gray-800 shadow-xl rounded-xl p-8 max-w-md w-full text-center">
      
      <div className="flex justify-center mb-4">
        <svg
          className="h-10 w-10 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
          />
        </svg>
      </div>

      <h1 className="text-xl font-semibold text-gray-100 mb-2">
        Execution Failed
      </h1>

      <p className="text-sm text-gray-400 mb-6">
        The execution couldn’t be completed.  
        Please try again or review the logs.
      </p>

      <button
        onClick={onExecute}
        className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        Re-try
      </button>

    </div>
  </div>
  )
}

export default Failed