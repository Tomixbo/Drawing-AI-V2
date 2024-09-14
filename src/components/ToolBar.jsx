import React, { useState, useRef, useEffect } from "react";

export default function ToolBar({ navBarHeight }) {
  const isDragging = useRef(false); // Utilisation de useRef pour le drag
  const [isTransparent, setIsTransparent] = useState(false); // Utilisation de useState pour la transparence
  const [hoverPosition, setHoverPosition] = useState("left"); // Pour l'aperçu de la position
  const toolbarRef = useRef(null); // Référence pour le toolbar

  // Désactiver la sélection de texte pendant le drag
  const disableTextSelection = () => {
    document.body.style.userSelect = "none";
  };

  // Réactiver la sélection de texte après le drag
  const enableTextSelection = () => {
    document.body.style.userSelect = "";
  };

  // Désactiver les interactions sur l'application sauf pour le menu pendant le drag
  const disablePointerEvents = () => {
    document.querySelector(".app-container").style.pointerEvents = "none";
    toolbarRef.current.style.pointerEvents = "auto"; // Laisser les événements actifs pour le menu
  };

  // Réactiver les interactions après le drag
  const enablePointerEvents = () => {
    document.querySelector(".app-container").style.pointerEvents = "auto";
  };

  // Fonction pour gérer le mouvement de la souris
  const handleMouseMove = (event) => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Define placement zones
    const topBoundary = navBarHeight + 100;
    const bottomBoundary = screenHeight - 100;
    const leftBoundary = 100;
    const rightBoundary = screenWidth - 100;

    if (isDragging.current) {
      // Capturer la position actuelle de la souris
      const x = event.clientX;
      const y = event.clientY;

      // Update position during drag
      if (y < topBoundary) {
        setHoverPosition("top");
        // console.log(`TOP - x: ${x}, y: ${y}`);
      } else if (y >= bottomBoundary) {
        setHoverPosition("bottom");
        // console.log(`BOTTOM - x: ${x}, y: ${y}`);
      } else if (x < leftBoundary) {
        setHoverPosition("left");
        // console.log(`LEFT - x: ${x}, y: ${y}`);
      } else if (x >= rightBoundary) {
        setHoverPosition("right");
        // console.log(`RIGHT - x: ${x}, y: ${y}`);
      }
    }
  };

  // Fonction pour démarrer le drag (mousedown)
  const handleMouseDown = (event) => {
    isDragging.current = true; // Début du drag
    setIsTransparent(true); // Appliquer la transparence
    disableTextSelection(); // Désactiver la sélection de texte pendant le drag
    disablePointerEvents(); // Désactiver les interactions de la souris sauf pour le menu

    // console.log("Mouse down - drag started");

    // Attacher les événements mousemove et mouseup à la fenêtre
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    document.body.style.cursor = "move"; // Afficher le curseur de drag
  };

  // Fonction pour terminer le drag (mouseup)
  const handleMouseUp = () => {
    // console.log("Drag ended");
    isDragging.current = false; // Fin du drag
    setIsTransparent(false); // Supprimer la transparence
    enableTextSelection(); // Réactiver la sélection de texte
    enablePointerEvents(); // Réactiver les interactions de la souris

    // Supprimer les événements mousemove et mouseup une fois le drag terminé
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);

    document.body.style.cursor = "default"; // Réinitialiser le curseur
  };

  // Nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      enableTextSelection(); // S'assurer que la sélection de texte est réactivée
      enablePointerEvents(); // S'assurer que les interactions de la souris sont réactivées
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
          ? "flex-row h-[80px]"
          : "flex-col"
      } items-center p-4 shadow-lg rounded-lg bg-white dark:bg-gray-900 ${
        isTransparent ? "opacity-50" : ""
      }`}
      onDragOver={(e) => e.preventDefault()} // Empêcher le comportement par défaut
    >
      {/* Barre de mouvement - Double bar (qui déclenche le drag) */}
      <div
        className={`${
          hoverPosition === "top" || hoverPosition === "bottom"
            ? "h-full w-auto cursor-move mr-4" // Barre pour haut/bas
            : "w-full h-auto cursor-move mb-4" // Barre pour gauche/droite
        }`}
        onMouseDown={handleMouseDown} // Attacher l'événement mousedown uniquement à la double barre
      >
        <div
          className={`${
            hoverPosition === "top" || hoverPosition === "bottom"
              ? "flex flex-row space-x-0.5 h-full" // Barre horizontale pour haut/bas
              : "flex flex-col space-y-0.5 w-full" // Barre verticale pour gauche/droite
          }`}
        >
          <div
            className={`${
              hoverPosition === "top" || hoverPosition === "bottom"
                ? "w-px h-full bg-gray-600 dark:bg-gray-300" // Barre verticale
                : "w-full h-px bg-gray-600 dark:bg-gray-300" // Barre horizontale
            }`}
          />
          <div
            className={`${
              hoverPosition === "top" || hoverPosition === "bottom"
                ? "w-px h-full bg-gray-600 dark:bg-gray-300" // Barre verticale
                : "w-full h-px bg-gray-600 dark:bg-gray-300" // Barre horizontale
            }`}
          />
        </div>
      </div>

      {/* Boutons */}
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
