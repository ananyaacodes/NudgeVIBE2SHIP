import React, { useEffect, useRef, useState } from 'react';

interface Star {
  id: number;
  x: number; // percentage
  y: number; // percentage
  size: number; // px size
  speedFactor: number; // larger size moves more
  opacity: number;
}

interface TrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  born: number;
  maxLife: number;
}

export const Starfield: React.FC = () => {
  const [stars, setStars] = useState<Star[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const particlesRef = useRef<TrailParticle[]>([]);
  const lastPointerRef = useRef({ x: 0, y: 0, time: 0 });
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Generate 80 stars scattered evenly
    const generatedStars: Star[] = Array.from({ length: 80 }).map((_, index) => {
      const size = Math.random() * 2 + 1; // 1px to 3px
      return {
        id: index,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size,
        speedFactor: size * 12, // larger is closer, moves more in opposite direction
        opacity: Math.random() * 0.55 + 0.35,
      };
    });
    setStars(generatedStars);

    // Set canvas dimensions
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);

    const handlePointerMove = (clientX: number, clientY: number) => {
      const now = performance.now();
      const lastPointer = lastPointerRef.current;

      if (lastPointer.time === 0) {
        lastPointer.x = clientX;
        lastPointer.y = clientY;
        lastPointer.time = now;
        return;
      }

      const dt = now - lastPointer.time;
      if (dt > 0) {
        const vx = (clientX - lastPointer.x) / dt;
        const vy = (clientY - lastPointer.y) / dt;
        const speed = Math.sqrt(vx * vx + vy * vy);

        // Spawn a trail of particles if moving
        if (speed > 0.05) {
          // Determine spawn rate based on pointer speed
          const count = Math.min(3, Math.max(1, Math.floor(speed * 3.5)));
          for (let i = 0; i < count; i++) {
            if (particlesRef.current.length < 200) {
              const color = Math.random() > 0.5 ? '#ffffff' : '#a78bfa';
              particlesRef.current.push({
                x: clientX,
                y: clientY,
                // Initial direction matches pointer movement with a small natural scatter
                vx: vx * (10 + Math.random() * 6) + (Math.random() - 0.5) * 1.5,
                vy: vy * (10 + Math.random() * 6) + (Math.random() - 0.5) * 1.5,
                color,
                size: Math.random() * 2.5 + 1.2, // 1.2px to 3.7px
                alpha: 1.0,
                born: now,
                maxLife: 800 + Math.random() * 1000 // 0.8s to 1.8s
              });
            }
          }
        }
      }

      lastPointer.x = clientX;
      lastPointer.y = clientY;
      lastPointer.time = now;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const mouseX = (e.clientX / innerWidth) - 0.5;
      const mouseY = (e.clientY / innerHeight) - 0.5;
      setOffset({
        x: -mouseX,
        y: -mouseY,
      });

      handlePointerMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const { innerWidth, innerHeight } = window;
        const touchX = (touch.clientX / innerWidth) - 0.5;
        const touchY = (touch.clientY / innerHeight) - 0.5;
        setOffset({
          x: -touchX,
          y: -touchY,
        });

        handlePointerMove(touch.clientX, touch.clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Canvas animation loop
    const ctx = canvas?.getContext('2d');
    const updateAndRender = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = performance.now();
      const particles = particlesRef.current;
      const nextParticles: TrailParticle[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const age = now - p.born;

        if (age < p.maxLife) {
          p.alpha = 1 - age / p.maxLife;

          // Apply physics: friction/drag to slow down velocities gracefully
          p.vx *= 0.95;
          p.vy *= 0.95;

          // Displace position
          p.x += p.vx;
          p.y += p.vy;

          // Render soft outer glow
          ctx.globalAlpha = p.alpha * 0.35;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Render bright white star core
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2);
          ctx.fill();

          nextParticles.push(p);
        }
      }

      particlesRef.current = nextParticles;
      animationFrameIdRef.current = requestAnimationFrame(updateAndRender);
    };

    animationFrameIdRef.current = requestAnimationFrame(updateAndRender);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
    >
      {stars.map((star) => {
        const translateX = offset.x * star.speedFactor;
        const translateY = offset.y * star.speedFactor;

        return (
          <div
            key={star.id}
            className="starfield-particle bg-indigo-200/90 shadow-[0_0_4px_rgba(255,255,255,0.8)]"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              transform: `translate3d(${translateX}px, ${translateY}px, 0)`,
            }}
          />
        );
      })}

      {/* Interactive particle trail canvas layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
      />
    </div>
  );
};
