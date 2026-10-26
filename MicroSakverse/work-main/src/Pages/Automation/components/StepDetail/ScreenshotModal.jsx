import React from "react";
import { AiOutlineClose } from "react-icons/ai";

const ScreenshotModal = ({ screenshot, stepNumber, stepIntent, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="relative bg-gray-900 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-red-600 rounded-full hover:bg-red-700 z-10"
        >
          <AiOutlineClose className="w-4 h-4 text-white" />
        </button>

        <img
          src={`data:image/webp;base64,${screenshot}`}
          alt="Step Screenshot"
          className="w-full h-auto max-h-[80vh] object-contain"
        />

        <div className="p-4 border-t border-gray-800">
          <div className="text-sm text-gray-400 break-all whitespace-pre-wrap">
            Step {stepNumber}: {stepIntent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreenshotModal;