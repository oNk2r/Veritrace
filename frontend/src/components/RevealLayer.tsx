import { useEffect, useRef, useState } from 'react';

const SPOTLIGHT_R = 260;

interface RevealLayerProps {
  image: string;
  cursorX: number;
  cursorY: number;
  className?: string;
}

export function RevealLayer({ image, cursorX, cursorY, className = "" }: RevealLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [maskUrl, setMaskUrl] = useState<string>('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      renderMask();
    };

    window.addEventListener('resize', handleResize);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const renderMask = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (cursorX < -500 || cursorY < -500) {
      setMaskUrl(canvas.toDataURL());
      return;
    }

    const grad = ctx.createRadialGradient(
      cursorX,
      cursorY,
      0,
      cursorX,
      cursorY,
      SPOTLIGHT_R
    );

    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.75)');
    grad.addColorStop(0.75, 'rgba(255, 255, 255, 0.4)');
    grad.addColorStop(0.88, 'rgba(255, 255, 255, 0.12)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, SPOTLIGHT_R, 0, Math.PI * 2);
    ctx.fill();

    setMaskUrl(canvas.toDataURL());
  };

  useEffect(() => {
    renderMask();
  }, [cursorX, cursorY]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ display: 'none' }}
      />
      <div
        className={`absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none ${className}`}
        style={{
          backgroundImage: `url(${image})`,
          maskImage: maskUrl ? `url(${maskUrl})` : 'none',
          WebkitMaskImage: maskUrl ? `url(${maskUrl})` : 'none',
          maskSize: '100% 100%',
          WebkitMaskSize: '100% 100%',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
        }}
      />
    </>
  );
}
