import React from 'react';

const SearchBar = ({ value, onSearch }) => {
  return (
    <input
      type="text"
      className="mb-4 p-2 border rounded"
      placeholder="Search..."
      value={value}
      onChange={(e) => onSearch(e.target.value)}
    />
  );
};

export default SearchBar;
