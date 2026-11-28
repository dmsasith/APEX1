import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';

interface CachedMetrics {
  scrollWidth: number;
  clientWidth: number;
  maxScroll: number;
  trackWidth: number;
  thumbPx: number;
  usableTrackPx: number;
}

export const FloatingTableScrollbar: React.FC = () => {
  const [activeContainer, setActiveContainer] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const barRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const percentRef = useRef<HTMLSpanElement | null>(null);
  const leftBtnRef = useRef<HTMLButtonElement | null>(null);
  const rightBtnRef = useRef<HTMLButtonElement | null>(null);

  const lastInteractedRef = useRef<HTMLElement | null>(null);
  const activeContainerRef = useRef<HTMLElement | null>(null);
  const rafPaintRef = useRef<number | null>(null);
  const holdPanRafRef = useRef<number | null>(null);
  const wheelRafRef = useRef<number | null>(null);
  const pendingWheelDeltaRef = useRef<number>(0);

  const metricsRef = useRef<CachedMetrics>({
    scrollWidth: 0,
    clientWidth: 0,
    maxScroll: 1,
    trackWidth: 0,
    thumbPx: 44,
    usableTrackPx: 1,
  });

  const lastPctRef = useRef<string>('');
  const lastEdgesRef = useRef<{ canLeft: boolean; canRight: boolean }>({
    canLeft: false,
    canRight: false,
  });

  const dragStateRef = useRef<{
    startX: number;
    latestX: number;
    startScrollLeft: number;
    maxScroll: number;
    usableTrackPx: number;
    rafId: number | null;
  } | null>(null);

  activeContainerRef.current = activeContainer;

  const updateEdgeButtonsDom = useCallback((canLeft: boolean, canRight: boolean) => {
    const prev = lastEdgesRef.current;
    if (prev.canLeft === canLeft && prev.canRight === canRight) return;
    lastEdgesRef.current = { canLeft, canRight };

    const leftBtn = leftBtnRef.current;
    if (leftBtn) {
      leftBtn.disabled = !canLeft;
      leftBtn.className = `w-7 h-7 rounded-xl flex items-center justify-center border shrink-0 ${
        canLeft
          ? 'bg-white/12 hover:bg-emerald-500/25 text-white border-white/15 hover:border-emerald-400/50 cursor-pointer active:scale-95'
          : 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
      }`;
    }

    const rightBtn = rightBtnRef.current;
    if (rightBtn) {
      rightBtn.disabled = !canRight;
      rightBtn.className = `w-7 h-7 rounded-xl flex items-center justify-center border shrink-0 ${
        canRight
          ? 'bg-white/12 hover:bg-emerald-500/25 text-white border-white/15 hover:border-emerald-400/50 cursor-pointer active:scale-95'
          : 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
      }`;
    }
  }, []);

  // Measure layout dimensions ONLY when container changes or resizes (never per scroll frame)
  const refreshMetrics = useCallback((el?: HTMLElement | null): CachedMetrics | null => {
    const target = el ?? activeContainerRef.current;
    const trackEl = trackRef.current;
    const thumbEl = thumbRef.current;
    if (!target) return null;

    const scrollWidth = target.scrollWidth;
    const clientWidth = target.clientWidth;
    if (scrollWidth <= clientWidth + 6) {
      setIsVisible(false);
      return null;
    }

    const maxScroll = Math.max(1, scrollWidth - clientWidth);
    const trackWidth = trackEl ? trackEl.clientWidth : metricsRef.current.trackWidth || 320;
    const thumbWidthPct = Math.max(0.18, Math.min(0.82, clientWidth / scrollWidth));
    const thumbPx = Math.max(40, Math.round(trackWidth * thumbWidthPct));
    const usableTrackPx = Math.max(1, trackWidth - thumbPx);

    if (thumbEl && metricsRef.current.thumbPx !== thumbPx) {
      thumbEl.style.width = `${thumbPx}px`;
    }

    const next: CachedMetrics = {
      scrollWidth,
      clientWidth,
      maxScroll,
      trackWidth,
      thumbPx,
      usableTrackPx,
    };
    metricsRef.current = next;
    return next;
  }, []);

  // Pure transform paint using cached metrics — ZERO reflows and ZERO React re-renders
  const paintThumbFromScrollLeft = useCallback(
    (scrollLeftValue: number) => {
      const m = metricsRef.current;
      const clampedLeft = Math.max(0, Math.min(m.maxScroll, scrollLeftValue));
      const ratio = clampedLeft / m.maxScroll;

      const thumbEl = thumbRef.current;
      if (thumbEl) {
        const thumbX = Math.round(ratio * m.usableTrackPx);
        thumbEl.style.transform = `translate3d(${thumbX}px, 0, 0)`;
      }

      const pctText = `${Math.round(ratio * 100)}%`;
      if (percentRef.current && lastPctRef.current !== pctText) {
        lastPctRef.current = pctText;
        percentRef.current.textContent = pctText;
      }

      updateEdgeButtonsDom(clampedLeft > 2, clampedLeft < m.maxScroll - 2);
    },
    [updateEdgeButtonsDom]
  );

  const paintScrollbarNow = useCallback(
    (el?: HTMLElement | null) => {
      const target = el ?? activeContainerRef.current;
      if (!target) return;
      if (metricsRef.current.scrollWidth === 0 || metricsRef.current.trackWidth === 0) {
        if (!refreshMetrics(target)) return;
      }
      paintThumbFromScrollLeft(target.scrollLeft);
    },
    [refreshMetrics, paintThumbFromScrollLeft]
  );

  const schedulePaint = useCallback(() => {
    if (rafPaintRef.current !== null) return;
    rafPaintRef.current = window.requestAnimationFrame(() => {
      rafPaintRef.current = null;
      const target = activeContainerRef.current;
      if (target) {
        paintThumbFromScrollLeft(target.scrollLeft);
      }
    });
  }, [paintThumbFromScrollLeft]);

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
      best.style.scrollBehavior = 'auto';
      setIsVisible(best.scrollWidth > best.clientWidth + 6);
      refreshMetrics(best);
      paintThumbFromScrollLeft(best.scrollLeft);
    } else {
      setIsVisible(false);
    }
  }, [findBestOverflowingTableContainer, refreshMetrics, paintThumbFromScrollLeft]);

  // Lightweight observer for structural DOM changes, resize, vertical scroll, and Shift+Wheel fast pan
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
      }, 140);
    };

    scheduleSync();

    const mainEl = document.querySelector('main');
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
      if (container === activeContainerRef.current) {
        lastInteractedRef.current = container;
        return;
      }
      if (container.scrollWidth > container.clientWidth + 6 && container.querySelector('table')) {
        lastInteractedRef.current = container;
        scheduleSync();
      }
    };

    // Accelerate Shift + Mouse Wheel horizontal panning directly on wide tables (rAF batched)
    const handleTableWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      const container = target?.closest?.('.overflow-x-auto') as HTMLElement | null;
      if (!container) return;

      if (container !== activeContainerRef.current) {
        if (container.scrollWidth > container.clientWidth + 6 && container.querySelector('table')) {
          lastInteractedRef.current = container;
          scheduleSync();
        }
      }

      // If user holds Shift + Mouse Wheel vertically over a wide table, pan fast & smoothly
      if (e.shiftKey && Math.abs(e.deltaY) > 0 && Math.abs(e.deltaX) < 4) {
        if (container.scrollWidth <= container.clientWidth + 6) return;
        e.preventDefault();
        container.style.scrollBehavior = 'auto';
        pendingWheelDeltaRef.current += e.deltaY * 2.2;
        if (wheelRafRef.current === null) {
          wheelRafRef.current = window.requestAnimationFrame(() => {
            wheelRafRef.current = null;
            const d = pendingWheelDeltaRef.current;
            pendingWheelDeltaRef.current = 0;
            if (d !== 0) {
              container.scrollLeft += d;
              if (container === activeContainerRef.current) {
                paintThumbFromScrollLeft(container.scrollLeft);
              }
            }
          });
        }
      }
    };

    window.addEventListener('resize', scheduleSync, { passive: true });
    window.addEventListener('scroll', scheduleSync, { passive: true });
    mainEl?.addEventListener('pointerdown', handlePointerHint, { passive: true });
    mainEl?.addEventListener('wheel', handleTableWheel, { passive: false });

    return () => {
      if (rafSyncId !== null) window.cancelAnimationFrame(rafSyncId);
      if (mutationTimer !== null) window.clearTimeout(mutationTimer);
      if (wheelRafRef.current !== null) window.cancelAnimationFrame(wheelRafRef.current);
      mutationObserver?.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleSync);
      window.removeEventListener('scroll', scheduleSync);
      mainEl?.removeEventListener('pointerdown', handlePointerHint);
      mainEl?.removeEventListener('wheel', handleTableWheel);
    };
  }, [syncTargetContainer, paintThumbFromScrollLeft]);

  // Attach fast passive scroll listener + resize observer to active container & track
  useEffect(() => {
    if (!activeContainer) return;

    activeContainer.style.scrollBehavior = 'auto';

    const handleTableScroll = () => {
      if (dragStateRef.current || holdPanRafRef.current !== null) return;
      schedulePaint();
    };

    const containerResizeObserver = new ResizeObserver(() => {
      const m = refreshMetrics(activeContainer);
      if (!m) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
        paintThumbFromScrollLeft(activeContainer.scrollLeft);
      }
    });

    containerResizeObserver.observe(activeContainer);
    const tableChild = activeContainer.querySelector('table');
    if (tableChild) {
      containerResizeObserver.observe(tableChild);
    }
    if (trackRef.current) {
      containerResizeObserver.observe(trackRef.current);
    }

    activeContainer.addEventListener('scroll', handleTableScroll, { passive: true });
    refreshMetrics(activeContainer);
    paintThumbFromScrollLeft(activeContainer.scrollLeft);

    return () => {
      activeContainer.removeEventListener('scroll', handleTableScroll);
      containerResizeObserver.disconnect();
      if (rafPaintRef.current !== null) {
        window.cancelAnimationFrame(rafPaintRef.current);
        rafPaintRef.current = null;
      }
    };
  }, [activeContainer, refreshMetrics, paintThumbFromScrollLeft, schedulePaint]);

  // Ensure initial thumb width/position & button states paint cleanly whenever the bar mounts into DOM
  useEffect(() => {
    if (isVisible && activeContainer) {
      lastPctRef.current = '';
      lastEdgesRef.current = { canLeft: false, canRight: false };
      metricsRef.current.thumbPx = 0;
      refreshMetrics(activeContainer);
      paintThumbFromScrollLeft(activeContainer.scrollLeft);
    }
  }, [isVisible, activeContainer, refreshMetrics, paintThumbFromScrollLeft]);

  // Cleanup any active hold-to-pan loop on unmount
  useEffect(() => {
    return () => {
      if (holdPanRafRef.current !== null) {
        window.cancelAnimationFrame(holdPanRafRef.current);
      }
    };
  }, []);

  // Single-rAF-per-frame, zero-reflow pointer drag across the scrollbar track
  useEffect(() => {
    if (!isDragging) return;

    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const flushDragFrame = () => {
      const drag = dragStateRef.current;
      const targetEl = activeContainerRef.current;
      if (!drag || !targetEl) return;
      drag.rafId = null;

      const deltaX = drag.latestX - drag.startX;
      const scrollDelta = (deltaX / drag.usableTrackPx) * drag.maxScroll;
      const nextScrollLeft = Math.max(0, Math.min(drag.maxScroll, drag.startScrollLeft + scrollDelta));

      targetEl.scrollLeft = nextScrollLeft;
      paintThumbFromScrollLeft(nextScrollLeft);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag) return;
      drag.latestX = e.clientX;
      if (drag.rafId === null) {
        drag.rafId = window.requestAnimationFrame(flushDragFrame);
      }
    };

    const handlePointerUp = () => {
      const drag = dragStateRef.current;
      if (drag?.rafId !== null && drag?.rafId !== undefined) {
        window.cancelAnimationFrame(drag.rafId);
      }
      if (drag && activeContainerRef.current) {
        const deltaX = drag.latestX - drag.startX;
        const scrollDelta = (deltaX / drag.usableTrackPx) * drag.maxScroll;
        const finalLeft = Math.max(0, Math.min(drag.maxScroll, drag.startScrollLeft + scrollDelta));
        activeContainerRef.current.scrollLeft = finalLeft;
        paintThumbFromScrollLeft(finalLeft);
      }
      dragStateRef.current = null;
      setIsDragging(false);
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
  }, [isDragging, paintThumbFromScrollLeft]);

  if (!activeContainer || !isVisible) {
    return null;
  }

  const stopHoldPan = () => {
    if (holdPanRafRef.current !== null) {
      window.cancelAnimationFrame(holdPanRafRef.current);
      holdPanRafRef.current = null;
    }
  };

  // Hold arrow button for high-speed 60fps glide without DOM layout reads inside tick
  const startHoldPan = (direction: -1 | 1) => {
    const target = activeContainerRef.current;
    if (!target) return;
    stopHoldPan();
    target.style.scrollBehavior = 'auto';
    const m = refreshMetrics(target) || metricsRef.current;

    const immediateStep = Math.max(260, Math.round(m.clientWidth * 0.45));
    let virtualScrollLeft = Math.max(0, Math.min(m.maxScroll, target.scrollLeft + direction * immediateStep));
    target.scrollLeft = virtualScrollLeft;
    paintThumbFromScrollLeft(virtualScrollLeft);

    const holdStartedAt = performance.now();
    let lastFrameAt = holdStartedAt;

    const tick = (now: number) => {
      const currentTarget = activeContainerRef.current;
      if (!currentTarget) {
        holdPanRafRef.current = null;
        return;
      }
      if (now - holdStartedAt > 75) {
        const dt = Math.min(40, now - lastFrameAt) / 1000;
        const speedPxPerSec = Math.max(2400, metricsRef.current.clientWidth * 2.8);
        virtualScrollLeft = Math.max(
          0,
          Math.min(metricsRef.current.maxScroll, virtualScrollLeft + direction * speedPxPerSec * dt)
        );
        currentTarget.scrollLeft = virtualScrollLeft;
        paintThumbFromScrollLeft(virtualScrollLeft);
        if (
          (direction < 0 && virtualScrollLeft <= 0) ||
          (direction > 0 && virtualScrollLeft >= metricsRef.current.maxScroll)
        ) {
          holdPanRafRef.current = null;
          return;
        }
      }
      lastFrameAt = now;
      holdPanRafRef.current = window.requestAnimationFrame(tick);
    };

    holdPanRafRef.current = window.requestAnimationFrame(tick);
  };

  // Clicking anywhere on the track immediately jumps AND allows smooth dragging in one motion
  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const targetEl = activeContainerRef.current;
    const trackEl = trackRef.current;
    if (!targetEl || !trackEl) return;

    targetEl.style.scrollBehavior = 'auto';
    const m = refreshMetrics(targetEl) || metricsRef.current;
    const rect = trackEl.getBoundingClientRect();
    const clickX = e.clientX - rect.left - m.thumbPx / 2;
    const clickRatio = Math.max(0, Math.min(1, clickX / m.usableTrackPx));
    const jumpedLeft = clickRatio * m.maxScroll;

    targetEl.scrollLeft = jumpedLeft;
    paintThumbFromScrollLeft(jumpedLeft);

    dragStateRef.current = {
      startX: e.clientX,
      latestX: e.clientX,
      startScrollLeft: jumpedLeft,
      maxScroll: m.maxScroll,
      usableTrackPx: m.usableTrackPx,
      rafId: null,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture unavailable
    }
    setIsDragging(true);
  };

  const handleThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const targetEl = activeContainerRef.current;
    if (!targetEl) return;

    targetEl.style.scrollBehavior = 'auto';
    const m = refreshMetrics(targetEl) || metricsRef.current;
    const startScrollLeft = targetEl.scrollLeft;

    dragStateRef.current = {
      startX: e.clientX,
      latestX: e.clientX,
      startScrollLeft,
      maxScroll: m.maxScroll,
      usableTrackPx: m.usableTrackPx,
      rafId: null,
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
      target.scrollLeft += delta * 2.5;
      paintScrollbarNow(target);
    }
  };

  return (
    <div
      ref={barRef}
      onWheel={handleBarWheel}
      className="fixed bottom-[136px] sm:bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 sm:left-4 sm:translate-x-0 lg:left-1/2 lg:-translate-x-1/2 z-40 no-print w-[calc(100vw-24px)] sm:w-[calc(100vw-230px)] lg:w-[440px] xl:w-[520px] pointer-events-auto select-none"
      role="region"
      aria-label="Floating Horizontal Table Scrollbar"
    >
      <div className="px-2.5 py-2 rounded-2xl bg-slate-900/96 border border-slate-700/90 shadow-[0_14px_34px_-8px_rgba(2,6,23,0.72),inset_0_1px_0_rgba(255,255,255,0.12)] flex items-center gap-2">
        {/* Left Scroll Step / Hold-to-Glide Button */}
        <button
          ref={leftBtnRef}
          type="button"
          onPointerDown={() => startHoldPan(-1)}
          onPointerUp={stopHoldPan}
          onPointerLeave={stopHoldPan}
          onPointerCancel={stopHoldPan}
          className="w-7 h-7 rounded-xl flex items-center justify-center border shrink-0 bg-white/5 text-slate-500 border-white/5 cursor-not-allowed"
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
            style={{ width: '40px', transform: 'translate3d(0px, 0, 0)', willChange: 'transform' }}
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
          ref={rightBtnRef}
          type="button"
          onPointerDown={() => startHoldPan(1)}
          onPointerUp={stopHoldPan}
          onPointerLeave={stopHoldPan}
          onPointerCancel={stopHoldPan}
          className="w-7 h-7 rounded-xl flex items-center justify-center border shrink-0 bg-white/12 hover:bg-emerald-500/25 text-white border-white/15 hover:border-emerald-400/50 cursor-pointer active:scale-95"
          title="Click or hold to scroll table right"
          aria-label="Scroll Table Right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
