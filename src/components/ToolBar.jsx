import React, { useState, useRef, useEffect } from "react";
import Tool from "./Tool";
import {
  faEraser,
  faPaintBrush,
  faFillDrip,
  faImage,
} from "@fortawesome/free-solid-svg-icons";

export default function ToolBar({ navBarHeight }) {
  const isDragging = useRef(false);
  const [isTransparent, setIsTransparent] = useState(false);
  const [hoverPosition, setHoverPosition] = useState("left");
  const toolbarRef = useRef(null);
  const [activeTool, setActiveTool] = useState("Brush");
  const toolSize = 60;

  const disableTextSelection = () => {
    document.body.style.userSelect = "none";
  };

  const enableTextSelection = () => {
    document.body.style.userSelect = "";
  };

  const disablePointerEvents = () => {
    document.querySelector(".app-container").style.pointerEvents = "none";
    toolbarRef.current.style.pointerEvents = "auto";
  };

  const enablePointerEvents = () => {
    document.querySelector(".app-container").style.pointerEvents = "auto";
  };

  const handleMouseMove = (event) => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const topBoundary = navBarHeight + 100;
    const bottomBoundary = screenHeight - 100;
    const leftBoundary = 100;
    const rightBoundary = screenWidth - 100;

    if (isDragging.current) {
      const x = event.clientX;
      const y = event.clientY;

      if (y < topBoundary) {
        setHoverPosition("top");
      } else if (y >= bottomBoundary) {
        setHoverPosition("bottom");
      } else if (x < leftBoundary) {
        setHoverPosition("left");
      } else if (x >= rightBoundary) {
        setHoverPosition("right");
      }
    }
  };

  const handleMouseDown = (event) => {
    isDragging.current = true;
    setIsTransparent(true);
    disableTextSelection();
    disablePointerEvents();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    document.body.style.cursor = "move";
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    setIsTransparent(false);
    enableTextSelection();
    enablePointerEvents();

    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);

    document.body.style.cursor = "default";
  };

  // Function to activate the eraser tool
  const handleEraser = () => {
    setActiveTool("Eraser");
  };

  // Function to activate the brush tool
  const handleBrush = () => {
    setActiveTool("Brush");
  };

  // Function to activate the fill tool
  const handleFill = () => {
    setActiveTool("Fill");
  };

  useEffect(() => {
    return () => {
      enableTextSelection();
      enablePointerEvents();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={toolbarRef}
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
          ? `flex-row h-[${toolSize}px]`
          : "flex-col"
      } items-center ${isTransparent ? "opacity-50" : ""}`} // Supprimer le fond de couleur (bg)
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Barre de mouvement - Double bar (qui déclenche le drag) */}
      <div
        className={`${
          hoverPosition === "top" || hoverPosition === "bottom"
            ? "h-1/2 w-auto cursor-move mr-1.5" // Barre pour haut/bas
            : "w-1/2 h-auto cursor-move mb-1.5" // Barre pour gauche/droite
        } px-1 py-1  bg-white hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-700 
        border border-gray-300 dark:border-gray-700 shadow-md dark:shadow-none rounded-full`} // Ajouter le fond de couleur au double bar
        onMouseDown={handleMouseDown}
      >
        <div
          className={`${
            hoverPosition === "top" || hoverPosition === "bottom"
              ? "flex flex-row space-x-0.5 h-full"
              : "flex flex-col space-y-0.5 w-full"
          }`}
        >
          <div
            className={`${
              hoverPosition === "top" || hoverPosition === "bottom"
                ? "w-px h-full bg-gray-600 dark:bg-gray-300"
                : "w-full h-px bg-gray-600 dark:bg-gray-300"
            }`}
          />
          <div
            className={`${
              hoverPosition === "top" || hoverPosition === "bottom"
                ? "w-px h-full bg-gray-600 dark:bg-gray-300"
                : "w-full h-px bg-gray-600 dark:bg-gray-300"
            }`}
          />
        </div>
      </div>

      {/* Boutons */}
      <div
        className={`flex ${
          hoverPosition === "top" || hoverPosition === "bottom"
            ? "flex-row space-x-1"
            : "flex-col space-y-1"
        }`}
      >
        <Tool
          iconTool={faPaintBrush}
          nameTool={"Brush"}
          iconSize={toolSize}
          activeTool={activeTool}
          handleFunction={handleBrush}
        />
        <Tool
          iconTool={faEraser}
          nameTool={"Eraser"}
          iconSize={toolSize}
          activeTool={activeTool}
          handleFunction={handleEraser}
        />
        <Tool
          iconTool={faFillDrip}
          nameTool={"Fill"}
          iconSize={toolSize}
          activeTool={activeTool}
          handleFunction={handleFill}
        />
        <Tool
          iconTool={faImage}
          nameTool={"Fill Image"}
          iconSize={toolSize}
          activeTool={activeTool}
        />
      </div>
    </div>
  );
}
