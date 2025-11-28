import React, { useState, useEffect, useRef } from 'react';

interface DraggablePanelProps {
  title: string;
  initialPos: { x: number; y: number };
  children: React.ReactNode;
  className?: string;
}

const DraggablePanel: React.FC<DraggablePanelProps> = ({ title, initialPos, children, className }) => {
  const [pos, setPos] = useState(initialPos);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if clicking the header
    if (panelRef.current) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - pos.x,
        y: e.clientY - pos.y
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={panelRef}
      style={{ left: pos.x, top: pos.y, position: 'absolute' }}
      className={`z-50 w-72 bg-[#230800] border-4 border-double border-gensyn-primary shadow-[0_0_15px_rgba(250,215,209,0.2)] ${className}`}
    >
      {/* Header */}
      <div
        onMouseDown={handleMouseDown}
        className="bg-gensyn-primary text-[#230800] px-2 py-1 cursor-grab active:cursor-grabbing font-header text-xl uppercase tracking-wider flex justify-between items-center select-none"
      >
        <span>{title}</span>
        <span className="text-xs font-mono">::</span>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4 text-gensyn-primary font-mono text-sm">
        {children}
      </div>
    </div>
  );
};

export default DraggablePanel;
