'use client';

import React, { useEffect } from 'react';

const AmbientEffects = () => {
    useEffect(() => {
        const createEmbers = () => {
            const container = document.createElement('div');
            container.id = 'ember-container';
            document.body.appendChild(container);

            const intervalId = setInterval(() => {
                if (container.children.length < 50) { // Limit ember count
                    const ember = document.createElement('div');
                    ember.className = 'ember';
                    
                    const x = Math.random() * window.innerWidth;
                    const y = window.innerHeight + 50;
                    ember.style.left = `${x}px`;
                    ember.style.top = `${y}px`;

                    const size = Math.random() * 5 + 2;
                    ember.style.width = `${size}px`;
                    ember.style.height = `${size}px`;

                    const duration = Math.random() * 5 + 5;
                    ember.style.animationDuration = `${duration}s`;

                    container.appendChild(ember);

                    setTimeout(() => {
                        ember.remove();
                    }, duration * 1000);
                }
            }, 100);

            return { container, intervalId };
        };

        const addSparkEffects = () => {
            const sparkContainer = document.createElement('div');
            sparkContainer.id = 'spark-container';
            sparkContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
            document.body.appendChild(sparkContainer);
            
            const createSpark = () => {
                const spark = document.createElement('div');
                spark.className = 'spark';
                spark.style.left = `${Math.random() * 100}%`;
                spark.style.top = `${Math.random() * 100}%`;
                
                const size = Math.random() * 4 + 1;
                spark.style.width = `${size}px`;
                spark.style.height = `${size}px`;
                
                spark.style.animationDuration = `${Math.random() * 2 + 1}s`;
                
                sparkContainer.appendChild(spark);
                
                setTimeout(() => {
                    spark.remove();
                }, 3000);
            };
            
            const intervalId = setInterval(createSpark, 150);
            return { container: sparkContainer, intervalId };
        };

        const addLavaFlowAnimation = () => {
            const canvas = document.createElement('canvas');
            canvas.id = 'lava-flow';
            canvas.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;height:150px;pointer-events:none;z-index:-1;opacity:0.4;';
            document.body.appendChild(canvas);
            const ctx = canvas.getContext('2d');
            if (!ctx) return { canvas, animationFrameId: 0 };

            canvas.width = window.innerWidth;
            canvas.height = 150;

            let circles: any[] = [];
            for (let i = 0; i < 15; i++) {
                circles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 50 + 20,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    color: `rgba(255, ${Math.floor(Math.random() * 100)}, 0, 0.6)`
                });
            }

            let animationFrameId: number = 0;

            const animate = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.filter = 'blur(20px)';
                circles.forEach(circle => {
                    circle.x += circle.vx;
                    circle.y += circle.vy;
                    if (circle.x > canvas.width + circle.radius) circle.x = -circle.radius;
                    if (circle.x < -circle.radius) circle.x = canvas.width + circle.radius;
                    if (circle.y > canvas.height + circle.radius) circle.y = -circle.radius;
                    if (circle.y < -circle.radius) circle.y = canvas.height + circle.radius;

                    ctx.beginPath();
                    ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
                    ctx.fillStyle = circle.color;
                    ctx.fill();
                });
                animationFrameId = requestAnimationFrame(animate);
            };

            animate();
            return { canvas, animationFrameId };
        };

        const { container: emberContainer, intervalId: emberInterval } = createEmbers();
        const { container: sparkContainer, intervalId: sparkInterval } = addSparkEffects();
        const { canvas: lavaCanvas, animationFrameId: lavaFrameId } = addLavaFlowAnimation();

        // Cleanup function
        return () => {
            clearInterval(emberInterval);
            emberContainer.remove();
            clearInterval(sparkInterval);
            sparkContainer.remove();
            cancelAnimationFrame(lavaFrameId);
            lavaCanvas.remove();
        };
    }, []);

    return null; // This component does not render anything itself
};

export default AmbientEffects; 