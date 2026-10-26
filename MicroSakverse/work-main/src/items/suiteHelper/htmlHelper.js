// helpers/htmlHelper.js

/**
 * Generate HTML report from execution data with suite information
 * @param {Object} data - The execution result data with suite info
 * @returns {string} HTML content
 */
export const generateExecutionHTML = (data) => {
    const results = data.results || [];
    const suiteInfo = data.suiteInfo || {};
    const suiteExecution = data.suiteExecution || {};
    const summary = data.summary || {};
    
    // Group results by execution_id AND data_row_id to keep them separate
    const groupedByExecution = {};
    results.forEach(result => {
        const key = `${result.execution_id}_${result.data_row_id || 0}`;
        if (!groupedByExecution[key]) {
            groupedByExecution[key] = [];
        }
        groupedByExecution[key].push(result);
    });

    // Calculate overall statistics
    const totalSteps = results.length;
    const passedSteps = results.filter(r => r.status === 'passed').length;
    const failedSteps = results.filter(r => r.status === 'failed').length;
    const pendingSteps = results.filter(r => r.status === 'pending').length;
    const skippedSteps = results.filter(r => r.status === 'skipped').length;

    const generatedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Generate accordion items - one per execution_id + data_row_id combination
    const accordionItems = Object.entries(groupedByExecution).map(([key, steps]) => {
        // Parse the key to get execution_id and data_row_id
        const [execId, dataRowId] = key.split('_');
        
        // Sort steps by execution_order
        steps.sort((a, b) => (a.execution_order || 0) - (b.execution_order || 0));

        const execPassed = steps.filter(r => r.status === 'passed').length;
        const execFailed = steps.filter(r => r.status === 'failed').length;
        const execPending = steps.filter(r => r.status === 'pending').length;
        const execSkipped = steps.filter(r => r.status === 'skipped').length;

        // Determine overall status for this execution
        let execStatus = 'SUCCESS';
        let statusBadge = 'badge-success';
        if (execFailed > 0) {
            execStatus = 'FAILED';
            statusBadge = 'badge-failed';
        } else if (execPending > 0) {
            execStatus = 'IN PROGRESS';
            statusBadge = 'badge-progress';
        } else if (execSkipped > 0) {
            execStatus = 'NOT FOUND';
            statusBadge = 'badge-not-found';
        }

        // Get execution name from first step or use ID
        const execName = steps[0]?.execution_name || `Execution ${execId}`;

        // Generate table rows for each step
        const tableRows = steps.map((result, index) => {
            const stepOrder = result.execution_order ?? (index + 1);
            const stepName = result.step || 'N/A';
            const stepType = result.step_type || 'N/A';
            const target = result.target || '';
            const actualAction = result.step_type || '';
            const dataValue = result.data || '';
            
            // Status
            const status = result.status || 'unknown';
            let statusDisplay = '';
            if (status === 'passed') {
                statusDisplay = `<span class="badge badge-success">Passed</span>`;
            } else if (status === 'failed') {
                statusDisplay = `<span class="badge badge-failed">Failed</span>`;
            } else if (status === 'pending') {
                statusDisplay = `<span class="badge badge-progress">In Progress</span>`;
            } else if (status === 'skipped') {
                statusDisplay = `<span class="badge badge-not-found">Not Found</span>`;
            } else {
                statusDisplay = `<span class="badge">${status.toUpperCase()}</span>`;
            }

            // Error/Logs - with expandable view
            let errorLogs = '—';
            if (result.error && result.error !== 'None' && result.error !== 'null') {
                let errorContent = result.error;
                // If error is an array (like from the logs), format it nicely
                if (Array.isArray(errorContent)) {
                    errorContent = errorContent.map(line => {
                        if (typeof line === 'string') {
                            line = line.replace(/(\d{1,3}(,\d{3})*|\d+)/g, '<span style="color: #fbbf24;">$1</span>');
                        }
                        return line;
                    }).join('\n');
                } else if (typeof errorContent === 'string') {
                    errorContent = errorContent
                        .split('\n')
                        .map(line => {
                            return line.replace(/(\d{1,3}(,\d{3})*|\d+)/g, '<span style="color: #fbbf24;">$1</span>');
                        })
                        .join('\n');
                }
                
                // Create expandable error with toggle
                const errorId = `error-${execId}-${dataRowId}-${stepOrder}`;
                const lines = errorContent.split('\n');
                const isLongError = lines.length > 3 || errorContent.length > 200;
                
                if (isLongError) {
                    const previewLines = lines.slice(0, 3).join('\n');
                    errorLogs = `
                        <div class="error-container" id="${errorId}-container">
                            <div class="error-preview" id="${errorId}-preview">
                                <pre>${previewLines}${lines.length > 3 ? '\n...' : ''}</pre>
                            </div>
                            <div class="error-full" id="${errorId}-full" style="display: none;">
                                <pre>${errorContent}</pre>
                            </div>
                            <button class="error-toggle-btn" onclick="toggleError('${errorId}')">
                                Show ${lines.length > 3 ? `All ${lines.length} Lines` : 'More'}
                            </button>
                        </div>
                    `;
                } else {
                    errorLogs = `<div class="error-container"><pre>${errorContent}</pre></div>`;
                }
            }

            // Screenshot with lightbox - always visible and prominent
            let screenshotHtml = '';
            if (result.screenshot && result.screenshot !== 'Screenshot') {
                const screenshotId = `screenshot-${execId}-${dataRowId}-${stepOrder}`;
                screenshotHtml = `
                    <div class="screenshot-wrapper">
                        <button class="screenshot-btn" onclick="openLightbox('${screenshotId}')" title="Click to view screenshot">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="2.18"/>
                                <line x1="8" y1="2" x2="8" y2="22"/>
                                <line x1="16" y1="2" x2="16" y2="22"/>
                                <line x1="2" y1="8" x2="22" y2="8"/>
                                <line x1="2" y1="16" x2="22" y2="16"/>
                            </svg>
                            <span>View</span>
                        </button>
                        <img id="${screenshotId}" class="screenshot-img" style="display:none;" 
                             src="data:image/png;base64,${result.screenshot}" 
                             alt="Screenshot for step ${stepOrder}" />
                    </div>
                `;
            } else {
                screenshotHtml = `<span class="no-screenshot">—</span>`;
            }

            return `
                <tr>
                    <td class="col-order"><strong>${stepOrder}</strong></td>
                    <td class="col-intent"><div class="cell-content" title="${stepName}">${stepName}</div></td>
                    <td class="col-step-type">${stepType}</td>
                    <td class="col-target"><div class="cell-content" title="${target || '—'}">${target || '—'}</div></td>
                    <td class="col-action">${actualAction || '—'}</td>
                    <td class="col-value"><div class="cell-content" title="${dataValue || '—'}">${dataValue || '—'}</div></td>
                    <td class="col-status">${statusDisplay}</td>
                    <td class="col-error">${errorLogs}</td>
                    <td class="col-screenshot">${screenshotHtml}</td>
                </tr>
            `;
        }).join('');

        // Check if this execution has any failed steps to auto-open
        const hasFailed = execFailed > 0;
        const openAttr = hasFailed ? 'open' : '';

        return `
            <div class="accordion">
                <details ${openAttr}>
                    <summary>
                        <div class="accordion-header">
                            <div class="accordion-title">
                                <div class="execution-title">Execution ID: ${execId} ${dataRowId !== '0' ? `· Data Row ID: ${dataRowId}` : ''}</div>
                                <div class="execution-summary">${execName} · ${steps.length} steps · ${execPassed} passed · ${execFailed} failed · ${execPending} in progress</div>
                            </div>
                            <div class="accordion-meta">
                                <span class="badge ${statusBadge}">${execStatus}</span>
                                <span class="step-summary">▼</span>
                            </div>
                        </div>
                    </summary>

                    <div class="table-scroll-container">
                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th class="col-order">#</th>
                                        <th class="col-intent">Intent</th>
                                        <th class="col-step-type">Step Type</th>
                                        <th class="col-target">Target</th>
                                        <th class="col-action">Action</th>
                                        <th class="col-value">Value</th>
                                        <th class="col-status">Status</th>
                                        <th class="col-error">Error/Logs</th>
                                        <th class="col-screenshot sticky-col">Screenshot</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </details>
            </div>
        `;
    }).join('');

    // Format date helper with IST timezone
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
        } catch (e) {
            return dateString;
        }
    };

    // Calculate duration between two dates
    const calculateDuration = (startDate, endDate) => {
        if (!startDate || !endDate) return 'N/A';
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffMs = end - start;
            
            if (diffMs < 0) return 'Invalid duration';
            
            const diffSeconds = Math.floor(diffMs / 1000);
            const hours = Math.floor(diffSeconds / 3600);
            const minutes = Math.floor((diffSeconds % 3600) / 60);
            const seconds = diffSeconds % 60;
            
            return `${hours}h ${minutes}m ${seconds}s`;
        } catch (e) {
            return 'N/A';
        }
    };

    // Calculate duration for the execution
    const duration = calculateDuration(suiteExecution.started_at, suiteExecution.completed_at);

    // Get status badge color
    const getStatusBadgeColor = (status) => {
        switch(status) {
            case 'ACTIVE':
                return 'badge-success';
            case 'COMPLETED':
                return 'badge-success';
            case 'PARTIAL':
                return 'badge-progress';
            case 'FAILED':
                return 'badge-failed';
            default:
                return 'badge-not-found';
        }
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Execution Report - ${suiteInfo.suite_name || 'Report'}</title>

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #0f172a;
            color: #e5e7eb;
            margin: 0;
            padding: 24px;
        }

        .container {
            max-width: 100%;
            margin: auto;
            padding: 0 12px;
        }

        /* Header Styles */
        .header {
            background: linear-gradient(135deg, #1e293b, #0f172a);
            padding: 30px;
            border-radius: 16px;
            margin-bottom: 24px;
            border: 1px solid #334155;
        }

        .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 28px;
        }

        .header .sub-title {
            color: #94a3b8;
            margin-top: 8px;
            font-size: 14px;
        }

        /* Suite and Execution Info */
        .suite-info, .execution-info {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
        }

        .suite-info-grid, .execution-info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }

        .suite-info-item, .execution-info-item {
            display: flex;
            flex-direction: column;
        }

        .suite-info-item .label, .execution-info-item .label {
            color: #94a3b8;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }

        .suite-info-item .value, .execution-info-item .value {
            color: #e5e7eb;
            font-size: 16px;
            font-weight: 500;
        }

        .execution-info-item .value.duration {
            color: #34d399;
            font-size: 16px;
            font-weight: 600;
        }

        .badge {
            padding: 5px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
            white-space: nowrap;
        }

        .badge-success {
            background: rgba(34, 197, 94, 0.15);
            color: #22c55e;
            border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .badge-failed {
            background: rgba(239, 68, 68, 0.15);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .badge-progress {
            background: rgba(245, 158, 11, 0.15);
            color: #f59e0b;
            border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .badge-not-found {
            background: rgba(168, 85, 247, 0.15);
            color: #a855f7;
            border: 1px solid rgba(168, 85, 247, 0.3);
        }

        /* Summary Grid */
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }

        .card {
            background: #1e293b;
            padding: 20px;
            border-radius: 14px;
            border: 1px solid #334155;
            text-align: center;
        }

        .card-title {
            color: #94a3b8;
            font-size: 13px;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        .card-value {
            font-size: 32px;
            font-weight: bold;
            color: #ffffff;
        }

        .card-value.success { color: #22c55e; }
        .card-value.failed { color: #ef4444; }
        .card-value.progress { color: #f59e0b; }
        .card-value.skipped { color: #a855f7; }

        /* Accordion Styles */
        .accordion {
            background: #111827;
            border: 1px solid #334155;
            border-radius: 16px;
            margin-bottom: 16px;
            overflow: hidden;
        }

        .accordion summary {
            cursor: pointer;
            list-style: none;
        }

        .accordion summary::-webkit-details-marker {
            display: none;
        }

        .accordion-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 18px 20px;
            background: #1e293b;
            border-bottom: 1px solid #334155;
        }

        .accordion-title {
            display: flex;
            flex-direction: column;
            gap: 6px;
            flex: 1;
            min-width: 0;
        }

        .execution-title {
            font-size: 18px;
            font-weight: bold;
            color: #ffffff;
        }

        .execution-summary {
            font-size: 13px;
            color: #94a3b8;
            max-width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .accordion-meta {
            display: flex;
            gap: 12px;
            align-items: center;
            flex-shrink: 0;
            margin-left: 16px;
        }

        .step-summary {
            color: #cbd5e1;
            font-size: 13px;
        }

        /* Table Styles - With Sticky Screenshot Column */
        .table-scroll-container {
            position: relative;
            overflow: hidden;
        }

        .table-wrapper {
            overflow-x: auto;
            overflow-y: visible;
            padding: 0 4px;
            position: relative;
        }

        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            font-size: 13px;
            min-width: 1100px;
            table-layout: fixed;
            position: relative;
        }

        thead {
            position: sticky;
            top: 0;
            z-index: 20;
        }

        th, td {
            padding: 10px 12px;
            border-top: 1px solid #334155;
            vertical-align: middle;
            text-align: left;
            background: #111827;
            position: relative;
        }

        thead th {
            background: #020617;
            color: #cbd5e1;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            position: sticky;
            top: 0;
            z-index: 20;
            border-bottom: 2px solid #334155;
        }

        tr:hover td {
            background: #1e293b;
        }

        tr:hover td.sticky-col {
            background: #1e293b;
        }

        /* Column Width Definitions */
        .col-order { width: 50px; min-width: 50px; max-width: 50px; }
        .col-intent { width: 180px; min-width: 150px; max-width: 220px; }
        .col-step-type { width: 110px; min-width: 100px; max-width: 130px; }
        .col-target { width: 160px; min-width: 130px; max-width: 200px; }
        .col-action { width: 110px; min-width: 100px; max-width: 130px; }
        .col-value { width: 150px; min-width: 120px; max-width: 200px; }
        .col-status { width: 110px; min-width: 100px; max-width: 120px; }
        .col-error { width: 250px; min-width: 200px; max-width: 350px; }
        .col-screenshot { width: 130px; min-width: 120px; max-width: 150px; }

        /* Sticky Screenshot Column */
        .col-screenshot.sticky-col {
            position: sticky;
            right: 0;
            z-index: 15;
            background: #111827;
            border-left: 2px solid #334155;
            box-shadow: -4px 0 12px rgba(0, 0, 0, 0.3);
        }

        thead .col-screenshot.sticky-col {
            background: #020617;
            z-index: 25;
            border-left: 2px solid #334155;
        }

        tr:hover td.col-screenshot.sticky-col {
            background: #1e293b;
        }

        /* Cell content with tooltip */
        .cell-content {
            max-height: 60px;
            overflow-y: auto;
            word-wrap: break-word;
            white-space: pre-wrap;
            line-height: 1.5;
            padding-right: 4px;
        }

        .cell-content::-webkit-scrollbar {
            width: 3px;
        }

        .cell-content::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
        }

        .cell-content::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
        }

        /* Error Container */
        .error-container {
            max-height: 150px;
            overflow-y: auto;
            background: rgba(239, 68, 68, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 6px;
            padding: 6px 8px;
        }

        .error-container pre {
            margin: 0;
            white-space: pre-wrap;
            word-break: break-word;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.6;
            color: #fecaca;
            max-height: 100px;
            overflow-y: auto;
        }

        .error-container::-webkit-scrollbar {
            width: 4px;
        }

        .error-container::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
        }

        .error-container::-webkit-scrollbar-thumb {
            background: rgba(239, 68, 68, 0.3);
            border-radius: 3px;
        }

        .error-preview pre {
            max-height: 60px;
            overflow: hidden;
        }

        .error-full pre {
            max-height: 300px;
            overflow-y: auto;
        }

        .error-toggle-btn {
            background: rgba(239, 68, 68, 0.15);
            color: #fca5a5;
            border: 1px solid rgba(239, 68, 68, 0.25);
            padding: 3px 12px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            margin-top: 4px;
            transition: all 0.2s;
            width: 100%;
            text-align: center;
        }

        .error-toggle-btn:hover {
            background: rgba(239, 68, 68, 0.25);
            border-color: rgba(239, 68, 68, 0.4);
        }

        /* Screenshot Styles - Always visible */
        .screenshot-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }

        .screenshot-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #38bdf8;
            background: rgba(56, 189, 248, 0.12);
            border: 1px solid rgba(56, 189, 248, 0.25);
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
            width: 100%;
            justify-content: center;
        }

        .screenshot-btn:hover {
            background: rgba(56, 189, 248, 0.25);
            border-color: rgba(56, 189, 248, 0.5);
            transform: scale(1.03);
            box-shadow: 0 0 20px rgba(56, 189, 248, 0.1);
        }

        .screenshot-btn svg {
            flex-shrink: 0;
        }

        .screenshot-btn span {
            font-size: 11px;
        }

        .no-screenshot {
            color: #64748b;
            font-size: 14px;
        }

        .screenshot-img {
            display: none;
        }

        /* Lightbox Styles */
        .lightbox-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.92);
            z-index: 9999;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            animation: fadeIn 0.3s ease;
        }

        .lightbox-overlay.active {
            display: flex;
        }

        .lightbox-content {
            max-width: 90%;
            max-height: 90%;
            position: relative;
            animation: zoomIn 0.3s ease;
        }

        .lightbox-content img {
            max-width: 100%;
            max-height: 90vh;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .lightbox-close {
            position: fixed;
            top: 24px;
            right: 32px;
            color: #ffffff;
            font-size: 40px;
            font-weight: 300;
            cursor: pointer;
            z-index: 10000;
            background: rgba(0, 0, 0, 0.5);
            width: 56px;
            height: 56px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .lightbox-close:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .lightbox-counter {
            position: fixed;
            bottom: 32px;
            left: 50%;
            transform: translateX(-50%);
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            background: rgba(0, 0, 0, 0.5);
            padding: 8px 20px;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes zoomIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }

        /* Scrollbar styling for table */
        .table-wrapper::-webkit-scrollbar {
            height: 8px;
            width: 8px;
        }

        .table-wrapper::-webkit-scrollbar-track {
            background: #1e293b;
            border-radius: 4px;
        }

        .table-wrapper::-webkit-scrollbar-thumb {
            background: #475569;
            border-radius: 4px;
        }

        .table-wrapper::-webkit-scrollbar-thumb:hover {
            background: #64748b;
        }

        .footer {
            text-align: center;
            color: #64748b;
            margin-top: 32px;
            font-size: 13px;
            padding: 20px;
            border-top: 1px solid #334155;
        }

        /* Responsive Styles */
        @media (max-width: 1200px) {
            table {
                font-size: 12px;
                min-width: 1000px;
            }
            
            th, td {
                padding: 8px 10px;
            }

            .col-error { width: 200px; min-width: 160px; max-width: 280px; }
            .col-screenshot { width: 110px; min-width: 100px; max-width: 130px; }
            .col-intent { width: 150px; min-width: 120px; max-width: 180px; }
            .col-target { width: 130px; min-width: 110px; max-width: 160px; }
            .col-value { width: 120px; min-width: 100px; max-width: 160px; }
        }

        @media (max-width: 768px) {
            body {
                padding: 12px;
            }

            .container {
                padding: 0 4px;
            }

            .header {
                padding: 20px;
            }

            .header h1 {
                font-size: 22px;
            }

            .summary-grid {
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }

            .card {
                padding: 14px;
            }

            .card-value {
                font-size: 24px;
            }

            .accordion-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
                padding: 14px 16px;
            }

            .accordion-meta {
                width: 100%;
                justify-content: space-between;
                margin-left: 0;
            }

            .execution-title {
                font-size: 15px;
            }

            .execution-summary {
                white-space: normal;
                max-width: 100%;
            }

            .suite-info-grid,
            .execution-info-grid {
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }

            table {
                font-size: 11px;
                min-width: 850px;
            }

            th, td {
                padding: 6px 8px;
            }

            .col-error { width: 160px; min-width: 130px; max-width: 200px; }
            .col-screenshot { width: 100px; min-width: 90px; max-width: 110px; }
            .col-intent { width: 130px; min-width: 100px; max-width: 160px; }
            .col-target { width: 110px; min-width: 90px; max-width: 140px; }
            .col-value { width: 100px; min-width: 80px; max-width: 130px; }
            .col-step-type { width: 90px; min-width: 80px; max-width: 110px; }
            .col-action { width: 90px; min-width: 80px; max-width: 110px; }
            .col-status { width: 90px; min-width: 80px; max-width: 100px; }

            .screenshot-btn {
                font-size: 10px;
                padding: 4px 10px;
            }

            .screenshot-btn svg {
                width: 14px;
                height: 14px;
            }

            .lightbox-close {
                top: 16px;
                right: 16px;
                width: 44px;
                height: 44px;
                font-size: 30px;
            }

            .error-container {
                max-height: 100px;
            }

            .error-container pre {
                font-size: 10px;
                max-height: 60px;
            }

            .cell-content {
                max-height: 40px;
            }
        }

        @media (max-width: 480px) {
            .summary-grid {
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }

            .card {
                padding: 10px;
            }

            .card-value {
                font-size: 20px;
            }

            .card-title {
                font-size: 11px;
            }

            table {
                min-width: 750px;
                font-size: 10px;
            }

            th, td {
                padding: 4px 6px;
            }

            .col-order { width: 40px; min-width: 40px; max-width: 40px; }
            .col-intent { width: 110px; min-width: 90px; max-width: 140px; }
            .col-target { width: 90px; min-width: 70px; max-width: 120px; }
            .col-value { width: 80px; min-width: 60px; max-width: 110px; }
            .col-error { width: 120px; min-width: 100px; max-width: 160px; }
            .col-screenshot { width: 85px; min-width: 75px; max-width: 100px; }

            .screenshot-btn {
                font-size: 9px;
                padding: 3px 8px;
            }

            .screenshot-btn svg {
                width: 12px;
                height: 12px;
            }

            .screenshot-btn span {
                font-size: 9px;
            }
        }

        /* Print Styles */
        @media print {
            body {
                background: #ffffff;
                color: #000000;
                padding: 16px;
            }

            .container {
                max-width: 100%;
            }

            .header, .suite-info, .execution-info, .card, .accordion {
                background: #ffffff;
                color: #000000;
                border: 1px solid #cccccc;
                page-break-inside: avoid;
            }

            .header h1 { color: #000000; }
            .header .sub-title { color: #666666; }

            .accordion-header {
                background: #f3f4f6;
            }

            thead th {
                background: #eeeeee !important;
                color: #000000 !important;
            }

            th, td {
                background: #ffffff !important;
                color: #000000 !important;
                border-top: 1px solid #dddddd;
            }

            tr:hover td {
                background: #f9f9f9 !important;
            }

            .col-screenshot.sticky-col {
                background: #ffffff !important;
                border-left: 2px solid #dddddd;
                box-shadow: none;
            }

            thead .col-screenshot.sticky-col {
                background: #eeeeee !important;
            }

            tr:hover td.col-screenshot.sticky-col {
                background: #f9f9f9 !important;
            }

            .error-container {
                background: #fef2f2;
                border: 1px solid #fca5a5;
            }

            .error-container pre {
                color: #991b1b;
            }

            .badge-success {
                background: #dcfce7;
                color: #166534;
                border: 1px solid #86efac;
            }

            .badge-failed {
                background: #fee2e2;
                color: #991b1b;
                border: 1px solid #fca5a5;
            }

            .badge-progress {
                background: #fef3c7;
                color: #92400e;
                border: 1px solid #fcd34d;
            }

            .badge-not-found {
                background: #f3e8ff;
                color: #6b21a8;
                border: 1px solid #d8b4fe;
            }

            .screenshot-btn {
                color: #0369a1;
                background: #e0f2fe;
                border: 1px solid #7dd3fc;
            }

            .suite-info-item .value,
            .execution-info-item .value {
                color: #000000;
            }

            .card-value {
                color: #000000;
            }

            .lightbox-overlay {
                display: none !important;
            }

            .accordion details {
                display: block !important;
            }

            .accordion details[open] {
                display: block !important;
            }

            .table-wrapper {
                overflow: visible !important;
            }

            table {
                min-width: 100%;
                page-break-inside: auto;
            }

            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }

            .error-toggle-btn {
                display: none;
            }

            .error-preview {
                display: none !important;
            }

            .error-full {
                display: block !important;
            }

            .cell-content {
                max-height: none;
                overflow: visible;
            }

            .table-scroll-container {
                overflow: visible !important;
            }

            .table-wrapper::-webkit-scrollbar {
                display: none;
            }
        }
    </style>
</head>

<body>
<div class="container">

    <!-- Header -->
    <div class="header">
        <h1>📊 Test Execution Report</h1>
        <div class="sub-title">Generated At: ${generatedAt} (IST)</div>
    </div>

    <!-- Suite Information -->
    <div class="suite-info">
        <h2 style="color: #e5e7eb; font-size: 16px; margin-bottom: 16px; border-bottom: 1px solid #334155; padding-bottom: 12px;">Suite Information</h2>
        <div class="suite-info-grid">
            <div class="suite-info-item">
                <span class="label">Suite Name</span>
                <span class="value">${suiteInfo.suite_name || 'N/A'}</span>
            </div>
            <div class="suite-info-item">
                <span class="label">Suite ID</span>
                <span class="value">#${suiteInfo.suite_id || 'N/A'}</span>
            </div>
            <div class="suite-info-item">
                <span class="label">Description</span>
                <span class="value" style="font-weight: 400;">${suiteInfo.description || 'N/A'}</span>
            </div>
            <div class="suite-info-item">
                <span class="label">Status</span>
                <span class="value">
                    <span class="badge ${getStatusBadgeColor(suiteInfo.status)}">${suiteInfo.status || 'UNKNOWN'}</span>
                </span>
            </div>
        </div>
    </div>

    <!-- Execution Information -->
    <div class="execution-info">
        <h2 style="color: #e5e7eb; font-size: 16px; margin-bottom: 16px; border-bottom: 1px solid #334155; padding-bottom: 12px;">Execution Information</h2>
        <div class="execution-info-grid">
            <div class="execution-info-item">
                <span class="label">Execution ID</span>
                <span class="value">#${suiteExecution.suite_execution_id || 'N/A'}</span>
            </div>
            <div class="execution-info-item">
                <span class="label">Batch Session ID</span>
                <span class="value" style="font-size: 12px; font-family: monospace;">${suiteExecution.batch_session_id || 'N/A'}</span>
            </div>
            <div class="execution-info-item">
                <span class="label">Status</span>
                <span class="value">
                    <span class="badge ${getStatusBadgeColor(suiteExecution.status)}">${suiteExecution.status || 'UNKNOWN'}</span>
                </span>
            </div>
            <div class="execution-info-item">
                <span class="label">Report Status</span>
                <span class="value">
                    <span class="badge ${suiteExecution.report_status === 'FAILED' ? 'badge-failed' : 'badge-success'}">${suiteExecution.report_status || 'N/A'}</span>
                </span>
            </div>
            <div class="execution-info-item">
                <span class="label">Total Test Cases</span>
                <span class="value">${suiteExecution.total_testcases || 0}</span>
            </div>
            <div class="execution-info-item">
                <span class="label">Actual Test Cases</span>
                <span class="value">${suiteExecution.actual_testcases || 0}</span>
            </div>
            <div class="execution-info-item">
                <span class="label">Started At (IST)</span>
                <span class="value" style="font-size: 13px;">${formatDate(suiteExecution.started_at)}</span>
            </div>
            <div class="execution-info-item">
                <span class="label">Completed At (IST)</span>
                <span class="value" style="font-size: 13px;">${formatDate(suiteExecution.completed_at)}</span>
            </div>
            <div class="execution-info-item">
                <span class="label">Created At (IST)</span>
                <span class="value" style="font-size: 13px;">${formatDate(suiteExecution.created_at)}</span>
            </div>
            <div class="execution-info-item" style="grid-column: span 1;">
                <span class="label">⏱️ Total Duration</span>
                <span class="value duration">${duration}</span>
            </div>
        </div>
    </div>

    <!-- Summary Statistics -->
    <div class="summary-grid">
        <div class="card">
            <div class="card-title">Total Test Cases</div>
            <div class="card-value">${summary.total_testcases || 0}</div>
        </div>
        <div class="card">
            <div class="card-title">Total Steps</div>
            <div class="card-value">${summary.total_steps || 0}</div>
        </div>
        <div class="card">
            <div class="card-title">Passed</div>
            <div class="card-value success">${summary.passed || 0}</div>
        </div>
        <div class="card">
            <div class="card-title">Failed</div>
            <div class="card-value failed">${summary.failed || 0}</div>
        </div>
        <div class="card">
            <div class="card-title">Skipped</div>
            <div class="card-value skipped">${summary.skipped || 0}</div>
        </div>
    </div>

    <!-- Test Execution Details -->
    <h2 style="color: #e5e7eb; font-size: 18px; margin-bottom: 16px;">Test Execution Details</h2>
    ${accordionItems}

    <div class="footer">
        Generated by Devshift Unite Automation · ${new Date().getFullYear()}
    </div>
</div>

<!-- Lightbox -->
<div id="lightbox" class="lightbox-overlay" onclick="closeLightbox()">
    <div class="lightbox-close" onclick="closeLightbox()">✕</div>
    <div class="lightbox-content" onclick="event.stopPropagation()">
        <img id="lightbox-image" src="" alt="Screenshot" />
    </div>
    <div class="lightbox-counter" id="lightbox-counter"></div>
</div>

<script>
    // Lightbox functions
    function openLightbox(imageId) {
        const img = document.getElementById(imageId);
        if (!img) return;
        
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-image');
        
        // Copy the image source
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || 'Screenshot';
        
        // Show the lightbox
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Update counter
        document.getElementById('lightbox-counter').textContent = 'Click outside or press ESC to close';
    }

    function closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Close on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    });

    // Close on click outside
    document.getElementById('lightbox').addEventListener('click', function(e) {
        if (e.target === this) {
            closeLightbox();
        }
    });

    // Error toggle function
    function toggleError(errorId) {
        const previewEl = document.getElementById(errorId + '-preview');
        const fullEl = document.getElementById(errorId + '-full');
        const container = document.getElementById(errorId + '-container');
        const btn = container ? container.querySelector('.error-toggle-btn') : null;
        
        if (!previewEl || !fullEl || !btn) return;
        
        if (previewEl.style.display === 'none') {
            previewEl.style.display = 'block';
            fullEl.style.display = 'none';
            btn.textContent = 'Show All Lines';
        } else {
            previewEl.style.display = 'none';
            fullEl.style.display = 'block';
            btn.textContent = 'Show Less';
        }
    }

    // Auto-open accordions that have failed steps
    document.addEventListener('DOMContentLoaded', function() {
        const errorContainers = document.querySelectorAll('.error-container');
        errorContainers.forEach(container => {
            const accordion = container.closest('.accordion');
            if (accordion) {
                const details = accordion.querySelector('details');
                if (details) {
                    details.open = true;
                }
            }
        });
    });
</script>
</body>
</html>
    `;
};

// Helper function to transform report data to the format expected by generateExecutionHTML
export const transformReportData = (reportData) => {
    const results = [];
    
    reportData?.testcases?.forEach(testcase => {
        testcase?.steps?.forEach(step => {
            // Extract error logs from the step
            let error = null;
            if (step.logs) {
                // If logs is an array, check for errors or failures
                if (Array.isArray(step.logs)) {
                    const errorLogs = step.logs.filter(log => 
                        log && (log.includes('Failed') || log.includes('Error') || log.includes('could not convert'))
                    );
                    if (errorLogs.length > 0) {
                        error = errorLogs;
                    }
                } else if (typeof step.logs === 'string') {
                    // If logs is a string, check if it contains error indicators
                    if (step.logs.includes('Failed') || step.logs.includes('Error') || step.logs.includes('could not convert')) {
                        error = step.logs;
                    }
                }
            }
            
            results.push({
                execution_id: testcase.execution_id,
                data_row_id: testcase.data_row_id || 0,
                execution_name: testcase.execution_intent || `Execution ${testcase.execution_id}`,
                step: step.planned_intent || 'N/A',
                step_type: step.action || 'N/A',
                target: step.target || '',
                status: step.status || 'unknown',
                error: error || step.log_error || null,
                screenshot: step.screenshot && step.screenshot !== 'Screenshot' ? step.screenshot : null,
                execution_order: step.step_id || 0,
                data: step.value || ''
            });
        });
    });
    
    return {
        results,
        suiteInfo: reportData.suite || {},
        suiteExecution: reportData.suite_execution || {},
        summary: reportData.summary || {}
    };
};