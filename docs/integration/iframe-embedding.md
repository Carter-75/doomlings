# Iframe Embedding Guide for Doomlings Companion

This document explains how to embed the Doomlings Companion app in an iframe, specifically for integration with carter-portfolio.fyi and other authorized domains.

## Overview

Doomlings Companion now supports iframe embedding with the following features:
- **Secure iframe headers** - Proper X-Frame-Options and CSP configuration
- **Responsive design** - Adapts to iframe container dimensions
- **Portfolio integration** - Special styling and behavior for carter-portfolio.fyi
- **Parent communication** - PostMessage API for interaction with parent page
- **Game functionality** - Full Doomlings companion features in embedded mode

## Authorized Domains

Doomlings Companion can be embedded on the following domains:
- `https://carter-portfolio.fyi`
- `https://www.carter-portfolio.fyi`
- Local development: `http://localhost:4000`, `http://localhost:8080`, `http://localhost:3000`

## Basic Embedding

### HTML
```html
<iframe 
  src="https://your-doomlings-domain.com" 
  width="100%" 
  height="700"
  frameborder="0"
  allowfullscreen
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
  title="Doomlings Companion - Board Game Helper">
</iframe>
```

### Recommended CSS
```css
.doomlings-iframe {
  width: 100%;
  min-width: 320px;
  height: 700px;
  min-height: 600px;
  max-height: 900px;
  border: none;
  border-radius: 12px;
  box-shadow: 0 20px 40px -12px rgba(214, 52, 71, 0.15);
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
}

/* Responsive behavior */
@media (max-width: 768px) {
  .doomlings-iframe {
    height: 600px;
    border-radius: 8px;
  }
}
```

## Portfolio Integration Features

When embedded on carter-portfolio.fyi, Doomlings Companion automatically:

### Visual Adjustments
- Applies `portfolio-iframe-mode` styling
- Hides external links and contact information
- Reduces padding for compact display
- Optimizes navigation for showcase presentation

### Responsive Behavior
- Adapts navigation layout for smaller screens
- Maintains game functionality within constrained space
- Optimizes card displays for iframe dimensions

### Parent Communication
Doomlings sends messages to the parent frame for:
- Load completion notifications
- Theme changes
- Game state updates

## PostMessage API

### Messages from Doomlings to Parent
```javascript
// App loaded notification
{
  source: 'doomlings',
  type: 'doomlings-loaded',
  data: { 
    timestamp: Date.now(),
    theme: 'dark',
    embedMode: 'portfolio'
  }
}

// Theme change notification
{
  source: 'doomlings',
  type: 'theme-changed',
  data: { theme: 'dark' | 'light' }
}

// Game state updates
{
  source: 'doomlings',
  type: 'game-state-changed',
  data: { players: 4, currentAge: 2, gameActive: true }
}
```

### Messages from Parent to Doomlings
```javascript
// Change theme
window.frames[0].postMessage({
  type: 'theme-change',
  data: { theme: 'dark' }
}, 'https://your-doomlings-domain.com');

// Notify of resize
window.frames[0].postMessage({
  type: 'resize',
  data: { width: 800, height: 700 }
}, 'https://your-doomlings-domain.com');
```

## Security Features

### Content Security Policy
Doomlings uses CSP headers that allow embedding on authorized domains:
```
frame-ancestors 'self' https://carter-portfolio.fyi https://www.carter-portfolio.fyi;
```

### Origin Validation
- Validates referrer headers for iframe requests
- Applies different styling based on parent domain
- Blocks unauthorized iframe embedding attempts

### Sandbox Attributes
Recommended iframe sandbox attributes:
- `allow-scripts` - Required for app functionality
- `allow-same-origin` - Required for local storage and API calls
- `allow-forms` - Required for game interactions
- `allow-popups` - Required for certain game features

## Implementation Example for Carter Portfolio

```html
<!DOCTYPE html>
<html>
<head>
  <title>Carter's Portfolio - Doomlings Companion Demo</title>
  <style>
    .demo-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .doomlings-showcase {
      background: linear-gradient(135deg, #d63447 0%, #ff6b35 100%);
      padding: 40px;
      border-radius: 16px;
      margin: 40px 0;
    }
    
    .doomlings-iframe {
      width: 100%;
      height: 700px;
      border: none;
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
  </style>
</head>
<body>
  <div class="demo-container">
    <h1>Doomlings Companion Demo</h1>
    <p>Experience the digital companion for the DOOMlings board game:</p>
    
    <div class="doomlings-showcase">
      <iframe 
        class="doomlings-iframe"
        src="https://your-doomlings-domain.com?embed=portfolio"
        allowfullscreen
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        title="Doomlings Companion - Interactive Demo">
      </iframe>
    </div>
  </div>

  <script>
    // Listen for messages from Doomlings iframe
    window.addEventListener('message', (event) => {
      if (event.data.source === 'doomlings') {
        console.log('Doomlings message:', event.data);
        
        if (event.data.type === 'doomlings-loaded') {
          console.log('Doomlings has loaded successfully');
        }
        
        if (event.data.type === 'game-state-changed') {
          console.log('Game state updated:', event.data.data);
        }
      }
    });
  </script>
</body>
</html>
```

## Configuration Options

### Query Parameters
- `?embed=portfolio` - Enables portfolio-specific styling
- `?theme=dark` - Sets initial theme (dark/light)
- `?compact=true` - Enables compact mode for smaller spaces

### URL Examples
```
https://your-doomlings-domain.com?embed=portfolio&theme=dark
https://your-doomlings-domain.com?compact=true
```

## Game Features Available in Iframe

All core Doomlings Companion features are available in iframe mode:

### Full Game Management
- **Complete Card Database** - 77+ dominants, 40+ trinkets, 48 meanings
- **5-Tier Dominant System** - Full progression tracking
- **Game State Management** - Track players, turns, and progress
- **Multiplayer Support** - Real-time gameplay with friends
- **Age and Rule Management** - Full gameplay assistance

### Optimized for Embedding
- **Responsive Design** - Works on any screen size
- **Touch-Friendly** - Mobile and tablet optimized
- **Fast Loading** - Optimized for iframe performance
- **Offline Capable** - Core features work without internet

## Troubleshooting

### Common Issues

1. **Iframe not loading**
   - Check that the domain is in the authorized list
   - Verify HTTPS is being used (required for secure contexts)

2. **Content appears cut off**
   - Ensure minimum height of 600px
   - Check responsive CSS rules for your viewport

3. **Game features not working**
   - Verify all required sandbox attributes are present
   - Check browser console for JavaScript errors

4. **Styling looks incorrect**
   - Confirm iframe has sufficient width (minimum 320px)
   - Verify parent page CSS isn't conflicting

### Debug Information
Doomlings adds debug attributes to the body element when in iframe mode:
- `data-iframe="true"` - Indicates iframe mode
- `data-portfolio="true"` - Indicates portfolio embedding
- `data-theme="dark|light"` - Shows current theme

In development mode, a visual indicator appears in the top-right corner.

## Browser Support

Doomlings iframe embedding is supported in:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Performance Considerations

- First load may take 2-3 seconds for full initialization
- Game data is cached for faster subsequent loads
- Iframe mode is optimized for reduced resource usage
- WebSocket connections (for multiplayer) work within iframes

## Game-Specific Notes

### Card Management
- All card types are fully functional in iframe mode
- Search and filtering work normally
- Card interactions are touch and mouse friendly

### Game State
- Game states save/load normally in iframe mode
- Local storage works within sandbox constraints
- Multiplayer connections maintained

### Responsive Design
- Cards stack appropriately on smaller screens
- Navigation adapts to iframe dimensions
- All game controls remain accessible

## Contact

For questions about iframe embedding or authorization requests for additional domains, please open an issue in the Doomlings repository.

## Version History

- **v3.0.0+** - Full iframe embedding support added
- Comprehensive PostMessage API
- Portfolio integration features
- Enhanced security headers