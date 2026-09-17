(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('extractPagesFile');
    const zone = document.getElementById('extractPagesDropzone');
    const fileInfo = document.getElementById('extractPagesFileInfo');
    const rangeInput = document.getElementById('extractPagesInput');
    const rangeMessage = document.getElementById('extractPagesMessage');
    const hint = document.getElementById('extractPagesHint');
    const extractBtn = document.getElementById('extractPagesBtn');
    const clearBtn = document.getElementById('extractPagesClearBtn');
    const result = document.getElementById('extractPagesResult');

    if (
      !input || !zone || !fileInfo || !rangeInput || !rangeMessage ||
      !hint || !extractBtn || !clearBtn || !result
    ) {
      return;
    }

    let currentFile = null;
    let pageCount = 0;

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, function (char) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        }[char];
      });
    }

    function formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    function clearResult() {
      result.hidden = true;
      result.innerHTML = '';
    }

    function showMessage(type, title, message) {
      result.className = 'result-box' + (type ? ' result-box--' + type : '');
      result.innerHTML = '<strong>' + escapeHtml(title) + '</strong><p>' + message + '</p>';
      result.hidden = false;
    }

    // Same validated range parser used by Split PDF and Remove PDF Pages:
    // parses "1-3, 5" style input into a sorted, de-duplicated list of
    // 0-based page indices, rejecting empty input, out-of-range pages,
    // reversed ranges, etc. Here the parsed pages are the ones KEPT.
    function parseCustomRange(value, totalPages) {
      const trimmed = (value || '').trim();

      if (!trimmed) {
        return { ok: false, message: 'Enter at least one page or range to extract.' };
      }

      const parts = trimmed.split(',').map(function (p) { return p.trim(); }).filter(Boolean);

      if (!parts.length) {
        return { ok: false, message: 'Enter at least one page or range to extract.' };
      }

      const pages = new Set();

      for (const part of parts) {
        const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
        const singleMatch = part.match(/^(\d+)$/);

        if (rangeMatch) {
          const start = parseInt(rangeMatch[1], 10);
          const end = parseInt(rangeMatch[2], 10);

          if (start < 1 || end < 1) {
            return { ok: false, message: 'Page numbers must be 1 or greater.' };
          }
          if (start > totalPages || end > totalPages) {
            return {
              ok: false,
              message: 'This PDF has ' + totalPages + ' page' + (totalPages === 1 ? '' : 's') + '. "' + part + '" is out of range.'
            };
          }
          if (start > end) {
            return { ok: false, message: '"' + part + '" is invalid. The first number must not be greater than the second.' };
          }

          for (let i = start; i <= end; i++) {
            pages.add(i - 1);
          }
        } else if (singleMatch) {
          const page = parseInt(singleMatch[1], 10);

          if (page < 1) {
            return { ok: false, message: 'Page numbers must be 1 or greater.' };
          }
          if (page > totalPages) {
            return {
              ok: false,
              message: 'This PDF has ' + totalPages + ' page' + (totalPages === 1 ? '' : 's') + '. Page ' + page + ' is out of range.'
            };
          }

          pages.add(page - 1);
        } else {
          return { ok: false, message: '"' + part + '" is not a valid page or range.' };
        }
      }

      if (!pages.size) {
        return { ok: false, message: 'Enter at least one valid page or range.' };
      }

      // Sorted ascending so extracted pages preserve their original document
      // order, regardless of the order the person typed them in (e.g.
      // "5, 1-3" still produces pages in the order 1,2,3,5).
      return { ok: true, pages: Array.from(pages).sort(function (a, b) { return a - b; }) };
    }

    function resolveExtraction() {
      if (!pageCount) {
        return { ok: false, message: 'Upload a PDF first.' };
      }
      return parseCustomRange(rangeInput.value, pageCount);
    }

    function renderFileInfo() {
      if (!currentFile) {
        fileInfo.hidden = true;
        fileInfo.innerHTML = '';
        return;
      }

      const row = document.createElement('div');
      row.className = 'file-row';

      const text = document.createElement('span');
      const pageLabel = pageCount ? (pageCount + ' page' + (pageCount === 1 ? '' : 's')) : 'Reading…';
      text.innerHTML =
        '<strong>' + escapeHtml(currentFile.name) + '</strong> ' +
        '<small>· ' + formatSize(currentFile.size) + ' · ' + escapeHtml(pageLabel) + '</small>';

      const removeFileBtn = document.createElement('button');
      removeFileBtn.type = 'button';
      removeFileBtn.setAttribute('aria-label', 'Remove ' + currentFile.name);
      removeFileBtn.textContent = '×';
      removeFileBtn.addEventListener('click', resetTool);

      row.appendChild(text);
      row.appendChild(removeFileBtn);

      fileInfo.innerHTML = '';
      fileInfo.appendChild(row);
      fileInfo.hidden = false;
    }

    function validateLive() {
      rangeMessage.hidden = true;
      rangeInput.classList.remove('is-invalid');

      if (!currentFile || !pageCount || !rangeInput.value.trim()) {
        return { ok: false };
      }

      const check = resolveExtraction();
      if (!check.ok) {
        rangeMessage.textContent = check.message;
        rangeMessage.hidden = false;
        rangeInput.classList.add('is-invalid');
      }
      return check;
    }

    function updateHint() {
      if (!currentFile) {
        hint.textContent = 'Upload a PDF to begin.';
        return;
      }
      if (!rangeInput.value.trim()) {
        hint.textContent = 'Enter which pages to extract.';
        return;
      }
      const check = resolveExtraction();
      if (check.ok) {
        hint.textContent = check.pages.length + ' page' + (check.pages.length === 1 ? '' : 's') + ' will be extracted into a new PDF.';
      } else {
        hint.textContent = check.message;
      }
    }

    function updateButtonState() {
      const check = (currentFile && pageCount && rangeInput.value.trim()) ? resolveExtraction() : { ok: false };
      extractBtn.disabled = !check.ok;
      clearBtn.hidden = !currentFile;
      updateHint();
    }

    function resetTool() {
      currentFile = null;
      pageCount = 0;
      rangeInput.value = '';
      input.value = '';
      renderFileInfo();
      clearResult();
      updateButtonState();
    }

    async function loadFile(file) {
      if (!file) return;

      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      if (!isPdf) {
        showMessage('error', 'Not a PDF file', 'Please choose a valid PDF file and try again.');
        return;
      }

      currentFile = file;
      pageCount = 0;
      clearResult();
      renderFileInfo();
      updateButtonState();

      if (!window.PDFLib || typeof window.PDFLib.PDFDocument !== 'function') {
        showMessage('error', 'PDF engine could not load', 'Please refresh the page and try again.');
        return;
      }

      try {
        const bytes = await file.arrayBuffer();
        const pdf = await window.PDFLib.PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });
        pageCount = pdf.getPageCount();
        renderFileInfo();
        validateLive();
        updateButtonState();
      } catch (error) {
        console.error('Extract PDF Pages - load error:', error);
        currentFile = null;
        pageCount = 0;
        renderFileInfo();

        let message = 'This file could not be read as a PDF. Please check the file and try again.';
        if (error && /encrypted|password/i.test(String(error.message || error))) {
          message = 'This PDF appears to be password-protected or encrypted. Remove the protection and try again.';
        }
        showMessage('error', 'Could not open the PDF', message);
        updateButtonState();
      }
    }

    input.addEventListener('change', function () {
      loadFile(input.files && input.files[0]);
      input.value = '';
    });

    ['dragenter', 'dragover'].forEach(function (eventName) {
      zone.addEventListener(eventName, function (event) {
        event.preventDefault();
        event.stopPropagation();
        zone.classList.add('is-dragover');
      });
    });

    ['dragleave', 'drop'].forEach(function (eventName) {
      zone.addEventListener(eventName, function (event) {
        event.preventDefault();
        event.stopPropagation();
        zone.classList.remove('is-dragover');
      });
    });

    zone.addEventListener('drop', function (event) {
      const file = event.dataTransfer.files && event.dataTransfer.files[0];
      loadFile(file);
    });

    rangeInput.addEventListener('input', function () {
      validateLive();
      updateButtonState();
    });

    clearBtn.addEventListener('click', resetTool);

    extractBtn.addEventListener('click', async function () {
      if (!currentFile || !pageCount) {
        showMessage('error', 'No PDF selected', 'Choose a PDF file first.');
        return;
      }

      const check = resolveExtraction();
      if (!check.ok) {
        validateLive();
        updateButtonState();
        return;
      }

      if (!window.PDFLib || typeof window.PDFLib.PDFDocument !== 'function') {
        showMessage('error', 'PDF engine could not load', 'Please refresh the page and try again.');
        return;
      }

      const originalText = extractBtn.textContent;
      extractBtn.disabled = true;
      clearBtn.disabled = true;
      extractBtn.textContent = 'Extracting…';
      clearResult();

      try {
        const PDFDocument = window.PDFLib.PDFDocument;
        const sourceBytes = await currentFile.arrayBuffer();
        const sourcePdf = await PDFDocument.load(sourceBytes, { ignoreEncryption: false, updateMetadata: false });

        const outPdf = await PDFDocument.create();
        const copied = await outPdf.copyPages(sourcePdf, check.pages);
        copied.forEach(function (page) { outPdf.addPage(page); });

        const outBytes = await outPdf.save({ useObjectStreams: true, addDefaultPage: false });
        const blob = new Blob([outBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const baseName = currentFile.name.replace(/\.pdf$/i, '') || 'document';

        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = baseName + '-extracted.pdf';
        downloadLink.className = 'btn-primary';
        downloadLink.textContent = 'Download PDF →';

        result.className = 'result-box result-box--success';
        result.innerHTML = '';

        const heading = document.createElement('strong');
        heading.textContent = 'Pages extracted successfully';
        result.appendChild(heading);

        const note = document.createElement('p');
        note.textContent = check.pages.length + ' page' + (check.pages.length === 1 ? '' : 's') + ' extracted into a new PDF (' + formatSize(outBytes.length) + ').';
        result.appendChild(note);

        result.appendChild(downloadLink);
        result.hidden = false;

        setTimeout(function () { URL.revokeObjectURL(url); }, 120000);

      } catch (error) {
        console.error('Extract PDF Pages - error:', error);

        let message = 'This PDF could not be processed. Please check the file and try again.';
        if (error && /encrypted|password/i.test(String(error.message || error))) {
          message = 'This PDF appears to be password-protected or encrypted. Remove the protection and try again.';
        }
        showMessage('error', 'Could not extract pages', message);

      } finally {
        clearBtn.disabled = false;
        extractBtn.textContent = originalText;
        updateButtonState();
      }
    });

    updateButtonState();
  });
})();
