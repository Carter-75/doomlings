'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface IframeContextType {
  isIframe: boolean
  isPortfolioEmbed: boolean
  referrer: string | null
  parentOrigin: string | null
  sendToParent: (message: any) => void
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void
}

const IframeContext = createContext<IframeContextType | undefined>(undefined)

export function useIframe() {
  const context = useContext(IframeContext)
  if (context === undefined) {
    throw new Error('useIframe must be used within an IframeProvider')
  }
  return context
}

interface IframeProviderProps {
  children: ReactNode
}

export function IframeProvider({ children }: IframeProviderProps) {
  const [isIframe, setIsIframe] = useState(false)
  const [isPortfolioEmbed, setIsPortfolioEmbed] = useState(false)
  const [referrer, setReferrer] = useState<string | null>(null)
  const [parentOrigin, setParentOrigin] = useState<string | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    // Check if we're in an iframe
    const inIframe = window !== window.parent
    setIsIframe(inIframe)

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const embedParam = urlParams.get('embed')
    const themeParam = urlParams.get('theme') as 'dark' | 'light'
    
    setIsPortfolioEmbed(embedParam === 'portfolio')
    
    if (themeParam && (themeParam === 'dark' || themeParam === 'light')) {
      setTheme(themeParam)
    }

    // Get referrer information
    if (document.referrer) {
      setReferrer(document.referrer)
      try {
        const referrerUrl = new URL(document.referrer)
        setParentOrigin(referrerUrl.origin)
      } catch (error) {
        console.warn('Invalid referrer URL:', document.referrer)
      }
    }

    // Listen for messages from parent window
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      const allowedOrigins = [
        'https://carter-portfolio.fyi',
        'https://www.carter-portfolio.fyi',
        'http://localhost:4000',
        'http://localhost:8080',
        'http://localhost:3000'
      ]

      if (!allowedOrigins.includes(event.origin)) {
        return
      }

      const { type, data } = event.data

      switch (type) {
        case 'theme-change':
          if (data?.theme === 'dark' || data?.theme === 'light') {
            setTheme(data.theme)
          }
          break
        case 'resize':
          // Handle resize notifications from parent
          console.log('Parent resize:', data)
          break
        default:
          // Log unhandled message types for debugging
          console.log('Unhandled parent message:', { type, data })
      }
    }

    window.addEventListener('message', handleMessage)

    // Notify parent that Doomlings has loaded
    if (inIframe && parentOrigin) {
      setTimeout(() => {
        sendToParent({
          type: 'doomlings-loaded',
          data: { 
            timestamp: Date.now(),
            theme: theme,
            embedMode: embedParam
          }
        })
      }, 1000)
    }

    // Apply iframe-specific body classes
    if (inIframe) {
      document.body.classList.add('iframe-mode')
      if (embedParam === 'portfolio') {
        document.body.classList.add('portfolio-iframe-mode')
      }
    }

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [theme])

  const sendToParent = (message: any) => {
    if (isIframe && parentOrigin) {
      try {
        window.parent.postMessage({
          source: 'doomlings',
          ...message
        }, parentOrigin)
      } catch (error) {
        console.warn('Failed to send message to parent:', error)
      }
    }
  }

  // Notify parent when theme changes
  useEffect(() => {
    if (isIframe) {
      sendToParent({
        type: 'theme-changed',
        data: { theme }
      })
    }
  }, [theme, isIframe])

  const contextValue: IframeContextType = {
    isIframe,
    isPortfolioEmbed,
    referrer,
    parentOrigin,
    sendToParent,
    theme,
    setTheme
  }

  return (
    <IframeContext.Provider value={contextValue}>
      {children}
    </IframeContext.Provider>
  )
}