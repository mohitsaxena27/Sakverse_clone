import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Step1ProjectDetails from "./Step1ProjectDetails";
import Step2DocumentUpload from "./Step2DocumentUpload";
import Step3ToolIntegration from "./Step3ToolIntegration";
import Step4UserOnboarding from "./Step4UserOnboarding";
import { useUserStoryFlow } from "../api";

const CreateProjectPage = ({ users = [] }) => {
  const { projectOnboarding, loading: apiLoading, error: apiError } = useUserStoryFlow();
  const [step, setStep] = useState(1);
  const [stepValid, setStepValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [stepError, setStepError] = useState("");
  const navigate = useNavigate();


  const [formData, setFormData] = useState({
    project: {
      project_name: "",
      project_type: "Manual",
      description: "",
      automation_repo: "",
      linked: null, 
      llm_model: "",
      manual_repo: "",
      integration: [],
      users: { existing: [], new: [] },
    },
    documents: [],
  });

  const triggerToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

const handleNext = () => {
  if (loading) return;
  if (!stepValid) {
    triggerToast("error", stepError || "Please fill all required fields.");
    return;
  }

  // console.log("➡️ Moving to next step:", step + 1);
  if (step < 4) {
    setStep(step + 1);
    setStepValid(false);
    setStepError(""); // clear old errors
  }
};


  const handleBack = () => {
    if (loading) return;
    if (step > 1) setStep(step - 1);
    setStepError("");
  };

  const updateProjectData = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      project: { ...prev.project, [field]: value },
    }));
  };

  const updateIntegration = (integrations) => {
    setFormData((prev) => ({
      ...prev,
      project: { ...prev.project, integration: integrations },
    }));
  };

  const updateUsers = (usersData) => {
    setFormData((prev) => ({
      ...prev,
      project: { ...prev.project, users: usersData },
    }));
  };

const handleSubmit = async () => {
  if (loading) return;

  if (!stepValid) {
    triggerToast("error", stepError || "Please fix the errors before submitting.");
    return;
  }

  setLoading(true);

  try {
    // Convert linked boolean to integer (1 for true, 0 for false)
    const projectData = {
      ...formData.project,
      linked: formData.project.linked === true ? 1 : 0
    };
    
    const textData = JSON.stringify({ project: projectData });
    const files = formData.documents;

    await projectOnboarding(textData, files);

    triggerToast("success", "Project created successfully! wow");

    navigate("/Admin/Projects", {
      state: { successMessage: "Project onboarded successfully!" }
    });

  } catch (err) {
    console.error("❌ Project Onboarding Error:", err);

    const safeMessage =
      err?.response?.data?.message ||
      err?.message ||
      "Unexpected error occurred during onboarding.";

    setStepError?.(safeMessage);
    triggerToast("error", safeMessage);

  } finally {
    setLoading(false);
  }
};


  return (
    <div className="w-full h-full flex flex-col bg-green-100 text-gray-900 relative">
      {/* ------- TOAST SYSTEM ------- */}
      {toast && (
        <div
          className={`fixed top-5 right-5 w-80 max-w-full rounded-lg shadow-lg z-50 transition-all duration-500
    ${toast.type === "success" ? "bg-green-50 border-l-4 border-green-500 text-green-800" : "bg-red-50 border-l-4 border-red-500 text-red-800"}
  `}
        >
          <h1 className={`px-4 py-2 text-white font-bold rounded-t-md
    ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}
  `}>
            ALERT
          </h1>
          <div className="px-4 py-3 text-xs">
            {toast.message}
          </div>
        </div>

      )}


      {/* ------- HEADER (Corporate Theme) ------- */}
      <div className="flex items-center justify-between px-6 py-4 bg-blue-900 border-b border-blue-700 shadow">
        <div>
          <h2 className="text-3xl font-semibold text-white">Create New Project</h2>
          <p className="mt-1 text-sm text-blue-200">
            Provide the required details to onboard a new project.
          </p>
        </div>

        <button
          onClick={() => navigate("/Admin/Projects")}
          disabled={loading}
          className="flex items-center gap-2 bg-red-500 text-white font-semibold border border-gray-600 px-3 py-1 rounded-lg hover:bg-yellow-400 disabled:opacity-50"
        >
          <span className="text-sm">Back</span>
        </button>
      </div>

      {/* ------- MAIN FORM ------- */}
      <div className={`flex-1 overflow-y-auto p-6 space-y-6 ${loading ? "pointer-events-none opacity-50" : ""}`}>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {["Project Details", "Documents", "Integrations", "Users"].map((label, index) => {
            const s = index + 1;
            const active = step === s;
            const completed = step > s;

            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border
                    ${active
                      ? "bg-blue-600 border-blue-400 text-white"
                      : completed
                        ? "bg-green-600 border-green-400 text-white"
                        : "bg-gray-200 border-gray-400 text-gray-700"
                    }`}
                >
                  {s}
                </div>
                <span className="text-sm text-gray-800">{label}</span>
                {s !== 4 && <div className="w-8 h-[2px] bg-gray-400 mx-1" />}
              </div>
            );
          })}
        </div>

        {/* Step screens */}
        {step === 1 && (
          <Step1ProjectDetails
            formData={formData.project}
            updateProjectData={updateProjectData}
            setStepValid={setStepValid}
            setStepError={setStepError}
          />
        )}
        {step === 2 && (
          <Step2DocumentUpload
            formData={formData}
            setFormData={setFormData}
            updateProjectData={updateProjectData}
            setStepValid={setStepValid}
            setStepError={setStepError}
          />
        )}
        {step === 3 && (
          <Step3ToolIntegration
            integrations={formData.project.integration}
            updateIntegration={updateIntegration}
            setStepValid={setStepValid}
            setStepError={setStepError}
          />
        )}
        {step === 4 && (
          <Step4UserOnboarding
            usersData={formData.project.users}
            updateUsers={updateUsers}
            existingUsers={users}
            integrations={formData.project.integration}
            setStepValid={setStepValid}
            setStepError={setStepError}
          />
        )}
      </div>

      {/* ------- FOOTER NAVIGATION (Corporate Theme) ------- */}
      <div className="border-t border-blue-800 bg-blue-900 px-6 py-2 flex flex-col gap-3 shadow">
        <div className="flex justify-between items-center">

          <button
            onClick={handleBack}
            disabled={step === 1 || loading}
            className="px-2 py-1 rounded-lg bg-blue-700 text-white border border-blue-600 hover:bg-blue-600 disabled:opacity-50"
          >
            Back
          </button>

          <div className="flex items-center gap-4">

            {step < 4 ? (
              <button
                onClick={handleNext}
                // disabled={loading || !stepValid}
                className="px-2 py-1 rounded-lg bg-yellow-500 text-blue-900 font-semibold border border-yellow-600 hover:bg-yellow-400 disabled:opacity-50"
              >
                Next
              </button>

            ) : (
              <button
                onClick={handleSubmit}
                // disabled={loading || !stepValid} // <-- disable until Step 4 is valid
                className="px-2 py-1 rounded-lg bg-green-500 text-white border border-green-700 hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Project"}
              </button>

            )}
          </div>
        </div>


      </div>


      {/* ------- PAGE FREEZE OVERLAY ------- */}
      {loading && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-8 py-4 rounded-lg shadow-lg text-gray-800 text-lg font-semibold animate-pulse">
            Processing... Please wait
            <br />
            meanwhile please dont reload or close the tab. or switch to different page.
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateProjectPage;
