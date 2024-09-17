import React, { useState, useRef, useEffect } from 'react';
import interact from 'interactjs';
import html2canvas from 'html2canvas';

interface Layer {
  id: number;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  lastModified: number;
}

const ImageOnlyDragComponent: React.FC = () => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 防止頁面縮放
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });

    // 防止頁面滾動
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const addImageLayer = (imgSrc: string): void => {
    const img = new Image();
    img.onload = () => {
      const maxSize = 100;
      let width = img.width;
      let height = img.height;

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }

      const newLayer: Layer = {
        id: Date.now(),
        content: imgSrc,
        position: { x: 0, y: 0 },
        size: { width, height },
        lastModified: Date.now(),
      };
      setLayers(prevLayers => [...prevLayers, newLayer]);
      setSelectedLayerId(newLayer.id);
    };
    img.src = imgSrc;
  };

  const updateLayerPosition = (id: number, newPosition: { x: number; y: number }): void => {
    setLayers(prevLayers =>
      prevLayers.map(layer =>
        layer.id === id ? { ...layer, position: newPosition, lastModified: Date.now() } : layer
      )
    );
  };

  const updateLayerSize = (id: number, newSize: { width: number; height: number }): void => {
    setLayers(prevLayers =>
      prevLayers.map(layer =>
        layer.id === id ? { ...layer, size: newSize, lastModified: Date.now() } : layer
      )
    );
  };

  const captureImage = (): void => {
    const button = document.querySelector('button');
    button?.classList.add('animate-wiggle');

    setTimeout(() => {
      button?.classList.remove('animate-wiggle');
    }, 300);

    if (canvasContainerRef.current) {
      html2canvas(canvasContainerRef.current).then(canvas => {
        const link = document.createElement('a');
        link.download = 'my-turtle-image.png';
        link.href = canvas.toDataURL();
        link.click();
      });
    }
  };

  useEffect(() => {
    layers.forEach(layer => {
      const element = document.getElementById(`layer-${layer.id}`);
      if (element) {
        interact(element)
          .draggable({
            inertia: true,
            modifiers: [
              interact.modifiers.restrictRect({
                restriction: 'parent',
                endOnly: true
              })
            ],
            listeners: {
              move(event) {
                setSelectedLayerId(layer.id);
                const target = event.target as HTMLElement;
                const x = (parseFloat(target.getAttribute('data-x') || '0') || 0) + event.dx;
                const y = (parseFloat(target.getAttribute('data-y') || '0') || 0) + event.dy;
                updateLayerPosition(layer.id, { x, y });
                target.style.transform = `translate(${x}px, ${y}px)`;
                target.setAttribute('data-x', x.toString());
                target.setAttribute('data-y', y.toString());
              },
            },
          })
          .resizable({
            edges: { bottom: true, right: true },
            inertia: true,
            modifiers: [
              interact.modifiers.restrictSize({
                min: { width: 50, height: 50 },
              })
            ],
            listeners: {
              move(event) {
                const target = event.target as HTMLElement;
                let x = (parseFloat(target.getAttribute('data-x') || '0') || 0);
                let y = (parseFloat(target.getAttribute('data-y') || '0') || 0);
                const width = event.rect.width;
                const height = event.rect.height;
                updateLayerSize(layer.id, { width, height });
                target.style.width = `${width}px`;
                target.style.height = `${height}px`;
                x += event.deltaRect.left;
                y += event.deltaRect.top;
                target.style.transform = `translate(${x}px, ${y}px)`;
                target.setAttribute('data-x', x.toString());
                target.setAttribute('data-y', y.toString());
              },
            },
          });
      }
    });
  }, [layers]);

  const sortedLayers = [...layers].sort((a, b) => a.lastModified - b.lastModified);
  const imgs: { label: string, url: string }[] = [
    { label: "kame", url: "/images/kame.png", },
    { label: "cloud", url: "/images/cloud.png", },
    { label: "rainy", url: "/images/rainy.png", },
    { label: "sun", url: "/images/sun.png", }
  ];

  return (
    <div onClick={() => setSelectedLayerId(null)}  className='space-y-5'>
      <div className="flex gap-4 items-center">
        {imgs.map(img => (
          <div key={img.label} className="w-20 h-20 flex items-center cursor-pointer  select-none">
            <img src={img.url} alt={img.label} onClick={() => addImageLayer(img.url)} />
          </div>
        ))}
      </div>

      <div
        ref={canvasContainerRef}
        className=' shadow-md rounded-lg max-w-full w-[500px] h-[500px] border border-gray-300 relative overflow-hidden'
      >
        {sortedLayers.map((layer, index) => (
          <div
            key={layer.id}
            id={`layer-${layer.id}`}
            className={selectedLayerId === layer.id ? " border-2 rounded-md border-cyan-300" : ''}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedLayerId(layer.id);
            }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translate(${layer.position.x}px, ${layer.position.y}px)`,
              width: `${layer.size.width}px`,
              height: `${layer.size.height}px`,
              zIndex: index + 1,
            }}
          >
            <img
              src={layer.content}
              alt={`Layer ${layer.id}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ))}
      </div>
      <div>
        <button
          onClick={captureImage}
          className="group relative inline-flex items-center justify-center p-4 px-6 py-3 overflow-hidden font-medium text-indigo-600 transition duration-300 ease-out border-2 border-indigo-500 rounded-full shadow-md"
        >
          <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-indigo-500 group-hover:translate-x-0 ease">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V8"></path>
            </svg>
          </span>
          <span className="absolute flex items-center justify-center w-full h-full text-indigo-500 transition-all duration-300 transform group-hover:translate-x-full ease">下載我的烏龜圖</span>
          <span className="relative invisible">下載我的烏龜圖</span>
        </button>
      </div>
    </div>
  );
};

export default ImageOnlyDragComponent;