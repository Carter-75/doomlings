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
    onSkip: () => void;
}

export default function TutorialOverlay({ steps, currentStep, onNext, onSkip }: TutorialOverlayProps) {
    const step = steps[currentStep];
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
    const [arrowPos, setArrowPos] = useState<'top' | 'bottom' | 'none'>('bottom');
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updatePosition = () => {
            if (!step?.highlightId) {
                // Center tooltip when no highlight
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

            const el = document.getElementById(step.highlightId);
            if (!el) {
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

            const rect = el.getBoundingClientRect();
            const padding = 8;

            // Get current UI scale
            const scaleStr = typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--ui-scale').trim() : '1';
            const scale = parseFloat(scaleStr) || 1;

            // Highlight box
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

            // Tooltip positioning
            const tooltipWidth = 310 * scale;
            const tooltipHeight = 180 * scale; // Approximate height including arrow
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            const safeMargin = 16;

            let top = 0;
            let left = 0;
            let arrow: 'top' | 'bottom' | 'none' = 'bottom';

            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;

            if (spaceBelow >= tooltipHeight + 20) {
                // Position below
                top = rect.bottom + 16;
                arrow = 'top';
            } else if (spaceAbove >= tooltipHeight + 20) {
                // Position above
                top = rect.top - tooltipHeight - 16;
                arrow = 'bottom';
            } else {
                // If not enough vertical space, try side-by-side (important for landscape)
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
                    // Fallback to center vertically if it absolutely doesn't fit anywhere
                    top = viewportHeight / 2 - tooltipHeight / 2;
                    left = viewportWidth / 2 - tooltipWidth / 2;
                    arrow = 'none';
                }
            }

            // Clamping horizontal for top/bottom arrows
            if (arrow === 'top' || arrow === 'bottom') {
                left = rect.left + rect.width / 2 - tooltipWidth / 2;
            }

            // Final clamping to ensure it's always on screen
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

        // Update on mount, step change, and resize/orientation change
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('orientationchange', updatePosition);

        // Polling as a safety for dynamic layouts (like sections expanding)
        const interval = setInterval(updatePosition, 1000);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('orientationchange', updatePosition);
            clearInterval(interval);
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
                <div className="tutorial-highlight-ring" style={highlightStyle} />
            )}

            {/* Tooltip card */}
            <div
                ref={tooltipRef}
                className="tutorial-tooltip"
                style={tooltipStyle}
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

                <div className="tutorial-footer">
                    <button className="tutorial-next-btn" onClick={onNext}>
                        {isLast ? '🎉 Done!' : 'Next →'}
                    </button>
                </div>

                {arrowPos === 'bottom' && <div className="tutorial-arrow tutorial-arrow-bottom" />}
            </div>
        </>
    );
}
