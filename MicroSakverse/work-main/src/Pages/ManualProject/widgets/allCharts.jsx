import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { useFetchData } from '../useFetchData';

const DynamicCharts = ({ selectedStoryId, projectId, selectedStatus }) => {
  const { data, isLoading, error } = useFetchData(selectedStoryId, projectId, selectedStatus);
  const [requirementDetailsData, setRequirementDetailsData] = useState([]);
  const [testCasesPerRequirementData, setTestCasesPerRequirementData] = useState([]);
  const [knowledgeExistenceData, setKnowledgeExistenceData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [totalTestCases, setTotalTestCases] = useState(0);

  // Utility to get priority color
  const getColorForPriority = (priority) => {
    const colors = {
      P1: '#EF4444', // Red
      P2: '#F59E0B', // Amber
      P3: '#10B981', // Teal
    };
    return colors[priority] || '#94A3B8'; // Default gray
  };

  // Process data when fetched
  useEffect(() => {
    if (!data) return;

    const requirementDetails = data.requirement_details || [];
    const testCases = data.test_cases || [];
    const qna = data.qna || [];

    // Requirement details
    const functionalCount = requirementDetails.filter((req) => req.type === 'Functional').length;
    const nonFunctionalCount = requirementDetails.filter((req) => req.type === 'Non-Functional').length;
    setRequirementDetailsData([
      { name: 'Functional', value: functionalCount, color: '#2563EB' },
      { name: 'Non-Functional', value: nonFunctionalCount, color: '#14B8A6' },
    ]);

    // Test cases count
    setTotalTestCases(testCases.length);

    // Test cases per requirement
    const reqCounts = testCases.reduce((acc, testCase) => {
      acc[testCase.requirment_id] = (acc[testCase.requirment_id] || 0) + 1;
      return acc;
    }, {});
    setTestCasesPerRequirementData(
      Object.entries(reqCounts).map(([reqId, count]) => ({ name: `Req ${reqId}`, value: count }))
    );

    // Knowledge existence
    const knowledgeExistCount = qna.filter((q) => q.knowledge_exist === 1).length;
    const knowledgeNotExistCount = qna.filter((q) => q.knowledge_exist === 0).length;
    setKnowledgeExistenceData([
      { name: 'Knowledge Exists', value: knowledgeExistCount, color: '#6366F1' },
      { name: 'Knowledge Gap', value: knowledgeNotExistCount, color: '#F43F5E' },
    ]);

    // Priority distribution
    const priorityCounts = testCases.reduce((acc, testCase) => {
      acc[testCase.priority] = (acc[testCase.priority] || 0) + 1;
      return acc;
    }, {});
    setPriorityData(
      Object.entries(priorityCounts).map(([priority, count]) => ({
        name: priority,
        value: count,
        color: getColorForPriority(priority),
      }))
    );
  }, [data]);

  if (isLoading) return <p className="text-center text-sm font-semibold">Loading...</p>;
  if (error) return <p className="text-center text-sm text-red-500">{error}</p>;

  return (
    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
      {/* Knowledge Existence */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Specification Risk</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={knowledgeExistenceData}
              dataKey="value"
              nameKey="name"
              innerRadius={40}
              outerRadius={80}
              label
            >
              {knowledgeExistenceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: '12px' }} />
            <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Requirement Details */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Requirement Details</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={requirementDetailsData}
              dataKey="value"
              nameKey="name"
              innerRadius={40}
              outerRadius={80}
              label
            >
              {requirementDetailsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: '12px' }} />
            <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Priority */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Test Cases by Priority</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={priorityData}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={80}
              label
            >
              {priorityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: '12px' }} />
            <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <text
              x={"50%"}
              y={"50%"}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: '18px', fontWeight: '600', fill: '#374151' }}
            >
              {totalTestCases}
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Test Cases per Requirement */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Test Cases / Requirement</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={testCasesPerRequirementData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: '12px' }} />
            <Bar dataKey="value" name="Testcases" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DynamicCharts;
