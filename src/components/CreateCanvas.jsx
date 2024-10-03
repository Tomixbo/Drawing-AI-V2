import React, { useRef, useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrashCan,
  faReply,
  faShare,
  faXmark,
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
} from "@fortawesome/free-solid-svg-icons";
import "./style/canvasStyle.css";

export default function CreateCanvas({
  navBarHeight,
  activeTool, // "Brush", "Pan", "Eraser", "Fill", "FillImage"
  toolBarPosition,
  brushSize,
  currentColor,
  canvasRef,
  actions,
  setActions,
  windowSize,
  setWindowSize,
  startWindowSize,
  setStartWindowSize,
  scale,
  setScale,
  origin,
  setOrigin,
}) {
  const pressureIsEnabled = true;
  const [prevPoint, setPrevPoint] = useState(null);
  // Add these variables at the top of your component
  const smoothingBuffer = useRef([]); // Buffer to store recent points
  const smoothingBufferSize = 3; // Number of points to average

  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isMiddleButtonDown, setIsMiddleButtonDown] = useState(false);
  const [context, setContext] = useState(null);

  const [redoStack, setRedoStack] = useState([]); // Stack to store redo actions
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const brushSizeRef = useRef(brushSize);
  const currentColorRef = useRef(currentColor);
  const scaleRef = useRef(scale);
  const originRef = useRef(origin);

  // State variables for resizing the FocusArea
  const [isResizing, setIsResizing] = useState(false);
  const [resizeEdge, setResizeEdge] = useState(null); // "left", "right", "top", "bottom"
  const [hoverEdge, setHoverEdge] = useState(null); // For hover effect
  const [startResizeMousePosition, setStartResizeMousePosition] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    scaleRef.current = scale;
    originRef.current = origin;
  }, [scale, origin]);

  const smoothPressure = (prevPressure, currentPressure, alpha = 0.7) => {
    return prevPressure * (1 - alpha) + currentPressure * alpha;
  };

  // ne Redraw function with pressure
  const redraw = useCallback(() => {
    if (!context) return;

    // Clear the canvas before redrawing
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0); // Reset transformations
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); // Clear canvas
    context.restore();

    // Apply current transformations (zoom and pan)
    context.save();
    context.setTransform(
      scaleRef.current,
      0,
      0,
      scaleRef.current,
      -originRef.current.x * scaleRef.current,
      -originRef.current.y * scaleRef.current
    );

    // Find the index of the last 'clear' action
    const lastClearIndex = actions.reduce((lastIndex, action, index) => {
      if (action.type === "clear") return index;
      return lastIndex;
    }, -1);

    // Get the actions after the last 'clear' action
    const actionsToProcess = actions.slice(lastClearIndex + 1);

    // Iterate through actionsToProcess and apply them
    actionsToProcess.forEach((action) => {
      if (action.type === "line") {
        if (action.points.length > 0) {
          context.strokeStyle =
            action.tool === "eraser" ? "rgba(0,0,0,1)" : action.currentColor;
          context.globalCompositeOperation =
            action.tool === "eraser" ? "destination-out" : "source-over";

          if (action.usePressure) {
            // Draw with variable line width
            for (let i = 0; i < action.points.length - 1; i++) {
              const p0 = action.points[i];
              const p1 = action.points[i + 1];

              // Smooth the pressure data
              // const smoothedPressure = (p0.pressure + p1.pressure) / 2;
              const smoothedPressure = smoothPressure(
                p0.pressure,
                p1.pressure,
                0.7
              );

              // Calculate line width based on smoothed pressure
              let adjustedBrushSize = action.brushSize * smoothedPressure;

              context.beginPath();
              context.lineWidth = adjustedBrushSize;
              context.moveTo(p0.x, p0.y);
              context.lineTo(p1.x, p1.y);
              context.stroke();
            }
          } else {
            // Draw normally
            context.lineWidth = action.brushSize;
            context.beginPath();
            context.moveTo(action.points[0].x, action.points[0].y);

            for (let i = 1; i < action.points.length - 1; i++) {
              const midPoint = {
                x: (action.points[i].x + action.points[i + 1].x) / 2,
                y: (action.points[i].y + action.points[i + 1].y) / 2,
              };
              context.quadraticCurveTo(
                action.points[i].x,
                action.points[i].y,
                midPoint.x,
                midPoint.y
              );
            }
            context.lineTo(
              action.points[action.points.length - 1].x,
              action.points[action.points.length - 1].y
            );
            context.stroke();
          }
        }
      } else if (action.type === "fill") {
        //Draw fill actions
        const adjustedX = Math.floor(
          (action.x - originRef.current.x) * scaleRef.current
        );
        const adjustedY = Math.floor(
          (action.y - originRef.current.y) * scaleRef.current
        );

        // Ensure the adjusted coordinates are within the bounds of the canvas
        if (
          adjustedX >= 0 &&
          adjustedX < canvasRef.current.width &&
          adjustedY >= 0 &&
          adjustedY < canvasRef.current.height
        ) {
          // Perform flood fill using adjusted coordinates
          floodFill(adjustedX, adjustedY, action.fillColor, context);
        }
      }
    });

    context.restore();
  }, [actions, context]);

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
    if (context) {
      // Store the current state of the canvas before clearing it as an action
      const clearAction = {
        type: "clear",
      };
      setActions((prevActions) => {
        setRedoStack([]); // Clear the redo stack when a new action is added
        return [...prevActions, clearAction];
      });

      // Actually clear the canvas
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

      // Update panStart to the new mouse position
      setPanStart({ x: e.clientX, y: e.clientY });

      // Redraw the canvas as we pan
      redraw();
    },
    [isPanning, panStart, redraw]
  );

  // Add handlePointerDown
  const handlePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      if (!context) return;

      if (
        activeTool === "Pan" ||
        (activeTool === "FillImage" && e.button === 0)
      ) {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
      } else if (
        (activeTool === "Brush" || activeTool === "Eraser") &&
        e.button === 0
      ) {
        setIsDrawing(true);

        const { offsetX, offsetY } = e.nativeEvent;
        const worldPos = canvasToWorld(offsetX, offsetY);
        setPrevPoint({
          x: worldPos.x,
          y: worldPos.y,
          pressure:
            pressureIsEnabled && typeof e.pressure === "number"
              ? e.pressure
              : 1, // Default pressure to 1 if not available
        });
        const newAction = {
          type: "line",
          tool: activeTool.toLowerCase(),
          brushSize: brushSizeRef.current,
          currentColor: currentColorRef.current,
          usePressure: pressureIsEnabled && typeof e.pressure === "number", // Add this line
          points: [
            {
              x: worldPos.x,
              y: worldPos.y,
              pressure:
                pressureIsEnabled && typeof e.pressure === "number"
                  ? e.pressure
                  : null, // Add this line
            },
          ],
        };
        setActions((prevActions) => {
          setRedoStack([]); // Clear the redo stack when a new action is added
          return [...prevActions, newAction];
        });

        // Begin a new path when starting a new drawing
        context.beginPath();
        const pixelPos = worldToPixel(worldPos.x, worldPos.y);
        context.moveTo(pixelPos.x, pixelPos.y); // Start the path at the first point
      } else if (activeTool === "Fill" && e.button === 0) {
        const { offsetX, offsetY } = e.nativeEvent;

        // Convert screen coordinates to world coordinates
        const worldPos = canvasToWorld(offsetX, offsetY);

        // Convert world coordinates to pixel coordinates
        const pixelPos = worldToPixel(worldPos.x, worldPos.y);

        // Perform flood fill using pixel coordinates
        const fillColor = hexToRgba(currentColorRef.current);
        floodFill(pixelPos.x, pixelPos.y, fillColor, context);

        // Record the fill action using world coordinates (for correct redraw)
        const newAction = {
          type: "fill",
          x: worldPos.x, // Store world coordinates for later redraw
          y: worldPos.y,
          fillColor,
        };
        setActions((prevActions) => {
          setRedoStack([]); // Clear the redo stack when a new action is added
          return [...prevActions, newAction];
        });
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

  // Add handlePointerMove
  const handlePointerMove = useCallback(
    (e) => {
      if (isDrawing) {
        const { offsetX, offsetY } = e.nativeEvent;
        const worldPos = canvasToWorld(offsetX, offsetY);

        // Get the current pressure
        let currentPressure =
          pressureIsEnabled && typeof e.pressure === "number" ? e.pressure : 1; // Default pressure to 1 if not available

        // Smooth the pressure data using EMA or moving average
        const smoothedPressure = (prevPoint.pressure + currentPressure) / 2;

        // Add the new point to the smoothing buffer
        smoothingBuffer.current.push({
          x: worldPos.x,
          y: worldPos.y,
          pressure: smoothedPressure,
        });

        // Keep the buffer size within the limit
        if (smoothingBuffer.current.length > smoothingBufferSize) {
          smoothingBuffer.current.shift();
        }

        // Calculate the average position
        const avgPoint = smoothingBuffer.current.reduce(
          (acc, point) => ({
            x: acc.x + point.x / smoothingBuffer.current.length,
            y: acc.y + point.y / smoothingBuffer.current.length,
            pressure:
              acc.pressure + point.pressure / smoothingBuffer.current.length,
          }),
          { x: 0, y: 0, pressure: 0 }
        );

        const currentAction = actions[actions.length - 1];

        if (currentAction && currentAction.type === "line") {
          const lastPoint =
            currentAction.points[currentAction.points.length - 1];

          // Only add new points if the cursor has moved sufficiently
          if (distance(lastPoint, avgPoint) > 2) {
            // Update the current action with the new point
            setActions((prevActions) => {
              const newActions = [...prevActions];
              newActions[newActions.length - 1].points.push(avgPoint);
              setRedoStack([]); // Clear the redo stack when a new action is added
              return newActions;
            });

            // Draw in real-time
            const prevPixelPos = worldToPixel(prevPoint.x, prevPoint.y);
            const pixelPos = worldToPixel(avgPoint.x, avgPoint.y);

            let adjustedBrushSize =
              brushSizeRef.current * scaleRef.current * avgPoint.pressure;

            context.strokeStyle =
              activeTool === "Eraser"
                ? "rgba(255,255,255,1)"
                : currentColorRef.current;

            context.beginPath();
            context.lineWidth = adjustedBrushSize;
            context.moveTo(prevPixelPos.x, prevPixelPos.y);
            context.lineTo(pixelPos.x, pixelPos.y);
            context.stroke();

            // Update the previous point
            setPrevPoint(avgPoint);
          }
        }
      } else if (isPanning) {
        handlePan(e);
      }
    },
    [isDrawing, actions, handlePan, context, prevPoint]
  );

  // Add handlePointerUp
  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
    setIsPanning(false);
    setIsMiddleButtonDown(false);
    setPrevPoint(null); // Reset the previous point
    smoothingBuffer.current = [];

    // Redraw only once after the pointer is released
    redraw();
  }, [redraw]);

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
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      const deltaY = e.deltaY;

      const worldPos = canvasToWorld(offsetX, offsetY);

      let newScale = scaleRef.current;
      if (deltaY < 0) {
        newScale *= 1.1;
      } else {
        newScale /= 1.1;
      }

      // Limit the scale to a reasonable range
      newScale = Math.min(Math.max(newScale, 1), 5);

      const newOrigin = {
        x: worldPos.x - offsetX / newScale,
        y: worldPos.y - offsetY / newScale,
      };

      setScale(newScale);
      setOrigin(newOrigin);
    },
    [canvasToWorld]
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

  // zoom +
  const handleResetZoomPlus = () => {
    const canvas = canvasRef.current;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const worldPos = canvasToWorld(centerX, centerY);
    const pixelPos = worldToPixel(worldPos.x, worldPos.y);
    const newScale = scale < 5 ? scale + 0.1 : scale;

    const newOrigin = {
      x: worldPos.x - centerX / newScale,
      y: worldPos.y - centerY / newScale,
    };
    setScale(newScale);
    setOrigin(newOrigin);
  };

  // zoom -
  const handleResetZoomMinus = () => {
    const canvas = canvasRef.current;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const worldPos = canvasToWorld(centerX, centerY);
    const pixelPos = worldToPixel(worldPos.x, worldPos.y);

    const newScale = scale > 1 ? scale - 0.1 : scale;

    const newOrigin = {
      x: worldPos.x - centerX / newScale,
      y: worldPos.y - centerY / newScale,
    };
    setScale(newScale);
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

  useEffect(() => {
    // Call redraw only when not drawing
    if (!isDrawing && !isPanning) {
      redraw();
    }
  }, [scale, origin, redraw, isDrawing, isPanning]);

  // Update brush size and color references
  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

  useEffect(() => {
    currentColorRef.current = currentColor;
  }, [currentColor]);

  const undo = () => {
    if (actions.length > 0) {
      const lastAction = actions.pop(); // Remove the last action
      setRedoStack((prev) => [lastAction, ...prev]); // Add it to redoStack
      setActions([...actions]); // Update the actions state
      redraw(); // Redraw the canvas
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const redoAction = redoStack.shift(); // Get the last undone action
      setActions((prev) => [...prev, redoAction]); // Add it back to actions
      setRedoStack([...redoStack]); // Update the redoStack state
      redraw(); // Redraw the canvas
    }
  };

  const handleFocusAreaMouseMove = useCallback(
    (e) => {
      e.preventDefault();

      if (!isResizing) {
        // **Hovering Logic**
        const focusArea = e.currentTarget;
        const rect = focusArea.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const edgeThreshold = 10; // Sensitivity for detecting edges

        let newHoverEdge = null;
        let cursorStyle = "default";

        if (mouseX >= -edgeThreshold && mouseX <= edgeThreshold) {
          newHoverEdge = "left";
          cursorStyle = "ew-resize";
        } else if (
          mouseX >= rect.width - edgeThreshold &&
          mouseX <= rect.width + edgeThreshold
        ) {
          newHoverEdge = "right";
          cursorStyle = "ew-resize";
        } else if (mouseY >= -edgeThreshold && mouseY <= edgeThreshold) {
          newHoverEdge = "top";
          cursorStyle = "ns-resize";
        } else if (
          mouseY >= rect.height - edgeThreshold &&
          mouseY <= rect.height + edgeThreshold
        ) {
          newHoverEdge = "bottom";
          cursorStyle = "ns-resize";
        } else {
          newHoverEdge = null;
          cursorStyle = "move"; // Allow panning inside the focus area
        }

        setHoverEdge(newHoverEdge);
        focusArea.style.cursor = cursorStyle;
      } else {
        // **Resizing Logic**
        // Calculate delta based on global mouse position
        const deltaX = e.clientX - startResizeMousePosition.x;
        const deltaY = e.clientY - startResizeMousePosition.y;

        if (resizeEdge === "left") {
          // When resizing left, decrease width if dragging left, increase if dragging right
          const newWidth = Math.max(50, startWindowSize.width - deltaX);
          setWindowSize((prev) => ({ ...prev, width: newWidth }));
        } else if (resizeEdge === "right") {
          // When resizing right, increase width if dragging right, decrease if dragging left
          const newWidth = Math.max(50, startWindowSize.width + deltaX);
          setWindowSize((prev) => ({ ...prev, width: newWidth }));
        } else if (resizeEdge === "top") {
          // When resizing top, decrease height if dragging up, increase if dragging down
          const newHeight = Math.max(50, startWindowSize.height - deltaY);
          setWindowSize((prev) => ({ ...prev, height: newHeight }));
        } else if (resizeEdge === "bottom") {
          // When resizing bottom, increase height if dragging down, decrease if dragging up
          const newHeight = Math.max(50, startWindowSize.height + deltaY);
          setWindowSize((prev) => ({ ...prev, height: newHeight }));
        }
      }
    },
    [isResizing, resizeEdge, startResizeMousePosition, startWindowSize]
  );

  // Updated handleFocusAreaMouseDown function
  const handleFocusAreaMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      if (hoverEdge) {
        setIsResizing(true);
        setResizeEdge(hoverEdge);
        setStartResizeMousePosition({ x: e.clientX, y: e.clientY });
        setStartWindowSize({ ...windowSize });
      } else {
        // Begin panning when clicking inside the focus area
        if (activeTool === "FillImage") {
          setIsPanning(true);
          setPanStart({ x: e.clientX, y: e.clientY });
        }
      }
    },
    [hoverEdge, windowSize, activeTool]
  );

  // Updated handleFocusAreaMouseUp function
  const handleFocusAreaMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeEdge(null);
    setIsPanning(false);
  }, []);

  // Updated handleFocusAreaMouseLeave function
  const handleFocusAreaMouseLeave = useCallback(() => {
    if (!isResizing) {
      setHoverEdge(null);
    }
  }, [isResizing]);

  // Handle panning inside the focus area
  const handleFocusAreaPan = useCallback(
    (e) => {
      if (!isPanning) return;

      const dx = (e.clientX - panStart.x) / scaleRef.current;
      const dy = (e.clientY - panStart.y) / scaleRef.current;

      setOrigin((prevOrigin) => ({
        x: prevOrigin.x - dx,
        y: prevOrigin.y - dy,
      }));

      setPanStart({ x: e.clientX, y: e.clientY });

      redraw();
    },
    [isPanning, panStart, redraw]
  );

  // Add mouse move listener for panning inside the focus area
  useEffect(() => {
    if (isPanning) {
      window.addEventListener("mousemove", handleFocusAreaPan);
      window.addEventListener("mouseup", handleFocusAreaMouseUp);
    } else {
      window.removeEventListener("mousemove", handleFocusAreaPan);
      window.removeEventListener("mouseup", handleFocusAreaMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleFocusAreaPan);
      window.removeEventListener("mouseup", handleFocusAreaMouseUp);
    };
  }, [isPanning, handleFocusAreaPan, handleFocusAreaMouseUp]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleFocusAreaMouseMove);
      window.addEventListener("mouseup", handleFocusAreaMouseUp);
    } else {
      window.removeEventListener("mousemove", handleFocusAreaMouseMove);
      window.removeEventListener("mouseup", handleFocusAreaMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleFocusAreaMouseMove);
      window.removeEventListener("mouseup", handleFocusAreaMouseUp);
    };
  }, [isResizing, handleFocusAreaMouseMove, handleFocusAreaMouseUp]);

  // Handle touch start on the focus area
  const handleFocusAreaTouchStart = useCallback(
    (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (hoverEdge) {
        // Initiate resizing
        setIsResizing(true);
        setResizeEdge(hoverEdge);
        setStartResizeMousePosition({ x: touch.clientX, y: touch.clientY });
        setStartWindowSize({ ...windowSize });
      } else {
        // Initiate panning
        if (activeTool === "FillImage") {
          setIsPanning(true);
          setPanStart({ x: touch.clientX, y: touch.clientY });
        }
      }
    },
    [hoverEdge, windowSize, activeTool]
  );

  // Handle touch move on the focus area
  const handleFocusAreaTouchMove = useCallback(
    (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (isResizing) {
        // Calculate movement deltas based on global touch positions
        const deltaX = touch.clientX - startResizeMousePosition.x;
        const deltaY = touch.clientY - startResizeMousePosition.y;

        if (resizeEdge === "left") {
          const newWidth = Math.max(50, startWindowSize.width - deltaX);
          setWindowSize((prev) => ({ ...prev, width: newWidth }));
        } else if (resizeEdge === "right") {
          const newWidth = Math.max(50, startWindowSize.width + deltaX);
          setWindowSize((prev) => ({ ...prev, width: newWidth }));
        } else if (resizeEdge === "top") {
          const newHeight = Math.max(50, startWindowSize.height - deltaY);
          setWindowSize((prev) => ({ ...prev, height: newHeight }));
        } else if (resizeEdge === "bottom") {
          const newHeight = Math.max(50, startWindowSize.height + deltaY);
          setWindowSize((prev) => ({ ...prev, height: newHeight }));
        }
      } else if (isPanning) {
        // Calculate panning deltas
        const dx = (touch.clientX - panStart.x) / scaleRef.current;
        const dy = (touch.clientY - panStart.y) / scaleRef.current;

        setOrigin((prevOrigin) => ({
          x: prevOrigin.x - dx,
          y: prevOrigin.y - dy,
        }));

        setPanStart({ x: touch.clientX, y: touch.clientY });

        // Redraw the canvas as we pan
        redraw();
      }
    },
    [
      isResizing,
      resizeEdge,
      startResizeMousePosition,
      startWindowSize,
      isPanning,
      panStart,
      scaleRef,
      redraw,
    ]
  );

  // Handle touch end on the focus area
  const handleFocusAreaTouchEnd = useCallback(() => {
    setIsResizing(false);
    setResizeEdge(null);
    setIsPanning(false);
  }, []);

  // Manage touch event listeners for panning
  useEffect(() => {
    if (isPanning) {
      window.addEventListener("touchmove", handleFocusAreaTouchMove, {
        passive: false,
      });
      window.addEventListener("touchend", handleFocusAreaTouchEnd);
    } else {
      window.removeEventListener("touchmove", handleFocusAreaTouchMove, {
        passive: false,
      });
      window.removeEventListener("touchend", handleFocusAreaTouchEnd);
    }
    return () => {
      window.removeEventListener("touchmove", handleFocusAreaTouchMove, {
        passive: false,
      });
      window.removeEventListener("touchend", handleFocusAreaTouchEnd);
    };
  }, [isPanning, handleFocusAreaTouchMove, handleFocusAreaTouchEnd]);

  // Manage touch event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      window.addEventListener("touchmove", handleFocusAreaTouchMove, {
        passive: false,
      });
      window.addEventListener("touchend", handleFocusAreaTouchEnd);
    } else {
      window.removeEventListener("touchmove", handleFocusAreaTouchMove, {
        passive: false,
      });
      window.removeEventListener("touchend", handleFocusAreaTouchEnd);
    }
    return () => {
      window.removeEventListener("touchmove", handleFocusAreaTouchMove, {
        passive: false,
      });
      window.removeEventListener("touchend", handleFocusAreaTouchEnd);
    };
  }, [isResizing, handleFocusAreaTouchMove, handleFocusAreaTouchEnd]);

  const handleSaveImage = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Sauvegarder la transformation actuelle
    context.save();

    // Réinitialiser les transformations pour obtenir les données correctes
    context.setTransform(1, 0, 0, 1, 0, 0);

    // Calculer les facteurs d'échelle entre la taille du client et la taille du canvas
    const scaleX = canvas.width / canvas.clientWidth;
    const scaleY = canvas.height / canvas.clientHeight;

    // Calculer la position de la fenêtre en coordonnées du canvas
    const windowScreenX = canvas.clientWidth / 2 - windowSize.width / 2;
    const windowScreenY = canvas.clientHeight / 2 - windowSize.height / 2;

    const windowCanvasX = windowScreenX * scaleX;
    const windowCanvasY = windowScreenY * scaleY;

    const windowCanvasWidth = windowSize.width * scaleX;
    const windowCanvasHeight = windowSize.height * scaleY;

    // Obtenir les données de l'image
    const imageData = context.getImageData(
      windowCanvasX,
      windowCanvasY,
      windowCanvasWidth,
      windowCanvasHeight
    );

    // Restaurer les transformations précédentes
    context.restore();

    // Créer un canvas hors écran
    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = windowCanvasWidth;
    offscreenCanvas.height = windowCanvasHeight;
    const offscreenContext = offscreenCanvas.getContext("2d");

    // Placer les données de l'image dans le canvas hors écran
    offscreenContext.putImageData(imageData, 0, 0);

    // Obtenir l'URL des données de l'image
    const dataURL = offscreenCanvas.toDataURL("image/png");

    // Créer un lien pour télécharger l'image
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        className="overflow-hidden"
        style={{
          cursor:
            isPanning || isMiddleButtonDown || activeTool === "FillImage"
              ? "move"
              : activeTool === "Eraser"
              ? "pointer"
              : activeTool === "Fill"
              ? "crosshair"
              : "crosshair",
          width: "100%",
          height: "100%",
          touchAction: "none",
        }}
      />

      <div
        className={`fixed flex items-center right-1/2 transform translate-x-1/2 md:right-8 md:translate-x-0 bg-white bg-opacity-90 px-2 `}
        style={{
          top: toolBarPosition === "bottom" ? `${32 + navBarHeight}px` : null,
          bottom: toolBarPosition === "bottom" ? null : "32px",
        }}
      >
        {/* Undo Button */}
        <button
          onClick={undo} // Call the undo function
          className="mr-3 text-grey-300 hover:text-cyan-600"
        >
          <FontAwesomeIcon icon={faReply} />
        </button>

        {/* Redo Button */}
        <button
          onClick={redo} // Call the redo function
          className="mr-3 text-grey-300 hover:text-cyan-600"
        >
          <FontAwesomeIcon icon={faShare} />
        </button>
        <button
          onClick={clearCanvas}
          className="mr-3 text-grey-300 hover:text-cyan-600"
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
        <span className="mr-2">{scale.toFixed(1)}x</span>
        <input
          type="range"
          min="1"
          max="5"
          step="0.1"
          value={scale}
          onChange={handleSliderChange}
          className="w-30"
        />
        <button
          onClick={handleResetZoom}
          className="ml-3 text-grey-300 hover:text-cyan-600"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <button
          onClick={handleResetZoomMinus}
          className="ml-3 text-grey-300 hover:text-cyan-600"
        >
          <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
        </button>
        <button
          onClick={handleResetZoomPlus}
          className="ml-3 text-grey-300 hover:text-cyan-600"
        >
          <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
        </button>
      </div>
      {activeTool === "FillImage" && (
        <>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `100%`,
              pointerEvents: "none",
              zIndex: 10,
              overflow: "hidden",
            }}
          >
            <div
              onMouseMove={handleFocusAreaMouseMove}
              onMouseDown={handleFocusAreaMouseDown}
              onMouseUp={handleFocusAreaMouseUp}
              onMouseLeave={handleFocusAreaMouseLeave}
              onTouchStart={handleFocusAreaTouchStart}
              onTouchMove={handleFocusAreaTouchMove}
              onTouchEnd={handleFocusAreaTouchEnd}
              onWheel={handleScroll}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: `${windowSize.width}px`,
                height: `${windowSize.height}px`,
                transform: "translate(-50%, -50%)",
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7)",
                border: "2px solid transparent",
                borderLeft:
                  hoverEdge === "left" || hoverEdge === "right"
                    ? "2px solid cyan"
                    : undefined,
                borderRight:
                  hoverEdge === "left" || hoverEdge === "right"
                    ? "2px solid cyan"
                    : undefined,
                borderTop:
                  hoverEdge === "top" || hoverEdge === "bottom"
                    ? "2px solid cyan"
                    : undefined,
                borderBottom:
                  hoverEdge === "top" || hoverEdge === "bottom"
                    ? "2px solid cyan"
                    : undefined,
                cursor:
                  hoverEdge === "left" || hoverEdge === "right"
                    ? "ew-resize"
                    : hoverEdge === "top" || hoverEdge === "bottom"
                    ? "ns-resize"
                    : "default",
                pointerEvents: "auto",
              }}
            />
          </div>

          {/* Input box for width and height adjustment */}
          <div
            style={{
              position: "absolute",
              top: `${navBarHeight + 20}px`,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 11,
              backgroundColor: "#fff",
              padding: "10px",
              borderRadius: "8px",
              boxShadow: "0 0 5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <label>
              Width:
              <input
                type="number"
                value={windowSize.width}
                onChange={(e) =>
                  setWindowSize((prev) => ({
                    ...prev,
                    width: Number(e.target.value),
                  }))
                }
                style={{ marginRight: "10px", padding: "5px", width: "80px" }}
              />
            </label>
            <label>
              Height:
              <input
                type="number"
                value={windowSize.height}
                onChange={(e) =>
                  setWindowSize((prev) => ({
                    ...prev,
                    height: Number(e.target.value),
                  }))
                }
                style={{ padding: "5px", width: "80px" }}
              />
            </label>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 11,
              backgroundColor: "#fff",
              padding: "10px",
              borderRadius: "8px",
              boxShadow: "0 0 5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <button onClick={handleSaveImage}>Sauvegarder l'image</button>
          </div>
        </>
      )}
    </>
  );
}
