import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCircleInfo } from '@fortawesome/free-solid-svg-icons';

const DetailModal = ({ isOpen, onClose, selectedStoryDetails }) => {
  if (!isOpen) return null;

  const renderStorySections = (text) => {
    const hasAdditional = text.includes("Additional Context Provided");
    const hasDetailed = text.includes("Detailed Fetched From Uploaded Documents");

    const mainPart = text
      .split("Additional Context Provided")[0]
      .split("Detailed Fetched From Uploaded Documents")[0]
      .trim();

    const additionalPart = hasAdditional
      ? text.split("Additional Context Provided")[1]?.split("Detailed Fetched From Uploaded Documents")[0]?.trim()
      : "";

    const detailedPart = hasDetailed
      ? text.split("Detailed Fetched From Uploaded Documents")[1]?.trim()
      : "";

    return (
      <div className="text-gray-800 font-mono text-sm leading-relaxed">
        {/* User Story */}
        <div className="mb-4">
          <h3 className="font-semibold text-blue-700 mb-2">User Story</h3>
          <p className="whitespace-pre-line bg-blue-50 border border-blue-100 rounded p-3">
            {mainPart || "—"}
          </p>
        </div>

        {/* Additional Context Accordion */}
        {hasAdditional && (
          <details className="border border-purple-200 rounded">
            <summary className="cursor-pointer select-none bg-purple-50 text-purple-700 font-semibold px-4 py-2 rounded-t hover:bg-purple-100">
              Additional Context Provided
            </summary>
            <div className="p-4 whitespace-pre-line bg-purple-50 text-gray-700 border-t border-purple-100">
              {additionalPart || "- -"}
            </div>
          </details>
        )}

        {/* Detailed Fetched Accordion */}
        {hasDetailed && (
          <details className="border border-green-200 rounded mt-2">
            <summary className="cursor-pointer select-none bg-green-50 text-green-700 font-semibold px-4 py-2 rounded-t hover:bg-green-100">
              Detailed Fetched From Uploaded Documents
            </summary>
            <div className="p-4 whitespace-pre-line bg-green-50 text-gray-700 border-t border-green-100">
              {detailedPart || "- -"}
            </div>
          </details>
        )}

        {/* Empty message if no special sections */}
        {!hasAdditional && !hasDetailed && (
          <p className="text-gray-500 italic text-center">
            No additional context or document details available.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-80 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-100">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Story Details</h2>
            <p className="text-xs text-blue-600 mt-1">Complete user story information</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-blue-100"
            aria-label="Close modal"
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {selectedStoryDetails ? (
            renderStorySections(selectedStoryDetails)
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FontAwesomeIcon icon={faCircleInfo} className="w-8 h-8 mx-auto mb-3 opacity-60" />
              <p className="text-gray-600">No story details available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-blue-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
