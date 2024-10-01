import React, { useState, useEffect, useRef, act } from "react";
import NavBar from "./components/NavBar";
import ToolBar from "./components/ToolBar";
import CreateCanvas from "./components/CreateCanvas";
import "./main.css";

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    return savedDarkMode === "true";
  });

  // For toolbar
  const [activeTool, setActiveTool] = useState("Brush");
  const [toolBarPosition, setToolBarPosition] = useState("left");
  const [brushSize, setBrushSize] = useState(2);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF"); // Initial background color to white

  // For create CANVAS
  const [actions, setActions] = useState([]); // Each action is { type: 'line' | 'fill', ... }
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(1); // Zoom scale
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({
    width: 512,
    height: 512,
  });
  const [startWindowSize, setStartWindowSize] = useState({
    width: 512,
    height: 512,
  });

  // For navbar
  const [navBarHeight, setNavBarHeight] = useState(0); // Pour stocker la hauteur dynamique du NavBar
  const navBarRef = useRef(null); // Référence pour capturer l'élément NavBar
  const [activeTab, setActiveTab] = useState("CREATE");
  const menuItems = [
    { name: "CREATE" },
    { name: "MODIFY" },
    { name: "UPSCALE" },
    { name: "DEV. OPTIONS" },
  ];

  // Appliquer ou retirer la classe "dark" à l'élément <html> quand darkMode change
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode ? "true" : "false");
  }, [darkMode]);

  // Capture dynamique de la hauteur du NavBar
  useEffect(() => {
    if (navBarRef.current) {
      setNavBarHeight(navBarRef.current.offsetHeight);
    }

    const handleResize = () => {
      if (navBarRef.current) {
        setNavBarHeight(navBarRef.current.offsetHeight);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden app-container">
      <NavBar
        ref={navBarRef}
        setDarkMode={setDarkMode}
        darkMode={darkMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        menuItems={menuItems}
      />

      {activeTab === "CREATE" ? (
        <div className="flex-1">
          <ToolBar
            navBarHeight={navBarHeight}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            toolBarPosition={toolBarPosition}
            setToolBarPosition={setToolBarPosition}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            currentColor={currentColor}
            setCurrentColor={setCurrentColor}
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColor}
            canvasRef={canvasRef}
          />
          <CreateCanvas
            canvasRef={canvasRef}
            navBarHeight={navBarHeight}
            activeTool={activeTool}
            toolBarPosition={toolBarPosition}
            brushSize={brushSize}
            currentColor={currentColor}
            actions={actions}
            setActions={setActions}
            windowSize={windowSize}
            setWindowSize={setWindowSize}
            startWindowSize={startWindowSize}
            setStartWindowSize={setStartWindowSize}
            scale={scale}
            setScale={setScale}
            origin={origin}
            setOrigin={setOrigin}
          />
        </div>
      ) : null}
    </div>
  );
}
