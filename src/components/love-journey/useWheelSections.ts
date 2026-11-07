import { useEffect, type RefObject } from 'react';

const GESTURE_PAUSE_MS = 220;
const SECTION_THRESHOLD_PX = 30;

function canScrollVertically(target: Element, rail: HTMLElement, direction: number) {
    for (let element: Element | null = target; element && element !== rail; element = element.parentElement) {
        const remaining = direction > 0
            ? element.scrollHeight - element.clientHeight - element.scrollTop
            : element.scrollTop;

        if (remaining > 1 && /^(auto|scroll|overlay)$/.test(getComputedStyle(element).overflowY)) {
            return true;
        }
    }
    return false;
}

export function useWheelSections(railRef: RefObject<HTMLDivElement | null>, scrollToSection: (index: number) => void) {
    useEffect(() => {
        const rail = railRef.current;
        if (!rail) return;

        let lastWheelAt = -Infinity;
        let mode: 'pending' | 'native' | 'switched' = 'pending';
        let distance = 0;

        const onWheel = (event: WheelEvent) => {
            const { target } = event;
            if (event.defaultPrevented || !(target instanceof Element) || (!event.deltaX && !event.deltaY)) return;

            const now = performance.now();
            if (now - lastWheelAt > GESTURE_PAUSE_MS) {
                mode = 'pending';
                distance = 0;
            }
            lastWheelAt = now;

            if (event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)
                || target.closest('form, input, textarea, select, [contenteditable], [role="dialog"]')) {
                if (mode !== 'switched') mode = 'native';
                return;
            }
            if (mode === 'native') return;
            if (mode === 'switched') {
                event.preventDefault();
                return;
            }

            const direction = Math.sign(event.deltaY);
            const width = rail.clientWidth;
            if (!width) return;
            const currentIndex = Math.round(rail.scrollLeft / width);
            const nextIndex = currentIndex + direction;

            // Give the whole gesture to native scrolling if it started in a scrollable panel.
            if (canScrollVertically(target, rail, direction) || Math.abs(rail.scrollLeft - currentIndex * width) > 2
                || nextIndex < 0 || nextIndex >= rail.childElementCount) {
                mode = 'native';
                return;
            }

            event.preventDefault();
            const deltaUnit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
                : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? rail.clientHeight : 1;
            const delta = event.deltaY * deltaUnit;
            distance = Math.sign(distance) === direction ? distance + delta : delta;
            if (Math.abs(distance) < SECTION_THRESHOLD_PX) return;

            mode = 'switched';
            scrollToSection(nextIndex);
        };

        rail.addEventListener('wheel', onWheel, { passive: false });
        return () => rail.removeEventListener('wheel', onWheel);
    }, [railRef, scrollToSection]);
}
