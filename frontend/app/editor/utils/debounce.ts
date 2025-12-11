// Debounce utility function

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function with a cancel method
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number = 300,
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (...args: Parameters<T>) {
    // Clear existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      timeoutId = null;
      func(...args);
    }, wait);
  } as T & { cancel: () => void };

  // Add cancel method
  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 *
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to throttle
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number = 300,
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime: number | null = null;

  const invokeFunc = (args: Parameters<T>) => {
    lastArgs = null;
    lastCallTime = Date.now();
    func(...args);
  };

  const throttled = function (...args: Parameters<T>) {
    const now = Date.now();

    if (lastCallTime === null) {
      // First call
      invokeFunc(args);
    } else {
      const timeSinceLastCall = now - lastCallTime;

      if (timeSinceLastCall >= wait) {
        // Enough time has passed, invoke immediately
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        invokeFunc(args);
      } else {
        // Not enough time has passed, schedule for later
        lastArgs = args;

        if (timeoutId === null) {
          const remainingTime = wait - timeSinceLastCall;
          timeoutId = setTimeout(() => {
            timeoutId = null;
            if (lastArgs !== null) {
              invokeFunc(lastArgs);
            }
          }, remainingTime);
        }
      }
    }
  } as T & { cancel: () => void };

  throttled.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastCallTime = null;
  };

  return throttled;
}
