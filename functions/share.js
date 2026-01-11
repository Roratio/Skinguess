
export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const score = url.searchParams.get('score') || '0';
    const rankPct = url.searchParams.get('rank') || '-';
    const time = url.searchParams.get('time') || '0';
    // Handle skinName (which might contain spaces or special chars if not encoded properly, but URL object handles it)
    const skinName = url.searchParams.get('skinName') || 'Unknown Skin';
    const imageUrl = url.searchParams.get('imageUrl') || '';

    // Construct the OGP Image URL
    // It should point to our own API
    const baseUrl = url.origin;
    // We pass all params to the OG generator
    const ogImageUrl = `${baseUrl}/api/og?score=${score}&rank=${rankPct}&time=${time}&skinName=${encodeURIComponent(skinName)}&imageUrl=${encodeURIComponent(imageUrl)}`;

    const title = `結果: ${score}点 (TOP ${rankPct}%) | Skin Guess`;
    const description = `Skin Guess: Eternal Return スキン当てクイズ！\n最速正解: ${skinName} (${time}秒)\nスコア: ${score}`;

    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="keywords" content="エタリタ,エターナルリターン,スキン,当て,クイズ,ゲーム,이터널리턴,이리">

    <!-- Twitter Card data -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${ogImageUrl}">

    <!-- Open Graph data -->
    <meta property="og:title" content="${title}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url.href}" />
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:site_name" content="Skin Guess" />

    <!-- Redirect to main page -->
    <script>
        // Redirect to the main game page
        setTimeout(() => {
            window.location.href = '/';
        }, 100);
    </script>
</head>
<body style="background: #111; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
    <div>
        <h1>Skin Guess</h1>
        <p>Redirecting to game...</p>
        <p><a href="/" style="color: #facc15;">Click here if not redirected</a></p>
    </div>
</body>
</html>
    `;

    return new Response(html, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
        },
    });
}
