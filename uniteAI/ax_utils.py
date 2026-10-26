def flatten_ax_tree(node, results=None):
    if results is None:
        results = []

    if not node:
        return results

    role = node.get("role")
    name = node.get("name")

    if role and name:
        results.append({"role": role, "name": name})

    for child in node.get("children", []):
        flatten_ax_tree(child, results)

    return results


def get_ax_nodes(page):
    """
    Browser-side accessibility extraction.
    Works even when Playwright accessibility API is missing.
    """
    return page.evaluate("""
    () => {
        const results = [];

        const elements = document.querySelectorAll(
            'button, [role="button"], a, input, textarea, select, [role], [aria-label]'
        );

        for (const el of elements) {
            let name =
                el.getAttribute('aria-label') ||
                el.getAttribute('title') ||
                el.getAttribute('placeholder') ||
                el.innerText?.trim() ||
                el.value?.trim();

            // Salesforce icon-only buttons
            const assistive = el.querySelector?.('.slds-assistive-text');
            if (!name && assistive) {
                name = assistive.innerText.trim();
            }

            if (!name) continue;

            const role =
                el.getAttribute('role') ||
                (el.tagName === 'BUTTON' ? 'button' :
                 el.tagName === 'A' ? 'link' :
                 el.tagName === 'INPUT' ? 'textbox' :
                 el.tagName.toLowerCase());

            results.push({
                role,
                name
            });
        }

        return results;
    }
    """)


def normalize(text):
    return text.lower().replace(" ", "").replace("-", "")


def find_ax_candidates(intent, ax_nodes):
    intent_n = normalize(intent)
    return [
        n for n in ax_nodes
        if intent_n in normalize(n["name"])
           or normalize(n["name"]) in intent_n
    ]
