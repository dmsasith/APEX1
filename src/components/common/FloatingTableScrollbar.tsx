import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';

export const FloatingTableScrollbar: React.FC = () => {
  const [activeContainer, setActiveContainer] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [edges, setEdges] = useState<{ canLeft: boolean; canRight: boolean }>({
    canLeft: false,
    canRight: false,
  });
  const [isDragging, setIsDragging] = useState(false);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const percentRef = useRef<HTMLSpanElement | null>(null);

  const lastInteractedRef = useRef<HTMLElement | null>(null);
  const activeContainerRef = useRef<HTMLElement | null>(null);
  const rafPaintRef = useRef<number | null>(null);
  const holdPanRafRef = useRef<number | null>(null);

  const dragStateRef = useRef<{
    startX: number;
    startScrollLeft: number;
    maxScroll: number;
    thumbPx: number;
    usableTrackPx: number;
  } | null>(null);

  activeContainerRef.current = activeContainer;

  // Direct DOM paint via GPU translate3d — ZERO React re-renders during scroll/drag
  const paintScrollbarNow = useCallback((el?: HTMLElement | null) => {
    const target = el ?? activeContainerRef.current;
    const trackEl = trackRef.current;
    const thumbEl = thumbRef.current;
    const pctEl = percentRef.current;
    if (!target) return;

    const scrollWidth = target.scrollWidth;
    const clientWidth = target.clientWidth;
    const scrollLeft = target.scrollLeft;

    if (scrollWidth <= clientWidth + 6) {
      setIsVisible(false);
      return;
    }

    const maxScroll = Math.max(1, scrollWidth - clientWidth);
    const clampedLeft = Math.max(0, Math.min(maxScroll, scrollLeft));
    const ratio = clampedLeft / maxScroll;

    if (trackEl && thumbEl) {
      const trackWidth = trackEl.clientWidth;
      if (trackWidth > 0) {
        const thumbWidthPct = Math.max(0.18, Math.min(0.82, clientWidth / scrollWidth));
        const thumbPx = Math.max(36, Math.round(trackWidth * thumbWidthPct));
        const usableTrackPx = Math.max(1, trackWidth - thumbPx);
        const thumbX = Math.round(ratio * usableTrackPx);
        thumbEl.style.width = `${thumbPx}px`;
        thumbEl.style.transform = `translate3d(${thumbX}px, 0, 0)`;
      }
    }

    if (pctEl) {
      pctEl.textContent = `${Math.round(ratio * 100)}%`;
    }

    const nextCanLeft = clampedLeft > 2;
    const nextCanRight = clampedLeft < maxScroll - 2;
    setEdges((prev) =>
      prev.canLeft === nextCanLeft && prev.canRight === nextCanRight
        ? prev
        : { canLeft: nextCanLeft, canRight: nextCanRight }
    );
  }, []);

  const schedulePaint = useCallback(() => {
    if (rafPaintRef.current !== null) return;
    rafPaintRef.current = window.requestAnimationFrame(() => {
      rafPaintRef.current = null;
      paintScrollbarNow();
    });
  }, [paintScrollbarNow]);

  const findBestOverflowingTableContainer = useCallback((): HTMLElement | null => {
    if (typeof document === 'undefined') return null;
    const mainEl = document.querySelector('main');
    if (!mainEl) return null;

    const candidates = Array.from(mainEl.querySelectorAll<HTMLElement>('.overflow-x-auto')).filter(
      (el) => {
        if (el.scrollWidth <= el.clientWidth + 6) return false;
        if (!el.querySelector('table')) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width < 120 || rect.height < 48) return false;
        return rect.bottom > 96 && rect.top < window.innerHeight - 64;
      }
    );

    if (candidates.length === 0) return null;

    if (lastInteractedRef.current && candidates.includes(lastInteractedRef.current)) {
      return lastInteractedRef.current;
    }

    let best = candidates[0];
    let bestVisibleArea = 0;
    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      const visibleH = Math.max(
        0,
        Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)
      );
      const area = visibleH * rect.width;
      if (area > bestVisibleArea) {
        bestVisibleArea = area;
        best = el;
      }
    }
    return best;
  }, []);

  const syncTargetContainer = useCallback(() => {
    if (dragStateRef.current) return;
    const best = findBestOverflowingTableContainer();
    setActiveContainer((prev) => (prev === best ? prev : best));
    if (best) {
      setIsVisible(best.scrollWidth > best.clientWidth + 6);
      paintScrollbarNow(best);
    } else {
      setIsVisible(false);
    }
  }, [findBestOverflowingTableContainer, paintScrollbarNow]);

  // Lightweight observer for structural DOM changes, resize, and vertical page scroll
  useEffect(() => {
    let rafSyncId: number | null = null;
    let mutationTimer: number | null = null;

    const scheduleSync = () => {
      if (dragStateRef.current) return;
      if (rafSyncId !== null) return;
      rafSyncId = window.requestAnimationFrame(() => {
        rafSyncId = null;
        syncTargetContainer();
      });
    };

    const scheduleDebouncedSync = () => {
      if (dragStateRef.current) return;
      if (mutationTimer !== null) window.clearTimeout(mutationTimer);
      mutationTimer = window.setTimeout(() => {
        mutationTimer = null;
        scheduleSync();
      }, 90);
    };

    scheduleSync();

    const mainEl = document.querySelector('main');
    // Watch structural subtree changes ONLY (never attribute/hover churn!)
    const mutationObserver = mainEl
      ? new MutationObserver(scheduleDebouncedSync)
      : null;
    if (mainEl && mutationObserver) {
      mutationObserver.observe(mainEl, {
        childList: true,
        subtree: true,
      });
    }

    const resizeObserver = new ResizeObserver(scheduleSync);
    if (mainEl) {
      resizeObserver.observe(mainEl);
    }

    const handlePointerHint = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const container = target?.closest?.('.overflow-x-auto') as HTMLElement | null;
      if (!container) return;
      // Fast O(1) exit if already tracking this exact table container
      if (container === activeContainerRef.current) {
        lastInteractedRef.current = container;
        return;
      }
      if (container.scrollWidth > container.clientWidth + 6 && container.querySelector('table')) {
        lastInteractedRef.current = container;
        scheduleSync();
      }
    };

    window.addEventListener('resize', scheduleSync, { passive: true });
    window.addEventListener('scroll', scheduleSync, { passive: true });
    mainEl?.addEventListener('pointerdown', handlePointerHint, { passive: true });
    mainEl?.addEventListener('wheel', handlePointerHint, { passive: true });

    return () => {
      if (rafSyncId !== null) window.cancelAnimationFrame(rafSyncId);
      if (mutationTimer !== null) window.clearTimeout(mutationTimer);
      mutationObserver?.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleSync);
      window.removeEventListener('scroll', scheduleSync);
      mainEl?.removeEventListener('pointerdown', handlePointerHint);
      mainEl?.removeEventListener('wheel', handlePointerHint);
    };
  }, [syncTargetContainer]);

  // Attach fast passive scroll listener + resize observer to active container
  useEffect(() => {
    if (!activeContainer) return;

    const handleTableScroll = () => {
      // Skip redundant rAF scheduling if thumb drag is already driving scrollLeft + thumb position
      if (dragStateRef.current) return;
      schedulePaint();
    };

    const containerResizeObserver = new ResizeObserver(() => {
      if (activeContainer.scrollWidth <= activeContainer.clientWidth + 6) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
        schedulePaint();
      }
    });

    containerResizeObserver.observe(activeContainer);
    const tableChild = activeContainer.querySelector('table');
    if (tableChild) {
      containerResizeObserver.observe(tableChild);
    }

    activeContainer.addEventListener('scroll', handleTableScroll, { passive: true });
    paintScrollbarNow(activeContainer);

    return () => {
      activeContainer.removeEventListener('scroll', handleTableScroll);
      containerResizeObserver.disconnect();
      if (rafPaintRef.current !== null) {
        window.cancelAnimationFrame(rafPaintRef.current);
        rafPaintRef.current = null;
      }
    };
  }, [activeContainer, paintScrollbarNow, schedulePaint]);

  // Ensure initial thumb width/position paints as soon as the bar mounts into DOM
  useEffect(() => {
    if (isVisible && activeContainer) {
      paintScrollbarNow(activeContainer);
    }
  }, [isVisible, activeContainer, paintScrollbarNow]);

  // Cleanup any active hold-to-pan loop on unmount
  useEffect(() => {
    return () => {
      if (holdPanRafRef.current !== null) {
        window.cancelAnimationFrame(holdPanRafRef.current);
      }
    };
  }, []);

  // Zero-reflow, 1:1 GPU-composited pointer drag across the scrollbar track
  useEffect(() => {
    if (!isDragging) return;

    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const handlePointerMove = (e: PointerEvent) => {
      const targetEl = activeContainerRef.current;
      const drag = dragStateRef.current;
      const thumbEl = thumbRef.current;
      const pctEl = percentRef.current;
      if (!targetEl || !drag) return;

      const deltaX = e.clientX - drag.startX;
      const scrollDelta = (deltaX / drag.usableTrackPx) * drag.maxScroll;
      const nextScrollLeft = Math.max(0, Math.min(drag.maxScroll, drag.startScrollLeft + scrollDelta));

      targetEl.scrollLeft = nextScrollLeft;

      // Update thumb GPU transform + percentage directly with zero DOM layout reads
      const ratio = nextScrollLeft / drag.maxScroll;
      if (thumbEl) {
        const thumbX = Math.round(ratio * drag.usableTrackPx);
        thumbEl.style.transform = `translate3d(${thumbX}px, 0, 0)`;
      }
      if (pctEl) {
        pctEl.textContent = `${Math.round(ratio * 100)}%`;
      }

      const nextCanLeft = nextScrollLeft > 2;
      const nextCanRight = nextScrollLeft < drag.maxScroll - 2;
      setEdges((prev) =>
        prev.canLeft === nextCanLeft && prev.canRight === nextCanRight
          ? prev
          : { canLeft: nextCanLeft, canRight: nextCanRight }
      );
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
      setIsDragging(false);
      paintScrollbarNow();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      document.body.style.userSelect = prevUserSelect;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, paintScrollbarNow]);

  if (!activeContainer || !isVisible) {
    return null;
  }

  const stopHoldPan = () => {
    if (holdPanRafRef.current !== null) {
      window.cancelAnimationFrame(holdPanRafRef.current);
      holdPanRafRef.current = null;
    }
  };

  // Hold arrow button for silky 60fps fast glide, or quick tap for instant jump step
  const startHoldPan = (direction: -1 | 1) => {
    if (!activeContainer) return;
    stopHoldPan();
    activeContainer.style.scrollBehavior = 'auto';

    // Immediate snappy step on press
    const immediateStep = Math.max(180, Math.round(activeContainer.clientWidth * 0.35));
    activeContainer.scrollLeft += direction * immediateStep;
    paintScrollbarNow(activeContainer);

    let holdStartedAt = performance.now();
    let lastFrameAt = holdStartedAt;

    const tick = (now: number) => {
      const target = activeContainerRef.current;
      if (!target) {
        holdPanRafRef.current = null;
        return;
      }
      // Start continuous fast glide after 190ms press-and-hold
      if (now - holdStartedAt > 190) {
        const dt = Math.min(40, now - lastFrameAt) / 1000;
        const speedPxPerSec = Math.max(1200, target.clientWidth * 1.6);
        target.scrollLeft += direction * speedPxPerSec * dt;
        paintScrollbarNow(target);
      }
      lastFrameAt = now;
      holdPanRafRef.current = window.requestAnimationFrame(tick);
    };

    holdPanRafRef.current = window.requestAnimationFrame(tick);
  };

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeContainer || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
    const maxScroll = Math.max(1, activeContainer.scrollWidth - activeContainer.clientWidth);
    activeContainer.style.scrollBehavior = 'auto';
    activeContainer.scrollLeft = clickRatio * maxScroll;
    paintScrollbarNow(activeContainer);
  };

  const handleThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const targetEl = activeContainerRef.current;
    const trackEl = trackRef.current;
    if (!targetEl || !trackEl) return;

    targetEl.style.scrollBehavior = 'auto';
    const trackWidth = trackEl.clientWidth;
    const scrollWidth = targetEl.scrollWidth;
    const clientWidth = targetEl.clientWidth;
    const maxScroll = Math.max(1, scrollWidth - clientWidth);
    const thumbWidthPct = Math.max(0.18, Math.min(0.82, clientWidth / scrollWidth));
    const thumbPx = Math.max(36, Math.round(trackWidth * thumbWidthPct));
    const usableTrackPx = Math.max(1, trackWidth - thumbPx);

    dragStateRef.current = {
      startX: e.clientX,
      startScrollLeft: targetEl.scrollLeft,
      maxScroll,
      thumbPx,
      usableTrackPx,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unavailable
    }
    setIsDragging(true);
  };

  const handleBarWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const target = activeContainerRef.current;
    if (!target) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (delta !== 0) {
      target.style.scrollBehavior = 'auto';
      target.scrollLeft += delta * 1.65;
      paintScrollbarNow(target);
    }
  };

  return (
    <div
      onWheel={handleBarWheel}
      className="fixed bottom-[136px] sm:bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 sm:left-4 sm:translate-x-0 lg:left-1/2 lg:-translate-x-1/2 z-40 no-print w-[calc(100vw-24px)] sm:w-[calc(100vw-230px)] lg:w-[440px] xl:w-[520px] pointer-events-auto select-none"
      role="region"
      aria-label="Floating Horizontal Table Scrollbar"
    >
      <div className="px-2.5 py-2 rounded-2xl bg-slate-900/96 border border-slate-700/90 shadow-[0_14px_34px_-8px_rgba(2,6,23,0.72),inset_0_1px_0_rgba(255,255,255,0.12)] flex items-center gap-2">
        {/* Left Scroll Step / Hold-to-Glide Button */}
        <button
          type="button"
          onPointerDown={() => startHoldPan(-1)}
          onPointerUp={stopHoldPan}
          onPointerLeave={stopHoldPan}
          onPointerCancel={stopHoldPan}
          disabled={!edges.canLeft}
          className={`w-7 h-7 rounded-xl flex items-center justify-center border shrink-0 ${
            edges.canLeft
              ? 'bg-white/12 hover:bg-emerald-500/25 text-white border-white/15 hover:border-emerald-400/50 cursor-pointer active:scale-95'
              : 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
          }`}
          title="Click or hold to scroll table left"
          aria-label="Scroll Table Left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Label Icon */}
        <div className="hidden sm:flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-300 shrink-0 pl-0.5">
          <MoveHorizontal className="w-3.5 h-3.5 text-emerald-400" />
        </div>

        {/* Wide Grab-Friendly Floating Scroll Track & GPU-Composited Thumb */}
        <div
          ref={trackRef}
          onPointerDown={handleTrackPointerDown}
          className="relative flex-1 h-4 rounded-full bg-slate-800 border border-white/15 shadow-inner cursor-pointer overflow-hidden touch-none"
          title="Drag bar or click track to pan table horizontally"
        >
          <div
            ref={thumbRef}
            onPointerDown={handleThumbPointerDown}
            style={{ width: '36px', transform: 'translate3d(0px, 0, 0)', willChange: 'transform' }}
            className={`absolute left-0 top-0.5 bottom-0.5 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 flex items-center justify-center gap-0.5 touch-none ${
              isDragging
                ? 'cursor-grabbing brightness-110 ring-2 ring-white/60'
                : 'cursor-grab hover:brightness-110'
            }`}
          >
            <span className="w-0.5 h-2 rounded-full bg-slate-950/45" />
            <span className="w-0.5 h-2 rounded-full bg-slate-950/45" />
            <span className="w-0.5 h-2 rounded-full bg-slate-950/45" />
          </div>
        </div>

        {/* Live Scroll Percentage (Updated directly via ref without React re-render) */}
        <span
          ref={percentRef}
          className="text-[10px] font-mono font-extrabold text-emerald-300 tabular-nums w-8 text-right shrink-0"
        >
          0%
        </span>

        {/* Right Scroll Step / Hold-to-Glide Button */}
        <button
          type="button"
          onPointerDown={() => startHoldPan(1)}
          onPointerUp={stopHoldPan}
          onPointerLeave={stopHoldPan}
          onPointerCancel={stopHoldPan}
          disabled={!edges.canRight}
          className={`w-7 h-7 rounded-xl flex items-center justify-center border shrink-0 ${
            edges.canRight
              ? 'bg-white/12 hover:bg-emerald-500/25 text-white border-white/15 hover:border-emerald-400/50 cursor-pointer active:scale-95'
              : 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
          }`}
          title="Click or hold to scroll table right"
          aria-label="Scroll Table Right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
