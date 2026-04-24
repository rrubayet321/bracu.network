'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Member } from '@/types/member';
import { GlowCard } from '@/components/ui/spotlight-card';

interface Node {
  id: string;
  slug: string;
  name: string;
  profilePic?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  img?: HTMLImageElement;
}

interface Edge {
  source: string;
  target: string;
}

interface NetworkGraphProps {
  members: Member[];
  highlightSlug?: string | null;
}

const REPULSION = 800;
const ATTRACTION = 0.04;
const DAMPING = 0.88;
const CENTER_GRAVITY = 0.025;
const NODE_RADIUS = 22;
const SETTLE_THRESHOLD = 0.15;

export default function NetworkGraph({ members, highlightSlug }: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const rafRef = useRef<number>(0);
  const settledRef = useRef(false);
  const highlightRef = useRef<string | null>(null);

  const tick = useCallback(function tickFn() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const W = canvas.width;
    const H = canvas.height;

    // ── Physics ───────────────────────────────────────────────
    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = REPULSION / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        nodes[i].vx -= fx;
        nodes[i].vy -= fy;
        nodes[j].vx += fx;
        nodes[j].vy += fy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const a = nodes.find((n) => n.slug === edge.source);
      const b = nodes.find((n) => n.slug === edge.target);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      a.vx += dx * ATTRACTION;
      a.vy += dy * ATTRACTION;
      b.vx -= dx * ATTRACTION;
      b.vy -= dy * ATTRACTION;
    }

    // Center gravity
    for (const n of nodes) {
      n.vx += (W / 2 - n.x) * CENTER_GRAVITY;
      n.vy += (H / 2 - n.y) * CENTER_GRAVITY;
    }

    // Apply velocity + damping + boundary
    let maxV = 0;
    for (const n of nodes) {
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      n.x += n.vx;
      n.y += n.vy;
      n.x = Math.max(NODE_RADIUS, Math.min(W - NODE_RADIUS, n.x));
      n.y = Math.max(NODE_RADIUS, Math.min(H - NODE_RADIUS, n.y));
      maxV = Math.max(maxV, Math.abs(n.vx), Math.abs(n.vy));
    }

    // ── Draw ──────────────────────────────────────────────────
    ctx.clearRect(0, 0, W, H);

    const hl = highlightRef.current;
    const hlNode = hl ? nodes.find((n) => n.slug === hl) : null;
    const hlConnected = new Set<string>();
    if (hlNode) {
      for (const e of edges) {
        if (e.source === hl) hlConnected.add(e.target);
        if (e.target === hl) hlConnected.add(e.source);
      }
    }

    // Draw edges
    for (const edge of edges) {
      const a = nodes.find((n) => n.slug === edge.source);
      const b = nodes.find((n) => n.slug === edge.target);
      if (!a || !b) continue;

      const isHighlighted =
        hl && (edge.source === hl || edge.target === hl);

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = isHighlighted ? 'rgba(74,108,247,0.7)' : 'rgba(60,60,60,0.8)';
      ctx.lineWidth = isHighlighted ? 1.5 : 1;
      ctx.stroke();
    }

    // Draw nodes
    for (const node of nodes) {
      const isHighlighted = hl === node.slug;
      const isConnected = hlConnected.has(node.slug);
      const isDimmed = hl && !isHighlighted && !isConnected;

      ctx.save();
      ctx.globalAlpha = isDimmed ? 0.25 : 1;

      // Shadow / glow for highlighted
      if (isHighlighted) {
        ctx.shadowColor = 'rgba(74,108,247,0.6)';
        ctx.shadowBlur = 16;
      }

      // Clip circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
      ctx.clip();

      if (node.img && node.img.complete && node.img.naturalWidth > 0) {
        ctx.drawImage(node.img, node.x - NODE_RADIUS, node.y - NODE_RADIUS, NODE_RADIUS * 2, NODE_RADIUS * 2);
      } else {
        // Fallback: initials circle
        ctx.fillStyle = '#253494';
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = `bold ${NODE_RADIUS * 0.65}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          node.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
          node.x,
          node.y
        );
      }

      // Border ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = isHighlighted
        ? 'rgba(74,108,247,0.9)'
        : isConnected
        ? 'rgba(74,108,247,0.5)'
        : 'rgba(60,60,60,0.8)';
      ctx.lineWidth = isHighlighted ? 2 : 1;
      ctx.stroke();

      ctx.restore();
    }

    // Check if simulation has settled
    if (maxV < SETTLE_THRESHOLD && !hl) {
      settledRef.current = true;
      rafRef.current = 0;
      return;
    }

    rafRef.current = requestAnimationFrame(tickFn);
  }, []);

  // Keep highlight ref in sync with prop without re-running the whole effect
  useEffect(() => {
    highlightRef.current = highlightSlug ?? null;
    settledRef.current = false; // resume animation on hover
    if (!rafRef.current) tick();
   
  }, [highlightSlug, tick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || members.length === 0) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      settledRef.current = false;
    };
    resizeCanvas();

    const W = canvas.width;
    const H = canvas.height;

    // Build nodes with random starting positions
    nodesRef.current = members.map((m) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      profilePic: m.profile_pic,
      x: W * 0.2 + Math.random() * W * 0.6,
      y: H * 0.2 + Math.random() * H * 0.6,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
    }));

    // Build edges from connections field
    const edgeSet = new Set<string>();
    edgesRef.current = [];
    for (const m of members) {
      for (const conn of m.connections) {
        const key = [m.slug, conn].sort().join('|');
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edgesRef.current.push({ source: m.slug, target: conn });
        }
      }
    }

    // Preload images — start animation after all loaded (or after 2s timeout)
    const imagePromises = nodesRef.current.map(
      (node) =>
        new Promise<void>((resolve) => {
          if (!node.profilePic) { resolve(); return; }
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => { node.img = img; resolve(); };
          img.onerror = () => resolve();
          img.src = node.profilePic;
          setTimeout(resolve, 2000); // never block for more than 2s
        })
    );

    Promise.all(imagePromises).then(() => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    });

    // ResizeObserver
    const ro = new ResizeObserver(() => {
      resizeCanvas();
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    });
    ro.observe(canvas.parentElement!);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [members, tick]);

  return (
    <GlowCard customSize={true} className="graph-container" glowColor="red">
      <canvas ref={canvasRef} className="graph-canvas" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </GlowCard>
  );
}
