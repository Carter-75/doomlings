'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface TutorialStep {
    title: string;
    message: string;
    /** ID of the DOM element to highlight. null = no highlight (intro/outro steps) */
    highlightId: string | null;
    /** Section to navigate to before showing this step */
    section?: string;
}

interface TutorialOverlayProps {
    steps: TutorialStep[];
    currentStep: number;
    onNext: () => void;
    onBack: () => void;
    onSkip: () => void;
}

export default function TutorialOverlay({ steps, currentStep, onNext, onBack, onSkip }: TutorialOverlayProps) {
    const step = steps[currentStep];
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        opacity: 0,
        pointerEvents: 'none'
    });
    const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
    const [arrowPos, setArrowPos] = useState<'top' | 'bottom' | 'none'>('bottom');
    const [opacity, setOpacity] = useState(0);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Start hidden whenever step changes
        setOpacity(0);

        let el = step?.highlightId ? document.getElementById(step.highlightId) : null;

        if (el) {
            const rect = el.getBoundingClientRect();
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            // Scroll if mostly out of view (using center block, which gracefully falls back if impossible)
            if (rect.top < 0 || rect.bottom > viewportHeight) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        const updatePosition = () => {
            if (!step?.highlightId) {
                setHighlightStyle({});
                setTooltipStyle({
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10001,
                });
                setArrowPos('none');
                return;
            }

            // re-fetch element inside the loop in case DOM updated
            const currentEl = document.getElementById(step.highlightId);
            if (!currentEl) {
                setHighlightStyle({});
                setTooltipStyle({
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10001,
                });
                setArrowPos('none');
                return;
            }

            const rect = currentEl.getBoundingClientRect();
            const padding = 8;
            const scaleStr = typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--ui-scale').trim() : '1';
            const scale = parseFloat(scaleStr) || 1;

            setHighlightStyle({
                position: 'fixed',
                top: rect.top - padding,
                left: rect.left - padding,
                width: rect.width + padding * 2,
                height: rect.height + padding * 2,
                borderRadius: '10px',
                zIndex: 9999,
                pointerEvents: 'none',
                boxShadow: '0 0 0 4000px rgba(0,0,0,0.72), 0 0 0 3px var(--primary-red), 0 0 24px 6px rgba(255, 255, 255, 0.08)',
            });

            const tooltipWidth = 310 * scale;
            const tooltipHeight = 180 * scale;
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            const safeMargin = 16;

            let top = 0;
            let left = 0;
            let arrow: 'top' | 'bottom' | 'none' = 'bottom';

            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;

            if (spaceBelow >= tooltipHeight + 20) {
                top = rect.bottom + 16;
                arrow = 'top';
            } else if (spaceAbove >= tooltipHeight + 20) {
                top = rect.top - tooltipHeight - 16;
                arrow = 'bottom';
            } else {
                const spaceRight = viewportWidth - rect.right;
                const spaceLeft = rect.left;

                if (spaceRight >= tooltipWidth + 20) {
                    left = rect.right + 16;
                    top = rect.top + rect.height / 2 - tooltipHeight / 2;
                    arrow = 'none';
                } else if (spaceLeft >= tooltipWidth + 20) {
                    left = rect.left - tooltipWidth - 16;
                    top = rect.top + rect.height / 2 - tooltipHeight / 2;
                    arrow = 'none';
                } else {
                    top = viewportHeight / 2 - tooltipHeight / 2;
                    left = viewportWidth / 2 - tooltipWidth / 2;
                    arrow = 'none';
                }
            }

            if (arrow === 'top' || arrow === 'bottom') {
                left = rect.left + rect.width / 2 - tooltipWidth / 2;
            }

            left = Math.max(safeMargin, Math.min(left, viewportWidth - tooltipWidth - safeMargin));
            top = Math.max(safeMargin, Math.min(top, viewportHeight - tooltipHeight - safeMargin));

            setArrowPos(arrow);
            setTooltipStyle({
                position: 'fixed',
                top,
                left,
                width: tooltipWidth,
                zIndex: 10001,
            });
        };

        // Update immediately
        updatePosition();

        // Listeners for layout shifts and scrolling
        window.addEventListener('resize', updatePosition);
        window.addEventListener('orientationchange', updatePosition);
        window.addEventListener('scroll', updatePosition, true); // true = capture phase for all scrollable containers

        const interval = setInterval(updatePosition, 1000);

        // After scrolling is assumed to finish (smooth scroll takes around ~300ms usually)
        // Ensure position is fully 100% updated immediately before fading in
        const timer = setTimeout(() => {
            updatePosition();
            setOpacity(1);
        }, 400);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('orientationchange', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [currentStep, step]);

    if (!step) return null;

    const isLast = currentStep === steps.length - 1;
    const progress = Math.round(((currentStep + 1) / steps.length) * 100);

    return (
        <>
            {/* Backdrop (only shown when no highlight — else box-shadow does it) */}
            {!step.highlightId && (
                <div
                    className="tutorial-backdrop"
                    onClick={(e) => e.stopPropagation()}
                    style={{ opacity, transition: 'opacity 0.3s ease' }}
                />
            )}

            {/* Highlight element overlay (invisible, just blocks pointer on rest of screen) */}
            {step.highlightId && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9998,
                        pointerEvents: 'auto',
                    }}
                    onClick={(e) => e.stopPropagation()}
                />
            )}

            {/* Glow ring around target */}
            {Object.keys(highlightStyle).length > 0 && (
                <div className="tutorial-highlight-ring" style={{ ...highlightStyle, opacity, transition: 'opacity 0.3s ease' }} />
            )}

            {/* Tooltip card */}
            <div
                ref={tooltipRef}
                className="tutorial-tooltip"
                style={{ ...tooltipStyle, opacity, transition: 'opacity 0.3s ease' }}
            >
                {arrowPos === 'top' && <div className="tutorial-arrow tutorial-arrow-top" />}

                <div className="tutorial-header">
                    <span className="tutorial-step-badge">
                        {currentStep + 1} / {steps.length}
                    </span>
                    <button className="tutorial-skip-btn" onClick={onSkip}>✕ Skip</button>
                </div>

                <div className="tutorial-progress-bar">
                    <div className="tutorial-progress-fill" style={{ width: `${progress}%` }} />
                </div>

                <h3 className="tutorial-step-title">{step.title}</h3>
                <p className="tutorial-step-message">{step.message}</p>

                <div className="tutorial-footer" style={{ display: 'flex', gap: '8px' }}>
                    {currentStep > 0 && (
                        <button className="tutorial-back-btn" onClick={onBack} style={{ flex: 1 }}>
                            ← Back
                        </button>
                    )}
                    <button className="tutorial-next-btn" onClick={onNext} style={{ flex: currentStep > 0 ? 1 : 'none', width: currentStep > 0 ? 'auto' : '100%' }}>
                        {isLast ? '🎉 Done!' : 'Next →'}
                    </button>
                </div>

                {arrowPos === 'bottom' && <div className="tutorial-arrow tutorial-arrow-bottom" />}
            </div>
        </>
    );
}
