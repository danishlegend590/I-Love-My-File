(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('pageNumFile');
    const zone = document.getElementById('pageNumDropzone');
    const fileInfo = document.getElementById('pageNumFileInfo');
    const positionPresets = document.getElementById('pageNumPositionPresets');
    const startInput = document.getElementById('pageNumStart');
    const startMessage = document.getElementById('pageNumStartMessage');
    const hint = document.getElementById('pageNumHint');
    const addBtn = document.getElementById('pageNumBtn');
    const clearBtn = document.getElementById('pageNumClearBtn');
    const result = document.getElementById('pageNumResult');

    if (
      !input || !zone || !fileInfo || !positionPresets || !startInput ||
      !startMessage || !hint || !addBtn || !clearBtn || !result
    ) {
      return;
    }

    let currentFile = null;
    let position = 'bottom-center';

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

    function validateStart() {
      const raw = startInput.value.trim();
      const n = parseInt(raw, 10);

      startMessage.hidden = true;
      startInput.classList.remove('is-invalid');

      if (!raw) {
        return { ok: false, message: 'Enter a starting number.' };
      }
      if (!Number.isFinite(n) || n < 0) {
        return { ok: false, message: 'Starting number must be 0 or greater.' };
      }
      if (n > 100000) {
        return { ok: false, message: 'Starting number is too large.' };
      }
      return { ok: true, start: n };
    }

    function validateStartLive() {
      const check = validateStart();
      if (!check.ok && currentFile && startInput.value.trim()) {
        startMessage.textContent = check.message;
        startMessage.hidden = false;
        startInput.classList.add('is-invalid');
      }
      return check;
    }

    function updateHint() {
      hint.textContent = currentFile ? 'Ready to number "' + currentFile.name + '".' : 'Upload a PDF to begin.';
    }

    function updateButtonState() {
      const check = validateStart();
      addBtn.disabled = !currentFile || !check.ok;
      clearBtn.hidden = !currentFile;
      updateHint();
    }

    function resetTool() {
      currentFile = null;
      input.value = '';
      renderFileInfo();
      clearResult();
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

    positionPresets.addEventListener('click', function (event) {
      const btn = event.target.closest('.target-preset');
      if (!btn) return;

      positionPresets.querySelectorAll('.target-preset').forEach(function (el) {
        el.classList.remove('is-selected');
      });
      btn.classList.add('is-selected');
      position = btn.dataset.position;
      clearResult();
    });

    startInput.addEventListener('input', function () {
      validateStartLive();
      updateButtonState();
    });

    clearBtn.addEventListener('click', resetTool);

    addBtn.addEventListener('click', async function () {
      if (!currentFile) {
        showMessage('error', 'No PDF selected', 'Choose a PDF file to number.');
        return;
      }

      const check = validateStart();
      if (!check.ok) {
        validateStartLive();
        updateButtonState();
        return;
      }

      if (!window.PDFLib || typeof window.PDFLib.PDFDocument !== 'function') {
        showMessage('error', 'PDF engine could not load', 'Please refresh the page and try again.');
        return;
      }

      const originalText = addBtn.textContent;
      addBtn.disabled = true;
      clearBtn.disabled = true;
      addBtn.textContent = 'Adding…';
      clearResult();

      try {
        const PDFDocument = window.PDFLib.PDFDocument;
        const rgb = window.PDFLib.rgb;
        const StandardFonts = window.PDFLib.StandardFonts;

        const bytes = await currentFile.arrayBuffer();
        const pdf = await PDFDocument.load(bytes, { ignoreEncryption: false });
        const font = await pdf.embedFont(StandardFonts.Helvetica);

        const fontSize = 10;
        const margin = 24;
        const pages = pdf.getPages();

        pages.forEach(function (page, index) {
          const pageNumber = check.start + index;
          const label = String(pageNumber);
          const { width } = page.getSize();
          const textWidth = font.widthOfTextAtSize(label, fontSize);

          let x;
          if (position === 'bottom-left') {
            x = margin;
          } else if (position === 'bottom-right') {
            x = width - margin - textWidth;
          } else {
            // bottom-center
            x = (width - textWidth) / 2;
          }

          page.drawText(label, {
            x: x,
            y: margin - fontSize * 0.3,
            size: fontSize,
            font: font,
            color: rgb(0.2, 0.2, 0.2)
          });
        });

        const outBytes = await pdf.save();
        const blob = new Blob([outBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const baseName = currentFile.name.replace(/\.pdf$/i, '') || 'document';

        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = baseName + '-numbered.pdf';
        downloadLink.className = 'btn-primary';
        downloadLink.textContent = 'Download PDF →';

        result.className = 'result-box result-box--success';
        result.innerHTML = '';

        const heading = document.createElement('strong');
        heading.textContent = 'Page numbers added successfully';
        result.appendChild(heading);

        const note = document.createElement('p');
        note.textContent = pages.length + ' page' + (pages.length === 1 ? '' : 's') + ' numbered, starting at ' + check.start + '.';
        result.appendChild(note);

        result.appendChild(downloadLink);
        result.hidden = false;

        setTimeout(function () { URL.revokeObjectURL(url); }, 120000);

      } catch (error) {
        console.error('Add Page Numbers - error:', error);

        let message = 'This PDF could not be processed. Please check the file and try again.';
        if (error && /encrypted|password/i.test(String(error.message || error))) {
          message = 'This PDF appears to be password-protected or encrypted. Remove the protection and try again.';
        }
        showMessage('error', 'Could not add page numbers', message);

      } finally {
        clearBtn.disabled = false;
        addBtn.textContent = originalText;
        updateButtonState();
      }
    });

    updateButtonState();
  });
})();
