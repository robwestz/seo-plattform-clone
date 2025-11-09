import React, { lazy, Suspense, ComponentType } from 'react';
import { Loading } from '../../components/ui/Loading';

/**
 * Lazy load a component with a fallback loading state
 */
export function lazyLoad<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  options: {
    fallback?: React.ReactNode;
    delay?: number;
  } = {}
) {
  const { fallback = <Loading size="lg" text="Loading..." />, delay = 0 } = options;

  const LazyComponent = lazy(() => {
    // Add artificial delay if specified (useful for testing)
    if (delay > 0) {
      return new Promise((resolve) => {
        setTimeout(() => {
          factory().then(resolve);
        }, delay);
      });
    }
    return factory();
  });

  return function LazyLoadedComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Preload a lazy component for faster loading
 */
export function preloadComponent<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  factory();
}

/**
 * Lazy load with retry logic
 */
export function lazyLoadWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    fallback?: React.ReactNode;
  } = {}
) {
  const { maxRetries = 3, retryDelay = 1000, fallback } = options;

  const loadWithRetry = async (attempt = 1): Promise<{ default: T }> => {
    try {
      return await factory();
    } catch (error) {
      if (attempt >= maxRetries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
      return loadWithRetry(attempt + 1);
    }
  };

  return lazyLoad(() => loadWithRetry(), { fallback });
}

/**
 * Lazy load on interaction (click, hover, etc.)
 */
export function lazyLoadOnInteraction<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  options: {
    event?: 'click' | 'hover' | 'focus';
    fallback?: React.ReactNode;
  } = {}
) {
  const { event = 'click', fallback } = options;

  return function InteractionLazyComponent(props: React.ComponentProps<T>) {
    const [shouldLoad, setShouldLoad] = React.useState(false);

    const handleInteraction = () => {
      if (!shouldLoad) {
        setShouldLoad(true);
        preloadComponent(factory);
      }
    };

    const eventHandlers = {
      click: { onClick: handleInteraction },
      hover: { onMouseEnter: handleInteraction },
      focus: { onFocus: handleInteraction },
    };

    if (!shouldLoad) {
      return (
        <div {...eventHandlers[event]}>
          {fallback || <div>Click to load component</div>}
        </div>
      );
    }

    const LazyComponent = lazy(factory);

    return (
      <Suspense fallback={fallback || <Loading />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Lazy load when component is in viewport
 */
export function lazyLoadOnVisible<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  options: {
    rootMargin?: string;
    threshold?: number;
    fallback?: React.ReactNode;
  } = {}
) {
  const { rootMargin = '50px', threshold = 0.01, fallback } = options;

  return function VisibleLazyComponent(props: React.ComponentProps<T>) {
    const [shouldLoad, setShouldLoad] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (!ref.current || shouldLoad) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setShouldLoad(true);
            preloadComponent(factory);
            observer.disconnect();
          }
        },
        { rootMargin, threshold }
      );

      observer.observe(ref.current);

      return () => observer.disconnect();
    }, [shouldLoad]);

    if (!shouldLoad) {
      return <div ref={ref}>{fallback || <Loading />}</div>;
    }

    const LazyComponent = lazy(factory);

    return (
      <Suspense fallback={fallback || <Loading />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Route-based code splitting helper
 */
export function lazyRoute<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazyLoad(factory, {
    fallback: (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading page..." />
      </div>
    ),
  });
}

export default {
  lazyLoad,
  preloadComponent,
  lazyLoadWithRetry,
  lazyLoadOnInteraction,
  lazyLoadOnVisible,
  lazyRoute,
};
