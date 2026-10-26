import React, { useEffect, useState, useRef } from "react";
import { FaUser, FaDatabase, FaSignOutAlt, FaClone, FaPlay, FaRedo, FaSpinner, FaFileDownload } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import useLogout from "../../../Components/Common/logout";
import useUserData from "../../../Hooks/Manual/UserData";
import { useNavigate } from "react-router-dom";
import saksoftLogo from "../../../assets/images/sakicon.png";

const AutomationNavbar = ({
  status,
  totalSteps,
  completedSteps,
  onExecute,
  failedSteps,
  onNumberChange,
  isEditMode,
  setIsEditMode,
  onClone,
  isCloning,
  onDownloadReport
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(0);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [sourceExecutionId, setSourceExecutionId] = useState("");

  const logoutTimeoutRef = useRef(null);

  const handleLogout = useLogout();

  const [searchParams, setSearchParams] = useSearchParams();
  const { projects = [] } = useUserData();
  const projectId = searchParams.get("projectId");
  const [isBugSubmitting, setIsBugSubmitting] = useState(false);
const [jiraKey, setJiraKey] = useState(null);

  const navigate = useNavigate();

const handleBugClick = async () => {
  if (isBugSubmitting) return;

  setIsBugSubmitting(true);
  setJiraKey(null);

  const payload = {
    error_type: "TypeError",
    error_message: "Cannot read properties of null (reading 'fields')",
    stack_trace:
      "TypeError: Cannot read properties of null (reading 'fields')\n    at createProject (https://nexusflow-app-lyart.vercel.app/projects.html:232:39)\n    at HTMLButtonElement.onclick (https://nexusflow-app-lyart.vercel.app/projects.html:118:69)",
    source_file: "projects.html",
    title: "Project creation failed — null template for category",
    priority: "critical",
    context: {
      module: "ProjectService",
      action: "createProject",
      inputs: {
        projectName: "Website Redesign",
        category: "marketing",
        description: ""
      }
    },
    repo_owner: "anirban-saksoft",
    repo_name: "nexusflow-app",
    app_name: "NexusFlow",
    environment: "production",
    timestamp: "2026-08-31T10:16:40.273Z",
    page_url: "https://nexusflow-app-lyart.vercel.app/projects.html"
  };

  try {
    const response = await fetch(
      "https://vm-dev-access.centralindia.cloudapp.azure.com/webhook/triage-issue",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      throw new Error(`API failed: ${response.status}`);
    }

    const data = await response.json();

    // Only keep jiraKey
    setJiraKey(data.jiraKey);
  } catch (error) {
    console.error("Bug creation failed:", error);
  } finally {
    setIsBugSubmitting(false);
  }
};


  useEffect(() => {
    const existingProjectId = searchParams.get("projectId");

    if (!existingProjectId && projects.length > 0) {
      const firstProject = projects[0];

      const updatedParams = new URLSearchParams(searchParams);
      updatedParams.set("projectId", firstProject.project_id);

      setSearchParams(updatedParams);
    }
  }, [projects]);

  useEffect(() => {
    onNumberChange?.(selectedNumber);
  }, []);

  useEffect(() => {
    if (status === "SUCCESS" || status === "FAILED") {
      setIsSubmitting(false);
    }
  }, [status]);

  const handleNumberChange = (e) => {
    const value = Number(e.target.value);
    setSelectedNumber(value);

    if (onNumberChange) {
      onNumberChange(value);
    }
  };

  const handleExecute = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onExecute();
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  const handleCloneClick = () => {
    setShowCloneModal(true);
    setSourceExecutionId("");
    setShowLogout(false);
  };

  const handleCloneSubmit = async () => {
    if (!sourceExecutionId) {
      return;
    }
    
    try {
      await onClone(sourceExecutionId);
      setShowCloneModal(false);
      setSourceExecutionId("");
    } catch (err) {
      // Error is already handled in parent
    }
  };

  const getTestResultBadge = () => {
    if (failedSteps > 0) {
      return {
        text: "Failed",
        icon: "✗",
        textColor: "text-red-400",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20"
      };
    }

    if (totalSteps > 0 && completedSteps === totalSteps) {
      return {
        text: "Passed",
        icon: "✓",
        textColor: "text-green-400",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/20"
      };
    }

    if (totalSteps === 0) {
      return {
        text: "Not Started",
        icon: "○",
        textColor: "text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/20"
      };
    }

    if (status === "IN_PROGRESS") {
      return {
        text: "Running",
        icon: "-",
        textColor: "text-blue-400",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20"
      };
    }

    return {
      text: "Retry",
      icon: "⟳",
      textColor: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20"
    };
  };

  const testResult = getTestResultBadge();

  const getButtonConfig = () => {
    if (status === "IN_PROGRESS" || isSubmitting) {
      return {
        label: status === "IN_PROGRESS" ? "Executing..." : "Executing...",
        icon: FaSpinner,
        className: "bg-blue-500 hover:bg-blue-600 text-white cursor-wait",
        disabled: true
      };
    }
    if (status === "SUCCESS") {
      return {
        label: "Re-run",
        icon: FaRedo,
        className: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40",
        disabled: false
      };
    }
    if (status === "FAILED") {
      return {
        label: "Retry",
        icon: FaRedo,
        className: "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40",
        disabled: false
      };
    }
    return {
      label: "Execute",
      icon: FaPlay,
      className: "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40",
      disabled: false
    };
  };

  const buttonConfig = getButtonConfig();
  const ButtonIcon = buttonConfig.icon;

  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const isButtonDisabled = isSubmitting || status === "IN_PROGRESS";

  const handleProfileClick = () => {
    setShowLogout(!showLogout);

    if (!showLogout) {
      logoutTimeoutRef.current = setTimeout(() => {
        setShowLogout(false);
      }, 5000);
    } else {
      clearTimeout(logoutTimeoutRef.current);
    }
  };

  const handleMouseEnter = () => {
    clearTimeout(logoutTimeoutRef.current);
  };

  const handleMouseLeave = () => {
    logoutTimeoutRef.current = setTimeout(() => {
      setShowLogout(false);
    }, 5000);
  };

  return (
    <>
      <header className="bg-[#0B0E14] border-b border-[#1E2630] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">

          {/* Left Section - Logo and Title */}
          <div className="flex items-center gap-3 min-w-[140px]">
            <img
              src={saksoftLogo}
              alt="Saksoft Logo"
              className="h-8 w-auto cursor-pointer hover:scale-105 transition-transform duration-200"
            />

            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-amber-400 leading-tight tracking-tight">
                Test Execution Agent
              </h1>
              <p className="text-xs text-gray-400 leading-tight">
                Intelligent Test Execution System
              </p>
            </div>
          </div>

          {/* Right Section - Controls */}
          <div className="flex items-center gap-2 flex-wrap flex-1 justify-end">
            
{failedSteps > 0 && (
  <div className="flex items-center gap-2">
       {jiraKey && (
      <span className="px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-sm font-semibold text-green-400">
        JIRA BUG KEY - {jiraKey}
      </span>
    )}
    <button
      onClick={handleBugClick}
      disabled={isBugSubmitting || jiraKey || buttonConfig.disabled}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
        isBugSubmitting || jiraKey || buttonConfig.disabled
          ? "bg-red-500/60 text-white cursor-not-allowed opacity-70"
          : "bg-red-500 hover:bg-red-700 text-white hover:scale-[1.02] active:scale-[0.98]"
      }`}
    >
      {isBugSubmitting ? (
        <>
          <FaSpinner className="animate-spin text-xs" />
          Creating...
        </>
      ) : (
        "BUG"
      )}
    </button>

 
  </div>
)}       
            {/* Execute Button - Minimal & Clean */}
<button
  onClick={handleExecute}
  disabled={buttonConfig.disabled}
  className={`w-24 px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${buttonConfig.className} ${
    buttonConfig.disabled
      ? 'opacity-70 cursor-not-allowed'
      : 'hover:scale-[1.02] active:scale-[0.98]'
  }`}
>
  {buttonConfig.disabled ? (
    <FaSpinner className="animate-spin" />
  ) : (
    <ButtonIcon className="text-sm" />
  )}
  {buttonConfig.label}
</button>


            {/* Status Badge - Clean Pill */}
            <div className={`px-3 py-1.5 rounded-full border ${testResult.bgColor} ${testResult.borderColor} backdrop-blur-sm`}>
              <span className={`text-xs font-semibold ${testResult.textColor} flex items-center gap-1.5`}>
                <span className="text-sm">{testResult.icon}</span>
                {testResult.text}
              </span>
            </div>

            {/* Download Report Button */}
    <button
  onClick={onDownloadReport}
  disabled={status !== 'SUCCESS'}
  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
    status === 'SUCCESS'
      ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]'
      : 'hidden bg-[#1A212A] text-gray-500 cursor-not-allowed border border-[#2A3442]'
  }`}
>
  <FaFileDownload className="text-md" />
  
</button>

            {/* Progress Bar */}
            {totalSteps > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-2 py-2 bg-[#1A212A] rounded-full border border-[#2A3442]">
                <div className="w-20 h-1.5  bg-[#2A3442] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-400 min-w-[32px]">
                  {Math.round(progress)}%
                </span>
              </div>
            )}

            {/* Row Number Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#1A212A] border border-[#2A3442] rounded-full px-2 py-1">
              <label className="text-xs text-gray-400 hidden sm:inline font-medium">Row</label>
              <select
                value={selectedNumber}
                onChange={handleNumberChange}
                className="bg-transparent border-none text-white text-xs sm:text-sm rounded-full px-2 py-0.5 outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer min-w-[50px] sm:min-w-[60px]"
              >
                <option value={0} className="bg-[#1A212A]">null</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num} className="bg-[#1A212A]">
                    {num}
                  </option>
                ))}
              </select>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#1A212A] hover:bg-[#252F3B] transition-all duration-200 cursor-pointer border border-[#2A3442] hover:border-[#3B4654]"
                onClick={handleProfileClick}
              >
                <FaUser className="text-gray-300 text-sm w-4 h-4" />
                <span className="text-gray-300 text-sm font-medium hidden sm:inline">
                  Profile
                </span>
              </div>

              {showLogout && (
                <div
                  className="absolute right-0 mt-2 bg-[#131A22] border border-[#2A3442] rounded-2xl shadow-2xl w-52 z-50 overflow-hidden backdrop-blur-sm animate-fadeIn"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {onClone && (
                    <button
                      onClick={handleCloneClick}
                      disabled={isCloning}
                      className={`w-full px-4 py-3 text-sm flex items-center gap-3 border-b border-[#2A3442] transition-colors ${
                        isCloning
                          ? "text-gray-500 cursor-not-allowed bg-[#1A212A]/50"
                          : "text-emerald-400 hover:bg-[#1A212A] hover:text-emerald-300"
                      }`}
                    >
                      <FaClone className="w-4 h-4" />
                      <span>{isCloning ? "Cloning..." : "Clone Test"}</span>
                    </button>
                  )}

                  <button
                    onClick={() => window.open("/testDataManagement", "_blank")}
                    className="w-full px-4 py-3 text-sm text-blue-400 hover:bg-[#1A212A] hover:text-blue-300 transition-colors flex items-center gap-3 border-b border-[#2A3442]"
                  >
                    <FaDatabase className="w-4 h-4" />
                    <span>Test Data Manager</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-sm text-rose-400 hover:bg-[#1A212A] hover:text-rose-300 transition-colors flex items-center gap-3"
                  >
                    <FaSignOutAlt className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Clone Modal */}
      {showCloneModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCloneModal(false);
              setSourceExecutionId("");
            }
          }}
        >
          <div className="bg-[#131A22] border border-[#2A3442] rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-100 mb-6 flex items-center gap-3">
              <FaClone className="text-emerald-400 w-5 h-5" />
              Clone Test
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Source Execution ID
                </label>
                <input
                  type="text"
                  value={sourceExecutionId}
                  onChange={(e) => setSourceExecutionId(e.target.value)}
                  placeholder="Enter execution ID to clone"
                  className="w-full px-4 py-2.5 bg-[#1A212A] border border-[#2A3442] rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Enter the execution ID you want to clone from
                </p>
              </div>

              <div className="flex flex-col xs:flex-row gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCloneModal(false);
                    setSourceExecutionId("");
                  }}
                  className="flex-1 px-4 py-2.5 bg-[#1A212A] text-gray-300 rounded-xl hover:bg-[#252F3B] transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloneSubmit}
                  disabled={isCloning || !sourceExecutionId}
                  className={`flex-1 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
                    isCloning || !sourceExecutionId
                      ? "bg-[#1A212A] text-gray-500 cursor-not-allowed"
                      : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  {isCloning ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Cloning...
                    </span>
                  ) : (
                    "Clone"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        @media (max-width: 480px) {
          .xs\\:flex-row {
            flex-direction: row;
          }
        }
      `}</style>
    </>
  );
};

export default AutomationNavbar;