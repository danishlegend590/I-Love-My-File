(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('compressPdfFile');
    const zone = document.getElementById('compressPdfDropzone');
    const fileInfo = document.getElementById('compressFileInfo');
    const hint = document.getElementById('compressHint');
    const compressBtn = document.getElementById('compressBtn');
    const clearBtn = document.getElementById('compressClearBtn');
    const result = document.getElementById('compressResult');

    if (!input || !zone || !fileInfo || !hint || !compressBtn || !clearBtn || !result) {
      return;
    }

    let currentFile = null;

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

    function renderFileInfo() {
      if (!currentFile) {
        fileInfo.hidden = true;
        fileInfo.innerHTML = '';
        return;
      }

      const row = document.createElement('div');
      row.className = 'file-row';

      const text = document.createElement('span');
      text.innerHTML = '<strong>' + escapeHtml(currentFile.name) + '</strong> <small>· ' + formatSize(currentFile.size) + '</small>';

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

    function updateHint() {
      hint.textContent = currentFile ? 'Ready to compress "' + currentFile.name + '".' : 'Upload a PDF to begin.';
    }

    function updateButtonState() {
      compressBtn.disabled = !currentFile;
      updateHint();
    }

    function resetTool() {
      currentFile = null;
      input.value = '';
      renderFileInfo();
      clearResult();
      clearBtn.hidden = true;
      updateButtonState();
    }

    function loadFile(file) {
      if (!file) return;

      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      if (!isPdf) {
        showMessage('error', 'Not a PDF file', 'Please choose a valid PDF file and try again.');
        return;
      }

      currentFile = file;
      clearResult();
      renderFileInfo();
      clearBtn.hidden = false;
      updateButtonState();
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

    clearBtn.addEventListener('click', resetTool);

    compressBtn.addEventListener('click', async function () {
      if (!currentFile) {
        showMessage('error', 'No PDF selected', 'Choose a PDF file to compress.');
        return;
      }

      if (!window.PDFLib || typeof window.PDFLib.PDFDocument !== 'function') {
        showMessage('error', 'PDF engine could not load', 'Please refresh the page and try again.');
        return;
      }

      const originalText = compressBtn.textContent;
      compressBtn.disabled = true;
      clearBtn.disabled = true;
      compressBtn.textContent = 'Compressing…';
      clearResult();

      try {
        const PDFDocument = window.PDFLib.PDFDocument;
        const originalBytes = await currentFile.arrayBuffer();
        const originalSize = originalBytes.byteLength;

        const pdf = await PDFDocument.load(originalBytes, { ignoreEncryption: false, updateMetadata: false });

        // Strip metadata that adds bytes without adding value. This is a real,
        // verifiable saving — not cosmetic.
        pdf.setTitle('');
        pdf.setAuthor('');
        pdf.setSubject('');
        pdf.setKeywords([]);
        pdf.setProducer('');
        pdf.setCreator('');

        // useObjectStreams restructures and deduplicates internal objects.
        // This is the main real lever available without re-encoding images.
        const compressedBytes = await pdf.save({
          useObjectStreams: true,
          addDefaultPage: false
        });

        const compressedSize = compressedBytes.byteLength;
        let savedBytes = originalSize - compressedSize;
        let finalBytes = compressedBytes;
        let finalSize = compressedSize;

        // Structural optimization can occasionally make an already efficient
        // PDF a few bytes larger (e.g. re-adding a cross-reference table the
        // original didn't need). If that happens, don't hand back a bigger
        // file than what the person uploaded — serve the original instead.
        if (savedBytes <= 0) {
          finalBytes = originalBytes;
          finalSize = originalSize;
          savedBytes = 0;
        }

        const savedPercent = originalSize > 0 ? (savedBytes / originalSize) * 100 : 0;

        const blob = new Blob([finalBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const baseName = currentFile.name.replace(/\.pdf$/i, '') || 'document';
        const fileName = baseName + (savedBytes > 0 ? '-compressed.pdf' : '.pdf');

        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = fileName;
        downloadLink.className = 'btn-primary';
        downloadLink.textContent = 'Download compressed PDF →';

        result.className = 'result-box result-box--success';
        result.innerHTML = '';

        const heading = document.createElement('strong');

        if (savedBytes > 0) {
          heading.textContent = 'PDF compressed successfully';
        } else {
          heading.textContent = 'This PDF was already well optimized';
        }
        result.appendChild(heading);

        const statsWrap = document.createElement('div');
        statsWrap.className = 'tool-results--grid';

        function stat(label, value, featured) {
          const cell = document.createElement('div');
          cell.className = 'tool-result-box' + (featured ? ' tool-result-box--featured' : '');
          cell.innerHTML = '<span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong>';
          return cell;
        }

        statsWrap.appendChild(stat('Original', formatSize(originalSize)));
        statsWrap.appendChild(stat('Compressed', formatSize(finalSize), true));
        statsWrap.appendChild(stat('Saved', savedBytes > 0 ? savedPercent.toFixed(1) + '%' : '0%'));
        result.appendChild(statsWrap);

        const note = document.createElement('p');
        if (savedBytes > 0) {
          note.textContent = 'Reduced from ' + formatSize(originalSize) + ' to ' + formatSize(finalSize) + '.';
        } else {
          note.textContent = 'This PDF\u2019s structure was already efficient, so there was nothing worth optimizing. Your original file is ready to download unchanged.';
        }
        result.appendChild(note);

        result.appendChild(downloadLink);
        result.hidden = false;

        setTimeout(function () { URL.revokeObjectURL(url); }, 120000);

      } catch (error) {
        console.error('Compress PDF - error:', error);

        let message = 'This PDF could not be compressed. Please check the file and try again.';
        if (error && /encrypted|password/i.test(String(error.message || error))) {
          message = 'This PDF appears to be password-protected or encrypted. Remove the protection and try again.';
        }
        showMessage('error', 'Could not compress the PDF', message);

      } finally {
        clearBtn.disabled = false;
        compressBtn.textContent = originalText;
        updateButtonState();
      }
    });

    updateButtonState();
  });
})();
