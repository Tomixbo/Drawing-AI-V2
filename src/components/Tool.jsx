import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ToolMenu from "./ToolMenu"; // Import the ParametersBar component

export default function Tool({
  iconTool,
  nameTool,
  iconSize,
  activeTool,
  hoverPosition,
  handleFunction,
  navBarHeight,
}) {
  const buttonRef = useRef(null); // Ref for the tool button

  const getParametersBarPosition = () => {
    switch (hoverPosition) {
      case "left":
        return "left-full ml-2"; // Place it to the right of the tool button
      case "right":
        return "right-full mr-2"; // Place it to the left of the tool button
      case "top":
        return "top-full mt-2"; // Place it below the tool button
      case "bottom":
        return "bottom-full mb-2"; // Place it above the tool button
      default:
        return "left-full ml-2"; // Default to right
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <button
        ref={buttonRef}
        className={`${
          activeTool === nameTool
            ? "rounded-full bg-cyan-950 dark:bg-teal-300"
            : "rounded-md bg-white border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-700"
        } p-1 flex items-center justify-center shadow-md dark:shadow-none
        transform transition-all hover:scale-110 duration-300 ease-in-out
        ${
          hoverPosition === "top" || hoverPosition === "bottom"
            ? "mx-0.5 hover:mx-3"
            : "my-0.5 hover:my-3"
        }`}
        style={{
          height: `${iconSize}px`,
          width: `${iconSize}px`,
        }}
        onClick={handleFunction}
      >
        <FontAwesomeIcon
          icon={iconTool}
          className={`${
            activeTool === nameTool
              ? "text-teal-300 dark:text-cyan-950"
              : "text-gray-700 dark:text-gray-200"
          }`}
          style={{ fontSize: iconSize * 0.5 }}
        />
      </button>
      {/* Show ParametersBar only if mouse is near */}
      {activeTool === nameTool ? (
        <div className={`absolute ${getParametersBarPosition()}`}>
          <ToolMenu hoverPosition={hoverPosition} navBarHeight={navBarHeight} />
        </div>
      ) : null}
    </div>
  );
}
