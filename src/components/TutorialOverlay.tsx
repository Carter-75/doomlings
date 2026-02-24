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
            boxShadow: '0 0 0 4000px rgba(0,0,0,0.72), 0 0 0 3px #7b61ff, 0 0 24px 6px rgba(123,97,255,0.7)',
        });

        // Tooltip positioning
        const tooltipWidth = 310;
        const tooltipHeight = 180;
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        let top: number;
        let left: number;
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
            // Center vertically
            top = viewportHeight / 2 - tooltipHeight / 2;
            arrow = 'none';
        }

        // Horizontal: center on element, clamp to viewport
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        left = Math.max(12, Math.min(left, viewportWidth - tooltipWidth - 12));
        top = Math.max(12, top);

        setArrowPos(arrow);
        setTooltipStyle({
            position: 'fixed',
            top,
            left,
            width: tooltipWidth,
            zIndex: 10001,
        });
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
