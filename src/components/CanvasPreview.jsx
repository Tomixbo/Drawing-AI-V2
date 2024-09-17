import React, { useRef, useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import "./style/canvasStyle.css";

export default function CanvasPreview({
  navBarHeight,
  activeTool,
  toolBarPosition,
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isMiddleButtonDown, setIsMiddleButtonDown] = useState(false); // New state for middle button
  const [context, setContext] = useState(null);
  const [scale, setScale] = useState(1); // Zoom scale
  const [lines, setLines] = useState([]); // Store drawn lines
  const [origin, setOrigin] = useState({ x: 0, y: 0 }); // Origin for zoom
  const [panStart, setPanStart] = useState({ x: 0, y: 0 }); // Start position for panning

  // Efface le canvas
  const clearCanvas = () => {
    setLines([]); // Réinitialise les lignes
    redraw(); // Redessine le canvas
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    ctx.lineCap = "round";
    setContext(ctx);
  }, []);

  const canvasToWorld = (x, y, scale, origin) => ({
    x: x / scale + origin.x,
    y: y / scale + origin.y,
  });

  // Start drawing or pan
  const handleMouseDown = useCallback(
    (e) => {
      if (activeTool === "Pan" && e.button === 0) {
        // Left mouse button for panning
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
      } else if (activeTool === "Brush" && e.button === 0) {
        // Left mouse button for drawing
        setIsDrawing(true);
        const { offsetX, offsetY } = e.nativeEvent;
        const point = canvasToWorld(offsetX, offsetY, scale, origin);
        setLines((prevLines) => [...prevLines, [point]]);
      }
      // Middle mouse button for panning
      if (e.button === 1) {
        setIsMiddleButtonDown(true); // Set middle button state
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    },
    [scale, origin, activeTool]
  );

  // Handle panning
  const handlePan = useCallback(
    (e) => {
      if (!isPanning) return;
      const dx = (e.clientX - panStart.x) / scale;
      const dy = (e.clientY - panStart.y) / scale;

      setOrigin((prevOrigin) => ({
        x: prevOrigin.x - dx,
        y: prevOrigin.y - dy,
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    },
    [isPanning, panStart, scale]
  );

  // Draw while mouse is moving
  const handleMouseMove = useCallback(
    (e) => {
      if (isDrawing) {
        const { offsetX, offsetY } = e.nativeEvent;
        const point = canvasToWorld(offsetX, offsetY, scale, origin);
        setLines((prevLines) => {
          const newLines = [...prevLines];
          newLines[newLines.length - 1] = [
            ...newLines[newLines.length - 1],
            point,
          ];
          return newLines;
        });
      } else if (isPanning) {
        handlePan(e);
      }
    },
    [isDrawing, scale, origin, isPanning, handlePan]
  );

  // Stop drawing or panning
  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    setIsPanning(false);
    setIsMiddleButtonDown(false); // Reset middle button state
  }, []);

  // Redraw all lines
  const redraw = useCallback(() => {
    if (!context) return;

    // Clear the canvas
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    context.restore();

    // Apply transformations
    context.save();
    context.setTransform(
      scale,
      0,
      0,
      scale,
      -origin.x * scale,
      -origin.y * scale
    );

    // Draw lines
    lines.forEach((line) => {
      context.beginPath();
      line.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });
      context.stroke();
    });

    context.restore();
  }, [context, lines, scale, origin]);

  // Handle zoom using keyboard shortcuts (zoom from the center)
  const zoomFromCenter = useCallback(
    (e) => {
      if (e.ctrlKey) {
        const canvas = canvasRef.current;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const centerWorldPos = canvasToWorld(centerX, centerY, scale, origin);

        let newScale = scale;
        if (e.key === "+") newScale *= 1.1;
        if (e.key === "-") newScale /= 1.1;

        // Adjust the origin
        const newOrigin = {
          x: centerWorldPos.x - centerX / newScale,
          y: centerWorldPos.y - centerY / newScale,
        };

        setScale(newScale);
        setOrigin(newOrigin);
      }
    },
    [scale, origin]
  );

  // Handle zoom using mouse scroll (zoom at the cursor position)
  const handleScroll = useCallback(
    (e) => {
      e.preventDefault(); // Prevent default scroll behavior
      const { offsetX, offsetY } = e;
      const mouseWorldPos = canvasToWorld(offsetX, offsetY, scale, origin);

      let newScale = scale;
      if (e.deltaY < 0) {
        newScale *= 1.1; // Scroll up to zoom in
      } else {
        newScale /= 1.1; // Scroll down to zoom out
      }

      // Adjust the origin
      const newOrigin = {
        x: mouseWorldPos.x - offsetX / newScale,
        y: mouseWorldPos.y - offsetY / newScale,
      };

      setScale(newScale);
      setOrigin(newOrigin);
    },
    [scale, origin]
  );

  // Handle zoom with slider
  const handleSliderChange = useCallback(
    (e) => {
      const newScale = parseFloat(e.target.value);
      const canvas = canvasRef.current;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const centerWorldPos = canvasToWorld(centerX, centerY, scale, origin);

      // Adjust the origin
      const newOrigin = {
        x: centerWorldPos.x - centerX / newScale,
        y: centerWorldPos.y - centerY / newScale,
      };

      setScale(newScale);
      setOrigin(newOrigin);
    },
    [scale, origin]
  );

  // Reset zoom to default scale (1)
  const handleResetZoom = () => {
    const canvas = canvasRef.current;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const centerWorldPos = canvasToWorld(centerX, centerY, scale, origin);

    // Adjust the origin
    const newOrigin = {
      x: centerWorldPos.x - centerX,
      y: centerWorldPos.y - centerY,
    };
    setScale(1);
    setOrigin(newOrigin);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.addEventListener("wheel", handleScroll, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleScroll);
    };
  }, [handleScroll]);

  useEffect(() => {
    window.addEventListener("keydown", zoomFromCenter);
    return () => window.removeEventListener("keydown", zoomFromCenter);
  }, [zoomFromCenter]);

  useEffect(() => {
    redraw();
  }, [scale, origin, lines, redraw]);

  return (
    <>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        className="overflow-hidden"
        style={{
          cursor:
            activeTool === "Pan" || isMiddleButtonDown ? "move" : "crosshair",
        }}
      />

      <div
        className={`fixed flex items-center right-1/2 transform translate-x-1/2 md:right-8 md:translate-x-0 `}
        style={{
          top: toolBarPosition === "bottom" ? `${32 + navBarHeight}px` : null,
          bottom: toolBarPosition === "bottom" ? null : "32px",
        }}
      >
        {/* Clear Canvas Button */}
        <button
          onClick={clearCanvas}
          className="mr-2 text-grey-300 hover:text-cyan-600"
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
        {/* Zoom Factor Text */}
        <span className="mr-2">{scale.toFixed(1)}x</span>
        {/* Zoom Slider */}
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={scale}
          onChange={handleSliderChange}
          className="w-30"
          style={{
            backgroundColor: "rgba(204, 50, 50, 0.5)", // Couleur de fond pour le slider
          }}
        />
        {/* Reset Zoom Button */}
        <button
          onClick={handleResetZoom}
          className="ml-2 bg-none text-grey-300 hover:text-cyan-600 hover:underline "
        >
          Reset Zoom
        </button>
      </div>
    </>
  );
}
