import React, { useState, useRef, useEffect } from 'react';
import interact from 'interactjs';
import html2canvas from 'html2canvas';


interface DragEvent extends MouseEvent {
  dx: number;
  dy: number;
}

interface ResizeEvent extends MouseEvent {
  rect: {
    width: number;
    height: number;
  };
  deltaRect: {
    left: number;
    top: number;
  };
}

const DrawBoard: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<'drag' | 'draw'>('drag');
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const drawingLayerRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [color, setColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(5);

  useEffect(() => {
    if (drawingLayerRef.current) {
      ctxRef.current = drawingLayerRef.current.getContext('2d');
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const resizeCanvas = (): void => {
    if (canvasContainerRef.current && drawingLayerRef.current) {
      drawingLayerRef.current.width = canvasContainerRef.current.clientWidth;
      drawingLayerRef.current.height = canvasContainerRef.current.clientHeight;
    }
  };

  const cloneImage = (imgSrc: string): void => {
    if (currentMode === 'drag' && canvasContainerRef.current) {
      const clone = document.createElement('div');
      clone.classList.add('clone');
      clone.style.width = '100px';
      clone.style.height = '100px';
      clone.style.left = '0px';
      clone.style.top = '0px';
      clone.style.position = 'absolute';
      
      const cloneImg = document.createElement('img');
      cloneImg.src = imgSrc;
      cloneImg.style.width = '100%';
      cloneImg.style.height = '100%';
      clone.appendChild(cloneImg);
      
      const resizeHandle = document.createElement('div');
      resizeHandle.classList.add('resize-handle');
      clone.appendChild(resizeHandle);
      
      canvasContainerRef.current.appendChild(clone);
      makeDraggableAndResizable(clone);
    }
  };

  const makeDraggableAndResizable = (element: HTMLElement): void => {
    interact(element)
      .draggable({
        inertia: true,
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: 'parent',
            endOnly: true
          })
        ],
        autoScroll: true,
        listeners: { move: dragMoveListener }
      })
      .resizable({
        edges: { bottom: true, right: true },
        listeners: {
          move: resizeMoveListener
        },
        modifiers: [
          interact.modifiers.restrictSize({
            min: { width: 50, height: 50 },
            max: { width: 500, height: 500 }
          })
        ],
        inertia: true
      });
  };

  const dragMoveListener = (event: DragEvent): void => {
    const target = event.target as HTMLElement;
    const x = (parseFloat(target.getAttribute('data-x') || '0') || 0) + event.dx;
    const y = (parseFloat(target.getAttribute('data-y') || '0') || 0) + event.dy;

    target.style.transform = `translate(${x}px, ${y}px)`;

    target.setAttribute('data-x', x.toString());
    target.setAttribute('data-y', y.toString());
  };

  const resizeMoveListener = (event: ResizeEvent): void => {
    const target = event.target as HTMLElement;
    let x = (parseFloat(target.getAttribute('data-x') || '0') || 0);
    let y = (parseFloat(target.getAttribute('data-y') || '0') || 0);

    target.style.width = `${event.rect.width}px`;
    target.style.height = `${event.rect.height}px`;

    x += event.deltaRect.left;
    y += event.deltaRect.top;

    target.style.transform = `translate(${x}px, ${y}px)`;

    target.setAttribute('data-x', x.toString());
    target.setAttribute('data-y', y.toString());
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (currentMode === 'draw') {
      setIsDrawing(true);
      draw(e);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (!isDrawing || currentMode !== 'draw' || !ctxRef.current || !drawingLayerRef.current) return;
    const rect = drawingLayerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctxRef.current.lineWidth = brushSize;
    ctxRef.current.lineCap = 'round';
    ctxRef.current.strokeStyle = color;

    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
  };

  const stopDrawing = (): void => {
    setIsDrawing(false);
    if (ctxRef.current) {
      ctxRef.current.beginPath();
    }
  };

  const switchMode = (): void => {
    setCurrentMode(prevMode => prevMode === 'drag' ? 'draw' : 'drag');
  };

  const captureImage = (): void => {
    if (canvasContainerRef.current) {
      html2canvas(canvasContainerRef.current).then(canvas => {
        const link = document.createElement('a');
        link.download = 'my-image.png';
        link.href = canvas.toDataURL();
        link.click();
      });
    }
  };

  return (
    <div>
      <div id="imageContainer">
        <img src="/api/placeholder/100/100" alt="拼圖1" className="draggable" onClick={() => cloneImage('/api/placeholder/100/100')} />
        <img src="/api/placeholder/100/100" alt="拼圖2" className="draggable" onClick={() => cloneImage('/api/placeholder/100/100')} />
        <img src="/api/placeholder/100/100" alt="拼圖3" className="draggable" onClick={() => cloneImage('/api/placeholder/100/100')} />
      </div>
      <button onClick={switchMode}>
        {currentMode === 'drag' ? '切換到繪畫模式' : '切換到拖曳模式'}
      </button>
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
      <input type="range" min="1" max="20" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value, 10))} />
      <button onClick={captureImage}>截圖</button>
      <div id="canvasContainer" ref={canvasContainerRef} style={{width: '500px', height: '500px', position: 'relative', overflow: 'hidden'}}>
        <canvas
          ref={drawingLayerRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 2,
            pointerEvents: currentMode === 'draw' ? 'auto' : 'none'
          }}
        />
      </div>
    </div>
  );
};

export default DrawBoard;