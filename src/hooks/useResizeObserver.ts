import { useCallback, useEffect, useRef, useState } from 'react';
import { Size } from 'src/types';

// resize变化
export const useResizeObserver = (el?: HTMLElement | null) => {
  const resizeObserverRef = useRef<ResizeObserver>();
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  // 取消连接
  const disconnect = useCallback(() => {
    resizeObserverRef.current?.disconnect();
  }, []);
  // 观察
  const observe = useCallback(
    (element: HTMLElement) => {
      disconnect();

      resizeObserverRef.current = new ResizeObserver(() => {
        setSize({
          width: element.clientWidth,
          height: element.clientHeight
        });
      });

      resizeObserverRef.current.observe(element);
    },
    [disconnect]
  );

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  useEffect(() => {
    if (el) observe(el);
  }, [observe, el]);

  return {
    size,
    disconnect,
    observe
  };
};
