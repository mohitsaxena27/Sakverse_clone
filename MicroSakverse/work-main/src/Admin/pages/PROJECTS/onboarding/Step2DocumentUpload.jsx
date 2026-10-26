import React, { useEffect } from "react";
import { Upload, X } from "lucide-react";

const Step2DocumentUpload = ({ formData, setFormData, updateProjectData, setStepValid,setStepError }) => {
  const handleFileUpload = (files) => {
    if (files) {
      const allowed = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      const newFiles = Array.from(files).filter((file) => allowed.includes(file.type));

      setFormData((prev) => ({
        ...prev,
        documents: [...prev.documents, ...newFiles],
      }));
    }
  };

  const removeFile = (index) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

useEffect(() => {
  const hasRepo = !!formData.project.manual_repo?.trim();
  const hasDocument = formData.documents.length > 0;

  let error = "";

  if (!hasRepo) {
    error = "Manual repository name is required.";
  } else if (!hasDocument) {
    error = "Atleast one document is required.";
  }

  const isValid = !error;

  setStepValid?.(isValid);
  setStepError?.(error);  // <-- send error back to parent
}, [
  formData.project.manual_repo,
  formData.documents,
  setStepValid,
  setStepError
]);



  return (
    <div className="space-y-6 text-gray-900 text-sm">
      {/* Manual Repo */}
      <div>
        <label className="block font-medium mb-2">Manual Repository <span className="text-red-600">*</span></label>
        <input
          type="text"
          value={formData.project.manual_repo || ""}
          onChange={(e) => updateProjectData("manual_repo", e.target.value)}
          placeholder="Enter manual repository name"
          className="w-full px-3 py-2 border rounded-lg bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          required
        />
      </div>

      {/* File Upload */}
      <div> 
        <label className="block font-medium mb-3">Upload Project Documents <span className="text-red-600">*</span> </label>

        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition"
          onDrop={(e) => {
            e.preventDefault();
            handleFileUpload(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-700 mb-2">
            Drag & drop files here, or
            <label className="text-blue-600 hover:text-blue-500 cursor-pointer"> browse
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.xlsx"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </label>
          </p>
          <p className="text-xs text-gray-500">Supported: PDF, DOCX, XLSX</p>
        </div>
      </div>

      {/* Uploaded Files */}
      {formData.documents.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Uploaded Files ({formData.documents.length})</h4>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {formData.documents.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-700">
                      {file.name.split(".").pop()?.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>

                <button
                  onClick={() => removeFile(index)}
                  className="p-1 text-red-500 hover:bg-red-100 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2DocumentUpload;