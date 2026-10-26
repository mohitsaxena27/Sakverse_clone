// helper/Automation/automationHelper.js

/**
 * Generate HTML report from execution data
 * @param {Object} data - The execution result data
 * @returns {string} HTML content
 */
export const generateExecutionHTML = (data) => {
    const results = data.results || [];
    
    // Group results by execution_id
    const groupedByExecution = {};
    results.forEach(result => {
        const execId = result.execution_id || 'unknown';
        if (!groupedByExecution[execId]) {
            groupedByExecution[execId] = [];
        }
        groupedByExecution[execId].push(result);
    });

    // Calculate overall statistics
    const totalSteps = results.length;
    const passedSteps = results.filter(r => r.status === 'passed').length;
    const failedSteps = results.filter(r => r.status === 'failed').length;
    const pendingSteps = results.filter(r => r.status === 'pending').length;
    const skippedSteps = results.filter(r => r.status === 'skipped').length;
    const inProgressSteps = pendingSteps + skippedSteps;

    const generatedAt = new Date().toLocaleString();

    // Generate accordion items - one per execution_id
    const accordionItems = Object.entries(groupedByExecution).map(([execId, steps]) => {
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
            const data = result.data || '';
            
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

            // Error/Logs
            let errorLogs = '—';
            if (result.error && result.error !== 'None' && result.error !== 'null') {
                errorLogs = `<div class="error-box">${result.error}</div>`;
            }

            // Screenshot
            let screenshotHtml = '';
            if (result.screenshot) {
                screenshotHtml = `
                    <div>
                        <span class="screenshot-summary" onclick="toggleScreenshot(this)">View Screenshot</span>
                        <img class="screenshot-img" style="display:none; margin-top: 6px;" 
                             src="data:image/png;base64,${result.screenshot}" alt="Screenshot for step ${stepOrder}" />
                    </div>
                `;
            }

            return `
                <tr>
                    <td><strong>${stepOrder}</strong></td>
                    <td>${stepName}</td>
                    <td>${stepType}</td>
                    <td>${target}</td>
                    <td>${actualAction}</td>
                    <td>${statusDisplay}</td>
                    <td>${errorLogs}</td>
                    <td>${screenshotHtml}</td>
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
                                <div class="execution-title">Execution ID: ${execId}</div>
                                <div class="execution-summary">${execName} · ${steps.length} steps · ${execPassed} passed · ${execFailed} failed · ${execPending} in progress</div>
                            </div>
                            <div class="accordion-meta">
                                <span class="badge ${statusBadge}">${execStatus}</span>
                                <span class="step-summary">▼</span>
                            </div>
                        </div>
                    </summary>

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 50px;">Order</th>
                                <th style="min-width: 200px;">Intent</th>
                                <th style="width: 120px;">Step Type</th>
                                <th style="min-width: 150px;">Planned Target</th>
                                <th style="width: 120px;">Actual Action</th>
                                <th style="width: 100px;">Status</th>
                                <th style="min-width: 150px;">Error/Logs</th>
                                <th style="width: 130px;">Screenshot</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </details>
            </div>
        `;
    }).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test Execution Report</title>

    <style>
        body {
            font-family: Arial, sans-serif;
            background: #0f172a;
            color: #e5e7eb;
            margin: 0;
            padding: 24px;
        }

        .container {
            max-width: 1500px;
            margin: auto;
        }

        .header {
            background: linear-gradient(135deg, #1e293b, #111827);
            padding: 24px;
            border-radius: 16px;
            margin-bottom: 24px;
            border: 1px solid #334155;
        }

        h1 {
            margin: 0;
            color: #ffffff;
        }

        .sub-title {
            color: #94a3b8;
            margin-top: 8px;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 24px;
        }

        .card {
            background: #1e293b;
            padding: 20px;
            border-radius: 14px;
            border: 1px solid #334155;
        }

        .card-title {
            color: #94a3b8;
            font-size: 14px;
            margin-bottom: 8px;
        }

        .card-value {
            font-size: 28px;
            font-weight: bold;
            color: #ffffff;
        }

        .success {
             color: #22c55e;
             font-weight: bold;
        }

        .failed {
             color: #ef4444;
             font-weight: bold;
        }

        .progress {
            color: #f59e0b;
            font-weight: bold;
        }

        .not-found {
            color: #a855f7;
            font-weight: bold;
        }

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
        }

        .execution-title {
            font-size: 18px;
            font-weight: bold;
            color: #ffffff;
        }

        .execution-summary {
            font-size: 13px;
            color: #94a3b8;
            max-width: 900px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .accordion-meta {
            display: flex;
            gap: 12px;
            align-items: center;
        }

        .step-summary {
            color: #cbd5e1;
            font-size: 13px;
        }

        .badge {
            padding: 6px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
        }

        .badge-success {
            background: rgba(34, 197, 94, 0.15);
            color: #22c55e;
            border: 1px solid rgba(34, 197, 94, 0.4);
        }

        .badge-failed {
            background: rgba(239, 68, 68, 0.15);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.4);
        }

        .badge-progress {
            background: rgba(245, 158, 11, 0.15);
            color: #f59e0b;
            border: 1px solid rgba(245, 158, 11, 0.4);
        }

        .badge-not-found {
            background: rgba(168, 85, 247, 0.15);
            color: #a855f7;
            border: 1px solid rgba(168, 85, 247, 0.4);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }

        th {
            background: #020617;
            color: #cbd5e1;
            text-align: left;
            padding: 10px 12px;
            font-size: 12px;
            font-weight: bold;
            position: sticky;
            top: 0;
        }

        td {
            padding: 10px 12px;
            border-top: 1px solid #334155;
            vertical-align: middle;
            color: #e5e7eb;
            font-size: 13px;
        }

        tr:hover {
            background: #1e293b;
        }

        .error-box {
            color: #fecaca;
            background: rgba(239, 68, 68, 0.12);
            border: 1px solid rgba(239, 68, 68, 0.35);
            padding: 6px 8px;
            border-radius: 6px;
            white-space: pre-wrap;
            word-break: break-word;
            font-size: 12px;
            max-width: 200px;
        }

        .screenshot-summary {
            color: #38bdf8;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
        }

        .screenshot-summary:hover {
            text-decoration: underline;
        }

        .screenshot-img {
            margin-top: 8px;
            max-width: 350px;
            max-height: 200px;
            border-radius: 8px;
            border: 1px solid #334155;
            display: block;
        }

        .footer {
            text-align: center;
            color: #64748b;
            margin-top: 32px;
            font-size: 13px;
        }

        @media (max-width: 1200px) {
            table {
                font-size: 12px;
            }
            
            th, td {
                padding: 8px 10px;
            }
            
            .error-box {
                max-width: 150px;
                font-size: 11px;
            }
        }

        @media (max-width: 768px) {
            body {
                padding: 12px;
            }

            .summary-grid {
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }

            .card {
                padding: 14px;
            }

            .card-value {
                font-size: 22px;
            }

            .accordion-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }

            .accordion-meta {
                width: 100%;
                justify-content: space-between;
            }

            .execution-title {
                font-size: 15px;
            }

            .execution-summary {
                white-space: normal;
                max-width: 100%;
            }

            table {
                font-size: 11px;
                display: block;
                overflow-x: auto;
            }

            th, td {
                padding: 6px 8px;
            }

            .error-box {
                max-width: 120px;
                font-size: 10px;
            }

            .screenshot-img {
                max-width: 200px;
                max-height: 150px;
            }
        }

        @media print {
            body {
                background: #ffffff;
                color: #000000;
            }

            .header, .card, .accordion {
                background: #ffffff;
                color: #000000;
                border: 1px solid #cccccc;
            }

            .accordion-header {
                background: #f3f4f6;
            }

            th {
                background: #eeeeee;
                color: #000000;
            }

            td {
                color: #000000;
                border-top: 1px solid #dddddd;
            }

            tr:hover {
                background: #f9f9f9;
            }

            .error-box {
                color: #991b1b;
                background: #fef2f2;
                border: 1px solid #fca5a5;
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

            .screenshot-summary {
                color: #0369a1;
            }
        }
    </style>
</head>

<body>
<div class="container">

    <div class="header">
        <h1>Test Execution Report</h1>
        <div class="sub-title">Generated At: ${generatedAt}</div>
    </div>

    <div class="summary-grid">
        <div class="card">
            <div class="card-title">Total Executions</div>
            <div class="card-value">${Object.keys(groupedByExecution).length}</div>
        </div>

        <div class="card">
            <div class="card-title">Total Steps</div>
            <div class="card-value">${totalSteps}</div>
        </div>

        <div class="card">
            <div class="card-title">Passed Steps</div>
            <div class="card-value success">${passedSteps}</div>
        </div>

        <div class="card">
            <div class="card-title">Failed Steps</div>
            <div class="card-value failed">${failedSteps}</div>
        </div>
    </div>

    ${accordionItems}

    <div class="footer">
        Generated by Sakverse Unite Automation · ${new Date().getFullYear()}
    </div>
</div>

<script>
    function toggleScreenshot(element) {
        const img = element.nextElementSibling;
        if (img && img.classList.contains('screenshot-img')) {
            if (img.style.display === 'none') {
                img.style.display = 'block';
                element.textContent = 'Hide Screenshot';
            } else {
                img.style.display = 'none';
                element.textContent = 'View Screenshot';
            }
        }
    }

    // Auto-open accordions that have failed steps
    document.addEventListener('DOMContentLoaded', function() {
        const errorBoxes = document.querySelectorAll('.error-box');
        errorBoxes.forEach(box => {
            const accordion = box.closest('.accordion');
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