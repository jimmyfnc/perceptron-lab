import { useEffect, useState, type RefObject } from "react";

/**
 * True while the element is on (or within `margin` of) the screen. Lets a
 * canvas figure stop its render and training loops once scrolled away.
 * Starts false so nothing heavy runs before the first observation.
 */
export function useInView(ref: RefObject<Element | null>, margin = "120px"): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: margin,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return inView;
}
