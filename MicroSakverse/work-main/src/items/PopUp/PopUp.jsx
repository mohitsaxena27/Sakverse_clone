<<<<<<< HEAD
import React from 'react';
import Base64Image from '../Base64Conversion/Base64Image';

const Popup = ({ isOpen, onClose, children, screenshot }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-4 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Details</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-font">
            X
          </button>
        </div>
        <div className="overflow-auto max-h-96">
          {children}
        </div>
        {/* Screenshot */}
        {screenshot && (
          <div className="mt-4">
            <Base64Image base64Data={screenshot} altText="Screenshot" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup;
=======
import React from 'react';
import Base64Image from '../Base64Conversion/Base64Image';

const Popup = ({ isOpen, onClose, children, screenshot }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-4 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Details</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-font">
            X
          </button>
        </div>
        <div className="overflow-auto max-h-96">
          {children}
        </div>
        {/* Screenshot */}
        {screenshot && (
          <div className="mt-4">
            <Base64Image base64Data={screenshot} altText="Screenshot" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup;
>>>>>>> ecad51d1f025099c0f00c978836ec32017d063eb
