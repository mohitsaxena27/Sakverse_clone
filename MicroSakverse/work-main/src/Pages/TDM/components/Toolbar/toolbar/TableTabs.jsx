// pages/tdm/components/toolbar/TableTabs.jsx
import React, { useRef, useState, useEffect, forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTable, faChevronLeft, faChevronRight, faTimes } from '@fortawesome/free-solid-svg-icons';

const TableTabs = forwardRef(({ 
    tables, 
    selectedTableId, 
    highlightedTableId,
    onTableSelect, 
    setSelectedTablename,
    onDeleteClick,
    setHighlightedTableId
}, ref) => {
    const [showLeftScroll, setShowLeftScroll] = useState(false);
    const [showRightScroll, setShowRightScroll] = useState(false);
    const scrollRef = useRef(null);

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

    const scroll = (direction) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
        }
    };

    // ─── NEW: Scroll to highlighted tab when it changes ──────────────────
    useEffect(() => {
        if (highlightedTableId) {
            const tabElement = document.querySelector(`[data-table-id="${highlightedTableId}"]`);
            if (tabElement && scrollRef.current) {
                const container = scrollRef.current;
                const tabRect = tabElement.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const scrollLeft = tabRect.left - containerRect.left + container.scrollLeft - 20;
                container.scrollTo({ 
                    left: Math.max(0, scrollLeft), 
                    behavior: 'smooth' 
                });
            }
        }
    }, [highlightedTableId]);

    if (tables.length === 0) return null;

    return (
        <div className="px-2 pb-2">
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                {showLeftScroll && (
                    <button onClick={() => scroll('left')} className="px-2 py-1.5 text-gray-500 hover:bg-gray-200 rounded flex-shrink-0">
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                )}
                
                <div 
                    ref={(node) => {
                        scrollRef.current = node;
                        if (ref) {
                            if (typeof ref === 'function') ref(node);
                            else ref.current = node;
                        }
                    }} 
                    onScroll={checkScrollButtons} 
                    className="flex overflow-x-auto gap-1 py-1 hide-scrollbar table-tabs-container" 
                    style={{ flex: 1 }}
                >
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
                                        onDeleteClick(table.table_id); 
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
    );
});

TableTabs.displayName = 'TableTabs';

export default TableTabs;