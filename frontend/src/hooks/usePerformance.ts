import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Monitor component render performance
 */
export function useRenderPerformance(componentName: string, log = false) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const renderTime = performance.now() - startTime.current;

    if (log) {
      console.log(`[${componentName}] Render #${renderCount.current} took ${renderTime.toFixed(2)}ms`);
    }

    startTime.current = performance.now();
  });

  return {
    renderCount: renderCount.current,
    componentName,
  };
}

/**
 * Track why a component re-rendered
 */
export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any>>();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
}

/**
 * Measure function execution time
 */
export function usePerformanceMeasure() {
  const measure = useCallback(<T extends any[], R>(
    fn: (...args: T) => R,
    label?: string
  ): ((...args: T) => R) => {
    return (...args: T) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      const duration = end - start;

      console.log(`[Performance] ${label || fn.name || 'Function'} took ${duration.toFixed(2)}ms`);

      return result;
    };
  }, []);

  return measure;
}

/**
 * Monitor memory usage
 */
export function useMemoryMonitor(interval = 5000) {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  useEffect(() => {
    if (!('memory' in performance)) {
      console.warn('Memory API not supported');
      return;
    }

    const checkMemory = () => {
      const memory = (performance as any).memory;
      setMemoryInfo({
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      });
    };

    checkMemory();
    const timer = setInterval(checkMemory, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return memoryInfo;
}

/**
 * Track Core Web Vitals
 */
export function useWebVitals() {
  const [vitals, setVitals] = useState<{
    CLS?: number;
    FID?: number;
    FCP?: number;
    LCP?: number;
    TTFB?: number;
  }>({});

  useEffect(() => {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          setVitals((prev) => ({ ...prev, LCP: lastEntry.renderTime || lastEntry.loadTime }));
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstInput = entries[0] as any;
          setVitals((prev) => ({ ...prev, FID: firstInput.processingStart - firstInput.startTime }));
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              setVitals((prev) => ({ ...prev, CLS: clsValue }));
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        return () => {
          lcpObserver.disconnect();
          fidObserver.disconnect();
          clsObserver.disconnect();
        };
      } catch (e) {
        console.warn('Web Vitals monitoring failed:', e);
      }
    }

    // Navigation Timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navTiming = performance.getEntriesByType('navigation')[0] as any;
      if (navTiming) {
        setVitals((prev) => ({
          ...prev,
          FCP: navTiming.responseStart - navTiming.fetchStart,
          TTFB: navTiming.responseStart - navTiming.requestStart,
        }));
      }
    }
  }, []);

  return vitals;
}

/**
 * Debounce a function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

/**
 * Throttle a function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      }
    },
    [callback, delay]
  );
}

/**
 * Idle callback hook
 */
export function useIdleCallback(callback: () => void, deps: any[] = []) {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(callback);
      return () => cancelIdleCallback(id);
    } else {
      // Fallback for browsers without requestIdleCallback
      const timeout = setTimeout(callback, 1);
      return () => clearTimeout(timeout);
    }
  }, deps);
}

/**
 * Network status monitoring
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState({
    online: navigator.onLine,
    effectiveType: (navigator as any).connection?.effectiveType,
    downlink: (navigator as any).connection?.downlink,
    rtt: (navigator as any).connection?.rtt,
    saveData: (navigator as any).connection?.saveData,
  });

  useEffect(() => {
    const updateOnlineStatus = () => {
      setStatus((prev) => ({ ...prev, online: navigator.onLine }));
    };

    const updateConnectionStatus = () => {
      const conn = (navigator as any).connection;
      if (conn) {
        setStatus({
          online: navigator.onLine,
          effectiveType: conn.effectiveType,
          downlink: conn.downlink,
          rtt: conn.rtt,
          saveData: conn.saveData,
        });
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    const conn = (navigator as any).connection;
    if (conn) {
      conn.addEventListener('change', updateConnectionStatus);
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      if (conn) {
        conn.removeEventListener('change', updateConnectionStatus);
      }
    };
  }, []);

  return status;
}

export default {
  useRenderPerformance,
  useWhyDidYouUpdate,
  usePerformanceMeasure,
  useMemoryMonitor,
  useWebVitals,
  useDebounce,
  useThrottle,
  useIdleCallback,
  useNetworkStatus,
};
