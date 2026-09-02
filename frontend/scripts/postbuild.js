const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');

if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');

  const seoTags = `
    <!-- SEO & Social Meta Tags -->
    <meta name="keywords" content="descargar videos 4k, convertir a mp3, extractor de audio, descarga multiple, sin anuncios, Aye Video Downloader">
    <link rel="canonical" href="https://video.ayeapps.com">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://video.ayeapps.com">
    <meta property="og:title" content="Aye Video Downloader — Descarga de Videos y Audio MP3">
    <meta property="og:description" content="Descarga videos en 4K y convierte a MP3 directamente en tu navegador. Sin anuncios, sin pop-ups y con descargas múltiples.">
    <meta property="og:site_name" content="AyeApps">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Aye Video Downloader — Descarga de Videos y Audio MP3">
    <meta name="twitter:description" content="Descarga videos en 4K y convierte a MP3 directamente en tu navegador. Sin anuncios ni límites.">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Aye Video Downloader",
      "operatingSystem": "Web, macOS, iOS",
      "applicationCategory": "MultimediaApplication",
      "description": "Descarga videos en 4K y convierte a MP3 directamente en tu navegador. Sin anuncios, sin pop-ups y con descargas múltiples.",
      "url": "https://video.ayeapps.com",
      "author": {
        "@type": "Organization",
        "name": "AyeApps",
        "url": "https://ayeapps.com"
      }
    }
    </script>
  </head>`;

  html = html.replace('</head>', seoTags);
  html = html.replace('<html lang="en">', '<html lang="es">');
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('✓ AyeVideoDownloader SEO injected into dist/index.html');

  // Create sitemap.xml
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://video.ayeapps.com</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
  fs.writeFileSync(path.join(distPath, 'sitemap.xml'), sitemap, 'utf8');
  console.log('✓ AyeVideoDownloader sitemap.xml generated');

  // Create robots.txt
  const robots = `User-Agent: *
Allow: /

Host: https://video.ayeapps.com
Sitemap: https://video.ayeapps.com/sitemap.xml
`;
  fs.writeFileSync(path.join(distPath, 'robots.txt'), robots, 'utf8');
  console.log('✓ AyeVideoDownloader robots.txt generated');
}
