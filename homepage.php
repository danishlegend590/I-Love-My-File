<?php
require_once __DIR__ . '/includes/tools.php';

$categories = [
    'PDF Tools'=>['slug'=>'pdf-tools','icon'=>'PDF','description'=>'Merge, split, compress, convert, protect and manage PDF files.','tools'=>['Merge PDF','Split PDF','Compress PDF','Rotate PDF','Extract PDF Pages','PDF to JPG']],
    'Image Tools'=>['slug'=>'image-tools','icon'=>'IMG','description'=>'Convert, compress, resize and optimize images in seconds.','tools'=>['Compress Image','JPG to WebP','PNG to WebP','WebP to JPG','WebP to PNG','Resize Image']],
    'Document Tools'=>['slug'=>'document-tools','icon'=>'DOC','description'=>'Convert and work with everyday document formats.','tools'=>['Word to PDF','PDF to Word','Excel to PDF','PDF to Excel','PPT to PDF','TXT to PDF']],
    'SEO Tools'=>['slug'=>'seo-tools','icon'=>'SEO','description'=>'Practical tools for metadata, URLs, schema and technical SEO.','tools'=>['Meta Tag Generator','Meta Description Generator','Schema Generator','Robots.txt Generator','URL Slug Generator','SERP Snippet Preview']],
    'Developer Tools'=>['slug'=>'developer-tools','icon'=>'</>','description'=>'Fast utilities for formatting, encoding, validation and development.','tools'=>['JSON Formatter','JSON Validator','HTML Formatter','CSS Formatter','Base64 Encoder','URL Encoder']],
];

// Popular tools shown on the homepage. Only tools that actually exist in
// includes/tools.php link out; everything else renders as a disabled
// "Coming soon" card so visitors never land on a 404. As real tools are
// added to tools.php, they automatically become clickable here with zero
// other changes needed.
$popular = [
    ['name' => 'Merge PDF', 'slug' => 'merge-pdf', 'cat' => 'PDF Tools'],
    ['name' => 'Split PDF', 'slug' => 'split-pdf', 'cat' => 'PDF Tools'],
    ['name' => 'Compress PDF', 'slug' => 'compress-pdf', 'cat' => 'PDF Tools'],
    ['name' => 'Compress Image', 'slug' => 'compress-image', 'cat' => 'Image Tools'],
    ['name' => 'JPG to PDF', 'slug' => 'jpg-to-pdf', 'cat' => 'PDF Tools'],
    ['name' => 'Image to PDF', 'slug' => 'image-to-pdf', 'cat' => 'PDF Tools'],
    ['name' => 'PDF to JPG', 'slug' => 'pdf-to-jpg', 'cat' => 'PDF Tools'],
    ['name' => 'JSON Formatter', 'slug' => 'json-formatter', 'cat' => 'Developer Tools'],
];

function ilmf_tool_slug($name) {
    return strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name));
}
?>
<main>
<section class="hero">
    <div class="hero-grid"></div>
    <div class="container hero-inner">
        <div class="eyebrow">FREE ONLINE TOOLS</div>
        <h1>Your files.<br><span>Simply handled.</span></h1>
        <p class="hero-lead">Convert, compress, edit and optimize PDFs, images, documents and more — quickly, simply and online.</p>
        <div class="tool-search" id="tool-search">
            <span class="search-icon" aria-hidden="true">⌕</span>
            <input id="searchInput" type="search" placeholder="What do you want to do? Try “Compress PDF”" autocomplete="off">
            <kbd>⌘ K</kbd>
        </div>
        <div class="hero-pills">
            <span>Free to use</span><span>Fast</span><span>Privacy-conscious</span><span>No software to install</span>
        </div>
    </div>
</section>

<section class="section popular-section">
    <div class="container">
        <div class="section-head"><div><div class="eyebrow">GET STARTED</div><h2>Popular tools</h2></div><a href="#all-tools">View all tools →</a></div>
        <div class="popular-grid" id="popularGrid">
            <?php foreach ($popular as $tool):
                $isLive = isset($tools[$tool['slug']]);
                $tag = $isLive ? 'a' : 'div';
            ?>
                <<?= $tag ?> class="tool-card<?= $isLive ? '' : ' tool-card--soon' ?>"<?php if ($isLive): ?> href="/<?= htmlspecialchars($tool['slug'], ENT_QUOTES, 'UTF-8') ?>"<?php endif; ?> data-tool="<?= htmlspecialchars(strtolower($tool['name'].' '.$tool['cat']), ENT_QUOTES, 'UTF-8') ?>">
                    <div class="card-icon"><?= htmlspecialchars(substr($tool['cat'], 0, 3), ENT_QUOTES, 'UTF-8') ?></div>
                    <div class="card-cat"><?= htmlspecialchars($tool['cat'], ENT_QUOTES, 'UTF-8') ?></div>
                    <h3><?= htmlspecialchars($tool['name'], ENT_QUOTES, 'UTF-8') ?></h3>
                    <?php if ($isLive): ?>
                        <span class="card-link">Use tool <b>→</b></span>
                    <?php else: ?>
                        <span class="card-soon-badge">Coming soon</span>
                    <?php endif; ?>
                </<?= $tag ?>>
            <?php endforeach; ?>
        </div>
        <div id="searchEmpty" class="empty-state" hidden>No matching tools found. Try another search.</div>
    </div>
</section>

<section class="section categories" id="all-tools">
    <div class="container">
        <div class="section-head intro-head"><div><div class="eyebrow">EXPLORE</div><h2>Tools for every kind of file</h2></div><p>Everything is organized by task, so you can get to the right utility without digging through a giant list.</p></div>
        <div class="category-grid">
        <?php foreach ($categories as $name => $cat): ?>
            <article class="category-card" id="<?= htmlspecialchars($cat['slug'], ENT_QUOTES, 'UTF-8') ?>">
                <div class="category-top"><div class="category-icon"><?= htmlspecialchars($cat['icon'], ENT_QUOTES, 'UTF-8') ?></div><span>Explore →</span></div>
                <h3><?= htmlspecialchars($name, ENT_QUOTES, 'UTF-8') ?></h3>
                <p><?= htmlspecialchars($cat['description'], ENT_QUOTES, 'UTF-8') ?></p>
                <div class="category-tools">
                <?php foreach ($cat['tools'] as $tool):
                    $slug = ilmf_tool_slug($tool);
                    $isLive = isset($tools[$slug]);
                ?>
                    <?php if ($isLive): ?>
                        <a href="/<?= htmlspecialchars($slug, ENT_QUOTES, 'UTF-8') ?>"><?= htmlspecialchars($tool, ENT_QUOTES, 'UTF-8') ?></a>
                    <?php else: ?>
                        <span class="tool-soon"><?= htmlspecialchars($tool, ENT_QUOTES, 'UTF-8') ?> <em>Soon</em></span>
                    <?php endif; ?>
                <?php endforeach; ?>
                </div>
            </article>
        <?php endforeach; ?>
        </div>
    </div>
</section>

<section class="section trust-section">
    <div class="container">
        <div class="trust-card">
            <div><div class="eyebrow">WHY ILOVEMYFILE</div><h2>Built around simple, useful tools.</h2><p>We want every tool to answer one clear problem, work well on mobile and stay easy to understand.</p></div>
            <div class="trust-points"><div><strong>Fast</strong><span>Focused tools without unnecessary steps.</span></div><div><strong>Private</strong><span>Browser-based processing where practical.</span></div><div><strong>Free</strong><span>Core utilities available without installing software.</span></div></div>
        </div>
    </div>
</section>

<section class="section faq-section">
    <div class="container narrow">
        <div class="eyebrow">FAQ</div><h2>About iLoveMyFile</h2>
        <details><summary>Is iLoveMyFile free?</summary><p>Core online utilities are planned to be free to use. Some advanced processing may be introduced later.</p></details>
        <details><summary>Do I need to install software?</summary><p>No. The goal is to make common file tasks available directly from your browser.</p></details>
        <details><summary>Are uploaded files stored?</summary><p>For tools that process files in the browser, files stay on your device. Tools that require server processing will clearly explain how files are handled.</p></details>
    </div>
</section>
</main>
<script src="/assets/js/homepage-search.js?v=1" defer></script>
