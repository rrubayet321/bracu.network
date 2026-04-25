'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Member } from '@/types/member';
import { GlowCard } from '@/components/ui/spotlight-card';

interface Node {
  id: number;
  slug: string;
  name: string;
  x: number;
  y: number;
  z: number;
  connections: number[];
  color: string;
  profilePic?: string;
  img?: HTMLImageElement;
}

interface NetworkGraphProps {
  members: Member[];
  highlightSlug?: string | null;
}

const DOT_COLOR = 'rgba(255, 255, 255, 0.92)';
const HOVER_COLOR = 'rgba(255, 255, 255, 1)';
const CONNECTION_COLOR = 'rgba(255, 255, 255, 0.13)';
const AUTO_ROTATE_SPEED = 0.0022;
const FOV = 600;
const BASE_RADIUS = 10;

function rotateY(x: number, y: number, z: number, angle: number): [number, number, number] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x * cos + z * sin, y, -x * sin + z * cos];
}

function rotateX(x: number, y: number, z: number, angle: number): [number, number, number] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x, y * cos - z * sin, y * sin + z * cos];
}

function project(x: number, y: number, z: number, cx: number, cy: number, fov: number): [number, number] {
  const scale = fov / (fov + z);
  return [x * scale + cx, y * scale + cy];
}

function makeSeedRand(seed: number) {
  const s = Math.sin(seed * 999.123) * 10000;
  return s - Math.floor(s);
}

export default function NetworkGraph({ members, highlightSlug }: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const transformedRef = useRef<Array<{ node: Node; sx: number; sy: number; z: number; visible: boolean }>>([]);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const rafRef = useRef<number>(0);
  const rotRef = useRef({ y: 0.4, x: 0.3 });
  const dragRef = useRef({ active: false, x: 0, y: 0, rotY: 0, rotX: 0 });
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const hoveredIdRef = useRef<number | null>(null);
  const highlightIdRef = useRef<number | null>(null);
  const memberIndexBySlug = useMemo(
    () => new Map(members.map((m, i) => [m.slug, i])),
    [members]
  );

  useEffect(() => {
    highlightIdRef.current =
      highlightSlug && memberIndexBySlug.has(highlightSlug)
        ? memberIndexBySlug.get(highlightSlug) ?? null
        : null;
  }, [highlightSlug, memberIndexBySlug]);

  useEffect(() => {
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    nodesRef.current = members.map((m, i) => {
      const theta = (2 * Math.PI * i) / goldenRatio;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / Math.max(members.length, 1));
      const x = Math.cos(theta) * Math.sin(phi);
      const y = Math.cos(phi);
      const z = Math.sin(theta) * Math.sin(phi);

      const deterministicConnections = new Set<number>();
      const fromData = (m.connections ?? [])
        .map((slug) => memberIndexBySlug.get(slug))
        .filter((idx): idx is number => typeof idx === 'number');
      for (const idx of fromData.slice(0, 4)) {
        if (idx !== i) deterministicConnections.add(idx);
      }
      if (deterministicConnections.size === 0) {
        const n = members.length;
        const numConnections = 1 + Math.floor(makeSeedRand(i) * 2);
        for (let j = 0; j < numConnections; j++) {
          const connId = Math.floor(makeSeedRand(i * 31 + j * 17) * Math.max(n, 1));
          if (connId !== i) deterministicConnections.add(connId);
        }
      }

      let img: HTMLImageElement | undefined;
      if (m.profile_pic) {
        img = imageCacheRef.current.get(m.profile_pic);
        if (!img) {
          img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = m.profile_pic;
          imageCacheRef.current.set(m.profile_pic, img);
        }
      }

      return {
        id: i,
        slug: m.slug,
        name: m.name,
        x,
        y,
        z,
        connections: [...deterministicConnections],
        color: `hsl(${(i * 137.508) % 360} 80% 70%)`,
        profilePic: m.profile_pic,
        img,
      };
    });
    hoveredIdRef.current = null;
  }, [members, memberIndexBySlug]);

  const hitTest = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let closestId: number | null = null;
    let closestDist = Infinity;
    for (const item of transformedRef.current) {
      if (!item.visible) continue;
      const dist = Math.hypot(x - item.sx, y - item.sy);
      if (dist < 30 && dist < closestDist) {
        closestDist = dist;
        closestId = item.node.id;
      }
    }
    hoveredIdRef.current = closestId;
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

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.38;

    if (!dragRef.current.active) rotRef.current.y += AUTO_ROTATE_SPEED;

    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.2);
    g.addColorStop(0, '#0a0a0a');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const transformed = nodesRef.current.map((node) => {
      let x = node.x * radius;
      let y = node.y * radius;
      let z = node.z * radius;
      [x, y, z] = rotateX(x, y, z, rotRef.current.x);
      [x, y, z] = rotateY(x, y, z, rotRef.current.y);
      const visible = z <= 0;
      const [sx, sy] = project(x, y, z, cx, cy, FOV);
      return { node, sx, sy, z, visible };
    });
    transformedRef.current = transformed;
    const byId = new Map(transformed.map((t) => [t.node.id, t] as const));

    const hoveredId = hoveredIdRef.current;
    const highlightedId = highlightIdRef.current;
    const hoveredNode = hoveredId !== null ? nodesRef.current[hoveredId] : null;
    const highlightedNode = highlightedId !== null ? nodesRef.current[highlightedId] : null;

    for (const item of transformed) {
      if (!item.visible) continue;
      for (const connId of item.node.connections) {
        if (connId <= item.node.id) continue;
        const other = byId.get(connId);
        if (!other || !other.visible) continue;
        const isHoveredEdge = hoveredNode && (item.node.id === hoveredNode.id || other.node.id === hoveredNode.id);
        const isHighlightedEdge = highlightedNode && (item.node.id === highlightedNode.id || other.node.id === highlightedNode.id);
        ctx.beginPath();
        ctx.moveTo(item.sx, item.sy);
        ctx.lineTo(other.sx, other.sy);
        ctx.strokeStyle = isHoveredEdge || isHighlightedEdge ? 'rgba(120,150,255,0.35)' : CONNECTION_COLOR;
        ctx.globalAlpha = isHoveredEdge || isHighlightedEdge ? 0.85 : 0.6;
        ctx.lineWidth = isHoveredEdge || isHighlightedEdge ? 1 : 0.6;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    for (const item of transformed) {
      if (!item.visible) continue;
      const isHovered = item.node.id === hoveredId || item.node.id === highlightedId;
      const isConnected = Boolean(
        (hoveredNode && hoveredNode.connections.includes(item.node.id)) ||
        (highlightedNode && highlightedNode.connections.includes(item.node.id))
      );
      const depthAlpha = Math.max(0.35, 1 - (item.z + radius) / (2 * radius));
      const nodeRadius = isHovered ? 16 : isConnected ? 13 : BASE_RADIUS;

      ctx.beginPath();
      ctx.arc(item.sx, item.sy, nodeRadius + (isHovered ? 3 : 1), 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.015)';
      ctx.fill();

      if (item.node.img && item.node.img.complete && item.node.img.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(item.sx, item.sy, nodeRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(item.node.img, item.sx - nodeRadius, item.sy - nodeRadius, nodeRadius * 2, nodeRadius * 2);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(item.sx, item.sy, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = isHovered || isConnected ? HOVER_COLOR : DOT_COLOR;
        ctx.globalAlpha = depthAlpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.arc(item.sx, item.sy, nodeRadius, 0, Math.PI * 2);
      ctx.strokeStyle = item.node.color;
      ctx.shadowBlur = isHovered ? 14 : 6;
      ctx.shadowColor = item.node.color;
      ctx.globalAlpha = isHovered ? 0.95 : 0.42;
      ctx.lineWidth = isHovered ? 1.8 : 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (isHovered) {
        ctx.font = '12px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fillText(item.node.name, item.sx, item.sy - 18);
        ctx.font = '10px system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.68)';
        ctx.fillText(`${item.node.connections.length} connections`, item.sx, item.sy - 6);
      }
    }

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = parentRef.current;
    if (!canvas || !parent) return;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      sizeRef.current = { w, h, dpr };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas();

    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(parent);
    window.addEventListener('resize', resizeCanvas);

    canvas.style.cursor = 'grab';
    const onPointerDown = (e: PointerEvent) => {
      dragRef.current = { active: true, x: e.clientX, y: e.clientY, rotY: rotRef.current.y, rotX: rotRef.current.x };
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (dragRef.current.active) {
        const dx = e.clientX - dragRef.current.x;
        const dy = e.clientY - dragRef.current.y;
        rotRef.current.y = dragRef.current.rotY + dx * 0.0065;
        rotRef.current.x = Math.max(-1.05, Math.min(1.05, dragRef.current.rotX + dy * 0.0065));
      } else {
        hitTest(e.clientX, e.clientY);
      }
    };

    const onPointerUp = () => {
      dragRef.current.active = false;
      canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
      ro.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [draw, hitTest]);

  return (
    <GlowCard customSize={true} className="graph-container" glowColor="red">
      <div ref={parentRef} style={{ position: 'absolute', inset: 0 }}>
        <canvas ref={canvasRef} className="graph-canvas" />
      </div>
    </GlowCard>
  );
}
