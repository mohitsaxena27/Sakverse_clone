// pages/tdm/components/Toolbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTDM } from '../../../../Hooks/TDM/tdm';
import { useToolbarSearch } from './hooks/useToolbarSearch';
import RepoInfo from './toolbar/RepoInfo';
import SearchBar from './toolbar/SearchBar';
import CreateTableButton from './toolbar/CreateTableButton';
import GenerateDataButton from './toolbar/GenerateDataButton';
import GenerateDataModal from '../GenerateDataModal';
import TableTabs from './toolbar/TableTabs';
import DeleteTableModal from './toolbar/DeleteTableModal';
import CreateTableModal from '../CreateTableModal';
import showToast from '../../../../items/ToastMessage/toastUtil';

const Toolbar = ({ 
    toggleSidebar, 
    repoData, 
    selectedRepoId, 
    onTableSelect, 
    onTableDelete, 
    selectedTableId,
    setSelectedTablename,
    repositories = [],
    onRepoSelect ,
    onRefresh,
}) => {
    const { deleteTable, getRepositories } = useTDM();
    const [tables, setTables] = useState(repoData || []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [deleteTableId, setDeleteTableId] = useState(null);
    const tableTabsRef = useRef(null);

    // ─── Search Hook ──────────────────────────────────────────────────────
    const {
        searchTerm,
        isSearching,
        searchResults,
        showSearchDropdown,
        highlightedTableId,
        pendingTableSelection,
        searchInputRef,
        searchDropdownRef,
        performSearch,
        handleSearchSelect,
        handleSearchKeyDown,
        clearSearch,
        setHighlightedTableId,
        setPendingTableSelection,
        setShowSearchDropdown,
        scrollToTableTab
    } = useToolbarSearch(repositories, selectedRepoId, onRepoSelect, onTableSelect, setSelectedTablename);

    useEffect(() => {
        if (repoData) setTables(repoData);
    }, [repoData]);

    // ─── Handle pending table selection after repo switch ──────────────
    useEffect(() => {
        if (pendingTableSelection && tables.length > 0) {
            const tableExists = tables.some(t => t.table_id === pendingTableSelection.table_id);
            if (tableExists) {
                // Select the table
                onTableSelect(pendingTableSelection.table_id);
                setSelectedTablename(pendingTableSelection.table_name);
                
                // ─── IMPROVED: Scroll and highlight with multiple attempts ───
                const attemptScroll = (attempt = 0) => {
                    const success = scrollToTableTab(pendingTableSelection.table_id, attempt);
                    if (!success && attempt < 3) {
                        // Retry with increasing delay
                        setTimeout(() => attemptScroll(attempt + 1), 200 * (attempt + 1));
                    }
                };
                
                // Start scrolling after a short delay to let DOM update
                setTimeout(() => attemptScroll(0), 150);
                
                showToast(`✅ Found "${pendingTableSelection.table_name}"`, 'success');
                setPendingTableSelection(null);
            }
        }
    }, [tables, pendingTableSelection, onTableSelect, setSelectedTablename, scrollToTableTab]);

    const handleOpenModal = () => {
        if (selectedRepoId) {
            setIsModalOpen(true);
        } else {
            showToast('Please select a repository first', 'error');
        }
    };

    

    const handleOpenGenerateModal = () => {
        if (selectedRepoId) {
            setIsGenerateModalOpen(true);
        } else {
            showToast('Please select a repository first', 'error');
        }
    };

const handleDataGenerated = async (newTableName) => {
    try {
        const data = await getRepositories();
        const updatedRepo = data.repositories?.find(
            repo => repo.repo_id === Number(selectedRepoId)
        );
        const updatedTables = updatedRepo ? updatedRepo.tables : [];
        setTables(updatedTables);

        // Auto-select the newly generated table so the populated data shows immediately
        const newTable = updatedTables.find(t => t.table_name === newTableName);
        if (newTable) {
            onTableSelect(newTable.table_id);
            setSelectedTablename(newTable.table_name);
        }

        // Still bump the parent's spreadsheetKey so Spreadsheet remounts cleanly
        if (onRefresh) onRefresh();
    } catch (error) {
        showToast('Table generated, but failed to refresh the table list', 'error');
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

    const selectedTable = tables.find(t => t.table_id === selectedTableId);

    return (
        <div className="bg-white border-b border-gray-200">
            {/* Top Bar */}
            <div className="px-4 py-2 flex items-center justify-between gap-4">
                <RepoInfo 
                    toggleSidebar={toggleSidebar}
                    selectedRepoId={selectedRepoId}
                    selectedTable={selectedTable}
                />

                <div className="flex items-center gap-3">
                    <GenerateDataButton 
                        selectedRepoId={selectedRepoId}
                        onClick={handleOpenGenerateModal}
                    />

                    <SearchBar
                        searchTerm={searchTerm}
                        isSearching={isSearching}
                        searchResults={searchResults}
                        showSearchDropdown={showSearchDropdown}
                        selectedRepoId={selectedRepoId}
                        searchInputRef={searchInputRef}
                        searchDropdownRef={searchDropdownRef}
                        performSearch={performSearch}
                        handleSearchSelect={handleSearchSelect}
                        handleSearchKeyDown={handleSearchKeyDown}
                        clearSearch={clearSearch}
                        repositories={repositories}
                    />

                    <CreateTableButton 
                        selectedRepoId={selectedRepoId}
                        onClick={handleOpenModal}
                    />
                </div>
            </div>

            {/* Table Tabs */}
            <div ref={tableTabsRef}>
                {tables.length > 0 && (
                    <TableTabs
                        tables={tables}
                        selectedTableId={selectedTableId}
                        highlightedTableId={highlightedTableId}
                        onTableSelect={onTableSelect}
                        setSelectedTablename={setSelectedTablename}
                        onDeleteClick={setDeleteTableId}
                        setHighlightedTableId={setHighlightedTableId}
                    />
                )}
            </div>

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

            <GenerateDataModal
    isOpen={isGenerateModalOpen}
    onClose={() => setIsGenerateModalOpen(false)}
    repoId={selectedRepoId}
    onSuccess={handleDataGenerated}   // ← was onRefresh
/>

            <DeleteTableModal
                isOpen={!!deleteTableId}
                onClose={() => setDeleteTableId(null)}
                onConfirm={deleteTableHandler}
            />

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