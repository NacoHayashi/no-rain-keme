import React, { useState, useRef, useEffect } from 'react';
import interact from 'interactjs';
import html2canvas from 'html2canvas';

interface Layer {
  id: number;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  lastModified: number;
  isNew: boolean;
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

  const handleDragStart = (event: React.DragEvent<HTMLImageElement>, imgSrc: string) => {
    event.dataTransfer.setData('text/plain', imgSrc);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const imgSrc = event.dataTransfer.getData('text/plain');
    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      addImageLayer(imgSrc, { x, y });
    }
  };

  const addImageLayer = (imgSrc: string, position: { x: number; y: number }): void => {
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
        position: position,
        size: { width, height },
        lastModified: Date.now(),
        isNew: true
      };
      setLayers(prevLayers => [...prevLayers, newLayer]);
      setSelectedLayerId(newLayer.id);
    };
    img.src = imgSrc;
  };

  const updateLayerPosition = (id: number, newPosition: { x: number; y: number }, isNew: boolean): void => {
    setLayers(prevLayers =>
      prevLayers.map(layer =>
        layer.id === id ? { ...layer, position: newPosition, lastModified: Date.now(), isNew } : layer
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
                let x, y;
                if (layer.isNew) {
                  x = layer.position.x;
                  y = layer.position.y;

                } else {
                  x = (parseFloat(target.getAttribute('data-x') || '0') || 0) + event.dx;
                  y = (parseFloat(target.getAttribute('data-y') || '0') || 0) + event.dy;
                }
                updateLayerPosition(layer.id, { x, y }, false);
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

  const [isBurning, setIsBurning] = useState(false);
  const burningImageRef = useRef<HTMLImageElement>(null);

  const sacrificeTurtle = async () => {
    if (!canvasContainerRef.current) return;

    // 1. 保存当前画布内容为图片
    const canvas = await html2canvas(canvasContainerRef.current);
    const imageDataUrl = canvas.toDataURL('image/png');

    // 2. 设置燃烧状态为true，触发动画
    setIsBurning(true);

    // 3. 设置保存的图片到燃烧图层
    if (burningImageRef.current) {
      burningImageRef.current.src = imageDataUrl;
    }

    // 4. 5秒后重置状态
    setTimeout(() => {
      setIsBurning(false);
      // 这里可以添加其他需要的操作，比如清空画布等
    }, 5000);
  };

  return (
    <div onClick={() => setSelectedLayerId(null)} className='space-y-5'>
      <div className="flex gap-4 items-center">
        {imgs.map(img => (
          <div key={img.label} className="w-20 h-20 flex items-center cursor-grab  select-none">
            <img src={img.url} alt={img.label} onDragStart={(e) => handleDragStart(e, img.url)}
              draggable />
          </div>
        ))}
      </div>

      <div
        ref={canvasContainerRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className=' shadow-md rounded-lg max-w-full w-full h-[500px] border border-gray-300 relative overflow-hidden'
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
      {isBurning && (
        <div className="absolute top-0 left-0 w-full h-full">
          <img
            ref={burningImageRef}
            className="w-full h-full object-cover animate-fade-out"
            alt="Burning turtle"
          />
          <div className="absolute top-0 left-0 w-full h-full bg-orange-500 opacity-50 animate-flicker" />
        </div>
      )}
      <div className='flex justify-between items-center'>
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
        <button
          onClick={sacrificeTurtle}
          className="group relative inline-flex items-center justify-center p-4 px-6 py-3 overflow-hidden font-medium text-indigo-600 transition duration-300 ease-out border-2 border-red-500 rounded-full shadow-md"
        >
          <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-red-500 group-hover:translate-x-0 ease">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"></path>
            </svg>
          </span>
          <span className="absolute flex items-center justify-center w-full h-full text-red-500 transition-all duration-300 transform group-hover:translate-x-full ease">獻祭烏龜圖</span>
          <span className="relative invisible">獻祭烏龜圖</span>
        </button>
      </div>
    </div>
  );
};

export default ImageOnlyDragComponent;