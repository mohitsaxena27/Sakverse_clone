import React, { useState, useMemo } from 'react';
import { useAutomationFlow } from '../../../Hooks/Automation/Automation';


const StatusBadge = ({ status }) => {
  const colors = {
    Completed: 'green',
    'In Progress': 'blue',
    Error: 'red',
    default: 'gray',
  };

  const color = colors[status] || colors.default;

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800 border border-${color}-200`}
    >
      {status}
    </span>
  );
};

// Progress Overview Card
const MetricCard = ({
  label,
  value,
  color,
}) => (
  <div className="border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
    <div
      className={`text-2xl font-bold text-${color}-600`}
    >
      {value}
    </div>

    <div className="text-sm text-gray-600 mt-1">
      {label}
    </div>
  </div>
);

// Integration Card
const IntegrationCard = ({
  tool,
  type,
  enabled,
}) => (
  <div className="bg-white border border-gray-400 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-gray-900">
        {tool}
      </h3>

      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          enabled
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-gray-100 text-gray-800 border border-gray-200'
        }`}
      >
        {enabled ? 'Active' : 'Inactive'}
      </span>
    </div>

    <p className="mt-1 text-xs text-gray-600">
      {type}
    </p>
  </div>
);

// Story Row
const StoryRow = ({
  story,
  isExpanded,
  toggleRow,
  onSelect,
}) => {
  const truncate = (text, max = 100) =>
    !text
      ? ''
      : text.length <= max
      ? text
      : text.slice(0, max) + '...';

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => onSelect(story._id)}
          className="text-sm font-mono text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          {String(story._id).slice(-8)}
        </button>
      </td>

      <td className="px-6 py-4">
        {isExpanded
          ? story.detail
          : truncate(story.detail)}
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={story.status} />
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <button
          onClick={() => toggleRow(story._id)}
          className="text-indigo-600 hover:text-indigo-800 mr-4"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>

        <button
          onClick={() => onSelect(story._id)}
          className="text-indigo-600 hover:text-indigo-800"
        >
          View
        </button>
      </td>
    </tr>
  );
};

const Home = ({
  setSelectedStory,
  projectId,
  userStories = [],
  currentProject = {},
}) => {
  const [expandedRows, setExpandedRows] =
    useState([]);

  const [reportLoading, setReportLoading] =
    useState(false);

  const [suiteMessage, setSuiteMessage] =
    useState('');

  const {
    executeSuiteParallel,
    openSuiteReport,
  } = useAutomationFlow();

  const toggleRow = (id) =>
    setExpandedRows((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );

  const handleSelect = (id) => {
    const story = userStories.find(
      (s) => s._id === id
    );

    if (!story) return;

    setSelectedStory({
      id: story._id,
      detail: story.detail || '',
      referenceKey: story.reference_key,
      status: story.status,
      stage: story.stage || '',
      created: story.created || '',
      updated: story.updated || '',
    });

    sessionStorage.setItem(
      'user_story_ref',
      story._id.toString()
    );
  };

  // Run Test Suite
  const handleRunSuite = async () => {
    try {
      setSuiteMessage(
        'Your test suite execution has started.'
      );

      const payload = {
        execution_ids: [ 29,
        23,
        27,
        84,
        86,
        88,
        87,
        41,
        58,
        69,
        70,
        71,
        72,
        47,
        49,
        73,
        75,
        77,
        76,
        40,
        39,
        68,
        80,
        78,
        67,
        83,
        85,
        57,
        60,
        89],
      };

      const response =
        await executeSuiteParallel(payload);

      console.log(
        'Suite Execution Response:',
        response
      );

      setTimeout(() => {
        setSuiteMessage(
          'Test suite is running successfully.'
        );
      }, 1000);
    } catch (error) {
      console.error(
        'Failed to execute suite:',
        error
      );

      setSuiteMessage(
        'Failed to start test suite execution.'
      );
    }

    setTimeout(() => {
      setSuiteMessage('');
    }, 5000);
  };

  // Get Report + Download HTML
  const handleOpenReport = async () => {
    try {
      setReportLoading(true);

      const response = await openSuiteReport();

      const htmlContent =
        typeof response === 'string'
          ? response
          : response?.data || '';

      const blob = new Blob([htmlContent], {
        type: 'text/html',
      });

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement('a');

      link.href = url;

      link.download = `suite-report-${Date.now()}.html`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        'Failed to open suite report:',
        error
      );
    } finally {
      setReportLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = userStories.length;

    const completed = userStories.filter(
      (s) => s.status === 'Completed'
    ).length;

    const inProgress = userStories.filter(
      (s) => s.status === 'In Progress'
    ).length;

    const errored = userStories.filter(
      (s) => s.status === 'Error'
    ).length;

    return {
      total,
      completed,
      inProgress,
      errored,

      completionRate: total
        ? (
            (completed / total) *
            100
          ).toFixed(1)
        : 0,

      progressRate: total
        ? (
            (inProgress / total) *
            100
          ).toFixed(1)
        : 0,

      errorRate: total
        ? (
            (errored / total) *
            100
          ).toFixed(1)
        : 0,
    };
  }, [userStories]);

  const recentStories = userStories.slice(
    0,
    10
  );

  const lastStory = userStories[0];

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-gray-100 border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Project Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Overview of project progress and
            recent activity
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Project Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            'project_name',
            'project_type',
            'role',
          ].map((key, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-sm border border-gray-400 p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="text-sm font-medium text-gray-600">
                {key
                  .replace('_', ' ')
                  .toUpperCase()}
              </h3>

              <p className="text-lg font-semibold text-gray-900">
                {currentProject[key]}
              </p>
            </div>
          ))}
        </div>

        {/* Integrations */}
        {currentProject.integration?.length >
          0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentProject.integration.map(
              (i, idx) => (
                <IntegrationCard
                  key={idx}
                  {...i}
                />
              )
            )}
          </div>
        )}

        {/* Progress Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Progress Overview
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Total Tasks"
                value={metrics.total}
                color="gray"
              />

              <MetricCard
                label="Completed"
                value={metrics.completed}
                color="green"
              />

              <MetricCard
                label="In Progress"
                value={metrics.inProgress}
                color="blue"
              />

              <MetricCard
                label="Errors"
                value={metrics.errored}
                color="red"
              />
            </div>

            {[
              'Completion',
              'Progress',
              'Error',
            ].map((type, idx) => {
              const key =
                type.toLowerCase() + 'Rate';

              const color =
                type === 'Completion'
                  ? 'green'
                  : type === 'Progress'
                  ? 'blue'
                  : 'red';

              return (
                <div key={idx}>
                  <div className="flex justify-between mb-2 text-sm font-medium text-gray-700">
                    <span>{type} Rate</span>

                    <span>
                      {metrics[key]}%
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full bg-${color}-500 transition-all duration-300`}
                      style={{
                        width: `${metrics[key]}%`,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Latest Story */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Latest Story
            </h2>

            {lastStory ? (
              <div className="space-y-4">
                {[
                  '_id',
                  'reference_key',
                ].map(
                  (key, idx) =>
                    lastStory[key] && (
                      <div key={idx}>
                        <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                          {key.replace('_', ' ')}
                        </h3>

                        <p className="text-sm font-mono text-indigo-600 bg-indigo-50 p-2 rounded mt-1 truncate">
                          {lastStory[key]}
                        </p>
                      </div>
                    )
                )}

                <div>
                  <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Status
                  </h3>

                  <StatusBadge
                    status={lastStory.status}
                  />
                </div>

                {lastStory.detail && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Details
                    </h3>

                    <p className="text-gray-700 text-sm mt-1">
                      {lastStory.detail}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No stories yet.
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {/* <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={handleRunSuite}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              Run Test Suite
            </button>

            <button
              onClick={handleOpenReport}
              disabled={reportLoading}
              className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition flex items-center gap-2 ${
                reportLoading
                  ? 'bg-green-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {reportLoading && (
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>

                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
              )}

              {reportLoading
                ? 'Generating Report...'
                : 'Get Report'}
            </button>
          </div>
        </div> */}

        {/* Suite Message */}
        {suiteMessage && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
            {suiteMessage}
          </div>
        )}

        {/* Recent Stories Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent User Stories
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    'ID',
                    'Details',
                    'Status',
                    'Actions',
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {recentStories.length ? (
                  recentStories.map(
                    (story) => (
                      <StoryRow
                        key={story._id}
                        story={story}
                        isExpanded={expandedRows.includes(
                          story._id
                        )}
                        toggleRow={toggleRow}
                        onSelect={handleSelect}
                      />
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-8 text-center text-gray-400"
                    >
                      No user stories.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;