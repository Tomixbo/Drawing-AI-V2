import React, { useState } from "react";

export default function ParametersBrush({ brushSize, setBrushSize }) {
  const [inputValue, setInputValue] = useState(`${brushSize} px`);

  const handleSliderChange = (e) => {
    const value = e.target.value;
    setBrushSize(value);
    setInputValue(`${value} px`);
  };
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };
  const handleInputKeyPress = (e) => {
    if (e.key === "Enter") {
      validateAndFormatInput(e.target.value);
    }
  };
  const handleInputBlur = (e) => {
    validateAndFormatInput(e.target.value);
  };

  const validateAndFormatInput = (value) => {
    const numValue = parseInt(value.replace(" px", ""), 10);
    if (!isNaN(numValue)) {
      const newValue = numValue > 128 ? 128 : numValue;
      setBrushSize(newValue);
      setInputValue(`${newValue} px`);
    } else {
      setInputValue(`${brushSize} px`);
    }
  };
  return (
    <>
      <div className="flex items-center px-2 space-x-3 w-fit">
        <p className="text-gray-700 dark:text-gray-200 text-xs">Brush size :</p>
        <input
          type="range"
          min={1}
          max={128}
          value={brushSize}
          onChange={handleSliderChange}
          className="w-16 xl:w-36"
        />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyPress}
          onBlur={handleInputBlur}
          className="p-1 bg-cyan-400 text-black text-xs border-none rounded focus:outline-none w-12"
        />
      </div>
    </>
  );
}
