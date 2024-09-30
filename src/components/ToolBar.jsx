import React, { useState, useRef, useEffect } from "react";
import Tool from "./Tool";
import MenuZones from "./MenuZones";
import {
  faEraser,
  faPaintBrush,
  faFillDrip,
  faEye,
  faArrowsUpDownLeftRight,
} from "@fortawesome/free-solid-svg-icons";
import ColorSelect from "./ColorSelect";

export default function ToolBar({
  navBarHeight,
  activeTool,
  setActiveTool,
  toolBarPosition,
  setToolBarPosition,
  brushSize,
  setBrushSize,
  currentColor,
  setCurrentColor,
  backgroundColor,
  setBackgroundColor,
  canvasRef,
}) {
  const isDragging = useRef(false);
  const [isTransparent, setIsTransparent] = useState(false);

  const toolbarRef = useRef(null);
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

  const handlePointerMove = (x, y) => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const topBoundary = navBarHeight + 100;
    const bottomBoundary = screenHeight - 100;
    const leftBoundary = 100;
    const rightBoundary = screenWidth - 100;

    if (isDragging.current) {
      if (y < topBoundary) {
        setToolBarPosition("top");
      } else if (y >= bottomBoundary) {
        setToolBarPosition("bottom");
      } else if (x < leftBoundary) {
        setToolBarPosition("left");
      } else if (x >= rightBoundary) {
        setToolBarPosition("right");
      }
    }
  };

  const handleMouseMove = (event) => {
    handlePointerMove(event.clientX, event.clientY);
  };

  const handleTouchMove = (event) => {
    const touch = event.touches[0];
    handlePointerMove(touch.clientX, touch.clientY);
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

  const handleTouchStart = (event) => {
    isDragging.current = true;
    setIsTransparent(true);
    disableTextSelection();
    disablePointerEvents();

    const touch = event.touches[0];
    handlePointerMove(touch.clientX, touch.clientY);

    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

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

  const handleTouchEnd = () => {
    isDragging.current = false;
    setIsTransparent(false);
    enableTextSelection();
    enablePointerEvents();

    window.removeEventListener("touchmove", handleTouchMove);
    window.removeEventListener("touchend", handleTouchEnd);

    document.body.style.cursor = "default";
  };

  // Function to activate the eraser tool
  const handlePan = () => {
    setActiveTool("Pan");
  };

  // Function to activate the brush tool
  const handleBrush = () => {
    setActiveTool("Brush");
  };

  // Function to activate the eraser tool
  const handleEraser = () => {
    setActiveTool("Eraser");
  };

  // Function to activate the fill tool
  const handleFill = () => {
    setActiveTool("Fill");
  };

  // Function to activate the fill tool
  // const handleFillImage = () => {
  //   const canvas = canvasRef.current;
  //   const context = canvas.getContext("2d");

  //   // Récupérer les données d'image du canvas
  //   const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

  //   // Créer un nouveau canvas pour y remettre les données
  //   const newCanvas = document.createElement("canvas");
  //   newCanvas.width = canvas.width;
  //   newCanvas.height = canvas.height;
  //   const newContext = newCanvas.getContext("2d");

  //   // Réinjecter les données dans le nouveau canvas
  //   newContext.putImageData(imageData, 0, 0);

  //   // Sauvegarder le nouveau canvas en PNG
  //   const dataURL = newCanvas.toDataURL("image/png");

  //   // Créer un lien de téléchargement pour l'image
  //   const downloadLink = document.createElement("a");
  //   downloadLink.href = dataURL;
  //   downloadLink.download = "canvas_image.png";
  //   downloadLink.click();
  // };
  const handleFillImage = () => {
    setActiveTool("FillImage"); // Change l'outil actif
  };

  useEffect(() => {
    return () => {
      enableTextSelection();
      enablePointerEvents();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <>
      <div
        ref={toolbarRef}
        className={`fixed z-20 transition-all duration-500 ease-in-out ${
          toolBarPosition === "left"
            ? "left-4 top-1/2 transform -translate-y-1/2"
            : toolBarPosition === "top"
            ? "left-1/2 transform -translate-x-1/2"
            : toolBarPosition === "right"
            ? "right-4 top-1/2 transform -translate-y-1/2"
            : "bottom-4 left-1/2 transform -translate-x-1/2"
        } flex ${
          toolBarPosition === "top" || toolBarPosition === "bottom"
            ? "flex-row"
            : "flex-col"
        } items-center ${isTransparent ? "opacity-50" : ""}`} // Supprimer le fond de couleur (bg)
        style={{
          top: toolBarPosition === "top" ? `${navBarHeight + 16}px` : undefined,
          height:
            toolBarPosition === "top" || toolBarPosition === "bottom"
              ? `${toolSize}px`
              : undefined,
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Barre de mouvement - Double bar (qui déclenche le drag) */}
        <div
          className={`${
            toolBarPosition === "top" || toolBarPosition === "bottom"
              ? "h-1/2 w-auto cursor-move mr-1.5" // Barre pour haut/bas
              : "w-1/2 h-auto cursor-move mb-1.5" // Barre pour gauche/droite
          } px-1 py-1 bg-white hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-700 
        border border-gray-300 dark:border-gray-700 shadow-md dark:shadow-none rounded-full`} // Ajouter le fond de couleur au double bar
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div
            className={`${
              toolBarPosition === "top" || toolBarPosition === "bottom"
                ? "flex flex-row space-x-0.5 h-full"
                : "flex flex-col space-y-0.5 w-full"
            }`}
          >
            <div
              className={`${
                toolBarPosition === "top" || toolBarPosition === "bottom"
                  ? "w-px h-full bg-gray-600 dark:bg-gray-300"
                  : "w-full h-px bg-gray-600 dark:bg-gray-300"
              }`}
            />
            <div
              className={`${
                toolBarPosition === "top" || toolBarPosition === "bottom"
                  ? "w-px h-full bg-gray-600 dark:bg-gray-300"
                  : "w-full h-px bg-gray-600 dark:bg-gray-300"
              }`}
            />
          </div>
        </div>

        {/* Boutons */}
        <div
          className={`flex ${
            toolBarPosition === "top" || toolBarPosition === "bottom"
              ? "flex-row "
              : "flex-col "
          }`}
        >
          <Tool
            iconTool={faArrowsUpDownLeftRight}
            nameTool={"Pan"}
            iconSize={toolSize}
            activeTool={activeTool}
            toolBarPosition={toolBarPosition}
            handleFunction={handlePan}
            navBarHeight={navBarHeight}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
          />
          <Tool
            iconTool={faPaintBrush}
            nameTool={"Brush"}
            iconSize={toolSize}
            activeTool={activeTool}
            toolBarPosition={toolBarPosition}
            handleFunction={handleBrush}
            navBarHeight={navBarHeight}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
          />
          <Tool
            iconTool={faEraser}
            nameTool={"Eraser"}
            iconSize={toolSize}
            activeTool={activeTool}
            toolBarPosition={toolBarPosition}
            handleFunction={handleEraser}
            navBarHeight={navBarHeight}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
          />
          <Tool
            iconTool={faFillDrip}
            nameTool={"Fill"}
            iconSize={toolSize}
            activeTool={activeTool}
            toolBarPosition={toolBarPosition}
            handleFunction={handleFill}
            navBarHeight={navBarHeight}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
          />
          <Tool
            iconTool={faEye}
            nameTool={"FillImage"}
            iconSize={toolSize}
            toolBarPosition={toolBarPosition}
            handleFunction={handleFillImage}
            activeTool={activeTool}
            navBarHeight={navBarHeight}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            toolStyle={"important"}
          />
          <ColorSelect
            iconSize={toolSize}
            toolBarPosition={toolBarPosition}
            currentColor={currentColor}
            setCurrentColor={setCurrentColor}
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColor}
          />
        </div>
      </div>
      {isDragging.current ? <MenuZones navBarHeight={navBarHeight} /> : null}
    </>
  );
}
