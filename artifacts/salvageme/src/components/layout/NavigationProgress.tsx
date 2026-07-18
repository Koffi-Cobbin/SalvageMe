import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

export function NavigationProgress() {
  const [location] = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevLocation = useRef(location);
  const trickleRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const hideRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (location === prevLocation.current) return;
    prevLocation.current = location;

    clearInterval(trickleRef.current);
    clearTimeout(hideRef.current);
    setVisible(true);
    setProgress(15);

    trickleRef.current = setInterval(() => {
      setProgress((p) => (p < 85 ? p + Math.random() * 10 : p));
    }, 200);

    hideRef.current = setTimeout(() => {
      clearInterval(trickleRef.current);
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
    }, 300);

    return () => {
      clearInterval(trickleRef.current);
      clearTimeout(hideRef.current);
    };
  }, [location]);

  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-label="Page loading"
      className="fixed left-0 top-0 z-50 h-1 bg-terracotta-500 transition-all duration-200"
      style={{ width: `${progress}%` }}
    />
  );
}
