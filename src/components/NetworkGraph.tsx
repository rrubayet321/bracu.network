'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Member } from '@/types/member';
import { GlowCard } from '@/components/ui/spotlight-card';

interface Node {
  slug: string;
  name: string;
  profilePic?: string;
  theta: number;
  phi: number;
  sx: number;
  sy: number;
  sz: number;
  depthScale: number;
  img?: HTMLImageElement;
}

interface NetworkGraphProps {
  members: Member[];
  highlightSlug?: string | null;
}

const BASE_NODE_RADIUS = 18;
const HOVER_NODE_RADIUS = 28;
const ROTATION_SPEED_Y = 0.0022;
const ROTATION_SPEED_X = 0.0009;

export default function NetworkGraph({ members, highlightSlug }: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const rafRef = useRef<number>(0);
  const highlightRef = useRef<string | null>(null);
  const hoveredSlugRef = useRef<string | null>(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const pointerRef = useRef({ x: -9999, y: -9999 });
  const frameRef = useRef(0);

  const tick = useCallback(function tickFn() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nodes = nodesRef.current;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const globeRadius = Math.min(W, H) * 0.36;
    const perspective = globeRadius * 2.5;

    frameRef.current += 1;
    rotationRef.current.y += ROTATION_SPEED_Y;
    rotationRef.current.x += ROTATION_SPEED_X;

    // Project 3D sphere points to 2D canvas
    const sinY = Math.sin(rotationRef.current.y);
    const cosY = Math.cos(rotationRef.current.y);
    const sinX = Math.sin(rotationRef.current.x);
    const cosX = Math.cos(rotationRef.current.x);
    for (const n of nodes) {
      const x = Math.sin(n.phi) * Math.cos(n.theta);
      const y = Math.cos(n.phi);
      const z = Math.sin(n.phi) * Math.sin(n.theta);

      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      const depthScale = perspective / (perspective - z2 * globeRadius);
      n.sx = cx + x1 * globeRadius * depthScale;
      n.sy = cy + y2 * globeRadius * depthScale;
      n.sz = z2;
      n.depthScale = depthScale;
    }

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, globeRadius + 10, 0, Math.PI * 2);
    ctx.clip();

    const hl = highlightRef.current;
    const hovered = hoveredSlugRef.current;
    const sortedNodes = [...nodes].sort((a, b) => a.sz - b.sz);

    // Draw a complete graph (all users connected to all users)
    for (let i = 0; i < sortedNodes.length; i++) {
      for (let j = i + 1; j < sortedNodes.length; j++) {
        const a = sortedNodes[i];
        const b = sortedNodes[j];
        const avgDepth = (a.sz + b.sz) / 2;
        const alpha = 0.06 + (avgDepth + 1) * 0.08;
        const isActive = hl && (a.slug === hl || b.slug === hl);
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.strokeStyle = isActive
          ? 'rgba(74,108,247,0.45)'
          : `rgba(115, 130, 160, ${Math.min(alpha, 0.18)})`;
        ctx.lineWidth = isActive ? 1.2 : 0.8;
        ctx.stroke();
      }
    }

    // Draw nodes front-to-back for depth
    for (const node of sortedNodes) {
      const isHighlighted = hl === node.slug || hovered === node.slug;
      const r = isHighlighted
        ? HOVER_NODE_RADIUS * node.depthScale
        : BASE_NODE_RADIUS * node.depthScale;

      ctx.save();
      ctx.beginPath();
      ctx.arc(node.sx, node.sy, r, 0, Math.PI * 2);
      ctx.clip();

      if (node.img && node.img.complete && node.img.naturalWidth > 0) {
        ctx.drawImage(node.img, node.sx - r, node.sy - r, r * 2, r * 2);
      } else {
        ctx.fillStyle = '#253494';
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.max(10, r * 0.65)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          node.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
          node.sx,
          node.sy
        );
      }

      ctx.beginPath();
      ctx.arc(node.sx, node.sy, r, 0, Math.PI * 2);
      ctx.strokeStyle = isHighlighted
        ? 'rgba(74,108,247,0.95)'
        : 'rgba(200,200,200,0.28)';
      ctx.lineWidth = isHighlighted ? 2 : 1.1;
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();

    rafRef.current = requestAnimationFrame(tickFn);
  }, []);

  useEffect(() => {
    highlightRef.current = highlightSlug ?? null;
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
  }, [highlightSlug, tick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || members.length === 0) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();
    hoveredSlugRef.current = null;
    rotationRef.current = { x: 0.2, y: 0 };
    frameRef.current = 0;

    // Use a Fibonacci sphere distribution for balanced globe layout.
    nodesRef.current = members.map((m, i) => {
      const count = members.length;
      const y = 1 - (i / Math.max(count - 1, 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = Math.PI * (3 - Math.sqrt(5)) * i;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      const phi = Math.acos(y);
      return {
        slug: m.slug,
        name: m.name,
        profilePic: m.profile_pic,
        theta: Math.atan2(z, x),
        phi,
        sx: 0,
        sy: 0,
        sz: 0,
        depthScale: 1,
      };
    });

    const imagePromises = nodesRef.current.map(
      (node) =>
        new Promise<void>((resolve) => {
          if (!node.profilePic) { resolve(); return; }
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => { node.img = img; resolve(); };
          img.onerror = () => resolve();
          img.src = node.profilePic;
          setTimeout(resolve, 2000);
        })
    );

    Promise.all(imagePromises).then(() => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    });

    const onMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      let nearest: { slug: string; d: number } | null = null;
      for (const node of nodesRef.current) {
        const r = BASE_NODE_RADIUS * node.depthScale + 8;
        const dx = node.sx - pointerRef.current.x;
        const dy = node.sy - pointerRef.current.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= r && (!nearest || d < nearest.d)) {
          nearest = { slug: node.slug, d };
        }
      }
      hoveredSlugRef.current = nearest?.slug ?? null;
    };

    const onLeave = () => {
      hoveredSlugRef.current = null;
    };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);

    // ResizeObserver
    const ro = new ResizeObserver(() => {
      resizeCanvas();
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    });
    ro.observe(canvas.parentElement!);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      ro.disconnect();
    };
  }, [members, tick]);

  return (
    <GlowCard customSize={true} className="graph-container" glowColor="red">
      <canvas ref={canvasRef} className="graph-canvas" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </GlowCard>
  );
}
