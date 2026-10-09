import { useCallback, useRef, useState } from 'react';

interface DragVisual {
    id: string;
    label: string;
    x: number;
    y: number;
    moved: boolean;
}

interface TileDragHandlers {
    onDrop: (id: string, zone: string | null) => void;
    onTap?: (id: string) => void;
}

/**
 * Drag & Drop con Pointer Events: funciona con ratón y con dedo.
 * Si el usuario solo toca (sin arrastrar), se emite onTap.
 * Las zonas de destino se marcan con data-drop="nombre-zona".
 */
export function useTileDrag({ onDrop, onTap }: TileDragHandlers) {
    const [drag, setDrag] = useState<DragVisual | null>(null);
    const [overZone, setOverZone] = useState<string | null>(null);
    const state = useRef<{ id: string; label: string; startX: number; startY: number; moved: boolean } | null>(null);

    const tileProps = useCallback(
        (id: string, label: string) => ({
            onPointerDown: (e: React.PointerEvent) => {
                (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
                state.current = { id, label, startX: e.clientX, startY: e.clientY, moved: false };
                setDrag({ id, label, x: e.clientX, y: e.clientY, moved: false });
            },
            onPointerMove: (e: React.PointerEvent) => {
                const s = state.current;
                if (!s) return;
                const moved = s.moved || Math.hypot(e.clientX - s.startX, e.clientY - s.startY) > 6;
                setDrag({ id: s.id, label: s.label, x: e.clientX, y: e.clientY, moved });
                if (moved) {
                    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-drop]');
                    setOverZone(target?.getAttribute('data-drop') ?? null);
                }
            },
            onPointerUp: (e: React.PointerEvent) => {
                const s = state.current;
                state.current = null;
                setDrag(null);
                if (!s) return;
                if (!s.moved) {
                    onTap?.(s.id);
                    setOverZone(null);
                    return;
                }
                const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-drop]');
                const zone = target?.getAttribute('data-drop') ?? null;
                setOverZone(null);
                onDrop(s.id, zone);
            },
            onPointerCancel: () => {
                state.current = null;
                setDrag(null);
                setOverZone(null);
            },
        }),
        [onDrop, onTap],
    );

    const draggingId = drag?.moved ? drag.id : null;

    const Ghost = drag?.moved ? (
        <div
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-4 border-amber-300 bg-amber-200 px-5 py-3 text-2xl font-black text-amber-900 shadow-xl"
            style={{ left: drag.x, top: drag.y }}
        >
            {drag.label}
        </div>
    ) : null;

    return { tileProps, draggingId, overZone, Ghost };
}
