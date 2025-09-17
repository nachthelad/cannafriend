// Suspense-compatible data fetching utilities
// Based on the pattern from React docs and libraries like SWR

type SuspenseResource<T> = {
  read(): T;
};

type PromiseStatus = 'pending' | 'fulfilled' | 'rejected';

interface SuspensePromise<T> extends Promise<T> {
  status?: PromiseStatus;
  result?: T;
  reason?: any;
}

export function createSuspenseResource<T>(promise: Promise<T>): SuspenseResource<T> {
  let status: PromiseStatus = 'pending';
  let result: T;
  let error: any;

  const suspensePromise = promise.then(
    (value) => {
      status = 'fulfilled';
      result = value;
      return value;
    },
    (reason) => {
      status = 'rejected';
      error = reason;
      throw reason;
    }
  ) as SuspensePromise<T>;

  return {
    read() {
      if (status === 'pending') {
        throw suspensePromise;
      } else if (status === 'rejected') {
        throw error;
      } else {
        return result;
      }
    }
  };
}

// Cache for resources to avoid re-fetching on re-renders
const resourceCache = new Map<string, SuspenseResource<any>>();

export function getSuspenseResource<T>(
  key: string,
  fetcher: () => Promise<T>
): SuspenseResource<T> {
  if (!resourceCache.has(key)) {
    resourceCache.set(key, createSuspenseResource(fetcher()));
  }
  return resourceCache.get(key)!;
}

// Clear cache when needed (e.g., on data mutations)
export function clearSuspenseCache(key?: string) {
  if (key) {
    resourceCache.delete(key);
  } else {
    resourceCache.clear();
  }
}