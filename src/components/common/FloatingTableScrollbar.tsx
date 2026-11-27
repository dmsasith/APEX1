import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';

interface ScrollMetrics {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
}

export const FloatingTableScrollbar: React.FC = () => {
  const [activeContainer, setActiveContainer] = useState<HTMLElement | null>(null);
  const [metrics, setMetrics] = useState<ScrollMetrics>({
    scrollLeft: 0,
    scrollWidth: 0,
    clientWidth: 0,
  });
  const [isDragging, setIsDragging] = useState(false);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const lastInteractedRef = useRef<HTMLElement | null>(null);
  const activeContainerRef = useRef<HTMLElement | null>(null);
  const dragStateRef = useRef<{
    startX: number;
    startScrollLeft: number;
  } | null>(null);

  activeContainerRef.current = activeContainer;

  const findBestOverflowingTableContainer = useCallback((): HTMLElement | null => {
    if (typeof document === 'undefined') return null;
    const mainEl = document.querySelector('main');
    if (!mainEl) return null;

    const candidates = Array.from(mainEl.querySelectorAll<HTMLElement>('.overflow-x-auto')).filter(
      (el) => {
        if (!el.querySelector('table')) return false;
        if (el.scrollWidth <= el.clientWidth + 6) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width < 120 || rect.height < 48) return false;
        // Must be visibly intersecting the active viewport area
        return rect.bottom > 96 && rect.top < window.innerHeight - 64;
      }
    );

    if (candidates.length === 0) return null;

    // Prefer the table the user most recently scrolled/hovered if still visible & overflowing
    if (lastInteractedRef.current && candidates.includes(lastInteractedRef.current)) {
      return lastInteractedRef.current;
    }

    // Otherwise pick the candidate with the largest visible vertical height in viewport
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

  const syncTargetAndMetrics = useCallback(() => {
    const best = findBestOverflowingTableContainer();
    setActiveContainer((prev) => (prev === best ? prev : best));
    if (best) {
      setMetrics({
        scrollLeft: best.scrollLeft,
        scrollWidth: best.scrollWidth,
        clientWidth: best.clientWidth,
      });
    }
  }, [findBestOverflowingTableContainer]);

  // Track DOM changes, window resize, and vertical page scroll
  useEffect(() => {
    let rafId: number | null = null;
    const scheduleSync = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        syncTargetAndMetrics();
      });
    };

    scheduleSync();

    const mainEl = document.querySelector('main');
    const mutationObserver = mainEl
      ? new MutationObserver(scheduleSync)
      : null;
    if (mainEl && mutationObserver) {
      mutationObserver.observe(mainEl, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
    }

    const resizeObserver = new ResizeObserver(scheduleSync);
    if (mainEl) {
      resizeObserver.observe(mainEl);
    }

    const handlePointerHint = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const container = target?.closest?.('.overflow-x-auto') as HTMLElement | null;
      if (container && container.querySelector('table') && container.scrollWidth > container.clientWidth + 6) {
        lastInteractedRef.current = container;
        scheduleSync();
      }
    };

    window.addEventListener('resize', scheduleSync, { passive: true });
    window.addEventListener('scroll', scheduleSync, { passive: true });
    mainEl?.addEventListener('pointerdown', handlePointerHint, { passive: true });
    mainEl?.addEventListener('wheel', handlePointerHint, { passive: true });

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      mutationObserver?.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleSync);
      window.removeEventListener('scroll', scheduleSync);
      mainEl?.removeEventListener('pointerdown', handlePointerHint);
      mainEl?.removeEventListener('wheel', handlePointerHint);
    };
  }, [syncTargetAndMetrics]);

  // Sync horizontal scroll position when the active table container scrolls natively
  useEffect(() => {
    if (!activeContainer) return;

    const handleTableScroll = () => {
      setMetrics({
        scrollLeft: activeContainer.scrollLeft,
        scrollWidth: activeContainer.scrollWidth,
        clientWidth: activeContainer.clientWidth,
      });
    };

    const containerResizeObserver = new ResizeObserver(handleTableScroll);
    containerResizeObserver.observe(activeContainer);
    const tableChild = activeContainer.querySelector('table');
    if (tableChild) {
      containerResizeObserver.observe(tableChild);
    }

    activeContainer.addEventListener('scroll', handleTableScroll, { passive: true });
    handleTableScroll();

    return () => {
      activeContainer.removeEventListener('scroll', handleTableScroll);
      containerResizeObserver.disconnect();
    };
  }, [activeContainer]);

  // Handle smooth mouse/touch dragging of the floating thumb
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const targetEl = activeContainerRef.current;
      const trackEl = trackRef.current;
      const drag = dragStateRef.current;
      if (!targetEl || !trackEl || !drag) return;

      const trackWidth = trackEl.clientWidth;
      const maxScroll = Math.max(1, targetEl.scrollWidth - targetEl.clientWidth);
      const thumbRatio = Math.max(0.16, Math.min(0.85, targetEl.clientWidth / targetEl.scrollWidth));
      const thumbPx = trackWidth * thumbRatio;
      const usableTrackPx = Math.max(1, trackWidth - thumbPx);

      const deltaX = e.clientX - drag.startX;
      const scrollDelta = (deltaX / usableTrackPx) * maxScroll;
      targetEl.scrollLeft = Math.max(0, Math.min(maxScroll, drag.startScrollLeft + scrollDelta));
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      dragStateRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging]);

  if (!activeContainer || metrics.scrollWidth <= metrics.clientWidth + 6) {
    return null;
  }

  const maxScroll = Math.max(1, metrics.scrollWidth - metrics.clientWidth);
  const scrollPercent = Math.min(100, Math.max(0, Math.round((metrics.scrollLeft / maxScroll) * 100)));
  const thumbWidthPct = Math.max(18, Math.min(82, (metrics.clientWidth / metrics.scrollWidth) * 100));
  const thumbLeftPct = (metrics.scrollLeft / maxScroll) * (100 - thumbWidthPct);

  const canScrollLeft = metrics.scrollLeft > 2;
  const canScrollRight = metrics.scrollLeft < maxScroll - 2;

  const handleStepScroll = (direction: -1 | 1) => {
    if (!activeContainer) return;
    const step = Math.max(180, Math.round(activeContainer.clientWidth * 0.45));
    activeContainer.scrollBy({
      left: direction * step,
      behavior: 'smooth',
    });
  };

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeContainer || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
    const targetLeft = clickRatio * maxScroll;
    activeContainer.scrollTo({
      left: targetLeft,
      behavior: 'smooth',
    });
  };

  const handleThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!activeContainer) return;
    dragStateRef.current = {
      startX: e.clientX,
      startScrollLeft: activeContainer.scrollLeft,
    };
    setIsDragging(true);
  };

  return (
    <div
      className="fixed bottom-[136px] sm:bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 sm:left-4 sm:translate-x-0 lg:left-1/2 lg:-translate-x-1/2 z-40 no-print w-[calc(100vw-24px)] sm:w-[calc(100vw-230px)] lg:w-[440px] xl:w-[520px] pointer-events-auto select-none animate-in fade-in slide-in-from-bottom-2 duration-150"
      role="region"
      aria-label="Floating Horizontal Table Scrollbar"
    >
      <div className="px-2.5 py-2 rounded-2xl bg-slate-900/92 backdrop-blur-xl border border-white/20 shadow-[0_16px_42px_-8px_rgba(2,6,23,0.72),inset_0_1px_0_rgba(255,255,255,0.14)] flex items-center gap-2">
        {/* Left Scroll Step Button */}
        <button
          type="button"
          onClick={() => handleStepScroll(-1)}
          disabled={!canScrollLeft}
          className={`w-7 h-7 rounded-xl flex items-center justify-center border transition shrink-0 ${
            canScrollLeft
              ? 'bg-white/12 hover:bg-emerald-500/25 text-white border-white/15 hover:border-emerald-400/50 cursor-pointer'
              : 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
          }`}
          title="Scroll Table Left"
          aria-label="Scroll Table Left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Label Icon */}
        <div className="hidden sm:flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-300 shrink-0 pl-0.5">
          <MoveHorizontal className="w-3.5 h-3.5 text-emerald-400" />
        </div>

        {/* Wide Grab-Friendly Floating Scroll Track & Thumb */}
        <div
          ref={trackRef}
          onPointerDown={handleTrackPointerDown}
          className="relative flex-1 h-4 rounded-full bg-slate-800/95 border border-white/15 shadow-inner cursor-pointer overflow-hidden"
          title="Drag bar or click track to pan table horizontally"
        >
          <div
            onPointerDown={handleThumbPointerDown}
            style={{
              width: `${thumbWidthPct}%`,
              left: `${thumbLeftPct}%`,
            }}
            className={`absolute top-0.5 bottom-0.5 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 shadow-[0_0_12px_rgba(52,211,153,0.55)] flex items-center justify-center gap-0.5 transition-[filter] ${
              isDragging
                ? 'cursor-grabbing brightness-110 ring-2 ring-white/50'
                : 'cursor-grab hover:brightness-110'
            }`}
          >
            <span className="w-0.5 h-2 rounded-full bg-slate-950/45" />
            <span className="w-0.5 h-2 rounded-full bg-slate-950/45" />
            <span className="w-0.5 h-2 rounded-full bg-slate-950/45" />
          </div>
        </div>

        {/* Live Scroll Percentage */}
        <span className="text-[10px] font-mono font-extrabold text-emerald-300 tabular-nums w-8 text-right shrink-0">
          {scrollPercent}%
        </span>

        {/* Right Scroll Step Button */}
        <button
          type="button"
          onClick={() => handleStepScroll(1)}
          disabled={!canScrollRight}
          className={`w-7 h-7 rounded-xl flex items-center justify-center border transition shrink-0 ${
            canScrollRight
              ? 'bg-white/12 hover:bg-emerald-500/25 text-white border-white/15 hover:border-emerald-400/50 cursor-pointer'
              : 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
          }`}
          title="Scroll Table Right"
          aria-label="Scroll Table Right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
