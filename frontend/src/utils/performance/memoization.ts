/**
 * Deep memoization with custom equality check
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    maxSize?: number;
    equals?: (a: any, b: any) => boolean;
  } = {}
): T {
  const { maxSize = 1, equals = shallowEqual } = options;
  const cache = new Map<string, { args: any[]; result: any }>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    // Check if we have a cached result with matching args
    for (const [, entry] of cache) {
      if (entry.args.length === args.length && entry.args.every((arg, i) => equals(arg, args[i]))) {
        return entry.result;
      }
    }

    // Compute new result
    const result = fn(...args);

    // Store in cache
    const key = JSON.stringify(args);
    cache.set(key, { args, result });

    // Enforce max cache size
    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  }) as T;
}

/**
 * Memoize async functions
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    maxSize?: number;
    ttl?: number; // Time to live in milliseconds
  } = {}
): T {
  const { maxSize = 10, ttl } = options;
  const cache = new Map<string, { promise: Promise<any>; timestamp: number }>();

  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    // Check if cached and not expired
    if (cached) {
      if (!ttl || Date.now() - cached.timestamp < ttl) {
        return cached.promise;
      }
      cache.delete(key);
    }

    // Create new promise
    const promise = fn(...args);
    cache.set(key, { promise, timestamp: Date.now() });

    // Enforce max cache size
    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return promise;
  }) as T;
}

/**
 * Shallow equality check
 */
export function shallowEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => a[key] === b[key]);
}

/**
 * Deep equality check
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => deepEqual(a[key], b[key]));
}

/**
 * Create a memoized selector function
 */
export function createSelector<T, R>(
  selector: (state: T) => R,
  equals: (a: R, b: R) => boolean = shallowEqual
): (state: T) => R {
  let lastState: T;
  let lastResult: R;
  let hasRun = false;

  return (state: T): R => {
    if (!hasRun || !equals(selector(lastState), selector(state))) {
      lastState = state;
      lastResult = selector(state);
      hasRun = true;
    }

    return lastResult;
  };
}

/**
 * Memoize component props
 */
export function memoizeProps<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return React.memo(Component, (prevProps, nextProps) => {
    return shallowEqual(prevProps, nextProps);
  });
}

/**
 * LRU Cache implementation
 */
export class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, V>;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  set(key: K, value: V): void {
    // Remove if already exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add to end
    this.cache.set(key, value);

    // Evict oldest if over size
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Weak memoization (garbage collected)
 */
export function weakMemoize<T extends object, R>(fn: (arg: T) => R): (arg: T) => R {
  const cache = new WeakMap<T, R>();

  return (arg: T): R => {
    if (cache.has(arg)) {
      return cache.get(arg)!;
    }

    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}

/**
 * Memoize with custom cache key generator
 */
export function memoizeWith<T extends (...args: any[]) => any>(
  keyFn: (...args: Parameters<T>) => string,
  fn: T
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn(...args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

export default {
  memoize,
  memoizeAsync,
  shallowEqual,
  deepEqual,
  createSelector,
  memoizeProps,
  LRUCache,
  weakMemoize,
  memoizeWith,
};
