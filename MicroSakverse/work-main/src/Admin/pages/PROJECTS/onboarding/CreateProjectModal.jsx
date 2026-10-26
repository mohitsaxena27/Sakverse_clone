import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import Step1ProjectDetails from "./Step1ProjectDetails";
import Step2DocumentUpload from "./Step2DocumentUpload";
import Step3ToolIntegration from "./Step3ToolIntegration";
import Step4UserOnboarding from "./Step4UserOnboarding";
import { useUserStoryFlow } from "../api";

const CreateProjectModal = ({ isOpen, onClose, users }) => {
  const { projectOnboarding, loading: apiLoading, error: apiError } = useUserStoryFlow();
  const [step, setStep] = useState(1);
  const [stepValid, setStepValid] = useState(false);
  const [loading, setLoading] = useState(false); // local loading for submit
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    project: {
      project_name: "",
      project_type: "Manual",
      description: "",
      automation_repo: "",
      linked: true,
      llm_model: "",
      manual_repo: "",
      integration: [],
      users: { existing: [], new: [] },
    },
    documents: [],
  });

  // Navigation
  const handleNext = () => {
    if (step < 4 && (step === 3 || stepValid)) {
      setStep(step + 1);
      setStepValid(false);
    }
  };

  const handleBack = () => step > 1 && setStep(step - 1);

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
    setLoading(true);
    try {
      const textData = JSON.stringify({ project: formData.project });
      const files = formData.documents;

      const result = await projectOnboarding(textData, files);

      setToast({ type: "success", message: "Project created successfully!" });
      // console.log("Project Onboarding Success:", result);

      // Optional: auto-close modal after success
      setTimeout(() => {
        setToast(null);
        onClose();
      }, 3000);
    } catch (err) {
      setToast({ type: "error", message: "Failed to create project: " + err.message });
      console.error("Failed to create project:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="sticky top-0 bg-gray-600 z-10 p-6 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Create New Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white" disabled={loading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-6 space-y-6 ${loading ? "pointer-events-none opacity-50" : ""}`}>
          {step === 1 && (
            <Step1ProjectDetails
              formData={formData.project}
              updateProjectData={updateProjectData}
              setStepValid={setStepValid}
            />
          )}
          {step === 2 && (
            <Step2DocumentUpload
              formData={formData}
              setFormData={setFormData}
              updateProjectData={updateProjectData}
              setStepValid={setStepValid}
            />
          )}
          {step === 3 && (
            <Step3ToolIntegration
              integrations={formData.project.integration}
              updateIntegration={updateIntegration}
            />
          )}
          {step === 4 && (
            <Step4UserOnboarding
              usersData={formData.project.users}
              updateUsers={updateUsers}
              existingUsers={users}
            />
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-600 z-10 p-6 border-t border-gray-700">
          <div className="flex justify-between mb-4">
            <button
              onClick={handleBack}
              disabled={step === 1 || loading}
              className="px-4 py-2 rounded-lg bg-yellow-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>

            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={loading || (step !== 3 && !stepValid)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Project"}
              </button>
            )}
          </div>

          {/* Progress */}
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 w-8 rounded-full border-black border-3 ${step >= s ? "bg-blue-500" : "bg-red-600"}`}
              />
            ))}
          </div>

          {apiError && <p className="text-red-500 text-center mt-2">{apiError}</p>}
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20">
            <div className="text-white text-lg font-medium animate-pulse">
              Processing... Please wait
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div
            className={`absolute top-4 right-4 px-4 py-2 rounded shadow-md ${
              toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateProjectModal;
