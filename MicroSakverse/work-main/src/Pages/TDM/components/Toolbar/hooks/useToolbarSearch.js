// pages/tdm/components/hooks/useToolbarSearch.js
import { useState, useRef, useEffect } from 'react';
import showToast from '../../../../../items/ToastMessage/toastUtil';

export const useToolbarSearch = (repositories, selectedRepoId, onRepoSelect, onTableSelect, setSelectedTablename) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [highlightedTableId, setHighlightedTableId] = useState(null);
    const [pendingTableSelection, setPendingTableSelection] = useState(null);
    const searchInputRef = useRef(null);
    const searchDropdownRef = useRef(null);
    const highlightTimeoutRef = useRef(null);

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Clear highlight after 3 seconds
    useEffect(() => {
        if (highlightedTableId) {
            // Clear any existing timeout
            if (highlightTimeoutRef.current) {
                clearTimeout(highlightTimeoutRef.current);
            }
            highlightTimeoutRef.current = setTimeout(() => {
                setHighlightedTableId(null);
            }, 3000);
            return () => {
                if (highlightTimeoutRef.current) {
                    clearTimeout(highlightTimeoutRef.current);
                }
            };
        }
    }, [highlightedTableId]);

    // ─── IMPROVED: Scroll to table tab with retry ──────────────────────
    const scrollToTableTab = (tableId, retryCount = 0) => {
        const tabElement = document.querySelector(`[data-table-id="${tableId}"]`);
        
        if (tabElement) {
            // Find the scrollable container
            const container = tabElement.closest('.table-tabs-container');
            if (container) {
                // Calculate position to scroll
                const tabRect = tabElement.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const scrollLeft = tabRect.left - containerRect.left + container.scrollLeft - 20;
                
                // Smooth scroll to the tab
                container.scrollTo({ 
                    left: Math.max(0, scrollLeft), 
                    behavior: 'smooth' 
                });
                
                // Force highlight visibility
                setHighlightedTableId(tableId);
                
                // Remove highlight after 3 seconds
                if (highlightTimeoutRef.current) {
                    clearTimeout(highlightTimeoutRef.current);
                }
                highlightTimeoutRef.current = setTimeout(() => {
                    setHighlightedTableId(null);
                }, 3000);
                
                return true;
            }
        }
        
        // If element not found and we haven't retried too many times
        if (retryCount < 5) {
            // Retry with increasing delay (100ms, 200ms, 400ms, 800ms, 1600ms)
            const delay = 100 * Math.pow(2, retryCount);
            setTimeout(() => {
                scrollToTableTab(tableId, retryCount + 1);
            }, delay);
            return false;
        }
        
        return false;
    };

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
        
        const isInCurrentRepo = result.repo_id === selectedRepoId;
        
        if (isInCurrentRepo) {
            // Same repository - select table directly
            onTableSelect(result.table_id);
            setSelectedTablename(result.table_name);
            
            // Scroll and highlight with retry
            setTimeout(() => {
                scrollToTableTab(result.table_id);
            }, 100);
            
            showToast(`✅ Found "${result.table_name}"`, 'success');
        } else {
            // Different repository - need to switch first
            const repo = repositories.find(r => r.repo_id === result.repo_id);
            if (repo) {
                // Store pending selection BEFORE switching
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

    const clearSearch = () => {
        setSearchTerm('');
        setSearchResults([]);
        setShowSearchDropdown(false);
        searchInputRef.current?.focus();
    };

    return {
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
    };
};