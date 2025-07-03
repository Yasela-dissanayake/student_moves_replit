import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

type SplitPaneContextValue = {
  minSize?: number;
  maxSize?: number;
  defaultSize?: number;
  initialSize?: number;
  size: number;
  setSize: (size: number) => void;
};

const SplitPaneContext = createContext<SplitPaneContextValue | undefined>(undefined);

export function SplitPane({
  children,
  minSize = 100,
  maxSize = Infinity,
  defaultSize = 250,
  initialSize,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  minSize?: number;
  maxSize?: number;
  defaultSize?: number;
  initialSize?: number;
  className?: string;
  [key: string]: any;
}) {
  const [size, setSize] = useState(initialSize || defaultSize);
  
  const value = {
    minSize,
    maxSize,
    defaultSize,
    initialSize,
    size,
    setSize,
  };

  return (
    <SplitPaneContext.Provider value={value}>
      <div className={`flex h-full ${className}`} {...props}>
        {children}
      </div>
    </SplitPaneContext.Provider>
  );
}

export function SplitPaneLeft({
  children,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  const context = useContext(SplitPaneContext);
  
  if (!context) {
    throw new Error('SplitPaneLeft must be used within a SplitPane');
  }
  
  return (
    <div
      className={`h-full ${className}`}
      style={{ width: `${context.size}px`, flexShrink: 0 }}
      {...props}
    >
      {children}
    </div>
  );
}

export function SplitPaneRight({
  children,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  return (
    <div className={`flex-grow h-full ${className}`} {...props}>
      {children}
    </div>
  );
}

export function SplitPaneResizer({
  className = '',
  ...props
}: {
  className?: string;
  [key: string]: any;
}) {
  const context = useContext(SplitPaneContext);
  const resizerRef = useRef<HTMLDivElement>(null);
  
  if (!context) {
    throw new Error('SplitPaneResizer must be used within a SplitPane');
  }
  
  useEffect(() => {
    const resizer = resizerRef.current;
    if (!resizer) return;
    
    let startSize: number;
    let startPosition: number;
    
    function onMouseDown(e: MouseEvent) {
      startSize = context.size;
      startPosition = e.clientX;
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    
    function onMouseMove(e: MouseEvent) {
      const delta = e.clientX - startPosition;
      const newSize = Math.max(context.minSize!, Math.min(context.maxSize!, startSize + delta));
      context.setSize(newSize);
    }
    
    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    
    resizer.addEventListener('mousedown', onMouseDown);
    
    return () => {
      resizer.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [context]);
  
  return (
    <div
      ref={resizerRef}
      className={`w-1 cursor-col-resize bg-slate-200 hover:bg-blue-500 active:bg-blue-600 h-full ${className}`}
      {...props}
    />
  );
}