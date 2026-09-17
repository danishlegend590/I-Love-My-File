(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('imgConvertFile');
    const zone = document.getElementById('imgConvertDropzone');
    const fileListEl = document.getElementById('imgConvertFileList');
    const hint = document.getElementById('imgConvertHint');
    const convertBtn = document.getElementById('imgConvertBtn');
    const clearBtn = document.getElementById('imgConvertClearBtn');
    const result = document.getElementById('imgConvertResult');

    if (!input || !zone || !fileListEl || !hint || !convertBtn || !clearBtn || !result) {
      return;
    }

    const toMime = hint.dataset.toMime;
    const toExt = hint.dataset.toExt;
    const toLabel = hint.dataset.toLabel;

    let items = [];
    let idCounter = 0;

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

    function updateHintText() {
      if (!items.length) {
        hint.textContent = hint.dataset.defaultText || hint.textContent;
      } else {
        hint.textContent = items.length + ' image' + (items.length === 1 ? '' : 's') + ' ready to convert.';
      }
    }

    // Preserve the server-rendered default hint text before we start
    // overwriting hint.textContent based on upload state.
    if (!hint.dataset.defaultText) {
      hint.dataset.defaultText = hint.textContent;
    }

    function updateButtonState() {
      convertBtn.disabled = items.length === 0;
      clearBtn.hidden = items.length === 0;
      updateHintText();
    }

    function removeItem(id) {
      items = items.filter(function (item) { return item.id !== id; });
      renderList();
      clearResult();
      updateButtonState();
    }

    function renderList() {
      if (!items.length) {
        fileListEl.hidden = true;
        fileListEl.innerHTML = '';
        return;
      }

      fileListEl.innerHTML = '';

      items.forEach(function (item) {
        const row = document.createElement('div');
        row.className = 'file-row';

        const label = document.createElement('span');
        label.innerHTML = '<strong>' + escapeHtml(item.name) + '</strong> <small>· ' + formatSize(item.size) + '</small>';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.setAttribute('aria-label', 'Remove ' + item.name);
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', function () { removeItem(item.id); });

        row.appendChild(label);
        row.appendChild(removeBtn);
        fileListEl.appendChild(row);
      });

      fileListEl.hidden = false;
    }

    function isAcceptedFile(file) {
      const acceptAttr = input.getAttribute('accept') || '';
      if (acceptAttr && file.type && acceptAttr.indexOf(file.type) !== -1) return true;
      // Fall back to extension check for browsers/OSes that misreport MIME type.
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (acceptAttr.indexOf('image/jpeg') !== -1 && (ext === 'jpg' || ext === 'jpeg')) return true;
      if (acceptAttr.indexOf('image/png') !== -1 && ext === 'png') return true;
      if (acceptAttr.indexOf('image/webp') !== -1 && ext === 'webp') return true;
      return false;
    }

    function addFiles(fileList) {
      const incoming = Array.prototype.slice.call(fileList || []);
      if (!incoming.length) return;

      const rejected = [];

      incoming.forEach(function (file) {
        if (!isAcceptedFile(file)) {
          rejected.push(file.name);
          return;
        }
        items.push({ id: ++idCounter, file: file, name: file.name, size: file.size });
      });

      renderList();
      clearResult();
      updateButtonState();

      if (rejected.length) {
        showMessage('error', 'Some files were skipped', escapeHtml(rejected.join(', ')) + ' — this tool only accepts the expected input format.');
      }
    }

    input.addEventListener('change', function () {
      addFiles(input.files);
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
      addFiles(event.dataTransfer.files);
    });

    function resetTool() {
      items = [];
      input.value = '';
      renderList();
      clearResult();
      updateButtonState();
    }

    clearBtn.addEventListener('click', resetTool);

    // canvas.toBlob() never throws and never returns null for an unsupported
    // format — it silently substitutes image/png instead. This is a real,
    // current gap on Safari specifically for WebP: Safari can decode WebP
    // but cannot encode it via canvas. Checking blob.type against the
    // requested mime is the only reliable way to catch this, rather than
    // shipping a mislabeled file (e.g. a PNG named "photo.webp").
    function encodeCanvasToBlob(canvas, mime, quality) {
      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (!blob || !blob.size) {
            reject(new Error('The browser could not create the output image.'));
            return;
          }
          if (blob.type !== mime) {
            reject(new Error(
              'Your browser cannot encode ' + toLabel + ' images. ' +
              'This is a known limitation in some browsers (notably Safari, which can open WebP images but not create them). ' +
              'Please try a different browser, such as Chrome or Firefox.'
            ));
            return;
          }
          resolve(blob);
        }, mime, quality);
      });
    }

    function loadImage(file) {
      return new Promise(function (resolve, reject) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not open ' + file.name + '.')); };
        img.src = url;
      });
    }

    async function convertOne(file) {
      const img = await loadImage(file);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      // JPG has no transparency; fill white first so images with a
      // transparent background (e.g. from PNG or WebP) don't render as
      // black when converted to JPG.
      if (toMime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);
      const quality = toMime === 'image/png' ? undefined : 0.9;
      return encodeCanvasToBlob(canvas, toMime, quality);
    }

    convertBtn.addEventListener('click', async function () {
      if (!items.length) {
        showMessage('error', 'No images selected', 'Add at least one image to convert.');
        return;
      }

      const originalText = convertBtn.textContent;
      convertBtn.disabled = true;
      clearBtn.disabled = true;
      convertBtn.textContent = 'Converting…';
      clearResult();

      try {
        if (items.length === 1) {
          const item = items[0];
          const blob = await convertOne(item.file);
          const url = URL.createObjectURL(blob);
          const baseName = item.name.replace(/\.[^.]+$/, '') || 'image';

          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = baseName + '.' + toExt;
          downloadLink.className = 'btn-primary';
          downloadLink.textContent = 'Download ' + toLabel + ' →';

          result.className = 'result-box result-box--success';
          result.innerHTML = '';

          const heading = document.createElement('strong');
          heading.textContent = 'Image converted successfully';
          result.appendChild(heading);

          const note = document.createElement('p');
          note.textContent = '1 image converted to ' + toLabel + ' (' + formatSize(blob.size) + ').';
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
          const padWidth = String(items.length).length;

          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const blob = await convertOne(item.file);
            const baseName = item.name.replace(/\.[^.]+$/, '') || ('image-' + (i + 1));
            const label = String(i + 1).padStart(padWidth, '0');
            zip.file(label + '-' + baseName + '.' + toExt, blob);
          }

          const zipBlob = await zip.generateAsync({ type: 'blob' });
          const url = URL.createObjectURL(zipBlob);

          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = 'converted-' + toExt + '.zip';
          downloadLink.className = 'btn-primary';
          downloadLink.textContent = 'Download ZIP →';

          result.className = 'result-box result-box--success';
          result.innerHTML = '';

          const heading = document.createElement('strong');
          heading.textContent = 'Images converted successfully';
          result.appendChild(heading);

          const note = document.createElement('p');
          note.textContent = items.length + ' images converted to ' + toLabel + ' (' + formatSize(zipBlob.size) + ' ZIP).';
          result.appendChild(note);

          result.appendChild(downloadLink);
          result.hidden = false;

          setTimeout(function () { URL.revokeObjectURL(url); }, 120000);
        }

      } catch (error) {
        console.error('Image convert - error:', error);
        showMessage('error', 'Could not convert', escapeHtml(error && error.message ? error.message : 'One or more images could not be processed.'));

      } finally {
        clearBtn.disabled = false;
        convertBtn.textContent = originalText;
        updateButtonState();
      }
    });

    updateButtonState();
  });
})();
