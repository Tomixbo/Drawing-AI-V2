import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSliders } from "@fortawesome/free-solid-svg-icons";

export default function ToolMenu({ navBarHeight, toolBarPosition }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const timeoutRef = useRef(null); // Ref to store the timeout

  // Create a ref to track toolBarPosition
  const toolBarPositionRef = useRef(toolBarPosition);

  useEffect(() => {
    // Update the toolBarPositionRef when toolBarPosition changes
    toolBarPositionRef.current = toolBarPosition;
  }, [toolBarPosition]);

  const handleClick = () => {
    setIsExpanded(true); // Expand the container
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    // Set a timeout to retract the container after 1 second (300 ms)
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false); // Retract the container
    }, 300);
  };

  const handleMouseEnter = () => {
    // Clear the timeout if the mouse re-enters the container
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return (
    <div
      onClick={handleClick}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      className="relative opacity-30 hover:opacity-100 transition-all duration-200 ease-in-out"
    >
      <div
        className={`absolute flex items-center justify-center transition-all duration-300 ease-in-out bg-white text-black dark:bg-cyan-950 dark:text-gray-300 
         shadow-md z-20
        ${
          toolBarPosition === "top"
            ? "top-0 left-1/2 transform -translate-x-1/2"
            : toolBarPosition === "left"
            ? "left-0 top-1/2 transform -translate-y-1/2"
            : toolBarPosition === "bottom"
            ? "bottom-0 left-1/2 transform -translate-x-1/2"
            : "right-0 top-1/2 transform -translate-y-1/2"
        }
        `}
        style={{
          width: isExpanded ? "200px" : "0", // Expand width to 200px when isExpanded is true
          height: "50px", // Fixed height
          borderRadius: "8px",
          overflow: "hidden",
          whiteSpace: "nowrap", // Prevent text wrapping
        }}
      >
        <span className="text-sm">Adjust Parameters</span>
      </div>

      <div
        className={`transition-all duration-300 ease-in-out bg-white text-black
        flex items-center justify-center shadow-md w-full h-full rounded-full z-10
      `}
        style={{
          cursor: "pointer",
        }}
      >
        <FontAwesomeIcon icon={faSliders} className="text-gray-600 text-lg" />
      </div>
    </div>
  );
}
