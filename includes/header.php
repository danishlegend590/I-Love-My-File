<?php
declare(strict_types=1);

if (!isset($pageTitle) || trim((string)$pageTitle) === '') {
    $pageTitle = 'iLoveMyFile — Free Online PDF, Image, Document & Developer Tools';
}
if (!isset($metaDescription) || trim((string)$metaDescription) === '') {
    $metaDescription = 'Free online tools for PDF, images, documents, SEO and developers. Convert, compress, edit and optimize files quickly online.';
}
if (!isset($canonicalUrl) || trim((string)$canonicalUrl) === '') {
    $canonicalUrl = 'https://ilovemyfile.com/';
}
if (!isset($ogImage) || trim((string)$ogImage) === '') {
    $ogImage = 'https://ilovemyfile.com/assets/img/logo-main.png';
}
if (!isset($robots) || trim((string)$robots) === '') {
    $robots = 'index,follow,max-image-preview:large';
}
if (!isset($schema)) {
    $schema = null;
}

if (!function_exists('ilmf_h')) {
    function ilmf_h(mixed $value): string
    {
        return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
    }
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= ilmf_h($pageTitle) ?></title>
    <meta name="description" content="<?= ilmf_h($metaDescription) ?>">
    <meta name="robots" content="<?= ilmf_h($robots) ?>">
    <link rel="canonical" href="<?= ilmf_h($canonicalUrl) ?>">
    <link rel="icon" href="/assets/img/logo-icon.png" type="image/png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/style.css?v=3">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="iLoveMyFile">
    <meta property="og:title" content="<?= ilmf_h($pageTitle) ?>">
    <meta property="og:description" content="<?= ilmf_h($metaDescription) ?>">
    <meta property="og:url" content="<?= ilmf_h($canonicalUrl) ?>">
    <meta property="og:image" content="<?= ilmf_h($ogImage) ?>">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?= ilmf_h($pageTitle) ?>">
    <meta name="twitter:description" content="<?= ilmf_h($metaDescription) ?>">
    <meta name="twitter:image" content="<?= ilmf_h($ogImage) ?>">
    <meta name="theme-color" content="#111522">

    <script>
    (function(){
        try {
            var t = localStorage.getItem('ilmf-theme');
            if (t === 'dark' || (!t && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.dataset.theme = 'dark';
            } else {
                document.documentElement.dataset.theme = 'light';
            }
        } catch (e) {}
    })();
    </script>

    <?php if ($schema !== null): ?>
    <script type="application/ld+json">
<?= is_string($schema) ? $schema : json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) ?>
    </script>
    <?php endif; ?>
</head>
<body>
<header class="site-header">
    <div class="container nav-wrap">
        <a class="brand" href="/" aria-label="iLoveMyFile home">
            <img class="brand-logo" src="/assets/img/logo-main.png" alt="iLoveMyFile">
        </a>

        <nav class="desktop-nav" aria-label="Primary navigation">
            <a href="/pdf-tools/">PDF Tools</a>
            <a href="/image-tools/">Images</a>
            <a href="/document-tools/">Documents</a>
            <a href="/seo-tools/">SEO</a>
            <a href="/developer-tools/">Developer</a>
        </nav>

        <div class="nav-actions">
            <button class="theme-toggle" id="themeToggle" type="button" aria-label="Toggle dark mode" title="Toggle dark mode">◐</button>
            <a class="nav-search" href="/#tool-search">Search</a>
        </div>
    </div>
</header>
