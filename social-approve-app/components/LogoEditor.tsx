'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface LogoEditorProps {
  imageUrl: string;
  logoUrl: string;
  onSave: (mergedImageBase64: string) => void;
  onCancel: () => void;
  initialPosition?: { x: number; y: number };
  initialSize?: number;
}

export default function LogoEditor({
  imageUrl,
  logoUrl,
  onSave,
  onCancel,
  initialPosition = { x: 30, y: 30 },
  initialSize = 150,
}: LogoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [position, setPosition] = useState(initialPosition);
  const [logoWidth, setLogoWidth] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isLocking, setIsLocking] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [logoEl, setLogoEl] = useState<HTMLImageElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 500, height: 500 });
  const [logoAspectRatio, setLogoAspectRatio] = useState(1); // width / height

  // Calculate logo height based on width and aspect ratio
  const logoHeight = logoWidth / logoAspectRatio;

  // Load images
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageEl(img);
      setImageLoaded(true);
    };
    img.src = imageUrl;

    const logo = new Image();
    logo.crossOrigin = 'anonymous';
    logo.onload = () => {
      setLogoEl(logo);
      setLogoLoaded(true);
      // Calculate aspect ratio (width / height)
      setLogoAspectRatio(logo.width / logo.height);
    };
    logo.src = logoUrl;
  }, [imageUrl, logoUrl]);

  // Calculate container size based on image aspect ratio
  useEffect(() => {
    if (imageEl) {
      const maxWidth = 600;
      const maxHeight = 600;
      const ratio = Math.min(maxWidth / imageEl.width, maxHeight / imageEl.height);
      setContainerSize({
        width: imageEl.width * ratio,
        height: imageEl.height * ratio,
      });
    }
  }, [imageEl]);

  // Mouse handlers for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on logo area (using actual logo dimensions)
    if (
      x >= position.x &&
      x <= position.x + logoWidth &&
      y >= position.y &&
      y <= position.y + logoHeight
    ) {
      setIsDragging(true);
      setDragOffset({ x: x - position.x, y: y - position.y });
    }
  }, [position, logoWidth, logoHeight]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    // Clamp to container bounds (using actual logo dimensions)
    const clampedX = Math.max(0, Math.min(x, containerSize.width - logoWidth));
    const clampedY = Math.max(0, Math.min(y, containerSize.height - logoHeight));

    setPosition({ x: clampedX, y: clampedY });
  }, [isDragging, dragOffset, containerSize, logoWidth, logoHeight]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Lock/merge the images
  const handleLock = async () => {
    if (!canvasRef.current || !imageEl || !logoEl) return;

    setIsLocking(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Set canvas to original image size
      canvas.width = imageEl.width;
      canvas.height = imageEl.height;

      // Draw base image
      ctx.drawImage(imageEl, 0, 0);

      // Calculate logo position/size scaled to original image dimensions
      const scaleX = imageEl.width / containerSize.width;
      const scaleY = imageEl.height / containerSize.height;
      const scaledX = position.x * scaleX;
      const scaledY = position.y * scaleY;
      const scaledWidth = logoWidth * scaleX;
      const scaledHeight = logoHeight * scaleY;

      // Draw logo with correct aspect ratio
      ctx.drawImage(logoEl, scaledX, scaledY, scaledWidth, scaledHeight);

      // Get merged image as base64
      const mergedBase64 = canvas.toDataURL('image/jpeg', 0.92);

      onSave(mergedBase64);
    } catch (error) {
      console.error('Error merging images:', error);
      alert('Failed to merge images. Please try again.');
    } finally {
      setIsLocking(false);
    }
  };

  // Preset positions (using actual logo dimensions)
  const presetPositions = {
    'top-left': { x: 20, y: 20 },
    'top-right': { x: containerSize.width - logoWidth - 20, y: 20 },
    'bottom-left': { x: 20, y: containerSize.height - logoHeight - 20 },
    'bottom-right': { x: containerSize.width - logoWidth - 20, y: containerSize.height - logoHeight - 20 },
  };

  const setPresetPosition = (preset: keyof typeof presetPositions) => {
    setPosition(presetPositions[preset]);
  };

  if (!imageLoaded || !logoLoaded) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-8">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-white mt-4">Loading images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[95vh] overflow-auto">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Position Logo</h2>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Editor Area */}
        <div className="p-4">
          <p className="text-slate-400 text-sm mb-4">
            Drag the logo to position it. Use the controls below to adjust size and position.
          </p>

          {/* Image Container */}
          <div
            ref={containerRef}
            className="relative mx-auto border-2 border-slate-600 rounded-lg overflow-hidden cursor-move select-none"
            style={{ width: containerSize.width, height: containerSize.height }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Base Image */}
            <img
              src={imageUrl}
              alt="Base"
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
            />

            {/* Logo Overlay - maintains aspect ratio */}
            <div
              className={`absolute pointer-events-none transition-shadow ${
                isDragging ? 'shadow-lg shadow-cyan-500/50' : ''
              }`}
              style={{
                left: position.x,
                top: position.y,
                width: logoWidth,
                height: logoHeight,
              }}
            >
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full"
                draggable={false}
              />
              {/* Drag handle indicator */}
              <div className="absolute inset-0 border-2 border-dashed border-cyan-400/50 rounded pointer-events-none"></div>
            </div>
          </div>

          {/* Hidden canvas for merging */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Controls */}
          <div className="mt-4 space-y-4">
            {/* Size Slider */}
            <div>
              <label className="text-sm text-slate-400 block mb-2">
                Logo Width: {Math.round(logoWidth)}px (Height: {Math.round(logoHeight)}px)
              </label>
              <input
                type="range"
                min="50"
                max="400"
                value={logoWidth}
                onChange={(e) => setLogoWidth(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* Preset Positions */}
            <div>
              <label className="text-sm text-slate-400 block mb-2">
                Quick Position:
              </label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setPresetPosition('top-left')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded"
                >
                  Top Left
                </button>
                <button
                  onClick={() => setPresetPosition('top-right')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded"
                >
                  Top Right
                </button>
                <button
                  onClick={() => setPresetPosition('bottom-left')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded"
                >
                  Bottom Left
                </button>
                <button
                  onClick={() => setPresetPosition('bottom-right')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded"
                >
                  Bottom Right
                </button>
              </div>
            </div>

            {/* Position Display */}
            <div className="text-sm text-slate-500">
              Position: X={Math.round(position.x)}, Y={Math.round(position.y)}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleLock}
            disabled={isLocking}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center gap-2"
          >
            {isLocking ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Merging...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Lock Logo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
