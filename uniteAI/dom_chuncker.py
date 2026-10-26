def extract_salesforce_chunks(page):
    """
    Extract Salesforce-aware DOM chunks:
    - Field chunks (label-driven)
    - Action/button chunks
    - Form/dialog chunks
    """
    elements=page.evaluate("""
    () => {

    /* =========================
       DOM TREE BUILDER
    ========================== */
    function buildDomTree(node, depth = 0, maxDepth = 50) {
        if (!node || depth > maxDepth) return null;

        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            return text ? { type: 'text', value: text } : null;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return null;

        const treeNode = {
            type: 'element',
            tag: node.tagName.toLowerCase(),
            attributes: {},
            children: []
        };

        for (const attr of node.attributes || []) {
            treeNode.attributes[attr.name] = attr.value;
        }

        for (const child of node.childNodes) {
            const childTree = buildDomTree(child, depth + 1, maxDepth);
            if (childTree) treeNode.children.push(childTree);
        }

        return treeNode;
    }

    /* =========================
       SHADOW-DOM SAFE QUERY
    ========================== */
    function deepQuerySelector(selector, root = document) {
        const results = [];
        const seen = new Set();

        const traverse = (node) => {
            if (!node || seen.has(node)) return;
            seen.add(node);

            if (node.querySelectorAll) {
                node.querySelectorAll(selector).forEach(el => results.push(el));
            }

            if (node.shadowRoot) traverse(node.shadowRoot);

            node.childNodes.forEach(child => {
                if (child.nodeType === 1) traverse(child);
            });
        };

        traverse(root);
        return results;
    }

    const chunks = [];

    const clean = txt =>
        txt ? txt.replace(/\\s+/g, ' ').trim() : '';

    /* =========================
       FIELD CHUNKS
    ========================== */
    const seenLabels = new Set();
    const seenFields = new Set();

    deepQuerySelector('label').forEach(label => {
        if (seenLabels.has(label)) return;
        seenLabels.add(label);

        const labelText = clean(label.innerText || label.textContent);
        if (!labelText) return;

        let field = null;

        // 1️⃣ label-for (shadow safe)
        if (label.htmlFor) {
           
            if (!field) {
                field = document.getElementById(label.htmlFor);
            }
        }

        // 2️⃣ Lightning host fallback → real input
        if (!field) {
            const host = label.closest(
                'lightning-input, lightning-combobox, lightning-textarea, lightning-primitive-input-simple'
            );
            if (host) {
                field = host.querySelector(
                    'input, textarea, [role="combobox"], [aria-haspopup="listbox"]'
                );
            }
        }

        if (!field) return;

        const role = field.getAttribute('role') || '';
        const tag = field.tagName.toLowerCase();
        const type = field.getAttribute('type') || '';

        let fieldType = 'text';
        if (role === 'combobox' || tag.includes('combobox'))
            fieldType = 'picklist';
        else if (tag === 'textarea')
            fieldType = 'textarea';
        else if (type === 'checkbox')
            fieldType = 'checkbox';
        else if (type === 'tel' || type === 'number')
            fieldType = 'number';

        chunks.push({
            chunk_type: 'field',
            field_type: fieldType,
            label: labelText,
            semantic_text: labelText + ' field',
            html: buildDomTree(field)
        });
    });
    deepQuerySelector('input, textarea').forEach(field => {
        if (seenFields.has(field)) return;

        const labelText = clean(
            field.getAttribute('placeholder') ||
            field.getAttribute('aria-label')
        );

        if (!labelText) return;

        const role = field.getAttribute('role') || '';
        const type = field.getAttribute('type') || '';

        let fieldType = 'text';
        if (
            type === 'search' ||
            role === 'combobox' ||
            field.getAttribute('aria-autocomplete') === 'list'
        ) {
            fieldType = 'picklist';
        }

        seenFields.add(field);

        chunks.push({
            chunk_type: 'field',
            field_type: fieldType,
            label: labelText,
            semantic_text: labelText + ' field',
            html: buildDomTree(field)
        });
    });

    /* =========================
       ACTION / BUTTON CHUNKS
    ========================== */
    const actionCandidates = new Set();

    deepQuerySelector(
        'button, [role="button"], input[type="submit"], input[type="button"], a[class*="button"], a[href^="/lightning/"], a[onclick], a[aria-current]'
    ).forEach(el => actionCandidates.add(el));

    const getActionText = (el) => {
        const tag = el.tagName.toLowerCase();

        if (tag === 'input' && el.value && el.value.trim())
            return el.value.trim();

        if (el.innerText && el.innerText.trim())
            return el.innerText.trim();

        const assistive = el.querySelector && el.querySelector('.slds-assistive-text');
        if (assistive && assistive.textContent.trim())
            return assistive.textContent.trim();

        const ariaLabel = el.getAttribute('aria-label');
        if (ariaLabel && ariaLabel.trim())
            return ariaLabel.trim();

        const title = el.title || el.getAttribute('title');
        if (title && title.trim())
            return title.trim();
        const datalabel = el.getAttribute('data-label');
        if (datalabel && datalabel.trim())
            return datalabel.trim();

        const labelledBy = el.getAttribute('aria-labelledby');
        if (labelledBy) {
            const ref = document.getElementById(labelledBy);
            if (ref && ref.innerText.trim())
                return ref.innerText.trim();
        }

        return '';
    };

    actionCandidates.forEach(btn => {
        const text = getActionText(btn);
        if (!text) return;

        chunks.push({
            chunk_type: 'action',
            action: text,
            semantic_text: 'Button ' + text,
            html: btn.outerHTML
        });
    });

    /* =========================
       FORM / MODAL CHUNKS
    ========================== */
    deepQuerySelector('form, [role="dialog"]').forEach(form => {
        const title =
            clean(form.querySelector('h1, h2, header')?.innerText) ||
            'Unnamed Form';

        chunks.push({
            chunk_type: 'form',
            name: title,
            semantic_text: 'Form ' + title,
            html: buildDomTree(form)
        });
    });

    return chunks;
    }
    """)
    print("Extracted Elements",elements)
    return elements

def get_page_anchors(page) -> str:
    return page.evaluate("""
    () => {
        const texts = [];

        // Page headers
        document.querySelectorAll('h1, h2, header').forEach(el => {
            if (el.innerText) texts.push(el.innerText.trim());
        });

        // Lightning object tabs
        document.querySelectorAll('[role="tab"], .slds-context-bar__label-action').forEach(el => {
            if (el.innerText) texts.push(el.innerText.trim());
        });

        // Modal titles
        document.querySelectorAll('[role="dialog"] h1, [role="dialog"] h2').forEach(el => {
            if (el.innerText) texts.push(el.innerText.trim());
        });

        return texts.join(" | ");
    }
    """)
def get_active_ui_container(page):
    return page.evaluate("""
    () => {
        const selectors = [
            '.slds-dropdown',
            '.slds-lookup__menu',
            '[role="listbox"]',
            '.slds-modal',
            '[role="dialog"]'
        ];

        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) return el.outerHTML;
        }
        return null;
    }
    """)
