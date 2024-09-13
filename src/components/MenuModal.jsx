import React from "react";

export default function MenuModal({ onClose, onDarkModeToggle, isDarkMode }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 relative w-96">
        {/* Header: Title and Close Icon */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Settings Menu
          </h2>
          <button
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white focus:outline-none"
            onClick={onClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-6 h-6"
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

        {/* Subtle Divider */}
        <hr className="border-t border-gray-300 dark:border-gray-600 mb-4" />

        {/* Modal Content: Dark Mode Option */}
        <div className="flex items-center px-2">
          <input
            id="dark-mode-toggle"
            type="checkbox"
            className="mr-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300 h-4 w-4 text-blue-600 border-gray-300 rounded"
            checked={isDarkMode}
            onChange={onDarkModeToggle}
          />
          <label
            htmlFor="dark-mode-toggle"
            className="text-gray-800 dark:text-gray-200"
          >
            Dark Mode
          </label>
        </div>
      </div>
    </div>
  );
}
