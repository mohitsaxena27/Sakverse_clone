import React, { useEffect, useState } from 'react';
import { useRequirementGraph } from '../../../Hooks/Manual/UserData';

const Table = ({ selectedStoryId, projectId }) => {
  const [dashboardData, setDashboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false); // accordion state

  const { requirementTable } = useRequirementGraph();

  const getDashBoard = async (projectId, selectedStoryId) => {
    try {
      const response = await requirementTable(projectId, selectedStoryId);
      if (response.status === 200) {
        return response.data.message;
      } else {
        throw new Error(response.message || "Failed to fetch dashboard data.");
      }
    } catch (error) {
      setError(error.message);
      return [];
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);

      if (!projectId || !selectedStoryId) {
        setError("Project ID and Story ID are required.");
        setIsLoading(false);
        return;
      }

      const data = await getDashBoard(projectId, selectedStoryId);
      setDashboardData(data);
      setIsLoading(false);
    };

    fetchDashboardData();
  }, [projectId, selectedStoryId]);

  return (
    <div className="w-full px-4 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 w-full text-white px-4 py-2 rounded-md font-semibold text-sm shadow hover:bg-gray-700 transition"
      >
        {isOpen ? 'Hide Requirement Table' : 'View Requirement Table'}
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-full mt-4' : 'max-h-0'
        }`}
      >
        {isLoading ? (
          <p className="text-center text-sm font-semibold py-4">Loading...</p>
        ) : error ? (
          <p className="text-center text-sm text-red-500 py-4">{error}</p>
        ) : (
          <div className="overflow-x-auto border border-gray-900 shadow-lg rounded-lg">
            <table className="table-auto w-full divide-y divide-gray-300">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Feature</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold uppercase">Test Cases</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold uppercase">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {dashboardData.length > 0 ? (
                  dashboardData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-100 transition-all">
                      <td className="px-3 py-2 text-xs font-medium text-gray-900">{item.feature}</td>
                      <td className="px-3 py-2 text-xs text-center text-gray-700">{item.Testcase_count}</td>
                      <td className="px-3 py-2 text-xs text-center text-gray-700">
                        {item.Testcase_count > 0 ? '✅' : '❌'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-4 py-4 text-center text-sm text-gray-500">
                      No data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Table;
