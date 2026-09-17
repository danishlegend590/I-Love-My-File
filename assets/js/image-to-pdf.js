(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('imgPdfFile');
    const zone = document.getElementById('imgPdfDropzone');
    const fileListEl = document.getElementById('imgPdfFileList');
    const reorderHint = document.getElementById('imgPdfReorderHint');
    const hint = document.getElementById('imgPdfHint');
    const convertBtn = document.getElementById('imgPdfBtn');
    const clearBtn = document.getElementById('imgPdfClearBtn');
    const result = document.getElementById('imgPdfResult');

    if (!input || !zone || !fileListEl || !reorderHint || !hint || !convertBtn || !clearBtn || !result) {
      return;
    }

    // Each entry: { id, file, name, size, type }
    let items = [];
    let idCounter = 0;
    let dragSrcId = null;

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

    function isSupportedImage(file) {
      return /^image\/(jpeg|png|webp)$/i.test(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
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

    function updateHint() {
      if (!items.length) {
        hint.textContent = 'Upload one or more images to begin.';
      } else {
        hint.textContent = items.length + ' image' + (items.length === 1 ? '' : 's') + ' ready to convert.';
      }
    }

    function updateButtonState() {
      convertBtn.disabled = items.length === 0;
      clearBtn.hidden = items.length === 0;
      reorderHint.hidden = items.length < 2;
      updateHint();
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

      items.forEach(function (item, index) {
        const row = document.createElement('div');
        row.className = 'file-row';
        row.draggable = true;
        row.dataset.id = String(item.id);

        const label = document.createElement('span');
        label.innerHTML =
          '<strong>' + (index + 1) + '.</strong> ' +
          escapeHtml(item.name) + ' <small>· ' + formatSize(item.size) + '</small>';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.setAttribute('aria-label', 'Remove ' + item.name);
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', function () { removeItem(item.id); });

        row.appendChild(label);
        row.appendChild(removeBtn);
        fileListEl.appendChild(row);

        row.addEventListener('dragstart', function (event) {
          dragSrcId = item.id;
          row.classList.add('is-dragging');
          event.dataTransfer.effectAllowed = 'move';
          try { event.dataTransfer.setData('text/plain', String(item.id)); } catch (e) { /* Safari */ }
        });

        row.addEventListener('dragend', function () {
          row.classList.remove('is-dragging');
          dragSrcId = null;
        });

        row.addEventListener('dragover', function (event) {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
        });

        row.addEventListener('drop', function (event) {
          event.preventDefault();
          if (dragSrcId === null || dragSrcId === item.id) return;

          const fromIndex = items.findIndex(function (i) { return i.id === dragSrcId; });
          const toIndex = items.findIndex(function (i) { return i.id === item.id; });
          if (fromIndex === -1 || toIndex === -1) return;

          const [moved] = items.splice(fromIndex, 1);
          items.splice(toIndex, 0, moved);
          renderList();
        });
      });

      fileListEl.hidden = false;
    }

    function addFiles(fileList) {
      const incoming = Array.prototype.slice.call(fileList || []);
      if (!incoming.length) return;

      const rejected = [];

      incoming.forEach(function (file) {
        if (!isSupportedImage(file)) {
          rejected.push(file.name);
          return;
        }
        items.push({
          id: ++idCounter,
          file: file,
          name: file.name,
          size: file.size,
          type: file.type
        });
      });

      renderList();
      clearResult();
      updateButtonState();

      if (rejected.length) {
        showMessage(
          'error',
          'Some files were skipped',
          escapeHtml(rejected.join(', ')) + ' — only JPG, PNG and WebP images are supported.'
        );
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

    // Converts a WebP (or any format pdf-lib can't embed directly) into a PNG
    // Blob via canvas, since pdf-lib only supports embedJpg/embedPng natively.
    function convertToPngViaCanvas(file) {
      return new Promise(function (resolve, reject) {
        const url = URL.createObjectURL(file);
        const img = new Image();

        img.onload = function () {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(function (blob) {
              URL.revokeObjectURL(url);
              if (!blob) {
                reject(new Error('Could not re-encode image.'));
                return;
              }
              blob.arrayBuffer().then(resolve).catch(reject);
            }, 'image/png');
          } catch (err) {
            URL.revokeObjectURL(url);
            reject(err);
          }
        };

        img.onerror = function () {
          URL.revokeObjectURL(url);
          reject(new Error('Could not load image.'));
        };

        img.src = url;
      });
    }

    convertBtn.addEventListener('click', async function () {
      if (!items.length) {
        showMessage('error', 'No images selected', 'Add at least one image to convert.');
        return;
      }

      if (!window.PDFLib || typeof window.PDFLib.PDFDocument !== 'function') {
        showMessage('error', 'PDF engine could not load', 'Please refresh the page and try again.');
        return;
      }

      const originalText = convertBtn.textContent;
      convertBtn.disabled = true;
      clearBtn.disabled = true;
      convertBtn.textContent = 'Converting…';
      clearResult();

      try {
        const PDFDocument = window.PDFLib.PDFDocument;
        const pdf = await PDFDocument.create();

        for (const item of items) {
          const isJpg = /jpe?g/i.test(item.type) || /\.jpe?g$/i.test(item.name);
          const isPng = /png/i.test(item.type) || /\.png$/i.test(item.name);

          let embeddedImage;

          if (isJpg) {
            const bytes = await item.file.arrayBuffer();
            embeddedImage = await pdf.embedJpg(bytes);
          } else if (isPng) {
            const bytes = await item.file.arrayBuffer();
            embeddedImage = await pdf.embedPng(bytes);
          } else {
            // WebP or anything else the browser can decode but pdf-lib can't
            // embed directly: re-encode as PNG via canvas first.
            const pngBytes = await convertToPngViaCanvas(item.file);
            embeddedImage = await pdf.embedPng(pngBytes);
          }

          const { width, height } = embeddedImage;
          const page = pdf.addPage([width, height]);
          page.drawImage(embeddedImage, { x: 0, y: 0, width: width, height: height });
        }

        const pdfBytes = await pdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'converted-images.pdf';
        downloadLink.className = 'btn-primary';
        downloadLink.textContent = 'Download PDF →';

        result.className = 'result-box result-box--success';
        result.innerHTML = '';

        const heading = document.createElement('strong');
        heading.textContent = 'PDF created successfully';
        result.appendChild(heading);

        const note = document.createElement('p');
        note.textContent = items.length + ' image' + (items.length === 1 ? '' : 's') + ' converted into a ' + formatSize(pdfBytes.byteLength) + ' PDF.';
        result.appendChild(note);

        result.appendChild(downloadLink);
        result.hidden = false;

        setTimeout(function () { URL.revokeObjectURL(url); }, 120000);

      } catch (error) {
        console.error('Image to PDF - error:', error);
        showMessage('error', 'Could not create the PDF', 'One or more images could not be processed. Please check your files and try again.');

      } finally {
        clearBtn.disabled = false;
        convertBtn.textContent = originalText;
        updateButtonState();
      }
    });

    updateButtonState();
  });
})();
