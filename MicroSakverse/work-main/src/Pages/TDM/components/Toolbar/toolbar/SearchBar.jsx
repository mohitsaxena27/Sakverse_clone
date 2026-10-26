// pages/tdm/components/toolbar/SearchBar.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSpinner, faTimes, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const SearchBar = ({
    searchTerm,
    isSearching,
    searchResults,
    showSearchDropdown,
    selectedRepoId,
    searchInputRef,
    searchDropdownRef,
    performSearch,
    handleSearchSelect,
    handleSearchKeyDown,
    clearSearch,
    repositories
}) => {
    return (
        <div className="relative" ref={searchDropdownRef}>
            <div className="relative">
                <FontAwesomeIcon 
                    icon={faSearch} 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                />
                <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => performSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    onFocus={() => {
                        if (searchTerm.trim() && searchResults.length > 0) {
                            // show dropdown logic handled by parent
                        }
                    }}
                    placeholder="Search Test Case ID..."
                    className="w-64 pl-9 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition"
                    disabled={!repositories?.length}
                />
                
                {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <FontAwesomeIcon icon={faSpinner} spin className="text-gray-400" />
                    </div>
                )}
                
                {searchTerm && !isSearching && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <FontAwesomeIcon icon={faTimes} size="xs" />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute top-full right-0 mt-2 w-[500px] max-h-[400px] overflow-y-auto bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
                    <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between">
                        <span className="text-xs font-medium text-gray-600">
                            Found {searchResults.length} result{searchResults.length > 1 ? 's' : ''}
                        </span>
                        <span className="text-[10px] text-gray-400">Enter to select first</span>
                    </div>
                    
                    {searchResults.map((result, idx) => {
                        const isInCurrentRepo = result.repo_id === selectedRepoId;
                        return (
                            <button
                                key={`${result.repo_id}-${result.table_id}-${idx}`}
                                onClick={() => handleSearchSelect(result)}
                                className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-start gap-3 group"
                            >
                                <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                                    result.match_type === 'exact' ? 'bg-green-500' : 'bg-blue-400'
                                }`} />
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm text-gray-800">
                                            {result.table_name}
                                        </span>
                                        {result.match_type === 'exact' && (
                                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                                Exact Match
                                            </span>
                                        )}
                                        {!isInCurrentRepo && (
                                            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                                                Switch Repo
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500">📁 {result.repo_name}</span>
                                </div>
                                
                                <FontAwesomeIcon 
                                    icon={faChevronRight} 
                                    className="text-gray-300 group-hover:text-blue-500 transition-colors mt-1"
                                    size="xs"
                                />
                            </button>
                        );
                    })}
                </div>
            )}

            {/* No Results */}
            {showSearchDropdown && searchResults.length === 0 && searchTerm.trim() && !isSearching && (
                <div className="absolute top-full right-0 mt-2 w-[400px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 p-6 text-center">
                    <div className="text-gray-400">
                        <FontAwesomeIcon icon={faSearch} className="text-4xl mb-3 text-gray-300" />
                        <p className="font-medium text-gray-600">No test cases found</p>
                        <p className="text-xs text-gray-400 mt-1">
                            No table matches "<span className="font-medium">{searchTerm}</span>"
                        </p>
                        <button
                            onClick={clearSearch}
                            className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Clear Search
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;