import React, { useState, useEffect, useRef } from "react";
import NavBar from "./components/NavBar";
import ToolBar from "./components/ToolBar";
import "./main.css";

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    return savedDarkMode === "true";
  });

  const [navBarHeight, setNavBarHeight] = useState(0); // Pour stocker la hauteur dynamique du NavBar
  const navBarRef = useRef(null); // Référence pour capturer l'élément NavBar

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
    <div className="h-screen w-screen overflow-hidden app-container">
      <NavBar ref={navBarRef} setDarkMode={setDarkMode} darkMode={darkMode} />
      <ToolBar navBarHeight={navBarHeight} />
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-950">
        <h1 className="text-lg lg:text-4xl font-bold text-blue-600 dark:text-gray-200 font-mono text-center">
          Bonjour, Drawing-AI V2 !
        </h1>
      </div>
    </div>
  );
}
