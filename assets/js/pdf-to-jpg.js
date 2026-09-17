(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('pdfJpgFile');
    const zone = document.getElementById('pdfJpgDropzone');
    const fileInfo = document.getElementById('pdfJpgFileInfo');
    const hint = document.getElementById('pdfJpgHint');
    const convertBtn = document.getElementById('pdfJpgBtn');
    const clearBtn = document.getElementById('pdfJpgClearBtn');
    const progress = document.getElementById('pdfJpgProgress');
    const result = document.getElementById('pdfJpgResult');

    if (!input || !zone || !fileInfo || !hint || !convertBtn || !clearBtn || !progress || !result) {
      return;
    }

    let currentFile = null;

    // PDF.js requires its worker script to be configured before use, matching
    // the exact same version as the main library script tag in index.php.
    // DOMContentLoaded guarantees the module script above has already run
    // and attached window.pdfjsLib by this point.
    let pdfjsReady = false;
    if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.worker.min.mjs';
      pdfjsReady = true;
    }

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
      hint.textContent = currentFile ? 'Ready to convert "' + currentFile.name + '".' : 'Upload a PDF to begin.';
    }

    function updateButtonState() {
      convertBtn.disabled = !currentFile;
      clearBtn.hidden = !currentFile;
      updateHint();
    }

    function resetTool() {
      currentFile = null;
      input.value = '';
      renderFileInfo();
      clearResult();
      progress.hidden = true;
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

    // Renders a single PDF.js page to a JPG Blob via canvas at a resolution
    // suited for screen/print use (scale 2 ~= 144 DPI on a standard page).
    async function renderPageToJpegBlob(pdfDoc, pageNumber, scale) {
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext('2d');

      // JPG has no transparency; fill white first so PDFs with a transparent
      // background don't render as black in the output.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport: viewport }).promise;

      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (!blob) {
            reject(new Error('Could not encode page ' + pageNumber + ' as JPG.'));
            return;
          }
          resolve(blob);
        }, 'image/jpeg', 0.92);
      });
    }

    convertBtn.addEventListener('click', async function () {
      if (!currentFile) {
        showMessage('error', 'No PDF selected', 'Choose a PDF file to convert.');
        return;
      }

      if (!window.pdfjsLib || typeof window.pdfjsLib.getDocument !== 'function') {
        showMessage('error', 'PDF engine could not load', 'Please refresh the page and try again.');
        return;
      }

      const originalText = convertBtn.textContent;
      convertBtn.disabled = true;
      clearBtn.disabled = true;
      convertBtn.textContent = 'Converting…';
      clearResult();
      progress.hidden = false;
      progress.textContent = 'Reading PDF…';

      try {
        const bytes = await currentFile.arrayBuffer();
        const loadingTask = window.pdfjsLib.getDocument({ data: bytes });
        const pdfDoc = await loadingTask.promise;
        const pageCount = pdfDoc.numPages;
        const baseName = currentFile.name.replace(/\.pdf$/i, '') || 'document';
        const scale = 2; // ~144 DPI, good balance of quality vs. file size

        if (pageCount === 1) {
          progress.textContent = 'Rendering page 1 of 1…';
          const blob = await renderPageToJpegBlob(pdfDoc, 1, scale);
          const url = URL.createObjectURL(blob);

          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = baseName + '.jpg';
          downloadLink.className = 'btn-primary';
          downloadLink.textContent = 'Download JPG →';

          result.className = 'result-box result-box--success';
          result.innerHTML = '';

          const heading = document.createElement('strong');
          heading.textContent = 'PDF converted successfully';
          result.appendChild(heading);

          const note = document.createElement('p');
          note.textContent = '1 page converted to JPG (' + formatSize(blob.size) + ').';
          result.appendChild(note);

          result.appendChild(downloadLink);
          result.hidden = false;

          setTimeout(function () { URL.revokeObjectURL(url); }, 120000);

        } else {
          if (!window.JSZip) {
            showMessage('error', 'ZIP engine could not load', 'Please refresh the page and try again.');
            return;
          }

          const zip = new window.JSZip();
          const padWidth = String(pageCount).length;

          for (let i = 1; i <= pageCount; i++) {
            progress.textContent = 'Rendering page ' + i + ' of ' + pageCount + '…';
            const blob = await renderPageToJpegBlob(pdfDoc, i, scale);
            const label = String(i).padStart(padWidth, '0');
            zip.file(baseName + '-page-' + label + '.jpg', blob);
          }

          progress.textContent = 'Packaging ZIP…';
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          const url = URL.createObjectURL(zipBlob);

          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = baseName + '-jpg.zip';
          downloadLink.className = 'btn-primary';
          downloadLink.textContent = 'Download ZIP →';

          result.className = 'result-box result-box--success';
          result.innerHTML = '';

          const heading = document.createElement('strong');
          heading.textContent = 'PDF converted successfully';
          result.appendChild(heading);

          const note = document.createElement('p');
          note.textContent = pageCount + ' pages converted to JPG (' + formatSize(zipBlob.size) + ' ZIP).';
          result.appendChild(note);

          result.appendChild(downloadLink);
          result.hidden = false;

          setTimeout(function () { URL.revokeObjectURL(url); }, 120000);
        }

      } catch (error) {
        console.error('PDF to JPG - error:', error);

        let message = 'This PDF could not be converted. Please check the file and try again.';
        if (error && /password|encrypted/i.test(String(error.message || error))) {
          message = 'This PDF appears to be password-protected or encrypted. Remove the protection and try again.';
        }
        showMessage('error', 'Could not convert the PDF', message);

      } finally {
        progress.hidden = true;
        clearBtn.disabled = false;
        convertBtn.textContent = originalText;
        updateButtonState();
      }
    });

    updateButtonState();
  });
})();
