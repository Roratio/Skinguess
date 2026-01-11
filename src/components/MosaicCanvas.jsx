import React, { useRef, useEffect } from 'react';

export function MosaicCanvas({ imageUrl, progress, width = 600, height = 400 }) {
    const canvasRef = useRef(null);
    const imgRef = useRef(null);

    useEffect(() => {
        const img = new Image();
        // img.crossOrigin = "Anonymous"; // REMOVED: CORS check fails for Drive redirects. We don't need pixel read access.
        img.referrerPolicy = "no-referrer"; // Fix for Google Drive
        img.src = imageUrl;
        img.onload = () => {
            imgRef.current = img;
            drawMosaic();
        };
    }, [imageUrl]);

    useEffect(() => {
        drawMosaic();
    }, [progress, imageUrl]); // Redraw when progress or image changes

    const drawMosaic = () => {
        const canvas = canvasRef.current;
        if (!canvas || !imgRef.current) return;
        const ctx = canvas.getContext('2d');

        // Logic:
        // progress 0 (Start) -> sampleSize Large (e.g., 0.02 * width)
        // progress 1 (End)   -> sampleSize 1 (Clear)

        // Inverse logic: progress goes 0 -> 1 over 30s
        // We want clear at 1. But game says "30s to reveal".
        // Start: Heavily pixelated. End: Clear.
        // Let's say max pixel size is 50px. Min is 1px.
        // Factor = (1 - progress) * 50. If progress=1, factor=0 (ensure >=1).

        // Actually, to make it smooth, we can use the "draw small then scale up" trick.
        // Scale down to W * (progress), then scale up.
        // Example: Progress 0.05 -> Draw to 5% size, then Scale up.
        // Progress 1.0 -> Draw to 100% size.

        // Avoid 0 size.
        const safeProgress = Math.max(0.01, progress);

        const w = canvas.width;
        const h = canvas.height;

        // Pass 1: Draw small
        // We need a temp canvas or just simple drawImage params
        // ctx.imageSmoothingEnabled = false; // Key for pixelation

        // 1. Clear
        ctx.clearRect(0, 0, w, h);

        // 2. Turn off smoothing
        ctx.imageSmoothingEnabled = false;

        // 3. Draw image reduced
        const sw = Math.max(1, Math.floor(w * safeProgress));
        const sh = Math.max(1, Math.floor(h * safeProgress));

        // Draw to offscreen canvas (or just trick with drawImage)
        // Ideally: Draw image to valid small rect, then draw that small rect back to full canvas.
        // But we can't do that easily on one canvas without reading back.
        // Actually we can do it with an offscreen canvas.

        const offscreen = document.createElement('canvas');
        offscreen.width = sw;
        offscreen.height = sh;
        const offCtx = offscreen.getContext('2d');
        offCtx.drawImage(imgRef.current, 0, 0, sw, sh);

        // 4. Draw back scaled up
        ctx.drawImage(offscreen, 0, 0, sw, sh, 0, 0, w, h);
    };

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-auto bg-black rounded shadow-lg"
        />
    );
}
