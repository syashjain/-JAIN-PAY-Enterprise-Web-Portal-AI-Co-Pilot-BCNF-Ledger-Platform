import React, { useEffect, useRef } from 'react';

interface SparkleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxSize: number;
  rotation: number;
  vRot: number;
  alpha: number;
  decay: number;
  color: string;
  shape: 'STAR_4' | 'STAR_8' | 'DIAMOND' | 'ORB';
  twinklePhase: number;
  twinkleSpeed: number;
}

interface ClickRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

const SPARKLE_PALETTE = [
  '#ee6018', // Signal Orange
  '#ffb347', // Warm Solar Gold
  '#fafafa', // Chalk White
  '#a0ca92', // Metric Green
  '#ffd166', // Starlight Amber
];

function drawFourPointStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  outerRadius: number,
  innerRadius: number,
  rotation: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  const spikes = 4;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / spikes;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawEightPointSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  outerRadius: number,
  rotation: number
) {
  drawFourPointStar(ctx, x, y, outerRadius, outerRadius * 0.22, rotation);
  drawFourPointStar(
    ctx,
    x,
    y,
    outerRadius * 0.68,
    outerRadius * 0.16,
    rotation + Math.PI / 4
  );
}

export const SparkleCursorOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const mouse = {
      x: width * 0.5,
      y: height * 0.35,
      trailX: width * 0.5,
      trailY: height * 0.35,
      lastSpawnX: width * 0.5,
      lastSpawnY: height * 0.35,
      isVisible: false,
      isHoveringInteractive: false,
      isPressed: false,
      headAngle: 0,
    };

    const particles: SparkleParticle[] = [];
    const ripples: ClickRipple[] = [];

    const spawnSparkles = (
      x: number,
      y: number,
      count: number,
      speedMultiplier = 1
    ) => {
      const shapes: SparkleParticle['shape'][] = [
        'STAR_4',
        'STAR_8',
        'STAR_4',
        'DIAMOND',
        'ORB',
      ];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.35 + Math.random() * 2.1) * speedMultiplier;
        const maxSize = 4 + Math.random() * 8.5;
        particles.push({
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.25,
          size: maxSize * 0.4,
          maxSize,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.14,
          alpha: 0.95,
          decay: 0.014 + Math.random() * 0.018,
          color:
            SPARKLE_PALETTE[Math.floor(Math.random() * SPARKLE_PALETTE.length)],
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.18 + Math.random() * 0.22,
        });
      }

      if (particles.length > 160) {
        particles.splice(0, particles.length - 160);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!mouse.isVisible) {
        mouse.isVisible = true;
        mouse.trailX = e.clientX;
        mouse.trailY = e.clientY;
      }

      const target = e.target as HTMLElement | null;
      mouse.isHoveringInteractive = Boolean(
        target?.closest(
          'button, a, input, select, textarea, [role="button"], label'
        )
      );

      const dx = mouse.x - mouse.lastSpawnX;
      const dy = mouse.y - mouse.lastSpawnY;
      const dist = Math.hypot(dx, dy);

      if (dist > 6) {
        const count = Math.min(4, Math.max(1, Math.floor(dist / 10)));
        spawnSparkles(mouse.x, mouse.y, count, 0.85);
        mouse.lastSpawnX = mouse.x;
        mouse.lastSpawnY = mouse.y;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      mouse.isPressed = true;
      mouse.isVisible = true;
      spawnSparkles(e.clientX, e.clientY, 18, 1.85);
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 4,
        maxRadius: 42,
        alpha: 0.85,
        color: '#ee6018',
      });
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 2,
        maxRadius: 26,
        alpha: 0.9,
        color: '#fafafa',
      });
    };

    const handleMouseUp = () => {
      mouse.isPressed = false;
    };

    const handleMouseLeave = () => {
      mouse.isVisible = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    let ambientTick = 0;

    const renderFrame = () => {
      ctx.clearRect(0, 0, width, height);

      // Smoothly interpolate trailing reticle
      mouse.trailX += (mouse.x - mouse.trailX) * 0.24;
      mouse.trailY += (mouse.y - mouse.trailY) * 0.24;
      mouse.headAngle += mouse.isHoveringInteractive ? 0.065 : 0.028;
      ambientTick += 1;

      // Occasional idle twinkle sparkle near the cursor even when still
      if (mouse.isVisible && ambientTick % 9 === 0) {
        spawnSparkles(
          mouse.x + (Math.random() - 0.5) * 18,
          mouse.y + (Math.random() - 0.5) * 18,
          1,
          0.45
        );
      }

      // 1. Render expanding click ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += (r.maxRadius - r.radius) * 0.16;
        r.alpha -= 0.032;
        if (r.alpha <= 0.01) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, r.alpha);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Render sparkle particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy = p.vy * 0.97 + 0.015; // subtle float/gravity
        p.rotation += p.vRot;
        p.twinklePhase += p.twinkleSpeed;
        p.alpha -= p.decay;

        if (p.alpha <= 0.01) {
          particles.splice(i, 1);
          continue;
        }

        const twinkleFactor = 0.65 + 0.35 * Math.sin(p.twinklePhase);
        const currentSize = p.maxSize * Math.min(1, p.alpha * 1.3) * twinkleFactor;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha * twinkleFactor));
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;

        if (p.shape === 'STAR_8') {
          drawEightPointSparkle(ctx, p.x, p.y, currentSize, p.rotation);
        } else if (p.shape === 'STAR_4') {
          drawFourPointStar(
            ctx,
            p.x,
            p.y,
            currentSize,
            currentSize * 0.24,
            p.rotation
          );
        } else if (p.shape === 'DIAMOND') {
          drawFourPointStar(
            ctx,
            p.x,
            p.y,
            currentSize * 0.75,
            currentSize * 0.42,
            p.rotation
          );
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentSize * 0.36, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 3. Render Custom Animated Sparkle Cursor Head + Trailing Orbit Ring
      if (mouse.isVisible) {
        const isLightTheme =
          typeof document !== 'undefined' &&
          document.documentElement.getAttribute('data-theme') === 'light';
        const ringRadius = mouse.isPressed
          ? 11
          : mouse.isHoveringInteractive
            ? 20
            : 15;

        // Outer trailing dashed/orbiting reticle
        ctx.save();
        ctx.translate(mouse.trailX, mouse.trailY);
        ctx.rotate(-mouse.headAngle * 0.75);
        ctx.strokeStyle = mouse.isHoveringInteractive
          ? 'rgba(238, 96, 24, 0.9)'
          : isLightTheme
            ? 'rgba(16, 16, 16, 0.55)'
            : 'rgba(250, 250, 250, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        // 4 orbiting satellite micro-dots on the trailing ring
        ctx.setLineDash([]);
        for (let k = 0; k < 4; k++) {
          const satAngle = (k * Math.PI) / 2;
          const sx = Math.cos(satAngle) * ringRadius;
          const sy = Math.sin(satAngle) * ringRadius;
          ctx.fillStyle =
            k % 2 === 0 ? '#ee6018' : isLightTheme ? '#101010' : '#a0ca92';
          ctx.beginPath();
          ctx.arc(sx, sy, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Primary rotating 8-point sparkle star at exact cursor tip
        const starOuter = mouse.isPressed
          ? 7.5
          : mouse.isHoveringInteractive
            ? 11.5
            : 9;
        ctx.save();
        ctx.fillStyle = mouse.isHoveringInteractive
          ? '#ee6018'
          : isLightTheme
            ? '#101010'
            : '#fafafa';
        drawEightPointSparkle(
          ctx,
          mouse.x,
          mouse.y,
          starOuter,
          mouse.headAngle
        );

        // Inner bright core
        ctx.fillStyle = isLightTheme ? '#ee6018' : '#ffb347';
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = window.requestAnimationFrame(renderFrame);
    };

    animationFrameId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="sparkle-cursor-overlay"
      className="fixed inset-0 pointer-events-none z-[9999]"
    />
  );
};

export default SparkleCursorOverlay;
