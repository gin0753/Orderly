"use client";

import { useEffect, useState } from "react";

export function useDebouncedValue<TValue>(
  value: TValue,
  delayMilliseconds: number,
) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMilliseconds);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delayMilliseconds, value]);

  return debouncedValue;
}
