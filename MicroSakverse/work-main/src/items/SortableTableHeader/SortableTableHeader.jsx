import React from 'react';

const SortableTableHeader = ({ headers, onSort, currentSort }) => {
  const handleSort = (key) => {
    const order = currentSort.key === key && currentSort.order === 'asc' ? 'desc' : 'asc';
    onSort(key, order);
  };

  return (
    <thead className="bg-gray-200">
      <tr className="text-left">
        {headers.map((header) => (
          <th
            key={header.key}
            className="py-2 px-4 border-b cursor-pointer"
            onClick={() => handleSort(header.key)}
          >
            {header.label}
            {currentSort.key === header.key && (
              <span className={`ml-2 ${currentSort.order === 'asc' ? '▲' : '▼'}`} />
            )}
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default SortableTableHeader;
