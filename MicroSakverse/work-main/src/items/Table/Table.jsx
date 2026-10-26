import React from 'react';

const ThirdTable = ({ onClose, thirdTableData }) => {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Step Details</h2>
        <p><strong>Step ID:</strong> {thirdTableData.step_id}</p>
        <p><strong>Error Message:</strong> {thirdTableData.error_message}</p>

        {/* Display the screenshot if available */}
        {thirdTableData.screenshot ? (
          <div className="mt-4">
            <img
              src={thirdTableData.screenshot}
              alt="Screenshot"
              className="w-full h-auto border border-gray-300 rounded-md"
            />
          </div>
        ) : (
          <p>No screenshot available.</p>
        )}

        <button
          className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ThirdTable;
