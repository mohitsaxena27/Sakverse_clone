export const createEmptyRow = (headers) => {
    const row = {};
    headers.forEach(h => row[h] = '');
    return row;
};

export const validateNewRow = (row, headers) => {
    return headers.some(h => !row[h]?.toString().trim());
};

export const getCellAddress = (tableName, rowIndex, header) => {
    return `{${tableName}.${rowIndex + 1}.${header}}`;
};

export const formatCellValue = (value) => {
    return value != null && value !== '' ? String(value) : '—';
};