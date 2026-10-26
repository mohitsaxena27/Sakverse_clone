import React from 'react';

const Pagination = ({ totalItems, itemsPerPage, currentPage, paginate }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <ul className="flex justify-center mt-4">
      {Array.from({ length: totalPages }, (_, i) => (
        <li key={i} className="mx-1">
          <button
            onClick={() => paginate(i + 1)}
            className={`px-3 py-1 border rounded ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-white'}`}
          >
            {i + 1}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default Pagination;
