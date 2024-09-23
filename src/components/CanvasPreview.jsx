import React, { useRef, useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import "./style/canvasStyle.css";

export default function CanvasPreview({
  navBarHeight,
  activeTool, // "Brush", "Pan", "Eraser", "Fill"
  toolBarPosition,
  brushSize,
  currentColor,
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isMiddleButtonDown, setIsMiddleButtonDown] = useState(false);
  const [context, setContext] = useState(null);
  const [scale, setScale] = useState(1); // Zoom scale
  const [actions, setActions] = useState([]); // Each action is { type: 'line' | 'fill', ... }
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const brushSizeRef = useRef(brushSize);
  const currentColorRef = useRef(currentColor);
  const scaleRef = useRef(scale);
  const originRef = useRef(origin);

  useEffect(() => {
    scaleRef.current = scale;
    originRef.current = origin;
  }, [scale, origin]);

  // Helper function to calculate distance between two points
  const distance = (p1, p2) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  // Convert hex color to RGBA array
  const hexToRgba = (hex) => {
    const bigint = parseInt(hex.slice(1), 16);
    return [
      (bigint >> 16) & 255, // Red
      (bigint >> 8) & 255, // Green
      bigint & 255, // Blue
      255, // Alpha
    ];
  };

  // Compare two colors with a tolerance
  const colorMatch = (target, current, tolerance = 30) => {
    return (
      Math.abs(target[0] - current[0]) <= tolerance && // Red
      Math.abs(target[1] - current[1]) <= tolerance && // Green
      Math.abs(target[2] - current[2]) <= tolerance && // Blue
      Math.abs(target[3] - current[3]) <= tolerance // Alpha
    );
  };

  // Flood Fill Algorithm
  const floodFill = (startX, startY, fillColor, ctx) => {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const stack = [[startX, startY]];
    const targetPos = (startY * width + startX) * 4;
    const targetColor = [
      data[targetPos], // Red
      data[targetPos + 1], // Green
      data[targetPos + 2], // Blue
      data[targetPos + 3], // Alpha
    ];

    if (colorMatch(targetColor, fillColor)) {
      return; // Prevent infinite loop if target color is same as fill color
    }

    const isSameColor = (pixelPos) => {
      const currentColor = [
        data[pixelPos], // Red
        data[pixelPos + 1], // Green
        data[pixelPos + 2], // Blue
        data[pixelPos + 3], // Alpha
      ];
      return colorMatch(targetColor, currentColor);
    };

    const setPixelColor = (pixelPos) => {
      data[pixelPos] = fillColor[0]; // Red
      data[pixelPos + 1] = fillColor[1]; // Green
      data[pixelPos + 2] = fillColor[2]; // Blue
      data[pixelPos + 3] = fillColor[3]; // Alpha
    };

    while (stack.length) {
      const [px, py] = stack.pop();
      let currentX = px;
      let currentY = py;
      let pixelPos = (currentY * width + currentX) * 4;

      // Move to the leftmost pixel that matches the target color
      while (currentX >= 0 && isSameColor(pixelPos)) {
        currentX--;
        pixelPos = (currentY * width + currentX) * 4;
      }
      currentX++;
      pixelPos = (currentY * width + currentX) * 4;

      let reachLeft = false;
      let reachRight = false;

      // Move to the right, fill pixels and check adjacent pixels
      while (currentX < width && isSameColor(pixelPos)) {
        setPixelColor(pixelPos);

        // Check pixel above
        if (currentY > 0) {
          if (isSameColor(pixelPos - width * 4)) {
            if (!reachLeft) {
              stack.push([currentX, currentY - 1]);
              reachLeft = true;
            }
          } else {
            reachLeft = false;
          }
        }

        // Check pixel below
        if (currentY < height - 1) {
          if (isSameColor(pixelPos + width * 4)) {
            if (!reachRight) {
              stack.push([currentX, currentY + 1]);
              reachRight = true;
            }
          } else {
            reachRight = false;
          }
        }

        currentX++;
        pixelPos = (currentY * width + currentX) * 4;
      }
    }

    ctx.putImageData(imgData, 0, 0); // Apply the changes
  };

  // Initialize the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setContext(ctx);
  }, []);

  // Convert screen coordinates to world coordinates
  const canvasToWorld = (x, y) => ({
    x: x / scaleRef.current + originRef.current.x,
    y: y / scaleRef.current + originRef.current.y,
  });

  // Convert world coordinates to pixel coordinates
  const worldToPixel = (worldX, worldY) => ({
    x: Math.floor((worldX - originRef.current.x) * scaleRef.current),
    y: Math.floor((worldY - originRef.current.y) * scaleRef.current),
  });

  // Clear the canvas and reset actions
  const clearCanvas = useCallback(() => {
    setActions([]); // Reset actions
    if (context) {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      context.restore();
    }
  }, [context]);

  // Handle mouse down events
  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      if (!context) return;

      if (activeTool === "Pan" && e.button === 0) {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
      } else if (
        (activeTool === "Brush" || activeTool === "Eraser") &&
        e.button === 0
      ) {
        setIsDrawing(true);
        const { offsetX, offsetY } = e.nativeEvent;
        const worldPos = canvasToWorld(offsetX, offsetY);
        const newAction = {
          type: "line",
          tool: activeTool.toLowerCase(),
          brushSize: brushSizeRef.current,
          currentColor: currentColorRef.current,
          points: [{ x: worldPos.x, y: worldPos.y }],
        };
        setActions((prevActions) => [...prevActions, newAction]);

        // Begin path for immediate drawing
        // context.beginPath();
        // context.moveTo(worldPos.x, worldPos.y);
        // context.lineWidth = brushSizeRef.current;
        // context.strokeStyle =
        //   activeTool === "Eraser" ? "rgba(0,0,0,1)" : currentColorRef.current;
        // context.globalCompositeOperation =
        //   activeTool === "Eraser" ? "destination-out" : "source-over";
      } else if (activeTool === "Fill" && e.button === 0) {
        const { offsetX, offsetY } = e.nativeEvent;
        const worldPos = canvasToWorld(offsetX, offsetY);
        const pixelPos = worldToPixel(worldPos.x, worldPos.y);
        const fillColor = hexToRgba(currentColorRef.current);

        // Perform flood fill
        floodFill(pixelPos.x, pixelPos.y, fillColor, context);

        // Record the fill action
        const newAction = {
          type: "fill",
          x: pixelPos.x,
          y: pixelPos.y,
          fillColor: fillColor,
        };
        setActions((prevActions) => [...prevActions, newAction]);
      }

      if (e.button === 1) {
        // Middle button for panning
        setIsMiddleButtonDown(true);
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    },
    [activeTool, context]
  );

  // Handle touch start events
  const handleTouchStart = useCallback(
    (e) => {
      e.preventDefault();
      if (!context) return;
      const touch = e.touches[0];
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const offsetX = touch.clientX - rect.left;
      const offsetY = touch.clientY - rect.top;

      if (activeTool === "Pan") {
        setIsPanning(true);
        setPanStart({ x: touch.clientX, y: touch.clientY });
      } else if (activeTool === "Brush" || activeTool === "Eraser") {
        setIsDrawing(true);
        const worldPos = canvasToWorld(offsetX, offsetY);
        const newAction = {
          type: "line",
          tool: activeTool.toLowerCase(),
          brushSize: brushSizeRef.current,
          currentColor: currentColorRef.current,
          points: [{ x: worldPos.x, y: worldPos.y }],
        };
        setActions((prevActions) => [...prevActions, newAction]);

        // Begin path for immediate drawing
        context.beginPath();
        context.moveTo(worldPos.x, worldPos.y);
        context.lineWidth = brushSizeRef.current;
        context.strokeStyle =
          activeTool === "Eraser" ? "rgba(0,0,0,1)" : currentColorRef.current;
        context.globalCompositeOperation =
          activeTool === "Eraser" ? "destination-out" : "source-over";
      } else if (activeTool === "Fill") {
        const worldPos = canvasToWorld(offsetX, offsetY);
        const pixelPos = worldToPixel(worldPos.x, worldPos.y);
        const fillColor = hexToRgba(currentColorRef.current);

        // Perform flood fill
        floodFill(pixelPos.x, pixelPos.y, fillColor, context);

        // Record the fill action
        const newAction = {
          type: "fill",
          x: pixelPos.x,
          y: pixelPos.y,
          fillColor: fillColor,
        };
        setActions((prevActions) => [...prevActions, newAction]);
      }
    },
    [activeTool, context]
  );

  // Handle panning with mouse
  const handlePan = useCallback(
    (e) => {
      if (!isPanning) return;
      const dx = (e.clientX - panStart.x) / scaleRef.current;
      const dy = (e.clientY - panStart.y) / scaleRef.current;

      setOrigin((prevOrigin) => ({
        x: prevOrigin.x - dx,
        y: prevOrigin.y - dy,
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    },
    [isPanning, panStart]
  );

  // Handle panning with touch
  const handleTouchPan = useCallback(
    (e) => {
      if (!isPanning) return;
      const touch = e.touches[0];
      const dx = (touch.clientX - panStart.x) / scaleRef.current;
      const dy = (touch.clientY - panStart.y) / scaleRef.current;

      setOrigin((prevOrigin) => ({
        x: prevOrigin.x - dx,
        y: prevOrigin.y - dy,
      }));
      setPanStart({ x: touch.clientX, y: touch.clientY });
    },
    [isPanning, panStart]
  );

  // Handle mouse move events
  const handleMouseMove = useCallback(
    (e) => {
      if (isDrawing) {
        const { offsetX, offsetY } = e.nativeEvent;
        const worldPos = canvasToWorld(offsetX, offsetY);
        const currentAction = actions[actions.length - 1];
        if (currentAction && currentAction.type === "line") {
          const lastPoint =
            currentAction.points[currentAction.points.length - 1];
          if (distance(lastPoint, worldPos) > 2) {
            // Update the current action with the new point
            setActions((prevActions) => {
              const newActions = [...prevActions];
              newActions[newActions.length - 1].points.push({
                x: worldPos.x,
                y: worldPos.y,
              });
              return newActions;
            });

            // Draw the line segment
            // context.lineTo(worldPos.x, worldPos.y);
            // context.stroke();
          }
        }
      } else if (isPanning) {
        handlePan(e);
      }
    },
    [isDrawing, actions, context, handlePan]
  );

  // Handle touch move events
  const handleTouchMove = useCallback(
    (e) => {
      e.preventDefault();
      if (!context) return;
      if (isDrawing) {
        const touch = e.touches[0];
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;
        const worldPos = canvasToWorld(offsetX, offsetY);
        const currentAction = actions[actions.length - 1];
        if (currentAction && currentAction.type === "line") {
          const lastPoint =
            currentAction.points[currentAction.points.length - 1];
          if (distance(lastPoint, worldPos) > 2) {
            // Update the current action with the new point
            setActions((prevActions) => {
              const newActions = [...prevActions];
              newActions[newActions.length - 1].points.push({
                x: worldPos.x,
                y: worldPos.y,
              });
              return newActions;
            });

            // Draw the line segment
            // context.lineTo(worldPos.x, worldPos.y);
            // context.stroke();
          }
        }
      } else if (isPanning) {
        handleTouchPan(e);
      }
    },
    [isDrawing, actions, context, handleTouchPan]
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

  // Function to draw smooth lines (not used in this approach but kept for reference)
  const drawSmoothLine = (ctx, points, lineColor) => {
    if (points.length < 2) return;
    ctx.strokeStyle = lineColor;
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

  // Redraw all actions
  const redraw = useCallback(() => {
    if (!context) return;

    // Clear the canvas
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    context.restore();

    // Apply current transformations
    context.save();
    context.setTransform(
      scaleRef.current,
      0,
      0,
      scaleRef.current,
      -originRef.current.x * scaleRef.current,
      -originRef.current.y * scaleRef.current
    );

    // Iterate through all actions and apply them
    actions.forEach((action) => {
      if (action.type === "line") {
        if (action.points.length > 0) {
          context.lineWidth = action.brushSize;
          context.strokeStyle =
            action.tool === "eraser" ? "rgba(0,0,0,1)" : action.currentColor;
          context.globalCompositeOperation =
            action.tool === "eraser" ? "destination-out" : "source-over";
          context.beginPath();
          context.moveTo(action.points[0].x, action.points[0].y);

          for (let i = 1; i < action.points.length; i++) {
            context.lineTo(action.points[i].x, action.points[i].y);
          }

          context.stroke();
        }
      } else if (action.type === "fill") {
        // Perform flood fill
        floodFill(action.x, action.y, action.fillColor, context);
      }
    });

    context.restore();
  }, [actions, context]);

  // Handle zoom using keyboard shortcuts
  const zoomFromCenter = useCallback(
    (e) => {
      if (e.ctrlKey) {
        e.preventDefault(); // Prevent default browser zoom
        const canvas = canvasRef.current;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const worldPos = canvasToWorld(centerX, centerY);
        const pixelPos = worldToPixel(worldPos.x, worldPos.y);

        let newScale = scaleRef.current;
        if (e.key === "+") newScale *= 1.1;
        if (e.key === "-") newScale /= 1.1;

        // Limit the scale to a reasonable range
        newScale = Math.min(Math.max(newScale, 0.1), 5);

        const newOrigin = {
          x: worldPos.x - centerX / newScale,
          y: worldPos.y - centerY / newScale,
        };

        setScale(newScale);
        setOrigin(newOrigin);
      }
    },
    [canvasToWorld, worldToPixel]
  );

  // Handle zoom using mouse scroll
  const handleScroll = useCallback(
    (e) => {
      e.preventDefault();
      const { offsetX, offsetY, deltaY } = e;
      const worldPos = canvasToWorld(offsetX, offsetY);
      const pixelPos = worldToPixel(worldPos.x, worldPos.y);

      let newScale = scaleRef.current;
      if (deltaY < 0) {
        newScale *= 1.1;
      } else {
        newScale /= 1.1;
      }

      // Limit the scale to a reasonable range
      newScale = Math.min(Math.max(newScale, 0.1), 5);

      const newOrigin = {
        x: worldPos.x - offsetX / newScale,
        y: worldPos.y - offsetY / newScale,
      };

      setScale(newScale);
      setOrigin(newOrigin);
    },
    [canvasToWorld, worldToPixel]
  );

  // Handle zoom with slider
  const handleSliderChange = useCallback(
    (e) => {
      const newScale = parseFloat(e.target.value);
      const canvas = canvasRef.current;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const worldPos = canvasToWorld(centerX, centerY);
      const pixelPos = worldToPixel(worldPos.x, worldPos.y);

      const newOrigin = {
        x: worldPos.x - centerX / newScale,
        y: worldPos.y - centerY / newScale,
      };

      setScale(newScale);
      setOrigin(newOrigin);
    },
    [canvasToWorld, worldToPixel]
  );

  // Reset zoom to default scale (1)
  const handleResetZoom = () => {
    const canvas = canvasRef.current;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const worldPos = canvasToWorld(centerX, centerY);
    const pixelPos = worldToPixel(worldPos.x, worldPos.y);

    const newOrigin = {
      x: worldPos.x - centerX,
      y: worldPos.y - centerY,
    };
    setScale(1);
    setOrigin(newOrigin);
  };

  // Add event listeners for zoom
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

  // Redraw the canvas whenever actions, scale, or origin change
  useEffect(() => {
    redraw();
  }, [actions, scale, origin, redraw]);

  // Update brush size and color references
  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

  useEffect(() => {
    currentColorRef.current = currentColor;
  }, [currentColor]);

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
            isPanning || isMiddleButtonDown
              ? "move"
              : activeTool === "Eraser"
              ? "pointer"
              : activeTool === "Fill"
              ? "crosshair"
              : "crosshair",
          width: "100%", // Adjust as needed
          height: "100%", // Adjust as needed
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
