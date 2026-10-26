import React, { useEffect, useCallback, useMemo } from "react";
import { Users, UserCheck, UserPlus, X, Key } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const blankCreds = (integrations = []) =>
  integrations.map((i) => ({ type: i.type, username: "", password: "" }));

const blankUser = (integrations) => ({
  username: "", password: "", user_display_name: "", llm_key: "",
  integration_creadentials: blankCreds(integrations),
});

const ADMIN_TEMPLATE = { id: 2, username: "admin.user", email: "admin@example.com", role: "Admin" };

const validate = (usersData) => {
  const admin = usersData?.existing?.[0];
  for (const c of admin?.integration_creadentials ?? [])
    if (!c.username?.trim() || !c.password?.trim())
      return "Admin integration credentials are incomplete.";

  for (const u of usersData?.new ?? []) {
    if (!u.username?.trim() || !u.password?.trim())
      return `User "${u.username || "#"}" is missing username or password.`;
    for (const c of u.integration_creadentials ?? [])
      if (!c.username?.trim() || !c.password?.trim())
        return `Integration credentials incomplete for "${u.username}".`;
  }
  return "";
};

// ── Shared Input ──────────────────────────────────────────────────────────────
const Field = ({ label, required, ...props }) => (
  <div>
    {label && (
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <input
      {...props}
      className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent transition
        ${props.disabled
          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
          : "bg-slate-50 border-slate-200 focus:ring-indigo-400"
        }`}
    />
  </div>
);

// ── Cred Row ──────────────────────────────────────────────────────────────────
const CredRow = React.memo(({ cred, onUsername, onPassword }) => (
  <div className="grid grid-cols-3 gap-3 p-3 bg-white border border-slate-200 rounded-xl">
    <Field label="Integration" disabled value={cred.type} />
    <Field label="Username" required placeholder="Username" value={cred.username} onChange={(e) => onUsername(e.target.value)} />
    <Field label="Password" required type="password" placeholder="••••••••" value={cred.password} onChange={(e) => onPassword(e.target.value)} />
  </div>
));

// ── Main Component ────────────────────────────────────────────────────────────
export default function Step4UserOnboarding({ usersData, updateUsers, integrations, setStepValid, setStepError }) {

  // Init / sync admin creds when integrations change
  useEffect(() => {
    if (!usersData) return;
    updateUsers({
      existing: [{ ...ADMIN_TEMPLATE, integration_creadentials: blankCreds(integrations) }],
      new: usersData.new ?? [],
    });
  }, [integrations]); // eslint-disable-line

  // Validation
  useEffect(() => {
    const err = validate(usersData);
    setStepValid?.(!err);
    setStepError?.(err);
  }, [usersData, setStepValid, setStepError]);

  // ── Updaters ────────────────────────────────────────────────────────────────
  const updateAdminCred = useCallback((idx, field, val) => {
    const existing = [...usersData.existing];
    const creds = [...existing[0].integration_creadentials];
    creds[idx] = { ...creds[idx], [field]: val };
    existing[0] = { ...existing[0], integration_creadentials: creds };
    updateUsers({ ...usersData, existing });
  }, [usersData, updateUsers]);

  const updateUserField = useCallback((uIdx, field, val) => {
    const newUsers = [...usersData.new];
    newUsers[uIdx] = { ...newUsers[uIdx], [field]: val };
    updateUsers({ ...usersData, new: newUsers });
  }, [usersData, updateUsers]);

  const updateUserCred = useCallback((uIdx, cIdx, field, val) => {
    const newUsers = [...usersData.new];
    const creds = [...newUsers[uIdx].integration_creadentials];
    creds[cIdx] = { ...creds[cIdx], [field]: val };
    newUsers[uIdx] = { ...newUsers[uIdx], integration_creadentials: creds };
    updateUsers({ ...usersData, new: newUsers });
  }, [usersData, updateUsers]);

  const addUser = useCallback(() =>
    updateUsers({ ...usersData, new: [...(usersData.new ?? []), blankUser(integrations)] }),
    [usersData, integrations, updateUsers]);

  const removeUser = useCallback((idx) =>
    updateUsers({ ...usersData, new: usersData.new.filter((_, i) => i !== idx) }),
    [usersData, updateUsers]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const admin       = usersData?.existing?.[0];
  const newUsers    = usersData?.new ?? [];
  const errMsg      = useMemo(() => validate(usersData), [usersData]);

  return (
    <div className="space-y-5 text-slate-800">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5" /> User Onboarding</h2>
        <p className="text-sm text-slate-500">Configure credentials for Admin and team members.</p>
      </div>

      {/* ── Admin Card ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-indigo-500" />
          <h3 className="font-semibold text-sm">Admin Integration Settings</h3>
        </div>

        {/* Admin info pill */}
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{admin?.username}</p>
            <p className="text-xs text-slate-500">{admin?.email}</p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">Admin</span>
        </div>

        {/* Admin creds */}
        {admin?.integration_creadentials?.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Integration Credentials</p>
            {admin.integration_creadentials.map((cred, i) => (
              <CredRow
                key={i} cred={cred}
                onUsername={(v) => updateAdminCred(i, "username", v)}
                onPassword={(v) => updateAdminCred(i, "password", v)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Team Users Card ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold text-sm">Team Users</h3>
            {newUsers.length > 0 && (
              <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">{newUsers.length}</span>
            )}
          </div>
          <button
            type="button" onClick={addUser}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add User
          </button>
        </div>

        {newUsers.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No team members added yet.
          </p>
        ) : (
          <div className="space-y-4">
            {newUsers.map((user, uIdx) => (
              <div key={uIdx} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                {/* User header */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">User - {uIdx + 1}</p>
                  <button
                    type="button" onClick={() => removeUser(uIdx)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* User basic fields */}
                <div className="grid grid-cols-2 gap-3">
                  <Field placeholder="Username" required value={user.username} onChange={(e) => updateUserField(uIdx, "username", e.target.value)} />
                  <Field placeholder="Password" required type="password" value={user.password} onChange={(e) => updateUserField(uIdx, "password", e.target.value)} />
                  <Field placeholder="Display Name" value={user.user_display_name} onChange={(e) => updateUserField(uIdx, "user_display_name", e.target.value)} />
                  <Field placeholder="LLM API Key" type="password" value={user.llm_key} onChange={(e) => updateUserField(uIdx, "llm_key", e.target.value)} />
                </div>

                {/* User integration creds */}
                {user.integration_creadentials?.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <Key className="w-3 h-3" /> Integration Credentials
                    </p>
                    {user.integration_creadentials.map((cred, cIdx) => (
                      <CredRow
                        key={cIdx} cred={cred}
                        onUsername={(v) => updateUserCred(uIdx, cIdx, "username", v)}
                        onPassword={(v) => updateUserCred(uIdx, cIdx, "password", v)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global error banner */}
      {errMsg && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          Fix the highlighted errors before continuing: {errMsg}
        </div>
      )}
    </div>
  );
}