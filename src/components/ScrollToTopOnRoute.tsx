'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollToTopOnRoute() {
  const pathname = usePathname();

  useEffect(() => {
    // Always reset scroll position when landing on a route.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}
