(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('resizeFile');
    const zone = document.getElementById('resizeDropzone');
    const fileInfo = document.getElementById('resizeFileInfo');
    const modePresets = document.getElementById('resizeModePresets');
    const exactGroup = document.getElementById('exactSizeGroup');
    const widthInput = document.getElementById('resizeWidth');
    const heightInput = document.getElementById('resizeHeight');
    const aspectLockBtn = document.getElementById('aspectLockBtn');
    const aspectLockHint = document.getElementById('aspectLockHint');
    const exactMessage = document.getElementById('exactSizeMessage');
    const percentGroup = document.getElementById('percentSizeGroup');
    const percentInput = document.getElementById('resizePercent');
    const percentMessage = document.getElementById('percentSizeMessage');
    const presetGroup = document.getElementById('presetSizeGroup');
    const presetSizes = document.getElementById('resizePresetSizes');
    const hint = document.getElementById('resizeHint');
    const resizeBtn = document.getElementById('resizeBtn');
    const clearBtn = document.getElementById('resizeClearBtn');
    const result = document.getElementById('resizeResult');

    if (
      !input || !zone || !fileInfo || !modePresets || !exactGroup || !widthInput ||
      !heightInput || !aspectLockBtn || !aspectLockHint || !exactMessage ||
      !percentGroup || !percentInput || !percentMessage || !presetGroup ||
      !presetSizes || !hint || !resizeBtn || !clearBtn || !result
    ) {
      return;
    }

    let currentFile = null;
    let naturalWidth = 0;
    let naturalHeight = 0;
    let mode = 'exact';
    let aspectLocked = true;
    let selectedPreset = null; // { w, h } when a preset card is chosen

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
      const dims = naturalWidth ? (naturalWidth + ' × ' + naturalHeight + 'px · ') : '';
      text.innerHTML = '<strong>' + escapeHtml(currentFile.name) + '</strong> <small>· ' + dims + formatSize(currentFile.size) + '</small>';

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

    // Returns { ok, width, height, message } for the currently selected mode.
    function resolveTargetSize() {
      if (!naturalWidth || !naturalHeight) {
        return { ok: false, message: 'Upload an image first.' };
      }

      if (mode === 'exact') {
        const w = parseInt(widthInput.value, 10);
        const h = parseInt(heightInput.value, 10);

        if (!widthInput.value.trim() || !heightInput.value.trim()) {
          return { ok: false, message: 'Enter both width and height.' };
        }
        if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
          return { ok: false, message: 'Width and height must be positive numbers.' };
        }
        if (w > 10000 || h > 10000) {
          return { ok: false, message: 'Maximum allowed dimension is 10000px.' };
        }
        return { ok: true, width: w, height: h };
      }

      if (mode === 'percent') {
        const raw = percentInput.value.trim();
        const p = parseFloat(raw);

        if (!raw) {
          return { ok: false, message: 'Enter a percentage.' };
        }
        if (!Number.isFinite(p) || p <= 0) {
          return { ok: false, message: 'Percentage must be a positive number.' };
        }
        if (p < 1 || p > 200) {
          return { ok: false, message: 'Enter a percentage between 1 and 200.' };
        }

        const w = Math.max(1, Math.round(naturalWidth * (p / 100)));
        const h = Math.max(1, Math.round(naturalHeight * (p / 100)));
        return { ok: true, width: w, height: h };
      }

      if (mode === 'preset') {
        if (!selectedPreset) {
          return { ok: false, message: 'Choose a size.' };
        }
        return { ok: true, width: selectedPreset.w, height: selectedPreset.h };
      }

      return { ok: false, message: 'Choose a resize mode.' };
    }

    function validateLive() {
      const check = resolveTargetSize();

      exactMessage.hidden = true;
      percentMessage.hidden = true;
      widthInput.classList.remove('is-invalid');
      heightInput.classList.remove('is-invalid');
      percentInput.classList.remove('is-invalid');

      if (!check.ok && currentFile) {
        if (mode === 'exact') {
          exactMessage.textContent = check.message;
          exactMessage.hidden = false;
          widthInput.classList.add('is-invalid');
          heightInput.classList.add('is-invalid');
        } else if (mode === 'percent') {
          percentMessage.textContent = check.message;
          percentMessage.hidden = false;
          percentInput.classList.add('is-invalid');
        }
      }

      return check;
    }

    function updateHint() {
      if (!currentFile) {
        hint.textContent = 'Upload an image to begin.';
        return;
      }
      const check = resolveTargetSize();
      if (!check.ok) {
        hint.textContent = check.message;
      } else {
        hint.textContent = 'Will resize to ' + check.width + ' × ' + check.height + 'px.';
      }
    }

    function updateButtonState() {
      const check = currentFile ? resolveTargetSize() : { ok: false };
      resizeBtn.disabled = !currentFile || !check.ok;
      clearBtn.hidden = !currentFile;
      updateHint();
    }

    function resetTool() {
      currentFile = null;
      naturalWidth = 0;
      naturalHeight = 0;
      input.value = '';
      widthInput.value = '';
      heightInput.value = '';
      renderFileInfo();
      clearResult();
      updateButtonState();
    }

    function loadImageDimensions(file) {
      return new Promise(function (resolve, reject) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = function () {
          URL.revokeObjectURL(url);
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = function () {
          URL.revokeObjectURL(url);
          reject(new Error('Could not open this image.'));
        };
        img.src = url;
      });
    }

    async function loadFile(file) {
      if (!file) return;

      const isImage = /^image\/(jpeg|png|webp)$/i.test(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
      if (!isImage) {
        showMessage('error', 'Unsupported file', 'Please choose a JPG, PNG or WebP image.');
        return;
      }

      currentFile = file;
      naturalWidth = 0;
      naturalHeight = 0;
      clearResult();
      renderFileInfo();
      updateButtonState();

      try {
        const dims = await loadImageDimensions(file);
        naturalWidth = dims.width;
        naturalHeight = dims.height;
        widthInput.value = String(naturalWidth);
        heightInput.value = String(naturalHeight);
        renderFileInfo();
        validateLive();
        updateButtonState();
      } catch (error) {
        currentFile = null;
        renderFileInfo();
        showMessage('error', 'Could not read image', 'This file could not be opened as an image.');
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

    modePresets.addEventListener('click', function (event) {
      const btn = event.target.closest('.target-preset');
      if (!btn) return;

      modePresets.querySelectorAll('.target-preset').forEach(function (el) {
        el.classList.remove('is-selected');
      });
      btn.classList.add('is-selected');

      mode = btn.dataset.mode;
      exactGroup.hidden = mode !== 'exact';
      percentGroup.hidden = mode !== 'percent';
      presetGroup.hidden = mode !== 'preset';

      clearResult();
      validateLive();
      updateButtonState();
    });

    presetSizes.addEventListener('click', function (event) {
      const btn = event.target.closest('.target-preset');
      if (!btn) return;

      presetSizes.querySelectorAll('.target-preset').forEach(function (el) {
        el.classList.remove('is-selected');
      });
      btn.classList.add('is-selected');

      selectedPreset = { w: parseInt(btn.dataset.w, 10), h: parseInt(btn.dataset.h, 10) };
      clearResult();
      updateButtonState();
    });

    aspectLockBtn.addEventListener('click', function () {
      aspectLocked = !aspectLocked;
      aspectLockBtn.classList.toggle('is-locked', aspectLocked);
      aspectLockBtn.setAttribute('aria-pressed', String(aspectLocked));
      aspectLockBtn.textContent = aspectLocked ? '🔒' : '🔓';
      aspectLockHint.textContent = aspectLocked
        ? 'Aspect ratio is locked — width and height update together.'
        : 'Aspect ratio is unlocked — width and height are independent.';
    });

    widthInput.addEventListener('input', function () {
      if (aspectLocked && naturalWidth && naturalHeight) {
        const w = parseInt(widthInput.value, 10);
        if (Number.isFinite(w) && w > 0) {
          heightInput.value = String(Math.max(1, Math.round(w * (naturalHeight / naturalWidth))));
        }
      }
      validateLive();
      updateButtonState();
    });

    heightInput.addEventListener('input', function () {
      if (aspectLocked && naturalWidth && naturalHeight) {
        const h = parseInt(heightInput.value, 10);
        if (Number.isFinite(h) && h > 0) {
          widthInput.value = String(Math.max(1, Math.round(h * (naturalWidth / naturalHeight))));
        }
      }
      validateLive();
      updateButtonState();
    });

    percentInput.addEventListener('input', function () {
      validateLive();
      updateButtonState();
    });

    clearBtn.addEventListener('click', resetTool);

    function loadImageElement(file) {
      return new Promise(function (resolve, reject) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not open this image.')); };
        img.src = url;
      });
    }

    resizeBtn.addEventListener('click', async function () {
      if (!currentFile) {
        showMessage('error', 'No image selected', 'Choose an image to resize.');
        return;
      }

      const check = resolveTargetSize();
      if (!check.ok) {
        validateLive();
        updateButtonState();
        return;
      }

      const originalText = resizeBtn.textContent;
      resizeBtn.disabled = true;
      clearBtn.disabled = true;
      resizeBtn.textContent = 'Resizing…';
      clearResult();

      try {
        const img = await loadImageElement(currentFile);
        const canvas = document.createElement('canvas');
        canvas.width = check.width;
        canvas.height = check.height;
        const ctx = canvas.getContext('2d');

        const outputMime = /png/i.test(currentFile.type) ? 'image/png' : (/webp/i.test(currentFile.type) ? 'image/webp' : 'image/jpeg');

        if (outputMime === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0, check.width, check.height);

        const blob = await new Promise(function (resolve, reject) {
          canvas.toBlob(function (result) {
            if (!result || !result.size) {
              reject(new Error('The browser could not create the resized image.'));
              return;
            }
            // canvas.toBlob() silently substitutes image/png when the
            // requested format can't actually be encoded (most notably
            // WebP on Safari, which can open WebP but not create it).
            // Checking the real blob type here prevents shipping a
            // mislabeled file with the wrong extension.
            if (result.type !== outputMime) {
              reject(new Error('Your browser could not re-encode this image in its original format. Try a different browser, such as Chrome or Firefox.'));
              return;
            }
            resolve(result);
          }, outputMime, outputMime === 'image/png' ? undefined : 0.92);
        });

        const url = URL.createObjectURL(blob);
        const baseName = currentFile.name.replace(/\.[^.]+$/, '') || 'image';
        const ext = outputMime === 'image/png' ? 'png' : (outputMime === 'image/webp' ? 'webp' : 'jpg');

        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = baseName + '-resized.' + ext;
        downloadLink.className = 'btn-primary';
        downloadLink.textContent = 'Download Image →';

        result.className = 'result-box result-box--success';
        result.innerHTML = '';

        const heading = document.createElement('strong');
        heading.textContent = 'Image resized successfully';
        result.appendChild(heading);

        const statsWrap = document.createElement('div');
        statsWrap.className = 'tool-results--grid';

        function stat(label, value, featured) {
          const cell = document.createElement('div');
          cell.className = 'tool-result-box' + (featured ? ' tool-result-box--featured' : '');
          cell.innerHTML = '<span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong>';
          return cell;
        }

        statsWrap.appendChild(stat('Original', naturalWidth + ' × ' + naturalHeight));
        statsWrap.appendChild(stat('New size', check.width + ' × ' + check.height, true));
        statsWrap.appendChild(stat('File size', formatSize(blob.size)));
        result.appendChild(statsWrap);

        result.appendChild(downloadLink);
        result.hidden = false;

        setTimeout(function () { URL.revokeObjectURL(url); }, 120000);

      } catch (error) {
        console.error('Resize Image - error:', error);
        showMessage('error', 'Could not resize the image', 'Please check the file and try again.');

      } finally {
        clearBtn.disabled = false;
        resizeBtn.textContent = originalText;
        updateButtonState();
      }
    });

    updateButtonState();
  });
})();
