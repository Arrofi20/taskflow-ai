"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function ScrollReset() {
  const pathname = usePathname();
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      prevPath.current = pathname;
    }
  }, [pathname]);

  return null;
}
