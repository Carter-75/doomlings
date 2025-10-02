import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Create response
  const response = NextResponse.next()

  // Get the referrer to determine if this is an iframe request
  const referrer = request.headers.get('referer')
  const userAgent = request.headers.get('user-agent') || ''
  
  // Define authorized iframe domains
  const authorizedDomains = [
    'https://carter-portfolio.fyi',
    'https://www.carter-portfolio.fyi',
    'http://localhost:4000',
    'http://localhost:8080',
    'http://localhost:3000',
    'https://localhost:4000',
    'https://localhost:8080',
    'https://localhost:3000'
  ]

  // Check if request is from an authorized domain
  const isAuthorizedIframe = referrer && authorizedDomains.some(domain => 
    referrer.startsWith(domain)
  )

  // Determine iframe embedding policy
  let frameAncestors = "'self'"
  if (isAuthorizedIframe) {
    const authorizedFrameAncestors = authorizedDomains
      .filter(domain => !domain.includes('localhost'))
      .join(' ')
    frameAncestors = `'self' ${authorizedFrameAncestors}`
  }

  // Set security headers
  const securityHeaders = {
    // Content Security Policy - Allow iframe embedding from authorized domains
    'Content-Security-Policy': `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob: https:;
      font-src 'self' data: https:;
      connect-src 'self' ws: wss: https:;
      frame-ancestors ${frameAncestors};
      base-uri 'self';
      form-action 'self';
    `.replace(/\s+/g, ' ').trim(),
    
    // X-Frame-Options - Allow framing from authorized domains
    'X-Frame-Options': isAuthorizedIframe ? 'SAMEORIGIN' : 'DENY',
    
    // Other security headers
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Add iframe detection headers for client-side use
  if (isAuthorizedIframe) {
    response.headers.set('X-Iframe-Allowed', 'true')
    response.headers.set('X-Iframe-Referrer', referrer || '')
    
    // Determine if this is portfolio embedding
    const isPortfolioEmbed = referrer?.includes('carter-portfolio.fyi') || 
                            request.nextUrl.searchParams.get('embed') === 'portfolio'
    if (isPortfolioEmbed) {
      response.headers.set('X-Portfolio-Embed', 'true')
    }
  }

  return response
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}