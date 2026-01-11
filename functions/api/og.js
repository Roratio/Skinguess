
import './polyfill.js';
import satori, { init } from 'satori';
import initYoga from 'yoga-wasm-web';
import { svg2png, initialize } from 'svg2png-wasm';

// Import WASM modules statically
import yogaWasm from './yoga.wasm';
import svg2pngWasm from './svg2png_wasm_bg.wasm';

// Initialize flag
let initialized = false;

async function initLibs() {
    if (initialized) return;

    // Initialize Yoga
    const yoga = await initYoga(yogaWasm);
    init(yoga);

    // Initialize svg2png
    await initialize(svg2pngWasm);

    initialized = true;
}

export async function onRequest(context) {
    try {
        await initLibs();

        const { request } = context;
        const url = new URL(request.url);
        const score = url.searchParams.get('score') || '0';
        const rankPct = url.searchParams.get('rank') || '-';
        const time = url.searchParams.get('time') || '0';
        const skinName = url.searchParams.get('skinName') || 'Unknown';
        const imageUrl = url.searchParams.get('imageUrl') || '';

        // Fetch fonts (JP and KR)
        const fontUrlJP = 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.12/files/noto-sans-jp-japanese-700-normal.woff';
        const fontUrlKR = 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-kr@5.0.12/files/noto-sans-kr-korean-700-normal.woff';

        const fontDataPromiseJP = fetch(fontUrlJP)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to load JP font: ${res.status}`);
                return res.arrayBuffer();
            });

        const fontDataPromiseKR = fetch(fontUrlKR)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to load KR font: ${res.status}`);
                return res.arrayBuffer();
            });

        // Markup
        // Design: Left: Image (Cover), Right: Info
        const markup = {
            type: 'div',
            props: {
                style: {
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#1f1f1f',
                    color: 'white',
                    fontFamily: 'Noto Sans JP, Noto Sans KR',
                },
                children: [
                    // Left Column: Character Image
                    {
                        type: 'div',
                        props: {
                            style: {
                                display: 'flex',
                                width: '45%',
                                height: '100%',
                                backgroundColor: '#000',
                                alignItems: 'center',
                                justifyItems: 'center',
                                overflow: 'hidden',
                                position: 'relative',
                            },
                            children: imageUrl ? [
                                {
                                    type: 'img',
                                    props: {
                                        src: imageUrl,
                                        style: {
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        },
                                    },
                                }
                            ] : [],
                        },
                    },
                    // Right Column: Info
                    {
                        type: 'div',
                        props: {
                            style: {
                                display: 'flex',
                                flexDirection: 'column',
                                width: '55%',
                                height: '100%',
                                padding: '40px',
                                justifyContent: 'center',
                                backgroundColor: '#fdfdfd',
                                color: '#1f1f1f'
                            },
                            children: [
                                // Header Text
                                {
                                    type: 'div',
                                    props: {
                                        style: { fontSize: '24px', color: '#666', marginBottom: '10px' },
                                        children: 'あなたが一番早く答えたのは...',
                                    },
                                },
                                // Skin Name
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            fontSize: '60px',
                                            fontWeight: 'bold',
                                            marginBottom: '10px',
                                            lineHeight: '1.2',
                                            color: '#333'
                                        },
                                        children: skinName,
                                    },
                                },
                                // Time
                                {
                                    type: 'div',
                                    props: {
                                        style: { fontSize: '50px', fontWeight: 'bold', color: '#555', marginBottom: '40px' },
                                        children: `${time}秒`,
                                    },
                                },
                                // Divider (Using border)
                                // Bottom Section: Score
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            display: 'flex',
                                            flexDirection: 'column',
                                        },
                                        children: [
                                            {
                                                type: 'div',
                                                props: {
                                                    style: { fontSize: '40px', color: '#666' },
                                                    children: '合計点数',
                                                },
                                            },
                                            {
                                                type: 'div',
                                                props: {
                                                    style: {
                                                        fontSize: '70px',
                                                        fontWeight: '900',
                                                        color: '#333'
                                                    },
                                                    children: `${score}点でした`,
                                                },
                                            },
                                            {
                                                type: 'div',
                                                props: {
                                                    style: {
                                                        fontSize: '60px',
                                                        color: '#666',
                                                        marginTop: '10px'
                                                    },
                                                    children: `TOP${rankPct}%`,
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        };

        const [fontDataJP, fontDataKR] = await Promise.all([fontDataPromiseJP, fontDataPromiseKR]);

        // Generate SVG
        const svg = await satori(markup, {
            width: 1200,
            height: 630,
            fonts: [
                {
                    name: 'Noto Sans JP',
                    data: fontDataJP,
                    weight: 400,
                    style: 'normal',
                },
                {
                    name: 'Noto Sans KR',
                    data: fontDataKR,
                    weight: 400,
                    style: 'normal',
                },
            ],
        });

        const pngBuffer = await svg2png(svg, {
            scale: 1,
        });

        return new Response(pngBuffer, {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (err) {
        return new Response(JSON.stringify({
            error: "OGP Generation Failed",
            message: err.message,
            stack: err.stack
        }, null, 2), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}
