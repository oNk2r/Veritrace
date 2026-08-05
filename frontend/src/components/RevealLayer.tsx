import { forwardRef } from 'react';

interface RevealLayerProps {
  image: string;
  className?: string;
}

export const RevealLayer = forwardRef<HTMLDivElement, RevealLayerProps>(
  function RevealLayer({ image, className = '' }, ref) {
    return (
      <div
        ref={ref}
        className={`reveal-layer absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none ${className}`}
        style={{ backgroundImage: `url(${image})` }}
      />
    );
  }
);
