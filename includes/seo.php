<?php

declare(strict_types=1);

/*
 * iLoveMyFile shared SEO head.
 *
 * Set these variables before including this file:
 * $pageTitle        Optional page title.
 * $metaDescription  Optional meta description.
 * $canonicalUrl     Optional absolute canonical URL.
 * $ogImage          Optional absolute OG image URL.
 * $robots           Optional robots directive.
 * $schema           Optional array|string JSON-LD payload.
 */

$siteName = 'iLoveMyFile';
$defaultTitle = 'iLoveMyFile – Free Online PDF, Image & File Tools';
$defaultDescription = 'Free online tools to convert, compress, edit and manage PDFs, images, documents and more. Fast, simple and privacy-friendly.';

$pageTitle = isset($pageTitle) && trim((string) $pageTitle) !== ''
    ? trim((string) $pageTitle)
    : $defaultTitle;

$metaDescription = isset($metaDescription) && trim((string) $metaDescription) !== ''
    ? trim((string) $metaDescription)
    : $defaultDescription;

$canonicalUrl = isset($canonicalUrl) && trim((string) $canonicalUrl) !== ''
    ? trim((string) $canonicalUrl)
    : 'https://www.ilovemyfile.com/';

$ogImage = isset($ogImage) && trim((string) $ogImage) !== ''
    ? trim((string) $ogImage)
    : 'https://www.ilovemyfile.com/assets/img/logo.png';

$robots = isset($robots) && trim((string) $robots) !== ''
    ? trim((string) $robots)
    : 'index,follow,max-image-preview:large';

function ilmf_escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}
?>
<title><?= ilmf_escape($pageTitle) ?></title>
<meta name="description" content="<?= ilmf_escape($metaDescription) ?>">
<meta name="robots" content="<?= ilmf_escape($robots) ?>">
<link rel="canonical" href="<?= ilmf_escape($canonicalUrl) ?>">

<meta property="og:type" content="website">
<meta property="og:site_name" content="<?= ilmf_escape($siteName) ?>">
<meta property="og:title" content="<?= ilmf_escape($pageTitle) ?>">
<meta property="og:description" content="<?= ilmf_escape($metaDescription) ?>">
<meta property="og:url" content="<?= ilmf_escape($canonicalUrl) ?>">
<meta property="og:image" content="<?= ilmf_escape($ogImage) ?>">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<?= ilmf_escape($pageTitle) ?>">
<meta name="twitter:description" content="<?= ilmf_escape($metaDescription) ?>">
<meta name="twitter:image" content="<?= ilmf_escape($ogImage) ?>">

<meta name="theme-color" content="#111827">

<?php if (isset($schema) && $schema !== null && $schema !== ''): ?>
<?php if (is_string($schema)): ?>
<script type="application/ld+json">
<?= $schema ?>
</script>
<?php else: ?>
<script type="application/ld+json">
<?= json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) ?>
</script>
<?php endif; ?>
<?php endif; ?>
