<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/tools.php';

// Reserved top-level routes that must never be treated as a tool slug,
// even if a future tool is accidentally named the same thing.
$reservedSlugs = ['privacy-policy', 'terms', 'contact', 'search', 'about'];

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = rtrim($path, '/') ?: '/';
$toolSlug = null;

// Flat tool URLs: ilovemyfile.com/merge-pdf (no / prefix).
if ($path !== '/' && preg_match('#^/([a-z0-9-]+)$#i', $path, $m)) {
    $slugCandidate = strtolower($m[1]);
    if (!in_array($slugCandidate, $reservedSlugs, true)) {
        $toolSlug = $slugCandidate;
    }
}

$isTool = $toolSlug !== null;
$tool = $isTool ? ($tools[$toolSlug] ?? null) : null;

$title = $tool['seo_title'] ?? 'iLoveMyFile — Free Online PDF, Image, Document & Developer Tools';
$description = $tool['seo_description'] ?? 'Free online tools for PDF, images, documents, SEO and developers. Convert, compress, edit and optimize files quickly online.';
$canonical = 'https://ilovemyfile.com' . ($isTool ? '/' . rawurlencode($toolSlug) : '/');
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?></title>
<meta name="description" content="<?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?>">
<link rel="canonical" href="<?= htmlspecialchars($canonical, ENT_QUOTES, 'UTF-8') ?>">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="icon" href="/assets/img/logo-icon.png" type="image/png">
<meta property="og:type" content="website">
<meta property="og:title" content="<?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?>">
<meta property="og:description" content="<?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?>">
<meta property="og:url" content="<?= htmlspecialchars($canonical, ENT_QUOTES, 'UTF-8') ?>">
<meta property="og:image" content="https://ilovemyfile.com/assets/img/logo-main.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/style.css?v=2">
<script>
(function(){try{var t=localStorage.getItem('ilmf-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.dataset.theme='dark';}catch(e){}})();
</script>
<?php if ($isTool && $tool): ?>
<script type="application/ld+json">
<?= json_encode([
    '@context'=>'https://schema.org',
    '@type'=>'WebApplication',
    'name'=>$tool['name'],
    'url'=>$canonical,
    'applicationCategory'=>'UtilitiesApplication',
    'operatingSystem'=>'Any',
    'description'=>$tool['description'],
    'isAccessibleForFree'=>true,
], JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT) ?>
</script>
<?php else: ?>
<script type="application/ld+json">
<?= json_encode([
    '@context'=>'https://schema.org',
    '@type'=>'WebSite',
    'name'=>'iLoveMyFile',
    'url'=>'https://ilovemyfile.com/',
    'description'=>$description,
    'potentialAction'=>['@type'=>'SearchAction','target'=>'https://ilovemyfile.com/search?q={search_term_string}','query-input'=>'required name=search_term_string']
], JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT) ?>
</script>
<?php endif; ?>
</head>
<body>
<header class="site-header">
<div class="container nav-wrap">
<a class="brand" href="/" aria-label="iLoveMyFile home"><img class="brand-logo" src="/assets/img/logo-main.png" alt="iLoveMyFile"></a>
<nav class="desktop-nav" aria-label="Primary navigation">
<a href="/merge-pdf">PDF Tools</a><a href="/#image-tools">Images</a><a href="/#document-tools">Documents</a><a href="/#seo-tools">SEO</a><a href="/#developer-tools">Developer</a>
</nav>
<div class="nav-actions"><button class="theme-toggle" id="themeToggle" type="button" aria-label="Toggle dark mode">◐</button><a class="nav-search" href="/#tool-search">Search</a></div>
</div>
</header>

<?php if (!$isTool): ?>
<!-- Existing homepage remains below; tool framework is now ready. -->
<?php
// Reuse the previous homepage by falling back to the original v1 source if available.
include __DIR__ . '/homepage.php';
?>
<?php elseif (!$tool): ?>
<main><section class="section"><div class="container narrow"><div class="eyebrow">404</div><h1>Tool not found.</h1><p>We couldn't find that tool.</p><a class="btn-primary" href="/">Back to iLoveMyFile →</a></div></section></main>
<?php else: ?>
<main>
<section class="tool-hero"><div class="container narrow"><div class="eyebrow"><?= htmlspecialchars($tool['category'], ENT_QUOTES, 'UTF-8') ?></div><h1><?= htmlspecialchars($tool['name'], ENT_QUOTES, 'UTF-8') ?></h1><p><?= htmlspecialchars($tool['description'], ENT_QUOTES, 'UTF-8') ?></p></div></section>

<?php if ($toolSlug === 'merge-pdf'): ?>
<section class="section tool-section"><div class="container tool-layout">
<div class="tool-main">
<div class="tool-box">
<div class="dropzone" id="dropzone"><div class="drop-icon">PDF</div><h2>Merge your PDF files</h2><p>Drag and drop your PDFs here or choose files from your device.</p><label class="btn-primary file-btn">Choose PDF files<input id="pdfFiles" type="file" accept="application/pdf,.pdf" multiple hidden></label><small>Files are processed in your browser.</small></div>
<div id="fileList" class="file-list" hidden></div>
<div class="tool-actions"><button class="btn-primary" id="mergeBtn" type="button" disabled>Merge PDFs →</button><button class="btn-secondary" id="clearBtn" type="button" hidden>Clear</button></div>
<div id="result" class="result-box" hidden></div>
</div>
<div class="tool-content"><h2>How to merge PDF files</h2><ol><li>Select two or more PDF files.</li><li>Arrange them in the order you want.</li><li>Click <strong>Merge PDFs</strong> and download your combined file.</li></ol><h2>Why use iLoveMyFile?</h2><p>Merge PDFs without installing desktop software. The tool is designed to be fast, simple and easy to use on mobile and desktop devices.</p><h2>Privacy</h2><p>For this browser-based tool, your PDF files are processed locally on your device and are not uploaded to iLoveMyFile servers.</p><h2>Frequently asked questions</h2><details><summary>Is this PDF merger free?</summary><p>Yes. The basic merger is free to use.</p></details><details><summary>How many PDFs can I merge?</summary><p>You can select multiple PDF files. Your browser's available memory determines practical limits.</p></details><details><summary>Are my files uploaded?</summary><p>No. This tool processes the selected PDFs in your browser.</p></details></div>
</div>
<aside class="tool-side"><div class="side-card"><div class="eyebrow">Related tools</div><a href="/split-pdf">Split PDF</a><a href="/compress-pdf">Compress PDF</a></div></aside>
</div></section>
<script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
<script src="/assets/js/merge-pdf.js?v=3" defer></script>

<?php elseif ($toolSlug === 'compress-image'): ?>
<section class="section tool-section">
  <div class="container tool-layout">
    <div class="tool-main">
      <div class="tool-box compressor-tool-box">
        <div class="dropzone" id="imageDropzone">
          <div class="drop-icon">IMG</div>
          <h2>Compress an image to your target size</h2>
          <p>Reduce an image to a size you need for forms, websites, social uploads and more.</p>
          <label class="btn-primary file-btn">
            Choose image
            <input id="imageFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden>
          </label>
          <small>Processing happens in your browser. Your image is not uploaded.</small>
        </div>

        <div id="imageFileList" class="file-list" hidden></div>

        <div class="compress-controls" aria-label="Image compression settings">
          <section class="compress-step">
            <div class="compress-step-head">
              <span class="step-number">1</span>
              <div>
                <h3>Target file size</h3>
                <p>Choose a quick target or enter your own.</p>
              </div>
            </div>
            <div class="target-presets" role="group" aria-label="Quick target sizes">
              <button type="button" class="target-preset is-selected" data-target="50" data-unit="KB">50 KB</button>
              <button type="button" class="target-preset" data-target="100" data-unit="KB">100 KB</button>
              <button type="button" class="target-preset" data-target="200" data-unit="KB">200 KB</button>
              <button type="button" class="target-preset" data-target="300" data-unit="KB">300 KB</button>
              <button type="button" class="target-preset" data-target="500" data-unit="KB">500 KB</button>
              <button type="button" class="target-preset" data-target="1024" data-unit="KB">1 MB</button>
              <button type="button" class="target-preset" data-target="custom" data-unit="KB">Custom</button>
            </div>

            <div class="custom-size-panel" id="customSizeGroup" hidden>
              <label for="customSize">Custom size</label>
              <div class="size-input-row">
                <input id="customSize" type="number" inputmode="decimal" min="0.01" step="0.01" value="200" aria-describedby="customSizeHint customSizeMessage">
                <select id="sizeUnit" aria-label="Custom size unit">
                  <option value="KB" selected>KB</option>
                  <option value="MB">MB</option>
                </select>
              </div>
              <small id="customSizeHint">KB mode: 10–500 KB. MB mode: 0.01–10 MB.</small>
              <div id="customSizeMessage" class="field-error" hidden></div>
            </div>
          </section>

          <section class="compress-step">
            <div class="compress-step-head">
              <span class="step-number">2</span>
              <div>
                <h3>Output format</h3>
                <p>Choose the format you want to download.</p>
              </div>
            </div>
            <div class="format-options" role="radiogroup" aria-label="Output format">
              <label class="format-option is-selected"><input type="radio" name="outputFormat" value="image/jpeg" checked><span>JPG</span></label>
              <label class="format-option"><input type="radio" name="outputFormat" value="image/webp"><span>WebP</span></label>
              <label class="format-option"><input type="radio" name="outputFormat" value="image/png"><span>PNG</span></label>
              <label class="format-option" id="avifFormatOption"><input type="radio" name="outputFormat" value="image/avif"><span>AVIF</span></label>
            </div>
            <div class="format-note" id="formatNote">JPG is the easiest default for photographs and target-size compression.</div>
          </section>
        </div>

        <p class="tool-hint" id="qualityHint">Choose a target and upload an image to begin.</p>

        <div class="tool-actions">
          <button class="btn-primary" id="compressBtn" type="button" disabled>Compress image →</button>
          <button class="btn-secondary" id="compressClearBtn" type="button" hidden>Clear</button>
        </div>

        <div id="compressResult" class="result-box" hidden></div>
      </div>

      <div class="tool-content">
        <h2>Compress images to a specific file size</h2>
        <p>Need an image under a specific upload limit? Pick a preset such as 50 KB, 100 KB, 200 KB, 300 KB, 500 KB or 1 MB, or enter a custom target.</p>

        <h2>How to use the image compressor</h2>
        <ol>
          <li>Choose a JPG, PNG, WebP, GIF or other supported image.</li>
          <li>Select a target size or choose <strong>Custom</strong>.</li>
          <li>If using Custom, enter a valid value and choose KB or MB.</li>
          <li>Choose an output format and click <strong>Compress image</strong>.</li>
        </ol>

        <h2>Target-size validation</h2>
        <p>Custom targets are deliberately limited to <strong>10–500 KB in KB mode</strong> and <strong>0.01–10 MB in MB mode</strong>. Invalid values are blocked before processing starts.</p>

        <h2>Private browser-based compression</h2>
        <p>This browser-based tool processes your selected image on your device. The image does not need to be uploaded to iLoveMyFile servers for this tool.</p>

        <h2>Frequently asked questions</h2>
        <details><summary>Can I compress an image to 50 KB or 200 KB?</summary><p>Yes. Choose a preset target or use Custom.</p></details>
        <details><summary>Can I enter 501 KB or 20 MB?</summary><p>No. Custom KB mode stops at 500 KB and custom MB mode stops at 10 MB. The Compress button remains disabled when the value is invalid.</p></details>
        <details><summary>Which output format should I choose?</summary><p>JPG is a practical default for photographs. WebP and AVIF can provide strong compression for web images. PNG is useful when lossless output or transparency matters.</p></details>
      </div>
    </div>

    <aside class="tool-side">
      <div class="side-card">
        <div class="eyebrow">Related tools</div>
        <a href="/merge-pdf">Merge PDF</a>
        <a href="/split-pdf">Split PDF</a>
        <a href="/compress-pdf">Compress PDF</a>
      </div>
    </aside>
  </div>
</section>
<script src="/assets/js/target-size-image-compressor.js?v=6" defer></script>

<?php elseif ($toolSlug === 'split-pdf'): ?>
<section class="section tool-section">
  <div class="container tool-layout">
    <div class="tool-main">
      <div class="tool-box">
        <div class="dropzone" id="splitDropzone">
          <div class="drop-icon">PDF</div>
          <h2>Split a PDF file</h2>
          <p>Drag and drop a PDF here, or choose a file from your device.</p>
          <label class="btn-primary file-btn">
            Choose PDF file
            <input id="splitPdfFile" type="file" accept="application/pdf,.pdf" hidden>
          </label>
          <small>Processing happens in your browser. Your PDF is not uploaded.</small>
        </div>

        <div id="splitFileInfo" class="file-list" hidden></div>

        <div class="compress-controls" aria-label="Split PDF settings">
          <section class="compress-step">
            <div class="compress-step-head">
              <span class="step-number">1</span>
              <div>
                <h3>Split mode</h3>
                <p>Choose which pages to extract.</p>
              </div>
            </div>
            <div class="target-presets" id="splitModePresets" role="group" aria-label="Split mode">
              <button type="button" class="target-preset is-selected" data-mode="all">All pages</button>
              <button type="button" class="target-preset" data-mode="odd">Odd pages</button>
              <button type="button" class="target-preset" data-mode="even">Even pages</button>
              <button type="button" class="target-preset" data-mode="custom">Custom range</button>
            </div>

            <div class="custom-size-panel" id="customRangeGroup" hidden>
              <label for="customRange">Custom range</label>
              <div class="size-input-row">
                <input id="customRange" type="text" inputmode="text" placeholder="e.g. 1-3, 5, 8-10" aria-describedby="customRangeHint customRangeMessage">
              </div>
              <small id="customRangeHint">Use page numbers and ranges separated by commas, e.g. 1-3, 5, 8-10.</small>
              <div id="customRangeMessage" class="field-error" hidden></div>
            </div>
          </section>

          <section class="compress-step">
            <div class="compress-step-head">
              <span class="step-number">2</span>
              <div>
                <h3>Output</h3>
                <p>Choose how the split pages should be delivered.</p>
              </div>
            </div>
            <div class="format-options" id="splitOutputOptions" role="radiogroup" aria-label="Output type">
              <label class="format-option is-selected"><input type="radio" name="splitOutput" value="separate" checked><span>Separate PDFs</span></label>
              <label class="format-option"><input type="radio" name="splitOutput" value="single"><span>Single PDF</span></label>
            </div>
            <div class="format-note" id="splitOutputNote">Each selected page or range is saved as its own PDF file inside a ZIP.</div>
          </section>
        </div>

        <p class="tool-hint" id="splitHint">Upload a PDF to begin.</p>

        <div class="tool-actions">
          <button class="btn-primary" id="splitBtn" type="button" disabled>Split PDF →</button>
          <button class="btn-secondary" id="splitClearBtn" type="button" hidden>Clear</button>
        </div>

        <div id="splitResult" class="result-box" hidden></div>
      </div>

      <div class="tool-content">
        <h2>Split a PDF by page range</h2>
        <p>Extract specific pages from a PDF, or divide a document into odd pages, even pages, or every page as its own file. Useful for pulling a contract page out of a scan, separating chapters, or breaking a large PDF into smaller pieces.</p>

        <h2>How to use the PDF splitter</h2>
        <ol>
          <li>Choose a PDF file from your device.</li>
          <li>Select a split mode: all pages, odd pages, even pages, or a custom range.</li>
          <li>If using a custom range, enter page numbers such as <strong>1-3, 5, 8-10</strong>.</li>
          <li>Choose whether you want separate PDFs in a ZIP, or one combined PDF, then click <strong>Split PDF</strong>.</li>
        </ol>

        <h2>Custom range format</h2>
        <p>Separate individual pages and ranges with commas, for example <strong>1-3, 5, 8-10</strong>. Page numbers must be within the document's page count, and a range's first number must not be greater than its second number.</p>

        <h2>Private browser-based splitting</h2>
        <p>This browser-based tool processes your selected PDF on your device. The file does not need to be uploaded to iLoveMyFile servers for this tool.</p>

        <h2>Frequently asked questions</h2>
        <details><summary>Can I extract just a few pages from a large PDF?</summary><p>Yes. Choose Custom range and enter the page numbers or ranges you want, such as 1-3, 5, 8-10.</p></details>
        <details><summary>What's the difference between separate PDFs and a single PDF?</summary><p>Separate PDFs gives you one file per page or range, delivered in a ZIP. Single PDF combines your selected pages into one new PDF.</p></details>
        <details><summary>Are my files uploaded to a server?</summary><p>No. This tool processes the selected PDF in your browser.</p></details>
      </div>
    </div>

    <aside class="tool-side">
      <div class="side-card">
        <div class="eyebrow">Related PDF tools</div>
        <a href="/merge-pdf">Merge PDF</a>
        <a href="/compress-pdf">Compress PDF</a>
      </div>
    </aside>
  </div>
</section>
<script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="/assets/js/split-pdf.js?v=1" defer></script>

<?php elseif ($toolSlug === 'compress-pdf'): ?>
<section class="section tool-section">
  <div class="container tool-layout">
    <div class="tool-main">
      <div class="tool-box">
        <div class="dropzone" id="compressPdfDropzone">
          <div class="drop-icon">PDF</div>
          <h2>Compress a PDF file</h2>
          <p>Drag and drop a PDF here, or choose a file from your device.</p>
          <label class="btn-primary file-btn">
            Choose PDF file
            <input id="compressPdfFile" type="file" accept="application/pdf,.pdf" hidden>
          </label>
          <small>Processing happens in your browser. Your PDF is not uploaded.</small>
        </div>

        <div id="compressFileInfo" class="file-list" hidden></div>

        <p class="tool-hint" id="compressHint">Upload a PDF to begin.</p>

        <div class="tool-actions">
          <button class="btn-primary" id="compressBtn" type="button" disabled>Compress PDF →</button>
          <button class="btn-secondary" id="compressClearBtn" type="button" hidden>Clear</button>
        </div>

        <div id="compressResult" class="result-box" hidden></div>
      </div>

      <div class="tool-content">
        <h2>Frequently asked questions</h2>
        <details><summary>Will compressing reduce quality?</summary><p>No. This tool does not alter your PDF's text, images or layout — it only optimizes how the file is stored.</p></details>
        <details><summary>Why did my PDF only shrink a little, or not at all?</summary><p>PDFs made mostly of large embedded photos, or already well-optimized files, have less to gain from structural optimization. If there's nothing worth optimizing, your original file is returned unchanged rather than a larger one.</p></details>
        <details><summary>Are my files uploaded to a server?</summary><p>No. This tool processes your PDF in your browser.</p></details>
      </div>
    </div>

    <aside class="tool-side">
      <div class="side-card">
        <div class="eyebrow">Related PDF tools</div>
        <a href="/merge-pdf">Merge PDF</a>
        <a href="/split-pdf">Split PDF</a>
      </div>
    </aside>
  </div>
</section>
<script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
<script src="/assets/js/compress-pdf.js?v=3" defer></script>

<?php elseif ($tool['view'] === 'image-to-pdf'):
    $accept = $tool['accept'] ?? 'image/jpeg,image/png,image/webp';
    $acceptLabel = [
        'jpg-to-pdf' => 'JPG',
        'png-to-pdf' => 'PNG',
        'image-to-pdf' => 'JPG, PNG or WebP',
    ][$toolSlug] ?? 'image';
?>
<section class="section tool-section">
  <div class="container tool-layout">
    <div class="tool-main">
      <div class="tool-box">
        <div class="dropzone" id="imgPdfDropzone">
          <div class="drop-icon">PDF</div>
          <h2>Convert <?= htmlspecialchars($acceptLabel, ENT_QUOTES, 'UTF-8') ?> to PDF</h2>
          <p>Drag and drop <?= htmlspecialchars($acceptLabel, ENT_QUOTES, 'UTF-8') ?> images here, or choose files from your device.</p>
          <label class="btn-primary file-btn">
            Choose images
            <input id="imgPdfFile" type="file" accept="<?= htmlspecialchars($accept, ENT_QUOTES, 'UTF-8') ?>" multiple hidden>
          </label>
          <small>Processing happens in your browser. Your images are not uploaded.</small>
        </div>

        <div id="imgPdfFileList" class="file-list" hidden></div>
        <p class="tool-hint" id="imgPdfReorderHint" hidden>Drag the rows above to change page order.</p>

        <p class="tool-hint" id="imgPdfHint">Upload one or more images to begin.</p>

        <div class="tool-actions">
          <button class="btn-primary" id="imgPdfBtn" type="button" disabled>Convert to PDF →</button>
          <button class="btn-secondary" id="imgPdfClearBtn" type="button" hidden>Clear</button>
        </div>

        <div id="imgPdfResult" class="result-box" hidden></div>
      </div>

      <div class="tool-content">
        <h2>Frequently asked questions</h2>
        <details><summary>Can I convert more than one image?</summary><p>Yes. Add as many images as you need — each becomes its own page, in the order shown. Drag a row to reorder it before converting.</p></details>
        <details><summary>Will image quality be reduced?</summary><p>No. Each image is placed on its own PDF page at its original resolution.</p></details>
        <details><summary>Are my files uploaded to a server?</summary><p>No. This tool processes your images in your browser.</p></details>
      </div>
    </div>

    <aside class="tool-side">
      <div class="side-card">
        <div class="eyebrow">Related PDF tools</div>
        <?php foreach (['jpg-to-pdf' => 'JPG to PDF', 'png-to-pdf' => 'PNG to PDF', 'image-to-pdf' => 'Image to PDF', 'merge-pdf' => 'Merge PDF'] as $relSlug => $relName): ?>
          <?php if ($relSlug !== $toolSlug): ?>
            <a href="/<?= htmlspecialchars($relSlug, ENT_QUOTES, 'UTF-8') ?>"><?= htmlspecialchars($relName, ENT_QUOTES, 'UTF-8') ?></a>
          <?php endif; ?>
        <?php endforeach; ?>
      </div>
    </aside>
  </div>
</section>
<script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
<script src="/assets/js/image-to-pdf.js?v=1" defer></script>

<?php elseif ($tool['view'] === 'pdf-to-jpg'): ?>
<section class="section tool-section">
  <div class="container tool-layout">
    <div class="tool-main">
      <div class="tool-box">
        <div class="dropzone" id="pdfJpgDropzone">
          <div class="drop-icon">PDF</div>
          <h2>Convert PDF to JPG</h2>
          <p>Drag and drop a PDF here, or choose a file from your device.</p>
          <label class="btn-primary file-btn">
            Choose PDF file
            <input id="pdfJpgFile" type="file" accept="application/pdf,.pdf" hidden>
          </label>
          <small>Processing happens in your browser. Your PDF is not uploaded.</small>
        </div>

        <div id="pdfJpgFileInfo" class="file-list" hidden></div>

        <p class="tool-hint" id="pdfJpgHint">Upload a PDF to begin.</p>

        <div class="tool-actions">
          <button class="btn-primary" id="pdfJpgBtn" type="button" disabled>Convert to JPG →</button>
          <button class="btn-secondary" id="pdfJpgClearBtn" type="button" hidden>Clear</button>
        </div>

        <div id="pdfJpgProgress" class="tool-hint" hidden></div>
        <div id="pdfJpgResult" class="result-box" hidden></div>
      </div>

      <div class="tool-content">
        <h2>Frequently asked questions</h2>
        <details><summary>How many JPG images will I get?</summary><p>One JPG per page. If your PDF has more than one page, all the JPGs are delivered together in a ZIP file.</p></details>
        <details><summary>Will the images be high quality?</summary><p>Yes. Pages are rendered at a resolution suited for screen and everyday printing use.</p></details>
        <details><summary>Are my files uploaded to a server?</summary><p>No. This tool processes your PDF in your browser.</p></details>
      </div>
    </div>

    <aside class="tool-side">
      <div class="side-card">
        <div class="eyebrow">Related PDF tools</div>
        <a href="/image-to-pdf">Image to PDF</a>
        <a href="/split-pdf">Split PDF</a>
        <a href="/compress-pdf">Compress PDF</a>
      </div>
    </aside>
  </div>
</section>
<script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.min.mjs" type="module"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="/assets/js/pdf-to-jpg.js?v=1" defer></script>

<?php elseif ($toolSlug === 'rotate-pdf'): ?>
<section class="section tool-section">
  <div class="container tool-layout">
    <div class="tool-main">
      <div class="tool-box">
        <div class="dropzone" id="rotatePdfDropzone">
          <div class="drop-icon">PDF</div>
          <h2>Rotate a PDF file</h2>
          <p>Drag and drop a PDF here, or choose a file from your device.</p>
          <label class="btn-primary file-btn">
            Choose PDF file
            <input id="rotatePdfFile" type="file" accept="application/pdf,.pdf" hidden>
          </label>
          <small>Processing happens in your browser. Your PDF is not uploaded.</small>
        </div>

        <div id="rotateFileInfo" class="file-list" hidden></div>

        <div class="compress-controls" aria-label="Rotation angle">
          <div class="target-presets" id="rotateAnglePresets" role="group" aria-label="Rotation angle">
            <button type="button" class="target-preset" data-angle="-90">Rotate left 90°</button>
            <button type="button" class="target-preset is-selected" data-angle="90">Rotate right 90°</button>
            <button type="button" class="target-preset" data-angle="180">Rotate 180°</button>
          </div>
        </div>

        <p class="tool-hint" id="rotateHint">Upload a PDF to begin.</p>

        <div class="tool-actions">
          <button class="btn-primary" id="rotateBtn" type="button" disabled>Rotate PDF →</button>
          <button class="btn-secondary" id="rotateClearBtn" type="button" hidden>Clear</button>
        </div>

        <div id="rotateResult" class="result-box" hidden></div>
      </div>

      <div class="tool-content">
        <h2>Frequently asked questions</h2>
        <details><summary>Does this rotate every page?</summary><p>Yes. The chosen rotation is applied to every page in the PDF.</p></details>
        <details><summary>Will this reduce quality?</summary><p>No. Rotation only changes page orientation — the content itself is untouched.</p></details>
        <details><summary>Are my files uploaded to a server?</summary><p>No. This tool processes your PDF in your browser.</p></details>
      </div>
    </div>

    <aside class="tool-side">
      <div class="side-card">
        <div class="eyebrow">Related PDF tools</div>
        <a href="/split-pdf">Split PDF</a>
        <a href="/compress-pdf">Compress PDF</a>
        <a href="/merge-pdf">Merge PDF</a>
      </div>
    </aside>
  </div>
</section>
<script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
<script src="/assets/js/rotate-pdf.js?v=1" defer></script>

<?php elseif ($tool['view'] === 'image-convert'):
    $fromMime = $tool['from'];
    $toMime = $tool['to'];
    $fromLabel = strtoupper(str_replace('image/', '', $fromMime === 'image/jpeg' ? 'jpg' : $fromMime));
    $toLabel = strtoupper(str_replace('image/', '', $toMime === 'image/jpeg' ? 'jpg' : $toMime));
    $toExt = $toMime === 'image/jpeg' ? 'jpg' : ($toMime === 'image/png' ? 'png' : 'webp');

    $allImageTools = ['jpg-to-webp' => 'JPG to WebP', 'png-to-webp' => 'PNG to WebP', 'webp-to-jpg' => 'WebP to JPG', 'webp-to-png' => 'WebP to PNG'];
?>
<section class="section tool-section">
  <div class="container tool-layout">
    <div class="tool-main">
      <div class="tool-box">
        <div class="dropzone" id="imgConvertDropzone">
          <div class="drop-icon">IMG</div>
          <h2>Convert <?= htmlspecialchars($fromLabel, ENT_QUOTES, 'UTF-8') ?> to <?= htmlspecialchars($toLabel, ENT_QUOTES, 'UTF-8') ?></h2>
          <p>Drag and drop <?= htmlspecialchars($fromLabel, ENT_QUOTES, 'UTF-8') ?> images here, or choose files from your device.</p>
          <label class="btn-primary file-btn">
            Choose images
            <input id="imgConvertFile" type="file" accept="<?= htmlspecialchars($fromMime, ENT_QUOTES, 'UTF-8') ?>" multiple hidden>
          </label>
          <small>Processing happens in your browser. Your images are not uploaded.</small>
        </div>

        <div id="imgConvertFileList" class="file-list" hidden></div>

        <p class="tool-hint" id="imgConvertHint" data-to-mime="<?= htmlspecialchars($toMime, ENT_QUOTES, 'UTF-8') ?>" data-to-ext="<?= htmlspecialchars($toExt, ENT_QUOTES, 'UTF-8') ?>" data-to-label="<?= htmlspecialchars($toLabel, ENT_QUOTES, 'UTF-8') ?>">Upload one or more <?= htmlspecialchars($fromLabel, ENT_QUOTES, 'UTF-8') ?> images to begin.</p>

        <div class="tool-actions">
          <button class="btn-primary" id="imgConvertBtn" type="button" disabled>Convert to <?= htmlspecialchars($toLabel, ENT_QUOTES, 'UTF-8') ?> →</button>
          <button class="btn-secondary" id="imgConvertClearBtn" type="button" hidden>Clear</button>
        </div>

        <div id="imgConvertResult" class="result-box" hidden></div>
      </div>

      <div class="tool-content">
        <h2>Frequently asked questions</h2>
        <details><summary>Can I convert more than one image at once?</summary><p>Yes. Add as many <?= htmlspecialchars($fromLabel, ENT_QUOTES, 'UTF-8') ?> images as you need. If you add more than one, they're delivered together in a ZIP.</p></details>
        <details><summary>Will image quality be affected?</summary><p>Images are re-encoded at a high quality setting. Some quality change is inherent to converting between formats, but it should not be visually noticeable for most images.</p></details>
        <details><summary>Are my files uploaded to a server?</summary><p>No. This tool processes your images in your browser.</p></details>
      </div>
    </div>

    <aside class="tool-side">
      <div class="side-card">
        <div class="eyebrow">Related image tools</div>
        <?php foreach ($allImageTools as $relSlug => $relName): ?>
          <?php if ($relSlug !== $toolSlug): ?>
            <a href="/<?= htmlspecialchars($relSlug, ENT_QUOTES, 'UTF-8') ?>"><?= htmlspecialchars($relName, ENT_QUOTES, 'UTF-8') ?></a>
          <?php endif; ?>
        <?php endforeach; ?>
        <a href="/compress-image">Compress Image</a>
      </div>
    </aside>
  </div>
</section>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="/assets/js/image-convert.js?v=1" defer></script>

<?php elseif ($toolSlug === 'resize-image'): ?>
<section class="section tool-section">
  <div class="container tool-layout">
    <div class="tool-main">
      <div class="tool-box">
        <div class="dropzone" id="resizeDropzone">
          <div class="drop-icon">IMG</div>
          <h2>Resize an image</h2>
          <p>Drag and drop a JPG, PNG or WebP image here, or choose a file from your device.</p>
          <label class="btn-primary file-btn">
            Choose Image
            <input id="resizeFile" type="file" accept="image/jpeg,image/png,image/webp" hidden>
          </label>
          <small>Processing happens in your browser. Your image is not uploaded.</small>
        </div>

        <div id="resizeFileInfo" class="file-list" hidden></div>

        <div class="compress-controls" aria-label="Resize settings">
          <section class="compress-step">
            <div class="compress-step-head">
              <span class="step-number">1</span>
              <div>
                <h3>Resize mode</h3>
                <p>Choose how you want to specify the new size.</p>
              </div>
            </div>
            <div class="target-presets" id="resizeModePresets" role="group" aria-label="Resize mode">
              <button type="button" class="target-preset is-selected" data-mode="exact">Exact size</button>
              <button type="button" class="target-preset" data-mode="percent">Percentage</button>
              <button type="button" class="target-preset" data-mode="preset">Common sizes</button>
            </div>

            <div class="custom-size-panel" id="exactSizeGroup">
              <div class="dimension-row">
                <div class="dimension-field">
                  <label for="resizeWidth">Width (px)</label>
                  <input id="resizeWidth" type="text" inputmode="numeric" placeholder="e.g. 1920">
                </div>
                <button type="button" id="aspectLockBtn" class="aspect-lock is-locked" aria-pressed="true" aria-label="Lock aspect ratio">🔒</button>
                <div class="dimension-field">
                  <label for="resizeHeight">Height (px)</label>
                  <input id="resizeHeight" type="text" inputmode="numeric" placeholder="e.g. 1080">
                </div>
              </div>
              <small id="aspectLockHint">Aspect ratio is locked — width and height update together.</small>
              <div id="exactSizeMessage" class="field-error" hidden></div>
            </div>

            <div class="custom-size-panel" id="percentSizeGroup" hidden>
              <label for="resizePercent">Scale</label>
              <div class="size-input-row">
                <input id="resizePercent" type="text" inputmode="numeric" placeholder="e.g. 50" value="50">
                <span class="unit-suffix">%</span>
              </div>
              <small>Enter a value between 1 and 200.</small>
              <div id="percentSizeMessage" class="field-error" hidden></div>
            </div>

            <div class="custom-size-panel" id="presetSizeGroup" hidden>
              <div class="target-presets" id="resizePresetSizes" role="group" aria-label="Common sizes">
                <button type="button" class="target-preset" data-w="1080" data-h="1080">1080 × 1080</button>
                <button type="button" class="target-preset" data-w="1920" data-h="1080">1920 × 1080</button>
                <button type="button" class="target-preset" data-w="1280" data-h="720">1280 × 720</button>
                <button type="button" class="target-preset" data-w="800" data-h="800">800 × 800</button>
              </div>
            </div>
          </section>
        </div>

        <p class="tool-hint" id="resizeHint">Upload an image to begin.</p>

        <div class="tool-actions">
          <button class="btn-primary" id="resizeBtn" type="button" disabled>Resize Image →</button>
          <button class="btn-secondary" id="resizeClearBtn" type="button" hidden>Clear</button>
        </div>

        <div id="resizeResult" class="result-box" hidden></div>
      </div>

      <div class="tool-content">
        <h2>Frequently asked questions</h2>
        <details><summary>Will resizing distort my image?</summary><p>Not with exact size or common sizes, as long as aspect ratio stays locked. Unlocking it lets you set width and height independently, which can stretch the image.</p></details>
        <details><summary>Can I make an image larger, not just smaller?</summary><p>Yes, though enlarging an image beyond its original resolution can make it look softer, since no new detail is created.</p></details>
        <details><summary>Are my files uploaded to a server?</summary><p>No. This tool processes your image in your browser.</p></details>
      </div>
    </div>

    <aside class="tool-side">
      <div class="side-card">
        <div class="eyebrow">Related image tools</div>
        <a href="/compress-image">Compress Image</a>
        <a href="/jpg-to-webp">JPG to WebP</a>
        <a href="/image-to-pdf">Image to PDF</a>
      </div>
    </aside>
  </div>
</section>
<script src="/assets/js/resize-image.js?v=1" defer></script>

<?php elseif ($toolSlug === 'add-page-numbers'): ?>
<section class="section tool-section">
  <div class="container tool-layout">
    <div class="tool-main">
      <div class="tool-box">
        <div class="dropzone" id="pageNumDropzone">
          <div class="drop-icon">PDF</div>
          <h2>Add page numbers to a PDF</h2>
          <p>Drag and drop a PDF here, or choose a file from your device.</p>
          <label class="btn-primary file-btn">
            Choose PDF file
            <input id="pageNumFile" type="file" accept="application/pdf,.pdf" hidden>
          </label>
          <small>Processing happens in your browser. Your PDF is not uploaded.</small>
        </div>

        <div id="pageNumFileInfo" class="file-list" hidden></div>

        <div class="compress-controls" aria-label="Page number settings">
          <div class="target-presets" id="pageNumPositionPresets" role="group" aria-label="Position">
            <button type="button" class="target-preset" data-position="bottom-left">Bottom left</button>
            <button type="button" class="target-preset is-selected" data-position="bottom-center">Bottom center</button>
            <button type="button" class="target-preset" data-position="bottom-right">Bottom right</button>
          </div>

          <div class="custom-size-panel">
            <label for="pageNumStart">Start numbering at</label>
            <div class="size-input-row">
              <input id="pageNumStart" type="text" inputmode="numeric" value="1">
            </div>
            <small>Most people can leave this as 1.</small>
            <div id="pageNumStartMessage" class="field-error" hidden></div>
          </div>
        </div>

        <p class="tool-hint" id="pageNumHint">Upload a PDF to begin.</p>

        <div class="tool-actions">
          <button class="btn-primary" id="pageNumBtn" type="button" disabled>Add Page Numbers →</button>
          <button class="btn-secondary" id="pageNumClearBtn" type="button" hidden>Clear</button>
        </div>

        <div id="pageNumResult" class="result-box" hidden></div>
      </div>

      <div class="tool-content">
        <h2>Frequently asked questions</h2>
        <details><summary>Does this number every page?</summary><p>Yes. Every page gets a number, starting from the number you choose.</p></details>
        <details><summary>Can I change the starting number?</summary><p>Yes. Enter any starting number — useful if this PDF continues from another document.</p></details>
        <details><summary>Are my files uploaded to a server?</summary><p>No. This tool processes your PDF in your browser.</p></details>
      </div>
    </div>

    <aside class="tool-side">
      <div class="side-card">
        <div class="eyebrow">Related PDF tools</div>
        <a href="/rotate-pdf">Rotate PDF</a>
        <a href="/merge-pdf">Merge PDF</a>
        <a href="/compress-pdf">Compress PDF</a>
      </div>
    </aside>
  </div>
</section>
<script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
<script src="/assets/js/add-page-numbers.js?v=1" defer></script>

<?php elseif ($toolSlug === 'remove-pdf-pages'): ?>
<section class="section tool-section">
  <div class="container tool-layout">
    <div class="tool-main">
      <div class="tool-box">
        <div class="dropzone" id="removePagesDropzone">
          <div class="drop-icon">PDF</div>
          <h2>Remove pages from a PDF</h2>
          <p>Drag and drop a PDF here, or choose a file from your device.</p>
          <label class="btn-primary file-btn">
            Choose PDF file
            <input id="removePagesFile" type="file" accept="application/pdf,.pdf" hidden>
          </label>
          <small>Processing happens in your browser. Your PDF is not uploaded.</small>
        </div>

        <div id="removePagesFileInfo" class="file-list" hidden></div>

        <div class="custom-size-panel">
          <label for="removePagesInput">Pages to remove</label>
          <div class="size-input-row">
            <input id="removePagesInput" type="text" inputmode="text" placeholder="e.g. 2, 4-6">
          </div>
          <small id="removePagesHintText">Use page numbers and ranges separated by commas, e.g. 2, 4-6.</small>
          <div id="removePagesMessage" class="field-error" hidden></div>
        </div>

        <p class="tool-hint" id="removePagesHint">Upload a PDF to begin.</p>

        <div class="tool-actions">
          <button class="btn-primary" id="removePagesBtn" type="button" disabled>Remove Pages →</button>
          <button class="btn-secondary" id="removePagesClearBtn" type="button" hidden>Clear</button>
        </div>

        <div id="removePagesResult" class="result-box" hidden></div>
      </div>

      <div class="tool-content">
        <h2>Frequently asked questions</h2>
        <details><summary>How do I remove more than one page?</summary><p>Separate pages and ranges with commas, for example 2, 4-6 removes page 2 and pages 4 through 6.</p></details>
        <details><summary>Can I remove every page?</summary><p>No. A PDF needs at least one page, so you can't remove all of them at once.</p></details>
        <details><summary>Are my files uploaded to a server?</summary><p>No. This tool processes your PDF in your browser.</p></details>
      </div>
    </div>

    <aside class="tool-side">
      <div class="side-card">
        <div class="eyebrow">Related PDF tools</div>
        <a href="/split-pdf">Split PDF</a>
        <a href="/extract-pdf-pages">Extract PDF Pages</a>
        <a href="/merge-pdf">Merge PDF</a>
      </div>
    </aside>
  </div>
</section>
<script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
<script src="/assets/js/remove-pdf-pages.js?v=1" defer></script>

<?php elseif ($toolSlug === 'extract-pdf-pages'): ?>
<section class="section tool-section">
  <div class="container tool-layout">
    <div class="tool-main">
      <div class="tool-box">
        <div class="dropzone" id="extractPagesDropzone">
          <div class="drop-icon">PDF</div>
          <h2>Extract pages from a PDF</h2>
          <p>Drag and drop a PDF here, or choose a file from your device.</p>
          <label class="btn-primary file-btn">
            Choose PDF file
            <input id="extractPagesFile" type="file" accept="application/pdf,.pdf" hidden>
          </label>
          <small>Processing happens in your browser. Your PDF is not uploaded.</small>
        </div>

        <div id="extractPagesFileInfo" class="file-list" hidden></div>

        <div class="custom-size-panel">
          <label for="extractPagesInput">Pages to extract</label>
          <div class="size-input-row">
            <input id="extractPagesInput" type="text" inputmode="text" placeholder="e.g. 1-3, 5">
          </div>
          <small id="extractPagesHintText">Use page numbers and ranges separated by commas, e.g. 1-3, 5. Extracted pages keep their original order.</small>
          <div id="extractPagesMessage" class="field-error" hidden></div>
        </div>

        <p class="tool-hint" id="extractPagesHint">Upload a PDF to begin.</p>

        <div class="tool-actions">
          <button class="btn-primary" id="extractPagesBtn" type="button" disabled>Extract Pages →</button>
          <button class="btn-secondary" id="extractPagesClearBtn" type="button" hidden>Clear</button>
        </div>

        <div id="extractPagesResult" class="result-box" hidden></div>
      </div>

      <div class="tool-content">
        <h2>Frequently asked questions</h2>
        <details><summary>What order will the extracted pages be in?</summary><p>Extracted pages keep their original order from the source PDF, regardless of the order you type them in.</p></details>
        <details><summary>What's the difference between this and Split PDF?</summary><p>Extract Pages always produces one new PDF from the pages you choose. Split PDF offers more modes, including separate files per page or range.</p></details>
        <details><summary>Are my files uploaded to a server?</summary><p>No. This tool processes your PDF in your browser.</p></details>
      </div>
    </div>

    <aside class="tool-side">
      <div class="side-card">
        <div class="eyebrow">Related PDF tools</div>
        <a href="/split-pdf">Split PDF</a>
        <a href="/remove-pdf-pages">Remove PDF Pages</a>
        <a href="/merge-pdf">Merge PDF</a>
      </div>
    </aside>
  </div>
</section>
<script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
<script src="/assets/js/extract-pdf-pages.js?v=1" defer></script>

<?php elseif ($toolSlug === 'json-formatter'): ?>
<section class="section tool-section">
  <div class="container tool-layout">
    <div class="tool-main">
      <div class="tool-box">
        <div class="code-toolbar">
          <label class="btn-secondary file-btn code-upload-btn">
            Upload .json file
            <input id="jsonFile" type="file" accept=".json,application/json,text/plain" hidden>
          </label>
          <button type="button" id="jsonSampleBtn" class="btn-secondary">Load example</button>
          <button type="button" id="jsonClearBtn" class="btn-secondary">Clear</button>
        </div>

        <div class="code-panel">
          <div class="code-panel-head">
            <span>Input</span>
          </div>
          <textarea id="jsonInput" class="code-textarea" spellcheck="false" placeholder='Paste your JSON here, e.g. {"name": "Ada", "active": true}'></textarea>
        </div>

        <p class="tool-hint" id="jsonHint">Paste JSON above, or upload a .json file.</p>

        <div class="tool-actions">
          <button class="btn-primary" id="jsonFormatBtn" type="button" disabled>Format JSON →</button>
          <button class="btn-secondary" id="jsonMinifyBtn" type="button" disabled>Minify</button>
        </div>

        <div id="jsonResult" class="result-box" hidden></div>

        <div class="code-panel" id="jsonOutputPanel" hidden>
          <div class="code-panel-head">
            <span>Output</span>
            <div class="code-panel-actions">
              <button type="button" id="jsonCopyBtn" class="btn-secondary">Copy</button>
              <button type="button" id="jsonDownloadBtn" class="btn-secondary">Download</button>
            </div>
          </div>
          <textarea id="jsonOutput" class="code-textarea" spellcheck="false" readonly></textarea>
        </div>
      </div>

      <div class="tool-content">
        <h2>Frequently asked questions</h2>
        <details><summary>What does this tool check?</summary><p>It checks that your JSON is syntactically valid, and if it is, formats it with clear, readable indentation. If it isn't valid, you'll see a specific error describing what's wrong.</p></details>
        <details><summary>Does formatting change my data?</summary><p>No. Formatting only changes whitespace and indentation — the values themselves are untouched.</p></details>
        <details><summary>Is my JSON uploaded to a server?</summary><p>No. This tool runs entirely in your browser.</p></details>
      </div>
    </div>

    <aside class="tool-side">
      <div class="side-card">
        <div class="eyebrow">Related developer tools</div>
        <a href="/">All tools</a>
      </div>
    </aside>
  </div>
</section>
<script src="/assets/js/json-formatter.js?v=1" defer></script>
<?php endif; ?>
</main>
<?php endif; ?>

<footer class="site-footer"><div class="container footer-grid"><div><a class="brand footer-brand" href="/"><img class="brand-logo" src="/assets/img/logo-main.png" alt="iLoveMyFile"></a><p>Simple online tools for your files, documents and everyday work.</p></div><div><h4>Tools</h4><a href="/merge-pdf">PDF Tools</a><a href="/#image-tools">Image Tools</a><a href="/#document-tools">Document Tools</a></div><div><h4>More</h4><a href="/#seo-tools">SEO Tools</a><a href="/#developer-tools">Developer Tools</a><a href="/#all-tools">All Tools</a></div><div><h4>Company</h4><a href="/privacy-policy">Privacy Policy</a><a href="/terms">Terms</a><a href="/contact">Contact</a></div></div><div class="container footer-bottom"><span>© <?= date('Y') ?> iLoveMyFile. All rights reserved.</span><span>Free · Fast · Private</span></div></footer>
<script src="/assets/js/app.js?v=2" defer></script>
</body></html>
