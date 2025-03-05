
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
}

export const Portal = ({ children }: PortalProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    ref.current = document.createElement("div");
    document.body.appendChild(ref.current);
    setMounted(true);

    return () => {
      if (ref.current) {
        document.body.removeChild(ref.current);
      }
    };
  }, []);

  return mounted && ref.current ? createPortal(children, ref.current) : null;
};
