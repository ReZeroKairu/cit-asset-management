import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface Props {
  show: boolean;
  onClose: () => void;
  onConfirm: (disposedBy: string) => void;
  assetCount?: number;
}

const DisposalConfirmationModal: React.FC<Props> = ({
  show,
  onClose,
  onConfirm,
  assetCount,
}) => {
  const [disposedBy, setDisposedBy] = useState("");

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDisposedBy("");
        onClose();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [show, onClose]);

  if (!show) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Auto-capitalize first letter of each word
    const capitalizedValue = value
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    setDisposedBy(capitalizedValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disposedBy.trim()) {
      onConfirm(disposedBy.trim());
    }
  };

  const handleCancel = () => {
    setDisposedBy("");
    onClose();
  };

  const modalContent = (
    <>
      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0 backdrop-blur-md bg-black/20 z-[9999]"
        onClick={handleCancel}
      />

      {/* Modal Content */}
      <div 
        className="fixed inset-0 z-10000 overflow-y-auto"
        onClick={handleCancel}
      >
        <div className="flex items-center justify-center min-h-screen px-4">
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-semibold">
                  Confirm Asset Disposal
                </h3>
              </div>
              <button
                type="button"
                className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-blue-700 cursor-pointer"
                onClick={handleCancel}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto px-6 py-4">
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  Are you sure you want to dispose all assets?
                </p>
                {assetCount && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Assets to dispose:</span> <span className="font-medium">{assetCount}</span>
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label 
                    htmlFor="disposed-by" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Disposal Personnel *
                  </label>
                  <input
                    id="disposed-by"
                    type="text"
                    value={disposedBy}
                    onChange={handleInputChange}
                    placeholder="Disposal Personnel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Name of the person performing the disposal
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!disposedBy.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Dispose Assets
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default DisposalConfirmationModal;
