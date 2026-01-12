'use client';

import React, { useState, useEffect } from 'react';

const SAMPLE_IMAGES = [
  '/images/sample1.jpg',
  '/images/sample2.jpg',
  '/images/sample3.jpg',
  '/images/sample4.jpg',
  '/images/sample5.jpg',
];

export const PhotoViewer: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [fitToWindow, setFitToWindow] = useState(true);

  const currentImage = SAMPLE_IMAGES[currentIndex];

  useEffect(() => {
    if (!isSlideshow) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SAMPLE_IMAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isSlideshow]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + SAMPLE_IMAGES.length) % SAMPLE_IMAGES.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SAMPLE_IMAGES.length);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 5));
    setFitToWindow(false);
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.25));
    setFitToWindow(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFitToWindow = () => {
    setFitToWindow(true);
    setZoom(1);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this image?')) {
      // In a real app, this would delete the image
      console.log('Delete image:', currentImage);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#c0c0c0' }}>
      {/* Toolbar */}
      <div className="win-toolbar">
        <button className="win-toolbar-button" onClick={handleZoomIn} title="Zoom In">
          🔍+
        </button>
        <button className="win-toolbar-button" onClick={handleZoomOut} title="Zoom Out">
          🔍-
        </button>
        <button className="win-toolbar-button" onClick={handleFitToWindow} title="Fit to Window">
          Fit
        </button>
        <button className="win-toolbar-button" onClick={handleRotate} title="Rotate">
          ↻
        </button>
        <button className="win-toolbar-button" onClick={handlePrint} title="Print">
          🖨️
        </button>
        <button className="win-toolbar-button" onClick={handleDelete} title="Delete">
          🗑️
        </button>
        <div style={{ flex: 1 }} />
        <button
          className="win-toolbar-button"
          onClick={() => setIsSlideshow(!isSlideshow)}
          style={{
            backgroundColor: isSlideshow ? '#000080' : '#c0c0c0',
            color: isSlideshow ? '#ffffff' : '#000000',
          }}
          title="Slideshow"
        >
          ▶️
        </button>
      </div>

      {/* Image Display Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#808080',
          position: 'relative',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          {currentImage ? (
            <img
              src={currentImage}
              alt={`Image ${currentIndex + 1}`}
              onError={(e) => {
                // Fallback if image doesn't exist
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.style.cssText = 'padding: 40px; text-align: center; color: #ffffff;';
                  fallback.innerHTML = `
                    <div style="font-size: 48px; margin-bottom: 16px;">🖼️</div>
                    <div>Sample Image ${currentIndex + 1}</div>
                    <div style="font-size: 12px; margin-top: 8px; color: #cccccc;">Place images in /public/images/</div>
                  `;
                  if (!parent.querySelector('.image-fallback')) {
                    fallback.className = 'image-fallback';
                    parent.appendChild(fallback);
                  }
                }
              }}
              style={{
                maxWidth: fitToWindow ? '100%' : 'none',
                maxHeight: fitToWindow ? '100%' : 'none',
                width: fitToWindow ? 'auto' : `${zoom * 100}%`,
                height: fitToWindow ? 'auto' : `${zoom * 100}%`,
                transform: `rotate(${rotation}deg)`,
                objectFit: fitToWindow ? 'contain' : 'none',
              }}
            />
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#ffffff' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖼️</div>
              <div>No image loaded</div>
            </div>
          )}
        </div>

        {/* Navigation Arrows */}
        <button
          className="win-button"
          onClick={handlePrevious}
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '20px',
            padding: '8px 12px',
            zIndex: 10,
          }}
          title="Previous"
        >
          ◀
        </button>
        <button
          className="win-button"
          onClick={handleNext}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '20px',
            padding: '8px 12px',
            zIndex: 10,
          }}
          title="Next"
        >
          ▶
        </button>
      </div>

      {/* Status Bar */}
      <div className="win-statusbar">
        <span>
          Image {currentIndex + 1} of {SAMPLE_IMAGES.length}
          {!fitToWindow && ` | Zoom: ${Math.round(zoom * 100)}%`}
          {rotation !== 0 && ` | Rotated: ${rotation}°`}
        </span>
      </div>
    </div>
  );
};

