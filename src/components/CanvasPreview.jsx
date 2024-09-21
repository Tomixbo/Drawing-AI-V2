import React, { useRef, useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import "./style/canvasStyle.css";

export default function CanvasPreview({
  navBarHeight,
  activeTool, // "Brush", "Pan", "Eraser"
  toolBarPosition,
  brushSize,
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isMiddleButtonDown, setIsMiddleButtonDown] = useState(false);
  const [context, setContext] = useState(null);
  const [scale, setScale] = useState(1); // Zoom scale
  const [lines, setLines] = useState([]); // Each line is { tool: 'brush' | 'eraser', points: [...] }
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const brushSizeRef = useRef(brushSize);
  const distance = (p1, p2) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  // Clear the canvas
  const clearCanvas = () => {
    setLines([]); // Reset lines
    redraw(); // Redraw the canvas
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

  // Start drawing or pan with mouse
  const handleMouseDown = useCallback(
    (e) => {
      if (activeTool === "Pan" && e.button === 0) {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
      } else if (
        (activeTool === "Brush" || activeTool === "Eraser") &&
        e.button === 0
      ) {
        setIsDrawing(true);
        const { offsetX, offsetY } = e.nativeEvent;
        const point = canvasToWorld(offsetX, offsetY, scale, origin);
        setLines((prevLines) => [
          ...prevLines,
          {
            tool: activeTool.toLowerCase(),
            brushSize: brushSizeRef.current,
            points: [point],
          }, // Store tool type
        ]);
      }
      if (e.button === 1) {
        setIsMiddleButtonDown(true);
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    },
    [scale, origin, activeTool]
  );

  // Start drawing or panning with touch
  const handleTouchStart = useCallback(
    (e) => {
      const touch = e.touches[0];
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect(); // Get the canvas position relative to viewport
      const offsetX = touch.clientX - rect.left;
      const offsetY = touch.clientY - rect.top;

      if (activeTool === "Pan") {
        setIsPanning(true);
        setPanStart({ x: touch.clientX, y: touch.clientY });
      } else if (activeTool === "Brush" || activeTool === "Eraser") {
        setIsDrawing(true);
        const point = canvasToWorld(offsetX, offsetY, scale, origin);
        setLines((prevLines) => [
          ...prevLines,
          {
            tool: activeTool.toLowerCase(),
            brushSize: brushSizeRef.current,
            points: [point],
          },
        ]);
      }
    },
    [scale, origin, activeTool]
  );

  // Handle panning with mouse
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

  // Handle panning with touch
  const handleTouchPan = useCallback(
    (e) => {
      if (!isPanning) return;
      const touch = e.touches[0];
      const dx = (touch.clientX - panStart.x) / scale;
      const dy = (touch.clientY - panStart.y) / scale;

      setOrigin((prevOrigin) => ({
        x: prevOrigin.x - dx,
        y: prevOrigin.y - dy,
      }));
      setPanStart({ x: touch.clientX, y: touch.clientY });
    },
    [isPanning, panStart, scale]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (isDrawing) {
        const { offsetX, offsetY } = e.nativeEvent;
        const point = canvasToWorld(offsetX, offsetY, scale, origin);
        setLines((prevLines) => {
          const newLines = [...prevLines];
          const currentLine = newLines[newLines.length - 1];

          // Ajoute seulement le point si la distance est suffisante
          if (
            currentLine.points.length === 0 ||
            distance(currentLine.points[currentLine.points.length - 1], point) >
              2
          ) {
            currentLine.points = [...currentLine.points, point];
          }

          return newLines;
        });
      } else if (isPanning) {
        handlePan(e);
      }
    },
    [isDrawing, scale, origin, isPanning, handlePan]
  );

  const handleTouchMove = useCallback(
    (e) => {
      const touch = e.touches[0];
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const offsetX = touch.clientX - rect.left;
      const offsetY = touch.clientY - rect.top;

      if (isDrawing) {
        const point = canvasToWorld(offsetX, offsetY, scale, origin);
        setLines((prevLines) => {
          const newLines = [...prevLines];
          const currentLine = newLines[newLines.length - 1];

          // Ajoute seulement le point si la distance est suffisante
          if (
            currentLine.points.length === 0 ||
            distance(currentLine.points[currentLine.points.length - 1], point) >
              2
          ) {
            currentLine.points = [...currentLine.points, point];
          }

          return newLines;
        });
      } else if (isPanning) {
        handleTouchPan(e);
      }
    },
    [isDrawing, scale, origin, isPanning, handleTouchPan]
  );

  // Stop drawing or panning for mouse
  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    setIsPanning(false);
    setIsMiddleButtonDown(false);
  }, []);

  // Stop drawing or panning for touch
  const handleTouchEnd = useCallback(() => {
    setIsDrawing(false);
    setIsPanning(false);
  }, []);

  const drawSmoothLine = (ctx, points) => {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const midPoint = {
        x: (points[i].x + points[i + 1].x) / 2,
        y: (points[i].y + points[i + 1].y) / 2,
      };
      ctx.quadraticCurveTo(points[i].x, points[i].y, midPoint.x, midPoint.y);
    }

    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
  };

  // Redraw all lines
  const redraw = useCallback(() => {
    if (!context) return;

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    context.restore();

    context.save();
    context.setTransform(
      scale,
      0,
      0,
      scale,
      -origin.x * scale,
      -origin.y * scale
    );

    lines.forEach((line) => {
      context.beginPath();

      if (line.tool === "eraser") {
        context.globalCompositeOperation = "destination-out";
        context.lineWidth = 20;
      } else {
        context.globalCompositeOperation = "source-over";
        context.lineWidth = line.brushSize; // Utilise la taille du pinceau stockée
      }

      // Remplace le tracé classique par des courbes lissées
      if (line.points.length > 1) {
        drawSmoothLine(context, line.points); // Fonction de courbe de Bézier
      } else {
        // Si une seule ligne, dessiner un point simple
        const point = line.points[0];
        context.arc(point.x, point.y, line.brushSize / 2, 0, 2 * Math.PI);
        context.fill();
      }
    });

    context.globalCompositeOperation = "source-over";
    context.restore();
  }, [context, lines, scale, origin]);

  // Handle zoom using keyboard shortcuts
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

  // Handle zoom using mouse scroll
  const handleScroll = useCallback(
    (e) => {
      e.preventDefault();
      const { offsetX, offsetY } = e;
      const mouseWorldPos = canvasToWorld(offsetX, offsetY, scale, origin);

      let newScale = scale;
      if (e.deltaY < 0) {
        newScale *= 1.1;
      } else {
        newScale /= 1.1;
      }

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

  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

  return (
    <>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleTouchEnd}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        className="overflow-hidden"
        style={{
          cursor:
            activeTool === "Pan" || isMiddleButtonDown
              ? "move"
              : activeTool === "Eraser"
              ? "pointer"
              : "crosshair",
        }}
      />

      <div
        className={`fixed flex items-center right-1/2 transform translate-x-1/2 md:right-8 md:translate-x-0`}
        style={{
          top: toolBarPosition === "bottom" ? `${32 + navBarHeight}px` : null,
          bottom: toolBarPosition === "bottom" ? null : "32px",
        }}
      >
        <button
          onClick={clearCanvas}
          className="mr-2 text-grey-300 hover:text-cyan-600"
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
        <span className="mr-2">{scale.toFixed(1)}x</span>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={scale}
          onChange={handleSliderChange}
          className="w-30"
        />
        <button
          onClick={handleResetZoom}
          className="ml-2 bg-none text-grey-300 hover:text-cyan-600 hover:underline"
        >
          Reset Zoom
        </button>
      </div>
    </>
  );
}
