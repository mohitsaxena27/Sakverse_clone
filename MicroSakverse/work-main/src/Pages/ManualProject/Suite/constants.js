export const POLL_INTERVAL_MS = 300000;

export const STATUS_STYLES = {
  ACTIVE: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  INACTIVE: { badge: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
  PENDING: { badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
};

export const EXEC_STATUS_STYLES = {
  RUNNING: { badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500 animate-pulse' },
  PARTIAL: { badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  COMPLETED: { badge: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  FAILED: { badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  PENDING: { badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500 animate-pulse' },
  NOT_EXECUTED: { badge: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
};

export const CASE_STATUS_STYLES = {
  PASSED: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  FAILED: { badge: 'bg-red-50 text-red-700 border-red-200' },
  SKIPPED: { badge: 'bg-gray-50 text-gray-600 border-gray-200' },
  passed: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed: { badge: 'bg-red-50 text-red-700 border-red-200' },
  skipped: { badge: 'bg-gray-50 text-gray-500 border-gray-200' },
};

export const ACTION_STYLES = {
  navigation: 'bg-blue-50 text-blue-700 border-blue-200',
  input: 'bg-purple-50 text-purple-700 border-purple-200',
  custom: 'bg-orange-50 text-orange-700 border-orange-200',
  screenshot: 'bg-teal-50 text-teal-700 border-teal-200',
};

export const DEFAULT_STYLE = { badge: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' };

export const getStyle = (map, key) => map[key] || DEFAULT_STYLE;