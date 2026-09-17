<?php
declare(strict_types=1);

// Dynamic XML sitemap. Reads the same includes/tools.php file that powers
// routing, so every tool added there appears here automatically — no manual
// sitemap edits are ever needed when a new tool ships.

require __DIR__ . '/includes/tools.php';

header('Content-Type: application/xml; charset=UTF-8');

$baseUrl = 'https://ilovemyfile.com';
$today = date('Y-m-d');

// Static, non-tool pages. Add a line here only for real standalone pages
// (not tools) such as legal or contact pages once they exist.
$staticPages = [
    ['loc' => '/', 'priority' => '1.0', 'changefreq' => 'daily', 'lastmod' => $today],
];

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

foreach ($staticPages as $page) {
    echo "  <url>\n";
    echo '    <loc>' . htmlspecialchars($baseUrl . $page['loc'], ENT_QUOTES, 'UTF-8') . "</loc>\n";
    echo '    <lastmod>' . htmlspecialchars($page['lastmod'], ENT_QUOTES, 'UTF-8') . "</lastmod>\n";
    echo '    <changefreq>' . htmlspecialchars($page['changefreq'], ENT_QUOTES, 'UTF-8') . "</changefreq>\n";
    echo '    <priority>' . htmlspecialchars($page['priority'], ENT_QUOTES, 'UTF-8') . "</priority>\n";
    echo "  </url>\n";
}

foreach ($tools as $slug => $tool) {
    $lastmod = $tool['lastmod'] ?? $today;
    echo "  <url>\n";
    echo '    <loc>' . htmlspecialchars($baseUrl . '/' . $slug, ENT_QUOTES, 'UTF-8') . "</loc>\n";
    echo '    <lastmod>' . htmlspecialchars($lastmod, ENT_QUOTES, 'UTF-8') . "</lastmod>\n";
    echo "    <changefreq>weekly</changefreq>\n";
    echo "    <priority>0.8</priority>\n";
    echo "  </url>\n";
}

echo '</urlset>' . "\n";
