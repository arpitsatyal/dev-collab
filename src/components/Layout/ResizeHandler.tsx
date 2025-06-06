import classes from "./Layout.module.css";
import { useEffect, useRef } from "react";

const MIN_WIDTH = 200;
const MAX_WIDTH = 1000;

interface ResizeHandleProps {
  navbarRef: React.RefObject<HTMLElement | null>;
  setNavWidth: (width: number) => void;
}

export default function ResizeHandle({
  navbarRef,
  setNavWidth,
}: ResizeHandleProps) {
  const isDragging = useRef(false);

  const handleMouseDown = () => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.current && navbarRef.current) {
      const newWidth =
        e.clientX - navbarRef.current.getBoundingClientRect().left;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setNavWidth(newWidth);
      }
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.body.style.cursor = "default";
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return <div className={classes.resizeHandle} onMouseDown={handleMouseDown} />;
}
