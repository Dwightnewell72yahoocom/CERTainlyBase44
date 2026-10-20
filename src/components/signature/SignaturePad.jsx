import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check } from 'lucide-react';

export default function SignaturePad({ onSave, saving }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      onSave(blob);
    }, 'image/png');
  };

  return (
    <div>
      <div
        className="relative rounded-2xl border-2 border-dashed overflow-hidden"
        style={{ borderColor: hasSignature ? '#6b7040' : '#d1ccc0' }}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={250}
          className="w-full h-48 bg-white touch-none"
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={stopDraw}
          onPointerLeave={stopDraw}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm" style={{ color: '#aaa' }}>
              Sign here with your finger or mouse
            </p>
          </div>
        )}
      </div>
      <div className="flex gap-3 mt-4">
        <button
          onClick={clear}
          className="flex-1 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
          style={{ backgroundColor: '#f0ede5', color: '#6b7040', border: '2px solid #6b7040' }}
        >
          <Eraser className="w-4 h-4" />
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={!hasSignature || saving}
          className="flex-1 h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: '#6b7040', color: '#E8A020' }}
        >
          <Check className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Signature'}
        </button>
      </div>
    </div>
  );
}