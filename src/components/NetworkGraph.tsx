'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Member } from '@/types/member';

interface Node {
  id: number;
  slug: string;
  name: string;
  website: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number[];
  img?: HTMLImageElement;
  imgLoaded: boolean;
}

interface NetworkGraphProps {
  members: Member[];
  highlightSlug?: string | null;
  onHoverSlug?: (slug: string | null) => void;
}

const NODE_RADIUS = 18;
const NODE_RADIUS_HOVER = 22;
const REPULSION = 3200;
const SPRING_LENGTH = 120;
const SPRING_K = 0.04;
const DAMPING = 0.82;
const CENTER_GRAVITY = 0.018;
const ACCENT = '#5e6ad2';
const EDGE_COLOR = 'rgba(255,255,255,0.07)';
const EDGE_HOVER = 'rgba(94,106,210,0.45)';
const RING_COLOR = 'rgba(255,255,255,0.10)';
const RING_HOVER = ACCENT;
const ENERGY_THRESHOLD = 0.12;
const MAX_SETTLE_FRAMES = 400;

function seedRand(seed: number): number {
  const x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function drawInitialsFallback(
  ctx: CanvasRenderingContext2D,
  node: Node,
  x: number,
  y: number,
  r: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1d2e';
  ctx.fill();
  ctx.font = `600 ${Math.round(r * 0.55)}px -apple-system, BlinkMacSystemFont, "Inter", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText(getInitials(node.name), x, y);
  ctx.restore();
}

export default function NetworkGraph({ members, highlightSlug, onHoverSlug }: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const hoveredIdRef = useRef<number | null>(null);
  const highlightIdRef = useRef<number | null>(null);
  const settleFrameRef = useRef(0);
  const isSettledRef = useRef(false);
  const dragRef = useRef<{ active: boolean; id: number | null; ox: number; oy: number }>({
    active: false, id: null, ox: 0, oy: 0,
  });

  const memberIndexBySlug = useMemo(
    () => new Map(members.map((m, i) => [m.slug, i])),
    [members],
  );

  // Sync highlighted node from external prop
  useEffect(() => {
    const prev = highlightIdRef.current;
    highlightIdRef.current =
      highlightSlug && memberIndexBySlug.has(highlightSlug)
        ? (memberIndexBySlug.get(highlightSlug) ?? null)
        : null;
    if (prev !== highlightIdRef.current) {
      isSettledRef.current = false;
      settleFrameRef.current = 0;
    }
  }, [highlightSlug, memberIndexBySlug]);

  // Build nodes when members change
  useEffect(() => {
    const { w, h } = sizeRef.current;
    const cx = w / 2 || 300;
    const cy = h / 2 || 250;
    const spread = Math.min(cx, cy) * 0.55;
    const n = members.length;

    nodesRef.current = members.map((m, i) => {
      // Place nodes in a loose circle to start physics
      const angle = (2 * Math.PI * i) / Math.max(n, 1);
      const r = spread * (0.5 + 0.5 * seedRand(i * 7));

      const fromData = (m.connections ?? [])
        .map((slug) => memberIndexBySlug.get(slug))
        .filter((idx): idx is number => idx !== undefined && idx !== i);

      // Fallback: sparse deterministic graph if no real connections
      const connSet = new Set(fromData.slice(0, 4));
      if (connSet.size === 0 && n > 1) {
        const numConn = 1 + Math.floor(seedRand(i * 3) * 2);
        for (let j = 0; j < numConn; j++) {
          const target = Math.floor(seedRand(i * 31 + j * 17) * n);
          if (target !== i) connSet.add(target);
        }
      }

      let img: HTMLImageElement | undefined;
      if (m.profile_pic) {
        img = imageCacheRef.current.get(m.profile_pic);
        if (!img) {
          img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            isSettledRef.current = false;
            settleFrameRef.current = 0;
          };
          img.src = m.profile_pic;
          imageCacheRef.current.set(m.profile_pic, img);
        }
      }

      return {
        id: i,
        slug: m.slug,
        name: m.name,
        website: m.website,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: 0,
        vy: 0,
        connections: [...connSet],
        img,
        imgLoaded: img ? img.complete && img.naturalWidth > 0 : false,
      };
    });

    hoveredIdRef.current = null;
    isSettledRef.current = false;
    settleFrameRef.current = 0;
  }, [members, memberIndexBySlug]);

  const stepPhysics = useCallback(() => {
    const nodes = nodesRef.current;
    const { w, h } = sizeRef.current;
    if (!nodes.length || !w || !h) return 0;
    const cx = w / 2;
    const cy = h / 2;
    let totalEnergy = 0;

    // Repulsion between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = REPULSION / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    // Spring attraction along edges
    for (const node of nodes) {
      for (const connId of node.connections) {
        if (connId >= nodes.length) continue;
        const other = nodes[connId];
        const dx = other.x - node.x;
        const dy = other.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const displacement = dist - SPRING_LENGTH;
        const fx = (dx / dist) * displacement * SPRING_K;
        const fy = (dy / dist) * displacement * SPRING_K;
        node.vx += fx;
        node.vy += fy;
        other.vx -= fx;
        other.vy -= fy;
      }
    }

    // Center gravity + integrate
    for (const node of nodes) {
      if (dragRef.current.active && dragRef.current.id === node.id) continue;

      node.vx += (cx - node.x) * CENTER_GRAVITY;
      node.vy += (cy - node.y) * CENTER_GRAVITY;
      node.vx *= DAMPING;
      node.vy *= DAMPING;
      node.x += node.vx;
      node.y += node.vy;

      // Keep within bounds with padding
      const pad = NODE_RADIUS_HOVER + 4;
      node.x = Math.max(pad, Math.min(w - pad, node.x));
      node.y = Math.max(pad, Math.min(h - pad, node.y));

      totalEnergy += node.vx * node.vx + node.vy * node.vy;
    }

    return totalEnergy;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h } = sizeRef.current;
    if (!w || !h) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    // Run physics unless settled
    let energy = 0;
    if (!isSettledRef.current) {
      energy = stepPhysics();
      settleFrameRef.current++;
      if (energy < ENERGY_THRESHOLD || settleFrameRef.current > MAX_SETTLE_FRAMES) {
        isSettledRef.current = true;
      }
    }

    // Update imgLoaded flags
    for (const node of nodesRef.current) {
      if (node.img && !node.imgLoaded) {
        node.imgLoaded = node.img.complete && node.img.naturalWidth > 0;
        if (node.imgLoaded) isSettledRef.current = false; // repaint once
      }
    }

    ctx.clearRect(0, 0, w, h);

    const nodes = nodesRef.current;
    const hoveredId = hoveredIdRef.current;
    const highlightedId = highlightIdRef.current;
    const activeId = hoveredId ?? highlightedId;
    const activeNode = activeId !== null ? nodes[activeId] : null;

    // Draw edges
    for (const node of nodes) {
      for (const connId of node.connections) {
        if (connId >= nodes.length || connId <= node.id) continue;
        const other = nodes[connId];
        const isActive =
          activeNode &&
          (node.id === activeNode.id || other.id === activeNode.id);

        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(other.x, other.y);
        ctx.strokeStyle = isActive ? EDGE_HOVER : EDGE_COLOR;
        ctx.lineWidth = isActive ? 1.2 : 0.8;
        ctx.globalAlpha = isActive ? 0.9 : 0.6;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // Draw nodes (back to front: non-hovered first)
    const sorted = [...nodes].sort((a, b) => {
      const aActive = a.id === activeId;
      const bActive = b.id === activeId;
      return Number(aActive) - Number(bActive);
    });

    for (const node of sorted) {
      const isHovered = node.id === hoveredId;
      const isHighlighted = node.id === highlightedId;
      const isActive = isHovered || isHighlighted;
      const isConnected =
        activeNode !== null && activeNode.connections.includes(node.id);
      const r = isActive ? NODE_RADIUS_HOVER : NODE_RADIUS;

      // Clip and draw photo or initials
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.clip();

      if (node.imgLoaded && node.img) {
        ctx.drawImage(node.img, node.x - r, node.y - r, r * 2, r * 2);
      } else {
        drawInitialsFallback(ctx, node, node.x, node.y, r);
      }
      ctx.restore();

      // Ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = isActive ? RING_HOVER : isConnected ? 'rgba(94,106,210,0.35)' : RING_COLOR;
      ctx.lineWidth = isActive ? 2 : 1;
      if (isActive) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = ACCENT;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Name label on hover
      if (isActive) {
        const label = node.name;
        const labelY = node.y + r + 14;
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Background pill
        const tw = ctx.measureText(label).width;
        const px = 8;
        const ph = 16;
        ctx.fillStyle = 'rgba(15,16,17,0.85)';
        ctx.beginPath();
        ctx.roundRect(node.x - tw / 2 - px, labelY - ph / 2, tw + px * 2, ph, 6);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText(label, node.x, labelY);
      }
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [stepPhysics]);

  // Canvas setup, events, resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = container.clientWidth;
      const h = container.clientHeight;
      sizeRef.current = { w, h };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      isSettledRef.current = false;
      settleFrameRef.current = 0;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const getCanvasPos = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const hitTest = (cx: number, cy: number): number | null => {
      let best: number | null = null;
      let bestDist = Infinity;
      for (const node of nodesRef.current) {
        const d = Math.hypot(cx - node.x, cy - node.y);
        if (d < NODE_RADIUS_HOVER + 8 && d < bestDist) {
          bestDist = d;
          best = node.id;
        }
      }
      return best;
    };

    const onPointerMove = (e: PointerEvent) => {
      const { x, y } = getCanvasPos(e.clientX, e.clientY);

      if (dragRef.current.active && dragRef.current.id !== null) {
        const node = nodesRef.current[dragRef.current.id];
        if (node) {
          node.x = x - dragRef.current.ox;
          node.y = y - dragRef.current.oy;
          node.vx = 0;
          node.vy = 0;
          isSettledRef.current = false;
          settleFrameRef.current = 0;
        }
        return;
      }

      const hit = hitTest(x, y);
      const prev = hoveredIdRef.current;
      hoveredIdRef.current = hit;
      canvas.style.cursor = hit !== null ? 'pointer' : 'default';

      if (prev !== hit) {
        isSettledRef.current = false;
        settleFrameRef.current = 0;
        onHoverSlug?.(hit !== null ? nodesRef.current[hit]?.slug ?? null : null);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const { x, y } = getCanvasPos(e.clientX, e.clientY);
      const hit = hitTest(x, y);
      if (hit !== null) {
        const node = nodesRef.current[hit];
        dragRef.current = { active: true, id: hit, ox: x - node.x, oy: y - node.y };
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = 'grabbing';
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (dragRef.current.active) {
        const { x, y } = getCanvasPos(e.clientX, e.clientY);
        const hit = hitTest(x, y);
        // Short-drag = click → open website
        if (hit !== null && hit === dragRef.current.id) {
          const node = nodesRef.current[hit];
          if (node?.website) window.open(node.website, '_blank', 'noopener');
        }
      }
      dragRef.current = { active: false, id: null, ox: 0, oy: 0 };
      canvas.style.cursor = 'default';
    };

    const onPointerLeave = () => {
      if (!dragRef.current.active) {
        hoveredIdRef.current = null;
        onHoverSlug?.(null);
        canvas.style.cursor = 'default';
        isSettledRef.current = false;
        settleFrameRef.current = 0;
      }
    };

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      ro.disconnect();
    };
  }, [draw, onHoverSlug]);

  return (
    <div ref={containerRef} className="graph-container">
      <canvas ref={canvasRef} className="graph-canvas" />
      {members.length === 0 && (
        <p className="graph-empty">no members yet</p>
      )}
    </div>
  );
}
