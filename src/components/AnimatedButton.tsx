'use client';

import React, { useRef, MouseEvent } from 'react';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    // We can add props here to control which animation to use
    animationType?: 'ripple' | 'lava' | 'trail' | 'phoenix'; // Example
    classAnimation?: 'magma-effect' | 'fire-pulse-animation' | 'fire-glow-animation' | 'fire-burst';
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({ children, onClick, className, animationType = 'ripple', classAnimation, ...props }) => {
    const buttonRef = useRef<HTMLButtonElement>(null);

    const createFireRipple = (event: MouseEvent<HTMLButtonElement>) => {
        const button = buttonRef.current;
        if (!button) return;

        const ripple = document.createElement('span');
        ripple.className = 'button-ripple';

        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        // The animation is handled by CSS keyframes
        button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600); // Corresponds to animation duration
    };

    const createLavaExplosion = () => {
        const button = buttonRef.current;
        if (!button) return;

        const rect = button.getBoundingClientRect();

        for (let i = 0; i < 12; i++) {
            const lavaParticle = document.createElement('span');
            lavaParticle.className = 'lava-particle';
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 10 + Math.random() * 30;
            const x = rect.width / 2 + Math.cos(angle) * 5;
            const y = rect.height / 2 + Math.sin(angle) * 5;
            
            lavaParticle.style.left = `${x}px`;
            lavaParticle.style.top = `${y}px`;
            
            const colors = ['#ff4500', '#ff7800', '#ff9a00', '#ffbf00', '#ff3300'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            lavaParticle.style.backgroundColor = color;
            lavaParticle.style.boxShadow = `0 0 ${6 + Math.random() * 10}px 2px ${color}`;
            
            button.appendChild(lavaParticle);
            
            const destX = Math.cos(angle) * distance;
            const destY = Math.sin(angle) * distance;
            
            lavaParticle.animate([
                { transform: 'scale(0.5) translate(0, 0)', opacity: 1 },
                { transform: `scale(${0.8 + Math.random() * 1.2}) translate(${destX}px, ${destY}px)`, opacity: 0.8 },
                { transform: `scale(0) translate(${destX * 1.5}px, ${destY * 1.5}px)`, opacity: 0 }
            ], {
                duration: 600 + Math.random() * 300,
                easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)'
            });
            
            setTimeout(() => lavaParticle.remove(), 900);
        }
    };

    const createFireTrailEffect = () => {
        const button = buttonRef.current;
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const numEmbers = 14;
        
        for (let i = 0; i < numEmbers; i++) {
            const ember = document.createElement('div');
            ember.className = 'fire-ember';
            
            ember.style.left = `${rect.width / 2}px`;
            ember.style.top = `${rect.height / 2}px`;
            
            const angle = Math.random() * Math.PI * 2;
            const length = 5 + Math.random() * 15;
            
            ember.style.width = `${length}px`;
            ember.style.transform = `rotate(${angle}rad)`;
            
            const hue = 20 + Math.random() * 40;
            ember.style.background = `linear-gradient(90deg, rgba(255,${Math.floor(80 + Math.random() * 100)},0,1), rgba(255,50,0,0))`;
            ember.style.boxShadow = `0 0 8px 2px hsla(${hue}, 100%, 65%, 0.7)`;
            
            button.appendChild(ember);
            
            ember.animate([
                { transform: `rotate(${angle}rad) scaleX(0.3)`, opacity: 0.9 },
                { transform: `rotate(${angle}rad) scaleX(1)`, opacity: 0 }
            ], {
                duration: 300 + Math.random() * 300,
                easing: 'cubic-bezier(0.1, 0.9, 0.2, 1)'
            });
            
            setTimeout(() => ember.remove(), 600);
        }
    }

    const createPhoenixEffect = () => {
        const button = buttonRef.current;
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const featherCount = 12;
        
        for (let i = 0; i < featherCount; i++) {
            const feather = document.createElement('div');
            feather.className = 'phoenix-feather';
            
            feather.style.left = rect.width / 2 + 'px';
            feather.style.top = rect.height / 2 + 'px';
            
            const hue = Math.random() > 0.7 ? 
                        35 + Math.floor(Math.random() * 15) :
                        5 + Math.floor(Math.random() * 25);
            const saturation = 90 + Math.floor(Math.random() * 10);
            const lightness = 45 + Math.floor(Math.random() * 15);
            
            feather.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            feather.style.boxShadow = `0 0 8px 3px hsla(${hue}, 100%, ${lightness + 10}%, 0.7)`;
            
            const size = 4 + Math.random() * 6;
            feather.style.width = size + 'px';
            feather.style.height = (size * 3) + 'px';
            
            button.appendChild(feather);
            
            const angle = (i / featherCount) * Math.PI * 2;
            const distance = 20 + Math.random() * 40;
            const curve = 30 + Math.random() * 50;
            
            const easings = [
                'cubic-bezier(0.2, 0.9, 0.1, 1)',
                'cubic-bezier(0.1, 0.8, 0.2, 1)',
                'cubic-bezier(0.3, 0.7, 0.1, 1)'
            ];
            const easing = easings[Math.floor(Math.random() * easings.length)];
            
            feather.animate([
                { transform: `translate(0, 0) rotate(0deg) scale(1)`, opacity: 0.2 },
                { transform: `translate(${Math.cos(angle) * distance * 0.3}px, ${Math.sin(angle) * distance * 0.3 - curve * 0.5}px) rotate(${Math.random() * 180 - 90}deg) scale(1.2)`, opacity: 0.9 },
                { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance - curve}px) rotate(${Math.random() * 360 - 180}deg) scale(0.5)`, opacity: 0 }
            ], {
                duration: 800 + Math.random() * 500,
                easing: easing
            });
            
            setTimeout(() => feather.remove(), 1300);
        }
    }

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        // Particle effects
        if (animationType === 'ripple') createFireRipple(event);
        else if (animationType === 'lava') createLavaExplosion();
        else if (animationType === 'trail') createFireTrailEffect();
        else if (animationType === 'phoenix') createPhoenixEffect();

        // Class-based animations
        if (classAnimation) {
            const button = buttonRef.current;
            if (button) {
                button.classList.add(classAnimation, 'animate'); // 'animate' is a common trigger
                setTimeout(() => {
                    button.classList.remove(classAnimation, 'animate');
                }, 800); // A sensible default, matches magma-rise
            }
        }

        if (onClick) {
            onClick(event);
        }
    };

    return (
        <button ref={buttonRef} onClick={handleClick} className={`button ${className || ''}`} {...props}>
            {children}
        </button>
    );
};

export default AnimatedButton; 