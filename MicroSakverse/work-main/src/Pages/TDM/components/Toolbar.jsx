// pages/tdm/components/Toolbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faBars, faTable, faPlus, faChevronLeft, faChevronRight, 
    faTimes, faFolderOpen, faSearch, faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { useTDM } from '../../../Hooks/TDM/tdm';
import CreateTableModal from './CreateTableModal';
import showToast from '../../../items/ToastMessage/toastUtil';

const Toolbar = ({ 
    toggleSidebar, 
    repoData, 
    selectedRepoId, 
    onTableSelect, 
    onTableDelete, 
    selectedTableId,
    setSelectedTablename,
    repositories = [],
    onRepoSelect 
}) => {
    const { deleteTable, getRepositories } = useTDM();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tables, setTables] = useState(repoData || []);
    const [deleteTableId, setDeleteTableId] = useState(null);
    const [showLeftScroll, setShowLeftScroll] = useState(false);
    const [showRightScroll, setShowRightScroll] = useState(false);
    const scrollRef = useRef(null);
    
    // ─── Search States ────────────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [highlightedTableId, setHighlightedTableId] = useState(null);
    const [pendingTableSelection, setPendingTableSelection] = useState(null); // ─── NEW ───
    const searchInputRef = useRef(null);
    const searchDropdownRef = useRef(null);

    useEffect(() => {
        if (repoData) setTables(repoData);
    }, [repoData]);

    // ─── Handle pending table selection after repo switch ──────────────
    useEffect(() => {
        if (pendingTableSelection && tables.length > 0) {
            // Find the table in the current tables list
            const tableExists = tables.some(t => t.table_id === pendingTableSelection.table_id);
            if (tableExists) {
                // Select the table
                onTableSelect(pendingTableSelection.table_id);
                setSelectedTablename(pendingTableSelection.table_name);
                
                // Scroll and highlight
                setTimeout(() => {
                    setHighlightedTableId(pendingTableSelection.table_id);
                    scrollToTableTab(pendingTableSelection.table_id);
                }, 200);
                
                showToast(` Found "${pendingTableSelection.table_name}" in "${pendingTableSelection.repo_name}"`, 'success');
                setPendingTableSelection(null);
            }
        }
    }, [tables, pendingTableSelection, onTableSelect, setSelectedTablename]);

    // ─── Click outside to close search dropdown ────────────────────────
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ─── Clear highlight after 3 seconds ──────────────────────────────
    useEffect(() => {
        if (highlightedTableId) {
            const timer = setTimeout(() => setHighlightedTableId(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [highlightedTableId]);

    const checkScrollButtons = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftScroll(scrollLeft > 0);
            setShowRightScroll(scrollLeft + clientWidth < scrollWidth - 10);
        }
    };

    useEffect(() => {
        checkScrollButtons();
        window.addEventListener('resize', checkScrollButtons);
        return () => window.removeEventListener('resize', checkScrollButtons);
    }, [tables]);

    const handleOpenModal = () => {
        if (selectedRepoId) {
            setIsModalOpen(true);
        } else {
            showToast('Please select a repository first', 'error');
        }
    };

    const handleTableCreate = async () => {
        setIsModalOpen(false);
        try {
            const data = await getRepositories();
            const updatedRepo = data.repositories?.find(repo => repo.repo_id === Number(selectedRepoId));
            setTables(updatedRepo ? updatedRepo.tables : []);
            showToast("Table created successfully", 'success');
        } catch (error) {
            showToast('Failed to refresh tables', 'error');
        }
    };

    const deleteTableHandler = async () => {
        if (!deleteTableId) return;
        try {
            await deleteTable(deleteTableId);
            showToast("Table deleted successfully", 'success');
            onTableDelete(deleteTableId);
            setTables(prev => prev.filter(table => table.table_id !== deleteTableId));
        } catch (error) {
            showToast("Failed to delete table", 'error');
        }
        setDeleteTableId(null);
    };

    const scroll = (direction) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
        }
    };

    // ─── Scroll to table tab ──────────────────────────────────────────────
    const scrollToTableTab = (tableId) => {
        const tabElement = document.querySelector(`[data-table-id="${tableId}"]`);
        if (tabElement && scrollRef.current) {
            const container = scrollRef.current;
            const tabRect = tabElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const scrollLeft = tabRect.left - containerRect.left + container.scrollLeft - 20;
            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
    };

    // ─── Search Functionality ──────────────────────────────────────────────
    const performSearch = (searchValue) => {
        setSearchTerm(searchValue);
        
        if (!searchValue.trim() || !repositories?.length) {
            setSearchResults([]);
            setShowSearchDropdown(false);
            return;
        }

        setIsSearching(true);
        const lowerSearch = searchValue.toLowerCase().trim();
        const results = [];
        
        for (const repo of repositories) {
            for (const table of (repo.tables || [])) {
                if (table.table_name.toLowerCase().includes(lowerSearch)) {
                    results.push({
                        repo_name: repo.repo_name,
                        repo_id: repo.repo_id,
                        table_id: table.table_id,
                        table_name: table.table_name,
                        match_type: table.table_name.toLowerCase() === lowerSearch ? 'exact' : 'partial'
                    });
                }
            }
        }
        
        results.sort((a, b) => {
            if (a.match_type === 'exact' && b.match_type !== 'exact') return -1;
            if (a.match_type !== 'exact' && b.match_type === 'exact') return 1;
            return a.table_name.localeCompare(b.table_name);
        });
        
        setSearchResults(results);
        setShowSearchDropdown(results.length > 0);
        setIsSearching(false);
    };

    const handleSearchSelect = (result) => {
        setShowSearchDropdown(false);
        setSearchTerm('');
        setSearchResults([]);
        
        // Check if table is in current repository
        const isInCurrentRepo = result.repo_id === selectedRepoId;
        
        if (isInCurrentRepo) {
            // Same repository - select table directly
            onTableSelect(result.table_id);
            setSelectedTablename(result.table_name);
            
            setTimeout(() => {
                setHighlightedTableId(result.table_id);
                scrollToTableTab(result.table_id);
            }, 200);
            
            showToast(`Found "${result.table_name}"`, 'success');
        } else {
            // Different repository - need to switch first
            const repo = repositories.find(r => r.repo_id === result.repo_id);
            if (repo) {
                // ─── KEY FIX: Store pending selection BEFORE switching ───
                setPendingTableSelection({
                    table_id: result.table_id,
                    table_name: result.table_name,
                    repo_name: result.repo_name
                });
                
                // Switch repository
                onRepoSelect(result.repo_id, repo.tables, repo.repo_name);
                showToast(`🔄 Switching to repository: ${result.repo_name}`, 'info');
            }
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter' && searchResults.length > 0) {
            handleSearchSelect(searchResults[0]);
        }
        if (e.key === 'Escape') {
            setShowSearchDropdown(false);
            setSearchTerm('');
            searchInputRef.current?.blur();
        }
    };

    const selectedTable = tables.find(t => t.table_id === selectedTableId);

    return (
        <div className="bg-white border-b border-gray-200">
            {/* Top Bar */}
            <div className="px-4 py-2 flex items-center justify-between gap-4">
                {/* Left side - Repo info */}
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <button 
                        onClick={toggleSidebar} 
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
                    >
                        <FontAwesomeIcon icon={faBars} />
                    </button>
                    
                    {selectedRepoId ? (
                        <div className="flex items-center space-x-2 text-sm truncate">
                            <FontAwesomeIcon icon={faFolderOpen} className="text-amber-500 flex-shrink-0" />
                            <span className="text-gray-600 flex-shrink-0">Repo:</span>
                            <span className="font-medium truncate">{selectedRepoId}</span>
                            {selectedTable && (
                                <>
                                    <span className="text-gray-400 flex-shrink-0">/</span>
                                    <FontAwesomeIcon icon={faTable} className="text-blue-500 text-xs flex-shrink-0" />
                                    <span className="font-medium truncate">{selectedTable.table_name}</span>
                                </>
                            )}
                        </div>
                    ) : (
                        <span className="text-sm text-gray-400">No repository selected</span>
                    )}
                </div>

                {/* Right side - Search + Actions */}
                <div className="flex items-center gap-3" ref={searchDropdownRef}>
                    {/* Search Input */}
                    <div className="relative">
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
                                        setShowSearchDropdown(true);
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
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSearchResults([]);
                                        setShowSearchDropdown(false);
                                        searchInputRef.current?.focus();
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <FontAwesomeIcon icon={faTimes} size="xs" />
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
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
                                        onClick={() => {
                                            setShowSearchDropdown(false);
                                            setSearchTerm('');
                                        }}
                                        className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Clear Search
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Create Table Button */}
                    {selectedRepoId ? (
                        <button 
                            onClick={handleOpenModal} 
                            className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex-shrink-0"
                        >
                            <FontAwesomeIcon icon={faPlus} className="mr-2 text-xs" />
                            Create Table
                        </button>
                    ) : (
                        <button disabled className="px-3 py-1.5 bg-gray-100 text-gray-400 text-sm rounded-lg cursor-not-allowed">
                            Select Repository First
                        </button>
                    )}
                </div>
            </div>

            {/* Table Tabs */}
            {tables.length > 0 && (
                <div className="px-2 pb-2">
                    <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                        {showLeftScroll && (
                            <button onClick={() => scroll('left')} className="px-2 py-1.5 text-gray-500 hover:bg-gray-200 rounded flex-shrink-0">
                                <FontAwesomeIcon icon={faChevronLeft} />
                            </button>
                        )}
                        
                        <div ref={scrollRef} onScroll={checkScrollButtons} className="flex overflow-x-auto gap-1 py-1 hide-scrollbar" style={{ flex: 1 }}>
                            {tables.map((table) => {
                                const isHighlighted = highlightedTableId === table.table_id;
                                const isSelected = selectedTableId === table.table_id;
                                
                                return (
                                    <div key={table.table_id} className="group relative flex-shrink-0">
                                        <button
                                            data-table-id={table.table_id}
                                            onClick={() => {
                                                onTableSelect(table.table_id);
                                                setSelectedTablename(table.table_name);
                                                setHighlightedTableId(null);
                                            }}
                                            className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-all ${
                                                isSelected
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : isHighlighted
                                                    ? 'bg-yellow-300 text-gray-800 shadow-lg ring-2 ring-yellow-500 ring-offset-2 animate-pulse'
                                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                            }`}
                                        >
                                            <FontAwesomeIcon 
                                                icon={faTable} 
                                                className={`mr-2 text-xs ${
                                                    isSelected ? 'text-white' : 
                                                    isHighlighted ? 'text-yellow-600' : 'text-blue-500'
                                                }`} 
                                            />
                                            <span className="truncate max-w-[150px]">{table.table_name}</span>
                                        </button>
                                        <button
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setDeleteTableId(table.table_id); 
                                            }}
                                            className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full shadow-md border opacity-0 group-hover:opacity-100 hover:bg-red-50 transition"
                                        >
                                            <FontAwesomeIcon icon={faTimes} size="xs" className="text-gray-500 hover:text-red-600" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {showRightScroll && (
                            <button onClick={() => scroll('right')} className="px-2 py-1.5 text-gray-500 hover:bg-gray-200 rounded flex-shrink-0">
                                <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {tables.length === 0 && selectedRepoId && (
                <div className="px-4 pb-4">
                    <div className="bg-gray-50 rounded-lg p-6 text-center border">
                        <p className="text-sm text-gray-500">No tables yet. Click "Create Table" to start.</p>
                    </div>
                </div>
            )}

            {/* Modals */}
            {isModalOpen && (
                <CreateTableModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    repoId={selectedRepoId} 
                    onTableCreate={handleTableCreate} 
                />
            )}

            {deleteTableId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-5 max-w-sm">
                        <h3 className="text-lg font-semibold mb-2">Delete Table</h3>
                        <p className="text-gray-600 mb-4">Are you sure you want to delete this table? This action cannot be undone.</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteTableId(null)} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200">
                                Cancel
                            </button>
                            <button onClick={deleteTableHandler} className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .hide-scrollbar::-webkit-scrollbar { height: 4px; }
                .hide-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
                .hide-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                .animate-pulse {
                    animation: pulse 0.8s ease-in-out 3;
                }
            `}</style>
        </div>
    );
};

export default Toolbar;