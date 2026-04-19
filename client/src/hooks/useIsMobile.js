import { useState, useEffect } from 'react';

/**
 * Returns true when viewport width is at or below `breakpoint`.
 *
 * @param {number} [breakpoint=700] Width threshold in pixels.
 * @returns {boolean} True when current viewport is considered mobile.
 */
export function useIsMobile(breakpoint = 700) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= breakpoint
  );

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= breakpoint);
    // Prefer matchMedia so updates are lightweight.
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onchange = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', onchange);
    } else {
      // Fallback path for older browsers.
      window.addEventListener('resize', handler);
    }
    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', onchange);
      } else {
        window.removeEventListener('resize', handler);
      }
    };
  }, [breakpoint]);

  return isMobile;
}
