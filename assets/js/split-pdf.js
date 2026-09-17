(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('splitPdfFile');
    const zone = document.getElementById('splitDropzone');
    const fileInfo = document.getElementById('splitFileInfo');
    const modePresets = document.getElementById('splitModePresets');
    const customRangeGroup = document.getElementById('customRangeGroup');
    const customRangeInput = document.getElementById('customRange');
    const customRangeMessage = document.getElementById('customRangeMessage');
    const outputOptions = document.getElementById('splitOutputOptions');
    const outputNote = document.getElementById('splitOutputNote');
    const hint = document.getElementById('splitHint');
    const splitBtn = document.getElementById('splitBtn');
    const clearBtn = document.getElementById('splitClearBtn');
    const result = document.getElementById('splitResult');

    if (
      !input || !zone || !fileInfo || !modePresets || !customRangeGroup ||
      !customRangeInput || !customRangeMessage || !outputOptions ||
      !outputNote || !hint || !splitBtn || !clearBtn || !result
    ) {
      return;
    }

    let currentFile = null;
    let pageCount = 0;
    let splitMode = 'all';
    let outputType = 'separate';
    let customRangeValid = false;

    const OUTPUT_NOTES = {
      separate: 'Each selected page or range is saved as its own PDF file inside a ZIP.',
      single: 'All selected pages are combined into one new PDF, in the order they appear in the original file.'
    };

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

    function showResult(type, title, message, downloadLink) {
      result.className = 'result-box' + (type ? ' result-box--' + type : '');
      result.innerHTML = '<strong>' + escapeHtml(title) + '</strong><p>' + message + '</p>';
      if (downloadLink) {
        result.appendChild(downloadLink);
      }
      result.hidden = false;
    }

    function clearResult() {
      result.hidden = true;
      result.innerHTML = '';
    }

    // Parses a custom range string like "1-3, 5, 8-10" into a sorted, de-duplicated
    // list of 0-based page indices, validated against pageCount (1-based bounds).
    function parseCustomRange(value, totalPages) {
      const trimmed = (value || '').trim();

      if (!trimmed) {
        return { ok: false, message: 'Enter at least one page or range.' };
      }

      const parts = trimmed.split(',').map(function (p) { return p.trim(); }).filter(Boolean);

      if (!parts.length) {
        return { ok: false, message: 'Enter at least one page or range.' };
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

      return { ok: true, pages: Array.from(pages).sort(function (a, b) { return a - b; }) };
    }

    // Returns an array of "groups" (each an array of 0-based page indices).
    // For "separate" output each group becomes its own PDF; for "single" output
    // all groups are flattened into one PDF in page order.
    function resolvePageGroups() {
      if (splitMode === 'all') {
        const groups = [];
        for (let i = 0; i < pageCount; i++) groups.push([i]);
        return { ok: true, groups: groups };
      }

      if (splitMode === 'odd') {
        const groups = [];
        for (let i = 0; i < pageCount; i++) {
          if ((i + 1) % 2 === 1) groups.push([i]);
        }
        if (!groups.length) {
          return { ok: false, message: 'This PDF has no odd-numbered pages.' };
        }
        return { ok: true, groups: groups };
      }

      if (splitMode === 'even') {
        const groups = [];
        for (let i = 0; i < pageCount; i++) {
          if ((i + 1) % 2 === 0) groups.push([i]);
        }
        if (!groups.length) {
          return { ok: false, message: 'This PDF only has one page, so there are no even-numbered pages.' };
        }
        return { ok: true, groups: groups };
      }

      // custom
      const parsed = parseCustomRange(customRangeInput.value, pageCount);
      if (!parsed.ok) {
        return { ok: false, message: parsed.message };
      }

      if (outputType === 'single') {
        return { ok: true, groups: [parsed.pages] };
      }

      // Separate output for custom ranges: each comma-separated part becomes
      // its own group, preserving the user's original range groupings.
      const rawParts = customRangeInput.value.split(',').map(function (p) { return p.trim(); }).filter(Boolean);
      const groups = [];

      for (const part of rawParts) {
        const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
        const singleMatch = part.match(/^(\d+)$/);

        if (rangeMatch) {
          const start = parseInt(rangeMatch[1], 10);
          const end = parseInt(rangeMatch[2], 10);
          const group = [];
          for (let i = start; i <= end; i++) group.push(i - 1);
          groups.push(group);
        } else if (singleMatch) {
          groups.push([parseInt(singleMatch[1], 10) - 1]);
        }
      }

      return { ok: true, groups: groups };
    }

    function updateHint() {
      if (!currentFile) {
        hint.textContent = 'Upload a PDF to begin.';
        return;
      }

      if (splitMode === 'custom' && !customRangeValid) {
        hint.textContent = 'Enter a valid custom range to continue.';
        return;
      }

      hint.textContent = 'Ready to split "' + currentFile.name + '".';
    }

    function updateSplitButtonState() {
      const ready = !!currentFile && pageCount > 0 && (splitMode !== 'custom' || customRangeValid);
      splitBtn.disabled = !ready;
      updateHint();
    }

    function validateCustomRangeLive() {
      if (splitMode !== 'custom') {
        customRangeValid = false;
        return;
      }

      if (!currentFile || pageCount === 0) {
        customRangeValid = false;
        customRangeMessage.hidden = true;
        customRangeInput.classList.remove('is-invalid');
        return;
      }

      const parsed = parseCustomRange(customRangeInput.value, pageCount);

      if (parsed.ok) {
        customRangeValid = true;
        customRangeMessage.hidden = true;
        customRangeInput.classList.remove('is-invalid');
      } else {
        customRangeValid = false;
        customRangeMessage.textContent = parsed.message;
        customRangeMessage.hidden = false;
        customRangeInput.classList.add('is-invalid');
      }
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

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.setAttribute('aria-label', 'Remove ' + currentFile.name);
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', resetTool);

      row.appendChild(text);
      row.appendChild(removeBtn);

      fileInfo.innerHTML = '';
      fileInfo.appendChild(row);
      fileInfo.hidden = false;
    }

    function resetTool() {
      currentFile = null;
      pageCount = 0;
      customRangeInput.value = '';
      customRangeValid = false;
      customRangeMessage.hidden = true;
      customRangeInput.classList.remove('is-invalid');
      input.value = '';
      renderFileInfo();
      clearResult();
      clearBtn.hidden = true;
      updateSplitButtonState();
    }

    async function loadFile(file) {
      if (!file) return;

      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

      if (!isPdf) {
        showResult('error', 'Not a PDF file', 'Please choose a valid PDF file and try again.');
        return;
      }

      currentFile = file;
      pageCount = 0;
      clearResult();
      renderFileInfo();
      clearBtn.hidden = false;
      updateSplitButtonState();

      if (!window.PDFLib || typeof window.PDFLib.PDFDocument !== 'function') {
        showResult('error', 'PDF engine could not load', 'Please refresh the page and try again.');
        return;
      }

      try {
        const bytes = await file.arrayBuffer();
        const pdf = await window.PDFLib.PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });
        pageCount = pdf.getPageCount();
        renderFileInfo();
        validateCustomRangeLive();
        updateSplitButtonState();
      } catch (error) {
        console.error('Split PDF - load error:', error);
        currentFile = null;
        pageCount = 0;
        renderFileInfo();
        clearBtn.hidden = true;

        let message = 'This file could not be read as a PDF. Please check the file and try again.';
        if (error && /encrypted|password/i.test(String(error.message || error))) {
          message = 'This PDF appears to be password-protected or encrypted. Remove the protection and try again.';
        }
        showResult('error', 'Could not open the PDF', message);
        updateSplitButtonState();
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

    modePresets.addEventListener('click', function (event) {
      const btn = event.target.closest('.target-preset');
      if (!btn) return;

      modePresets.querySelectorAll('.target-preset').forEach(function (el) {
        el.classList.remove('is-selected');
      });
      btn.classList.add('is-selected');

      splitMode = btn.dataset.mode;
      customRangeGroup.hidden = splitMode !== 'custom';

      if (splitMode === 'custom') {
        validateCustomRangeLive();
      } else {
        customRangeValid = false;
        customRangeMessage.hidden = true;
        customRangeInput.classList.remove('is-invalid');
      }

      clearResult();
      updateSplitButtonState();
    });

    customRangeInput.addEventListener('input', function () {
      validateCustomRangeLive();
      updateSplitButtonState();
    });

    outputOptions.addEventListener('change', function (event) {
      if (event.target && event.target.name === 'splitOutput') {
        outputType = event.target.value;
        outputOptions.querySelectorAll('.format-option').forEach(function (label) {
          label.classList.toggle('is-selected', label.querySelector('input').checked);
        });
        outputNote.textContent = OUTPUT_NOTES[outputType] || '';
        clearResult();
      }
    });

    clearBtn.addEventListener('click', resetTool);

    splitBtn.addEventListener('click', async function () {
      if (!currentFile || !pageCount) {
        showResult('error', 'No PDF selected', 'Choose a PDF file to split.');
        return;
      }

      if (splitMode === 'custom') {
        validateCustomRangeLive();
        if (!customRangeValid) {
          updateSplitButtonState();
          return;
        }
      }

      if (!window.PDFLib || typeof window.PDFLib.PDFDocument !== 'function') {
        showResult('error', 'PDF engine could not load', 'Please refresh the page and try again.');
        return;
      }

      const groupResult = resolvePageGroups();
      if (!groupResult.ok) {
        showResult('error', 'Could not split this PDF', groupResult.message);
        return;
      }

      const groups = groupResult.groups;
      const originalText = splitBtn.textContent;

      splitBtn.disabled = true;
      clearBtn.disabled = true;
      splitBtn.textContent = 'Splitting…';
      clearResult();

      try {
        const PDFDocument = window.PDFLib.PDFDocument;
        const sourceBytes = await currentFile.arrayBuffer();
        const sourcePdf = await PDFDocument.load(sourceBytes, { ignoreEncryption: false, updateMetadata: false });
        const baseName = currentFile.name.replace(/\.pdf$/i, '') || 'document';

        if (outputType === 'single' || groups.length === 1) {
          const flatPages = [];
          groups.forEach(function (group) { group.forEach(function (idx) { flatPages.push(idx); }); });
          const uniquePages = Array.from(new Set(flatPages)).sort(function (a, b) { return a - b; });

          const outPdf = await PDFDocument.create();
          const copied = await outPdf.copyPages(sourcePdf, uniquePages);
          copied.forEach(function (page) { outPdf.addPage(page); });
          const outBytes = await outPdf.save({ useObjectStreams: true, addDefaultPage: false });

          const blob = new Blob([outBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const fileName = baseName + '-split.pdf';

          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = fileName;
          downloadLink.className = 'btn-primary';
          downloadLink.textContent = 'Download PDF →';

          showResult(
            'success',
            'PDF split successfully',
            uniquePages.length + ' page' + (uniquePages.length === 1 ? '' : 's') + ' extracted into one PDF (' + formatSize(outBytes.length) + ').',
            downloadLink
          );

          setTimeout(function () { URL.revokeObjectURL(url); }, 120000);

        } else {
          if (!window.JSZip) {
            showResult('error', 'ZIP engine could not load', 'Please refresh the page and try again.');
            return;
          }

          const zip = new window.JSZip();
          const padWidth = String(groups.length).length;

          for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            const outPdf = await PDFDocument.create();
            const copied = await outPdf.copyPages(sourcePdf, group);
            copied.forEach(function (page) { outPdf.addPage(page); });
            const outBytes = await outPdf.save({ useObjectStreams: true, addDefaultPage: false });

            const label = String(i + 1).padStart(padWidth, '0');
            zip.file(baseName + '-part-' + label + '.pdf', outBytes);
          }

          const zipBlob = await zip.generateAsync({ type: 'blob' });
          const url = URL.createObjectURL(zipBlob);
          const fileName = baseName + '-split.zip';

          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = fileName;
          downloadLink.className = 'btn-primary';
          downloadLink.textContent = 'Download ZIP →';

          showResult(
            'success',
            'PDF split successfully',
            groups.length + ' PDF file' + (groups.length === 1 ? '' : 's') + ' created (' + formatSize(zipBlob.size) + ' ZIP).',
            downloadLink
          );

          setTimeout(function () { URL.revokeObjectURL(url); }, 120000);
        }

      } catch (error) {
        console.error('Split PDF - split error:', error);

        let message = 'The PDF could not be split. Please check the file and try again.';
        if (error && /encrypted|password/i.test(String(error.message || error))) {
          message = 'This PDF appears to be password-protected or encrypted. Remove the protection and try again.';
        }

        showResult('error', 'Could not split the PDF', message);

      } finally {
        clearBtn.disabled = false;
        splitBtn.textContent = originalText;
        updateSplitButtonState();
      }
    });

    updateSplitButtonState();
  });
})();
