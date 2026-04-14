import { useState, useEffect } from 'react';

/**
 * Returns true when the viewport is narrower than `breakpoint` pixels.
 * Updates on resize. Used to switch between mobile and desktop layouts.
 */
export function useIsMobile(breakpoint = 700) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= breakpoint
  );

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= breakpoint);
    // Use matchMedia for efficient listening
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onchange = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', onchange);
    } else {
      // Fallback for older browsers
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
