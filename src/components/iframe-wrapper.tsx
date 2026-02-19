'use client'

import React, { useEffect, ReactNode } from 'react'
import { useIframe } from '@/lib/iframe-context'

interface IframeWrapperProps {
  children: ReactNode
}

export function IframeWrapper({ children }: IframeWrapperProps) {
  const { isIframe, isPortfolioEmbed, theme } = useIframe()

  useEffect(() => {
    // Apply iframe classes to body
    if (isIframe) {
      document.body.classList.add('iframe-mode')
      document.body.setAttribute('data-iframe', 'true')

      if (isPortfolioEmbed) {
        document.body.classList.add('portfolio-iframe-mode')
        document.body.setAttribute('data-portfolio', 'true')
      }
    } else {
      document.body.classList.remove('iframe-mode', 'portfolio-iframe-mode')
      document.body.removeAttribute('data-iframe')
      document.body.removeAttribute('data-portfolio')
    }

    // Apply theme classes
    document.body.classList.remove('dark', 'light')
    document.body.classList.add(theme)
    document.body.setAttribute('data-theme', theme)

    return () => {
      // Cleanup classes on unmount
      document.body.classList.remove('iframe-mode', 'portfolio-iframe-mode', 'dark', 'light')
      document.body.removeAttribute('data-iframe')
      document.body.removeAttribute('data-portfolio')
      document.body.removeAttribute('data-theme')
    }
  }, [isIframe, isPortfolioEmbed, theme])

  // Apply saved UI scaling on mount
  useEffect(() => {
    const savedScaling = localStorage.getItem('uiScaling');
    if (savedScaling) {
      const scaleValue = parseInt(savedScaling, 10) / 100;
      document.documentElement.style.setProperty('--ui-scale', scaleValue.toString());
    }
  }, []);

  // Add viewport meta tag for responsive iframe behavior
  useEffect(() => {
    if (isIframe) {
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
      } else {
        const meta = document.createElement('meta')
        meta.name = 'viewport'
        meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
        document.head.appendChild(meta)
      }
    }
  }, [isIframe])

  return (
    <>
      {children}
      {/* Add iframe detection script for debugging */}
      {process.env.NODE_ENV === 'development' && isIframe && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(255, 107, 53, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          IFRAME{isPortfolioEmbed ? ' - PORTFOLIO' : ''}
        </div>
      )}
    </>
  )
}