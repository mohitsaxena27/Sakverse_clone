import React, { useEffect } from "react";

const Step1ProjectDetails = ({ formData, updateProjectData, setStepValid ,setStepError}) => {
  
useEffect(() => {
  let error = "";

  if (!formData.project_name?.trim()) {
    error = "Project name is required.";
  } else if (!formData.project_type?.trim()) {
    error = "Project type is required.";
  } else if (!formData.llm_model?.trim()) {
    error = "LLM model name is required.";
  }else if (formData.linked === null) {
    error = "Please select whether to link Unite Automation Tool.";
  }

  const isValid = !error;

  setStepValid?.(isValid);
  setStepError?.(error);
}, [
  formData.project_name,
  formData.project_type,
  formData.llm_model,
  formData.linked, 
  setStepValid,
  setStepError
]);



  

  return (
    <div className="">
      {/* Project Info Section */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-300">
        <h3 className="text-base font-semibold mb-3">Project Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Project Name */}
          <div>
            <label className="block mb-1 font-medium">
              Project Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.project_name}
              onChange={(e) => updateProjectData("project_name", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter project name"
              required
            />
          </div>

          {/* Project Type */}
          <div>
            <label className="block mb-1 font-medium">
              Project Type <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.project_type || ""}
              onChange={(e) => updateProjectData("project_type", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Select Type</option>
              <option value="Manual">Manual</option>
              {/* <option value="Automation">Automation</option> */}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => updateProjectData("description", e.target.value)}
            placeholder="Enter project description"
            className="w-full px-3 py-2 border rounded-lg bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Hidden Repo Section */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-300 hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="hidden">
            <label className="block mb-1 font-medium hidden">Automation Repo</label>
            <input
              type="text"
              value="https://github.com/LegacyTestZeus/Legacy_TestZeus"
              readOnly
              className="w-full px-3 py-2 border rounded-lg bg-gray-100 border-gray-300 cursor-not-allowed hidden"
            />
          </div>

     
        </div>
      </div>

      {/* LLM Model */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-300 mt-4">
        <label className="block mb-1 font-medium">LLM Model Name <span className="text-red-600">*</span></label>
        <input
          type="text"
          value={formData.llm_model || ""}
          onChange={(e) => updateProjectData("llm_model", e.target.value)}
          placeholder="Enter LLM model name..."
          className="w-full px-3 py-2 border rounded-lg bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          required
        />
        <div className="mt-5 ">
  <label className="font-medium block mb-2">
    Link Unite Automation Tool with this project?<span className="text-red-600"> *</span>
  </label>

  <div className="flex items-center gap-6" required>
    {/* YES */}
    <label className="flex items-center gap-2 cursor-pointer" >
      <input
        type="radio"
        name="linked"
        value="true"
        checked={formData.linked === true}
        onChange={() => updateProjectData("linked", true)}
        className="w-4 h-4 text-blue-600"
      />
      <span>Yes</span>
    </label>

    {/* NO */}
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="linked"
        value="false"
        checked={formData.linked === false}
        onChange={() => updateProjectData("linked", false)}
        className="w-4 h-4 text-blue-600"
      />
      <span>No</span>
    </label>
  </div>
</div>
      </div>
      
    </div>
  );
};

export default Step1ProjectDetails;