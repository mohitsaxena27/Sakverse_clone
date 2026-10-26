import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

const CATEGORIES = [
  { type: "PM",  label: "Project Management",  hint: "Jira, Linear…",       toolPH: "e.g. Jira",        urlPH: "https://pm.example.com",  required: false },
  { type: "TM",  label: "Test Management",      hint: "TestRail, Zephyr…",   toolPH: "e.g. TestRail",    urlPH: "https://tm.example.com",  required: false },
  { type: "KM",  label: "Knowledge Management", hint: "Confluence, Notion…", toolPH: "e.g. Confluence",  urlPH: "https://km.example.com",  required: false },
  { type: "LLM", label: "LLM Integration",      hint: "OpenAI, Anthropic…",  toolPH: "e.g. OpenAI, Anthropic, Groq etc",     urlPH: "https://api.openai.com/v1", required: true  },
];

function validate({ type, tool, url , customid}) {
  const t = tool.trim();
  const u = url.trim();
  if (type === "LLM") {
    if (!t) return "Model name is required.";
    if (!u) return "API URL is required.";
  } else {
    if (t && !u) return "URL is required when a tool is set.";
    if (!t && u) return "Tool name is required when a URL is set.";
  }
    if (type === "PM" && t && u && !customid) {
    return "Please select Custom ID for Project Management.";
  }
    if (type === "TM" && t && u && !customid) {
    return "Please select Custom ID for Test Management.";
  }
  return "";
}

function toOutput(items) {
  return items
    .filter((i) => i.tool.trim() || i.url.trim())
    .map(({ config, customid, ...rest }) => {
      const cfg = customid ? { ...config, customid } : { ...config };

      // "a, b, c"  →  ["a", "b", "c"]
      const processed = Object.fromEntries(
        Object.entries(cfg).map(([k, v]) => [
          k,
          typeof v === "string" && v.includes(",")
            ? v.split(",").map((s) => s.trim()).filter(Boolean)
            : v,
        ])
      );

      return { ...rest, additional_config: Object.keys(processed).length ? processed : null };
    });
}

// ─────────────────────────────────────────────
// 4. INITIAL STATE BUILDER
//    Merges saved integrations with blank defaults.
// ─────────────────────────────────────────────
function buildInitialItems(saved = []) {
  return CATEGORIES.map((cat) => {
    const existing = saved.find((s) => s.type === cat.type);
    return existing
      ? { type: cat.type, tool: existing.tool || "", url: existing.url || "", config: existing.additional_config ?? {}, customid: existing.customid || "" }
      : { type: cat.type, tool: "", url: "", config: {}, customid: "" };
  });
}

// ─────────────────────────────────────────────
// 5. CONFIG ROW — one key/value pair in "Additional Config"
// ─────────────────────────────────────────────
function ConfigRow({ rowKey, value, onKeyBlur, onValueChange, onRemove }) {
  // Local state so typing in the key field doesn't trigger renames on every keystroke
  const [localKey, setLocalKey] = useState(rowKey.startsWith("__new__") ? "" : rowKey);

  return (
    <div className="flex gap-2 items-center group">
      <input
        type="text"
        value={localKey}
        placeholder="Key"
        onChange={(e) => setLocalKey(e.target.value)}
        onBlur={(e) => onKeyBlur(e.target.value.trim() || rowKey)} // commit on blur
        className="flex-1 border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
      <input
        type="text"
        value={value}
        placeholder="Value (comma-separated = array)"
        onChange={(e) => onValueChange(e.target.value)}
        className="flex-[2] border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
      <button
        type="button"
        onClick={onRemove}
        title="Remove row"
        className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// 6. MAIN COMPONENT
// ─────────────────────────────────────────────
export default function ToolIntegration({ integrations, updateIntegration, setStepValid, setStepError }) {
  const [items, setItems] = useState(() => buildInitialItems(integrations));
  const [openCards, setOpenCards] = useState({}); // { PM: true, LLM: false … }

  // --- Derived: errors per type ---
  const errors = useMemo(() => {
    const map = {};
    items.forEach((i) => { map[i.type] = validate(i); });
    return map;
  }, [items]);

  const errorCount   = Object.values(errors).filter(Boolean).length;
  const configuredCount = items.filter((i) => i.tool && i.url).length;

  // --- Notify parent whenever items or errors change ---
  useEffect(() => {
    const firstError = Object.values(errors).find(Boolean) ?? "";
    setStepValid?.(!firstError);
    setStepError?.(firstError);
    updateIntegration?.(toOutput(items));
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Auto-open a card that has an error ---
  useEffect(() => {
    const errType = items.find((i) => errors[i.type])?.type;
    if (errType) setOpenCards((prev) => ({ ...prev, [errType]: true }));
  }, [errors]);

  // ── Helpers to update state immutably ──

  // Update a top-level field (tool, url, customid)
  function setField(idx, field, value) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  // Add a blank config row
  function addConfigRow(idx) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, config: { ...item.config, [`__new__${Date.now()}`]: "" } } : item
      )
    );
  }

  // Update config value for an existing key
  function setConfigValue(idx, key, value) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, config: { ...item.config, [key]: value } } : item
      )
    );
  }

  // Rename a config key (called on blur of key input)
  function renameConfigKey(idx, oldKey, newKey) {
    if (oldKey === newKey) return;
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const cfg = { ...item.config };
        cfg[newKey] = cfg[oldKey];
        delete cfg[oldKey];
        return { ...item, config: cfg };
      })
    );
  }

  // Remove a config row
  function removeConfigRow(idx, key) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const cfg = { ...item.config };
        delete cfg[key];
        return { ...item, config: cfg };
      })
    );
  }

  // Toggle accordion open/close
  function toggleCard(type) {
    setOpenCards((prev) => ({ ...prev, [type]: !prev[type] }));
  }

  // ── Render ──
  return (
    <div className="space-y-4 text-slate-800 w-full">

      {/* Page header with status badges */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold tracking-tight">Tool Integrations</h2>
        <div className="flex gap-2 text-xs font-semibold">
          {errorCount > 0 && (
            <span className="flex items-center gap-1 text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-full">
              <AlertCircle className="w-3 h-3" /> {errorCount} error{errorCount > 1 ? "s" : ""}
            </span>
          )}
          <span className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full text-slate-600">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            {configuredCount}/{items.length} configured
          </span>
        </div>
      </div>

      {/* Integration cards */}
      {items.map((item, idx) => {
        const cat    = CATEGORIES[idx];
        const err    = errors[item.type];
        const isOpen = !!openCards[item.type];

        return (
          <div key={item.type} className={`border rounded-xl bg-white shadow-sm transition-all ${err ? "border-red-300" : "border-slate-200"}`}>

            {/* ── Card header (click to expand/collapse) ── */}
            <button
              type="button"
              onClick={() => toggleCard(item.type)}
              className="w-full flex justify-between items-center px-4 py-3 hover:bg-slate-50 rounded-xl text-left"
            >
              <div>
                <p className="font-semibold text-sm flex items-center gap-2">
                  {cat.label}
                  {cat.required && (
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded font-bold">REQUIRED</span>
                  )}
                  {item.tool && item.url && (
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded font-bold">SAVED</span>
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{item.tool ? item.tool : cat.hint}</p>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {/* ── Card body (only shown when open) ── */}
            {isOpen && (
              <div className="border-t border-slate-100 px-4 pt-4 pb-5 space-y-4">

                {/* Tool name input */}
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-500">Tool / Model Name</span>
                  <input
                    value={item.tool}
                    placeholder={cat.toolPH}
                    onChange={(e) => setField(idx, "tool", e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-300 ${err ? "border-red-400 bg-red-50" : "border-slate-300"}`}
                  />
                </label>

                {/* URL input */}
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-500">API / Base URL</span>
                  <input
                    value={item.url}
                    placeholder={cat.urlPH}
                    onChange={(e) => setField(idx, "url", e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-300 ${err ? "border-red-400 bg-red-50" : "border-slate-300"}`}
                  />
                </label>

                {/* Inline error message */}
                {err && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3" /> {err}
                  </p>
                )}

                {/* Custom ID — only shown for PM cards */}
                {item.type === "PM" && (
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-slate-500 mr-5">Custom ID</span>
               <select
  value={item.customid || ""}
  onChange={(e) => setField(idx, "customid", e.target.value)}
  className={`border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 
    ${err ? "border-red-400 bg-red-50" : "border-slate-300"}`}
>
                      <option value="">— Select —</option>
                      <option value="1">1 Step</option>
                      <option value="2">2 Step</option>
                    </select>
                  </label>
                )}
                {item.type === "TM" && (
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-slate-500 mr-5">Custom ID</span>
                                  <select
  value={item.customid || ""}
  onChange={(e) => setField(idx, "customid", e.target.value)}
  className={`border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 
    ${err ? "border-red-400 bg-red-50" : "border-slate-300"}`}
>
                      <option value="">— Select —</option>
                      <option value="1">DEFAULT</option>
                      <option value="2">KIWI</option>
                      <option value="3">ADO</option>
                    </select>
                  </label>
                )}

                {/* Additional config key/value pairs */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-semibold text-slate-600">Additional Config</p>
                    <button
                      type="button"
                      onClick={() => addConfigRow(idx)}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Row
                    </button>
                  </div>

                  {Object.keys(item.config).length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">No extra config — click "Add Row" to add one</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(item.config).map(([k, v]) => (
                        <ConfigRow
                          key={k}
                          rowKey={k}
                          value={v}
                          onKeyBlur={(newKey)   => renameConfigKey(idx, k, newKey)}
                          onValueChange={(newVal) => setConfigValue(idx, k, newVal)}
                          onRemove={()          => removeConfigRow(idx, k)}
                        />
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}