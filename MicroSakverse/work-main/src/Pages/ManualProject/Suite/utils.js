export const getSuiteId = (suite) => suite.suite_id ?? suite.id;

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  const utcDateString =
    !dateString.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(dateString)
      ? `${dateString}Z`
      : dateString;

  const date = new Date(utcDateString);

  if (isNaN(date)) return dateString;

  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

export const formatDuration = (start, end) => {
  if (!start || !end) return 'N/A';
  const ms = new Date(end) - new Date(start);
  if (isNaN(ms) || ms < 0) return 'N/A';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

export const truncateMiddle = (str, keep = 8) => {
  if (!str || str.length <= keep * 2 + 3) return str || '';
  return `${str.slice(0, keep)}…${str.slice(-keep)}`;
};

export const looksLikeBase64Image = (str) => {
  if (!str || typeof str !== 'string') return false;
  if (str.startsWith('data:image')) return true;
  const cleaned = str.replace(/\s/g, '');
  return cleaned.length > 100 && /^[A-Za-z0-9+/]+=*$/.test(cleaned);
};

export const toImageSrc = (str) => {
  if (!str) return null;
  if (str.startsWith('data:image')) return str;
  if (looksLikeBase64Image(str)) return `data:image/png;base64,${str.replace(/\s/g, '')}`;
  return null;
};

export const extractSuiteList = (response) => {
  if (!response) return { list: [], total: 0 };
  if (Array.isArray(response)) return { list: response, total: response.length };
  const list = response.suites || response.data?.suites || [];
  const total = response.total_suites ?? response.data?.total_suites ?? list.length;
  return { list, total };
};