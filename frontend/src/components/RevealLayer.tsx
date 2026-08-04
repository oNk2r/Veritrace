// Stateless RevealLayer utilizing native CSS masking

interface RevealLayerProps {
  image: string;
  cursorX: number;
  cursorY: number;
  className?: string;
}

export function RevealLayer({ image, cursorX, cursorY, className = "" }: RevealLayerProps) {
  if (cursorX < -500 || cursorY < -500) {
    return (
      <div
        className={`absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none ${className}`}
        style={{
          backgroundImage: `url(${image})`,
          maskImage: 'none',
          WebkitMaskImage: 'none',
        }}
      />
    );
  }

  const maskStyle = `radial-gradient(circle 260px at ${cursorX}px ${cursorY}px, black 0%, black 40%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.12) 88%, transparent 100%)`;

  return (
    <div
      className={`absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none ${className}`}
      style={{
        backgroundImage: `url(${image})`,
        maskImage: maskStyle,
        WebkitMaskImage: maskStyle,
        maskSize: '100% 100%',
        WebkitMaskSize: '100% 100%',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
      }}
    />
  );
}
