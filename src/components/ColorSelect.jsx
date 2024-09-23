import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import "./style/colorSelect.css";

export default function ColorSelect({
  toolBarPosition,
  iconSize,
  currentColor,
  setCurrentColor,
  backgroundColor,
  setBackgroundColor,
}) {
  // Function to handle color change
  const handleColor = (e) => {
    setCurrentColor(e.currentTarget.value);
  };

  // Function to handle background color change
  const handleBackgroundColor = (e) => {
    setBackgroundColor(e.currentTarget.value);
  };

  const flipColors = () => {
    const temp = currentColor;
    handleColor({ currentTarget: { value: backgroundColor } });
    handleBackgroundColor({ currentTarget: { value: temp } });
  };

  return (
    <div
      className={`relative flex justify-center items-center
    ${
      toolBarPosition === "left" || toolBarPosition === "right"
        ? "mt-5"
        : "ml-5"
    }`}
      style={{
        height: iconSize,
        width: iconSize,
      }}
    >
      <div className={`relative w-4/5 h-4/5`}>
        <input
          type="color"
          className="hidden-color-input"
          onChange={handleColor}
        />
        <button
          className={`primary-color-button cursor-pointer absolute w-full h-full border-2 border-cyan-500 rounded-sm shadow-sm top-0 left-0`}
          onClick={(e) => e.target.previousSibling.click()}
          style={{ backgroundColor: currentColor }}
        />

        <button className="flip-color-button" onClick={flipColors}>
          <FontAwesomeIcon
            icon={faArrowsRotate}
            className={`text-gray-700 $w-5 `}
          />
        </button>

        <input
          type="color"
          className="hidden-color-input"
          value={backgroundColor}
          onChange={handleBackgroundColor}
        />
        <button
          className={`background-color-button cursor-pointer absolute w-full h-full border border-gray-500 rounded-sm shadow-sm bottom-0 right-0`}
          onClick={(e) => e.target.previousSibling.click()}
          style={{ backgroundColor: backgroundColor }}
        />
      </div>
    </div>
  );
}
