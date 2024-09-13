import React, { useState, useRef } from "react";

export default function ToolBar({ navBarHeight }) {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPosition, setHoverPosition] = useState("left"); // For position preview
  const toolbarRef = useRef(null); // Reference for the toolbar

  const handleDragStart = (event) => {
    setIsDragging(true);

    // Required for Firefox to work properly with drag events
    event.dataTransfer.setData("text/plain", "dragging");

    // Set the drag image to the actual toolbar element
    if (toolbarRef.current) {
      const toolbarElement = toolbarRef.current;
      event.dataTransfer.setDragImage(
        toolbarElement,
        toolbarElement.clientWidth / 2,
        toolbarElement.clientHeight / 2
      );
    }
  };

  const handleDrag = (event) => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const x = event.clientX;
    const y = event.clientY;

    // Define placement zones
    const topBoundary = navBarHeight + 100;
    const bottomBoundary = screenHeight - 100;
    const leftBoundary = 100;
    const rightBoundary = screenWidth - 100;

    // Update position during drag
    if (y < topBoundary) {
      setHoverPosition("top");
    } else if (y >= bottomBoundary) {
      setHoverPosition("bottom");
    } else if (x < leftBoundary) {
      setHoverPosition("left");
    } else if (x >= rightBoundary) {
      setHoverPosition("right");
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false); // Remove transparency
  };

  return (
    <div
      ref={toolbarRef} // Attach ref to the toolbar div
      className={`fixed transition-all duration-500 ease-in-out ${
        hoverPosition === "left"
          ? "left-4 top-1/2 transform -translate-y-1/2"
          : hoverPosition === "top"
          ? `top-[${navBarHeight + 16}px] left-1/2 transform -translate-x-1/2`
          : hoverPosition === "right"
          ? "right-4 top-1/2 transform -translate-y-1/2"
          : "bottom-4 left-1/2 transform -translate-x-1/2"
      } flex ${
        hoverPosition === "top" || hoverPosition === "bottom"
          ? "flex-row h-[80px]"
          : "flex-col"
      } items-center p-4 shadow-lg rounded-lg ${
        isDragging ? "opacity-50" : "" // Apply transparency during drag
      } bg-white dark:bg-gray-900`}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => e.preventDefault()} // Prevent default behavior
    >
      {/* Drag Handle - Movement Bar */}
      <div
        className={`${
          hoverPosition === "top" || hoverPosition === "bottom"
            ? "h-full w-auto cursor-move mr-4" // Bar for top/bottom
            : "w-full h-auto cursor-move mb-4" // Bar for left/right
        }`}
        draggable
      >
        {/* Double bar */}
        <div
          className={`${
            hoverPosition === "top" || hoverPosition === "bottom"
              ? "flex flex-row space-x-0.5 h-full" // Horizontal bar for top/bottom
              : "flex flex-col space-y-0.5 w-full" // Vertical bar for left/right
          }`}
        >
          <div
            className={`${
              hoverPosition === "top" || hoverPosition === "bottom"
                ? "w-px h-full bg-gray-600 dark:bg-gray-300" // Vertical bar
                : "w-full h-px bg-gray-600 dark:bg-gray-300" // Horizontal bar
            }`}
          />
          <div
            className={`${
              hoverPosition === "top" || hoverPosition === "bottom"
                ? "w-px h-full bg-gray-600 dark:bg-gray-300" // Vertical bar
                : "w-full h-px bg-gray-600 dark:bg-gray-300" // Horizontal bar
            }`}
          />
        </div>
      </div>

      {/* Buttons */}
      <div
        className={`flex ${
          hoverPosition === "top" || hoverPosition === "bottom"
            ? "flex-row space-x-2"
            : "flex-col space-y-2"
        }`}
      >
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          A
        </button>
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          B
        </button>
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          C
        </button>
      </div>
    </div>
  );
}
