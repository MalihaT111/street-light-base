import { useEffect, useRef, useState } from "react";

export function useChartDimensions(minHeight = 320) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: minHeight,
  });

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const element = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      const nextWidth = Math.floor(entry.contentRect.width);
      setDimensions({
        width: nextWidth,
        height: minHeight,
      });
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [minHeight]);

  return { containerRef, dimensions };
}
