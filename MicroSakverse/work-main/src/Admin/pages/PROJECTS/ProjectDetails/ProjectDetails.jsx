import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  XCircle,
  Pencil,
  Save,
  X,
  Shield,
  Mail,
  Calendar,UserPlus, Trash2
} from "lucide-react";
import useUserData from "../../../../Hooks/Manual/UserData";

const tabs = ["Details", "Integrations", "Users"];

const INTEGRATION_LABELS = {
  TM: "Test Management",
  PM: "Project Management",
  KM: "Knowledge Management",
  LLM: "AI / LLM",
};

const DUMMY_USERS = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Admin", joined: "Jan 12, 2024", status: "Active" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", role: "Manual Tester", joined: "Feb 3, 2024", status: "Active" },
  { id: 3, name: "Carol White", email: "carol@example.com", role: "Manual Tester", joined: "Mar 18, 2024", status: "Inactive" },
  { id: 4, name: "David Lee", email: "david@example.com", role: "Viewer", joined: "Apr 5, 2024", status: "Active" },
];

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects = [] } = useUserData();

  const project = useMemo(
    () => projects.find((p) => String(p.project_id) === String(projectId)),
    [projects, projectId]
  );

  const [editedProject, setEditedProject] = useState(null);
  const [activeTab, setActiveTab] = useState("Details");
  const [isEditing, setIsEditing] = useState(false);
  const [integrations, setIntegrations] = useState([]);

  useEffect(() => {
    if (project) {
      setEditedProject(project);
      setIntegrations(
        (project.integration || []).map((int) => ({
          ...int,
          username: "",
          password: "",
        }))
      );
    }
  }, [project]);

  const handleIntegrationChange = (index, field, value) => {
    setIntegrations((prev) =>
      prev.map((int, i) => (i === index ? { ...int, [field]: value } : int))
    );
  };

  const handleCancel = () => {
    setEditedProject(project);
    setIsEditing(false);
  };

  if (!editedProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
        Loading project...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto p-6 md:p-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition"
            >
              <ArrowLeft size={16} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{editedProject.project_name?.trim()}</h1>
              <p className="text-xs text-gray-400">Project ID: #{editedProject.project_id}</p>
            </div>
          </div>

          {/* Edit / Save / Cancel — only on Details & Integrations */}
          {activeTab !== "Users" && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-600"
                  >
                    <X size={14} /> Cancel
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    <Save size={14} /> Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition text-gray-700"
                >
                  <Pencil size={14} /> Edit
                </button>
              )}
            </div>
          )}
        </div>

        {/* Main card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setIsEditing(false); }}
                className={`px-6 py-3.5 text-sm font-medium transition border-b-2 ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8">

            {/* ── DETAILS TAB ── */}
            {activeTab === "Details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                <Field label="Project Name">
                  {isEditing ? (
                    <input
                      value={editedProject.project_name}
                      onChange={(e) =>
                        setEditedProject({ ...editedProject, project_name: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <ReadonlyField>{editedProject.project_name?.trim()}</ReadonlyField>
                  )}
                </Field>

                <Field label="Project Type">
                  <ReadonlyField>{editedProject.project_type}</ReadonlyField>
                </Field>

                <Field label="Role">
                  <ReadonlyField icon={<Users size={14} className="text-gray-400" />}>
                    {editedProject.role}
                  </ReadonlyField>
                </Field>
<Field label="Linked with Unite Automation">
  <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border bg-gray-50">

    <span
      className={`text-sm font-medium ${
        editedProject.linked ? "text-green-600" : "text-gray-500"
      }`}
    >
      {editedProject.linked ? "Linked" : "Not Linked"}
    </span>

    {/* Toggle */}
    <button
      type="button"
      disabled={!isEditing}
      onClick={() =>
        isEditing &&
        setEditedProject({
          ...editedProject,
          linked: !editedProject.linked,
        })
      }
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
        editedProject.linked ? "bg-green-500" : "bg-gray-300"
      } ${!isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
          editedProject.linked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </div>
</Field>

                <Field label="Total Integrations">
                  <ReadonlyField>{integrations.length} </ReadonlyField>
                </Field>

              </div>
            )}

            {/* ── INTEGRATIONS TAB ── */}
            {activeTab === "Integrations" && (
              <>
                {integrations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {["Type", "Tool", "Username", "Password", "Status"].map((h) => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {integrations.map((int, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            {/* Type */}
                            <td className="px-4 py-3.5">
                              <div className="font-medium text-gray-900">{INTEGRATION_LABELS[int.type] || int.type}</div>
                              <div className="text-xs text-gray-400">{int.type}</div>
                            </td>

                            {/* Tool */}
                            <td className="px-4 py-3.5">
                              {isEditing ? (
                                <input
                                  value={int.tool}
                                  onChange={(e) => handleIntegrationChange(i, "tool", e.target.value)}
                                  placeholder="e.g. JIRA"
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              ) : (
                                <span className="text-gray-700">{int.tool || <span className="text-gray-300 italic">—</span>}</span>
                              )}
                            </td>

                            {/* Username */}
                            <td className="px-4 py-3.5">
                              {isEditing ? (
                                <input
                                  value={int.username}
                                  onChange={(e) => handleIntegrationChange(i, "username", e.target.value)}
                                  placeholder="Username"
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              ) : (
                                <span className="text-gray-400 italic text-xs">{int.username || "Not set"}</span>
                              )}
                            </td>

                            {/* Password */}
                            <td className="px-4 py-3.5">
                              {isEditing ? (
                                <input
                                  type="password"
                                  value={int.password}
                                  onChange={(e) => handleIntegrationChange(i, "password", e.target.value)}
                                  placeholder="••••••••"
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              ) : (
                                <span className="text-gray-400 italic text-xs">{int.password ? "••••••••" : "Not set"}</span>
                              )}
                            </td>

                            {/* Toggle */}
                            <td className="px-4 py-3.5">
                              <button
                                onClick={() =>
                                  isEditing && handleIntegrationChange(i, "enabled", !int.enabled)
                                }
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                  int.enabled ? "bg-blue-600" : "bg-gray-200"
                                } ${!isEditing ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                              >
                                <span
                                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                    int.enabled ? "translate-x-4" : "translate-x-0.5"
                                  }`}
                                />
                              </button>
                              <span className={`ml-2 text-xs font-medium ${int.enabled ? "text-blue-600" : "text-gray-400"}`}>
                                {int.enabled ? "Enabled" : "Disabled"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-400">
                    <div className="text-sm">No integrations configured for this project.</div>
                  </div>
                )}
              </>
            )}
{/* ── USERS TAB ── */}
{activeTab === "Users" && (
  <div className="space-y-4">

    {/* Top Bar */}
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold text-gray-800">
        Project Users
      </h3>

      <button
        onClick={() => console.log("Add user clicked")}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
      >
        <UserPlus size={16} />
        Add User
      </button>
    </div>

    {/* Table */}
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {["User", "Role", "Joined", "Status", "Actions"].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-50">
          {DUMMY_USERS.map((user) => (
            <tr
              key={user.id}
              className="hover:bg-gray-50 transition-colors"
            >
              {/* USER */}
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs flex-shrink-0">
                    {user.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.name}
                    </div>
                    <div className="text-gray-400 text-xs flex items-center gap-1">
                      <Mail size={10} /> {user.email}
                    </div>
                  </div>
                </div>
              </td>

              {/* ROLE */}
              <td className="px-4 py-3.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                  <Shield size={11} /> {user.role}
                </span>
              </td>

              {/* JOINED */}
              <td className="px-4 py-3.5 text-gray-500 text-xs">
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} /> {user.joined}
                </div>
              </td>

              {/* STATUS */}
              <td className="px-4 py-3.5">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    user.status === "Active"
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {user.status}
                </span>
              </td>

              {/* ACTIONS */}
              <td className="px-4 py-3.5">
                <button
                  onClick={() => console.log("Delete user", user.id)}
                  className="p-2 rounded-md hover:bg-red-50 text-red-500 hover:text-red-600 transition"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Small reusable helpers ── */

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
      {label}
    </label>
    {children}
  </div>
);

const ReadonlyField = ({ children, icon }) => (
  <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700">
    {icon} {children}
  </div>
);

export default ProjectDetails;