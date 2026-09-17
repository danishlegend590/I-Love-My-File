(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('rotatePdfFile');
    const zone = document.getElementById('rotatePdfDropzone');
    const fileInfo = document.getElementById('rotateFileInfo');
    const anglePresets = document.getElementById('rotateAnglePresets');
    const hint = document.getElementById('rotateHint');
    const rotateBtn = document.getElementById('rotateBtn');
    const clearBtn = document.getElementById('rotateClearBtn');
    const result = document.getElementById('rotateResult');

    if (!input || !zone || !fileInfo || !anglePresets || !hint || !rotateBtn || !clearBtn || !result) {
      return;
    }

    let currentFile = null;
    let angle = 90; // matches the "Rotate right 90°" preset marked is-selected in the HTML

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
      hint.textContent = currentFile ? 'Ready to rotate "' + currentFile.name + '".' : 'Upload a PDF to begin.';
    }

    function updateButtonState() {
      rotateBtn.disabled = !currentFile;
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

    anglePresets.addEventListener('click', function (event) {
      const btn = event.target.closest('.target-preset');
      if (!btn) return;

      anglePresets.querySelectorAll('.target-preset').forEach(function (el) {
        el.classList.remove('is-selected');
      });
      btn.classList.add('is-selected');
      angle = parseInt(btn.dataset.angle, 10);
      clearResult();
    });

    clearBtn.addEventListener('click', resetTool);

    rotateBtn.addEventListener('click', async function () {
      if (!currentFile) {
        showMessage('error', 'No PDF selected', 'Choose a PDF file to rotate.');
        return;
      }

      if (!window.PDFLib || typeof window.PDFLib.PDFDocument !== 'function') {
        showMessage('error', 'PDF engine could not load', 'Please refresh the page and try again.');
        return;
      }

      const originalText = rotateBtn.textContent;
      rotateBtn.disabled = true;
      clearBtn.disabled = true;
      rotateBtn.textContent = 'Rotating…';
      clearResult();

      try {
        const PDFDocument = window.PDFLib.PDFDocument;
        const degrees = window.PDFLib.degrees;
        const bytes = await currentFile.arrayBuffer();
        const pdf = await PDFDocument.load(bytes, { ignoreEncryption: false });

        const pages = pdf.getPages();
        pages.forEach(function (page) {
          // Add to any existing rotation rather than overwrite it, since some
          // PDFs (especially phone scans) already carry an inherent rotation
          // value even before the user applies their own.
          const currentAngle = page.getRotation().angle;
          page.setRotation(degrees(currentAngle + angle));
        });

        const rotatedBytes = await pdf.save();
        const blob = new Blob([rotatedBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const baseName = currentFile.name.replace(/\.pdf$/i, '') || 'document';

        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = baseName + '-rotated.pdf';
        downloadLink.className = 'btn-primary';
        downloadLink.textContent = 'Download rotated PDF →';

        result.className = 'result-box result-box--success';
        result.innerHTML = '';

        const heading = document.createElement('strong');
        heading.textContent = 'PDF rotated successfully';
        result.appendChild(heading);

        const note = document.createElement('p');
        const angleLabel = angle === 180 ? '180°' : (angle === -90 ? '90° left' : '90° right');
        note.textContent = pages.length + ' page' + (pages.length === 1 ? '' : 's') + ' rotated ' + angleLabel + '.';
        result.appendChild(note);

        result.appendChild(downloadLink);
        result.hidden = false;

        setTimeout(function () { URL.revokeObjectURL(url); }, 120000);

      } catch (error) {
        console.error('Rotate PDF - error:', error);

        let message = 'This PDF could not be rotated. Please check the file and try again.';
        if (error && /encrypted|password/i.test(String(error.message || error))) {
          message = 'This PDF appears to be password-protected or encrypted. Remove the protection and try again.';
        }
        showMessage('error', 'Could not rotate the PDF', message);

      } finally {
        clearBtn.disabled = false;
        rotateBtn.textContent = originalText;
        updateButtonState();
      }
    });

    updateButtonState();
  });
})();
