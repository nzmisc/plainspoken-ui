import { useLayoutEffect, useRef, useState } from "react";

/**
 * An element's content width in CSS pixels, kept current with a ResizeObserver. It is 0 on the
 * server and in the first render, so a chart that waits for a width before drawing never renders
 * anything that could differ between server and browser (time zones, locales).
 *
 *   const [ref, width] = useElementWidth<HTMLDivElement>();
 *   return <div ref={ref}>{width > 0 && <svg width={width} … />}</div>;
 */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(Math.floor(el.getBoundingClientRect().width));
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}
