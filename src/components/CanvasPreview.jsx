import React, { useRef, useState, useEffect, useCallback } from "react";

export default function CanvasPreview() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [scale, setScale] = useState(1); // Zoom scale
  const [lines, setLines] = useState([]); // Store drawn lines
  const [origin, setOrigin] = useState({ x: 0, y: 0 }); // Origin for zoom

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

  // Start drawing
  const startDrawing = useCallback(
    (e) => {
      setIsDrawing(true);
      const { offsetX, offsetY } = e.nativeEvent;
      const point = canvasToWorld(offsetX, offsetY, scale, origin);
      setLines((prevLines) => [...prevLines, [point]]);
    },
    [scale, origin]
  );

  // Draw while mouse is moving
  const draw = useCallback(
    (e) => {
      if (!isDrawing) return;
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
    },
    [isDrawing, scale, origin]
  );

  // Stop drawing
  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
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
      if (e.altKey) {
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
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{ border: "1px solid black", cursor: "crosshair" }}
      />
    </div>
  );
}
