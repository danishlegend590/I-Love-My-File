(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('imageFile');
    const dropzone = document.getElementById('imageDropzone');
    const fileList = document.getElementById('imageFileList');
    const presetButtons = Array.from(document.querySelectorAll('.target-preset'));
    const customGroup = document.getElementById('customSizeGroup');
    const customSize = document.getElementById('customSize');
    const unit = document.getElementById('sizeUnit');
    const customMessage = document.getElementById('customSizeMessage');
    const formatOptions = Array.from(document.querySelectorAll('input[name="outputFormat"]'));
    const formatLabels = Array.from(document.querySelectorAll('.format-option'));
    const avifOption = document.getElementById('avifFormatOption');
    const formatNote = document.getElementById('formatNote');
    const hint = document.getElementById('qualityHint');
    const compressButton = document.getElementById('compressBtn');
    const clearButton = document.getElementById('compressClearBtn');
    const result = document.getElementById('compressResult');

    if (!input || !dropzone || !fileList || !presetButtons.length || !customGroup || !customSize || !unit || !customMessage || !formatOptions.length || !compressButton || !clearButton || !result) {
      return;
    }

    let selectedFile = null;
    let currentTarget = { custom: false, value: 200, unit: 'KB' };
    let lastOutputUrl = null;

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, function (character) {
        return {
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
        }[character];
      });
    }

    function formatBytes(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    function revokeLastUrl() {
      if (lastOutputUrl) {
        URL.revokeObjectURL(lastOutputUrl);
        lastOutputUrl = null;
      }
    }

    function clearResult() {
      revokeLastUrl();
      result.hidden = true;
      result.className = 'result-box';
      result.innerHTML = '';
    }

    function showResult(type, title, bodyHtml) {
      result.className = 'result-box result-box--' + type;
      result.innerHTML = '<strong>' + escapeHtml(title) + '</strong>' + bodyHtml;
      result.hidden = false;
    }

    function setHint(message) {
      if (hint) hint.textContent = message;
    }

    function getSelectedFormat() {
      const checked = formatOptions.find(function (radio) {
        return radio.checked && !radio.disabled;
      });
      return checked ? checked.value : null;
    }

    function targetValidation() {
      if (!currentTarget.custom) {
        customMessage.hidden = true;
        customMessage.textContent = '';
        customSize.classList.remove('is-invalid');
        unit.classList.remove('is-invalid');
        return { valid: true, bytes: currentTarget.unit === 'MB' ? currentTarget.value * 1024 * 1024 : currentTarget.value * 1024 };
      }

      const raw = customSize.value.trim();
      const value = Number(raw);
      let error = '';

      if (!raw || !Number.isFinite(value) || value <= 0) {
        error = 'Enter a valid target size.';
      } else if (currentTarget.unit === 'KB' && value < 10) {
        error = 'Minimum allowed in KB mode is 10 KB.';
      } else if (currentTarget.unit === 'KB' && value > 500) {
        error = 'Maximum allowed in KB mode is 500 KB.';
      } else if (currentTarget.unit === 'MB' && value < 0.01) {
        error = 'Minimum allowed in MB mode is 0.01 MB.';
      } else if (currentTarget.unit === 'MB' && value > 10) {
        error = 'Maximum allowed in MB mode is 10 MB.';
      }

      const invalid = Boolean(error);
      customMessage.hidden = !invalid;
      customMessage.textContent = error;
      customSize.classList.toggle('is-invalid', invalid);
      unit.classList.toggle('is-invalid', invalid);

      return {
        valid: !invalid,
        bytes: !invalid ? (currentTarget.unit === 'MB' ? value * 1024 * 1024 : value * 1024) : null
      };
    }

    function targetLabel() {
      if (!currentTarget.custom) return currentTarget.value + ' ' + currentTarget.unit;
      return customSize.value.trim() + ' ' + currentTarget.unit;
    }

    function updatePresetStyles() {
      presetButtons.forEach(function (button) {
        const selected = currentTarget.custom
          ? button.dataset.target === 'custom'
          : button.dataset.target === String(currentTarget.value) && button.dataset.unit === currentTarget.unit;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
    }

    function updateFormatStyles() {
      formatLabels.forEach(function (label) {
        const radio = label.querySelector('input');
        if (!radio) return;
        label.classList.toggle('is-selected', radio.checked && !radio.disabled);
        label.classList.toggle('is-disabled', radio.disabled);
      });
    }

    function updateFormatNote() {
      if (!formatNote) return;
      const mime = getSelectedFormat();
      if (mime === 'image/png') {
        formatNote.textContent = 'PNG is lossless. Reaching very small targets may require reducing image dimensions.';
      } else if (mime === 'image/webp') {
        formatNote.textContent = 'WebP is a strong choice for websites and usually gives a good balance of quality and size.';
      } else if (mime === 'image/avif') {
        formatNote.textContent = 'AVIF can achieve very small files, but only browsers with AVIF encoding support can create it.';
      } else {
        formatNote.textContent = 'JPG is a practical default for photographs and target-size compression.';
      }
    }

    function updateButtonState() {
      const validation = targetValidation();
      const ready = Boolean(selectedFile) && validation.valid && Boolean(getSelectedFormat());
      compressButton.disabled = !ready;
      return validation;
    }

    function clearSelection() {
      selectedFile = null;
      input.value = '';
      fileList.hidden = true;
      fileList.innerHTML = '';
      clearResult();
      clearButton.hidden = true;
      setHint('Choose a target size and upload an image to begin.');
      updateButtonState();
    }

    function renderFile() {
      if (!selectedFile) {
        clearButton.hidden = true;
        fileList.hidden = true;
        fileList.innerHTML = '';
        updateButtonState();
        return;
      }

      fileList.hidden = false;
      clearButton.hidden = false;
      fileList.innerHTML = '<div class="file-row"><span><strong>' + escapeHtml(selectedFile.name) + '</strong><small> · ' + formatBytes(selectedFile.size) + '</small></span><button type="button" class="file-remove" aria-label="Remove image">×</button></div>';
      const remove = fileList.querySelector('.file-remove');
      if (remove) remove.addEventListener('click', clearSelection);
      updateButtonState();
    }

    function selectFile(file) {
      if (!file) return;
      if (!/^image\//i.test(file.type)) {
        showResult('error', 'Unsupported image', '<p>Please choose a JPG, PNG, WebP, GIF or another supported image file.</p>');
        return;
      }
      selectedFile = file;
      clearResult();
      renderFile();
      setHint('Ready. Choose your target and output format, then compress.');
    }

    function supportsMime(mime) {
      const canvas = document.createElement('canvas');
      if (!canvas.getContext || !canvas.getContext('2d')) return false;
      if (mime === 'image/jpeg' || mime === 'image/png') return true;
      if (mime === 'image/avif') {
        try {
          return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
        } catch (e) {
          return false;
        }
      }
      return false;
    }

    // canvas.toBlob() never throws and never returns null when a requested
    // format isn't supported for encoding — it silently falls back to PNG
    // instead. This is a real, current gap on Safari specifically: Safari
    // can DECODE WebP but cannot ENCODE it via canvas. The only reliable way
    // to detect this is to check the actual mime type of the blob returned,
    // not just assume support or use toDataURL string matching (which does
    // not reliably surface this particular Safari limitation for WebP).
    function supportsWebpEncoding() {
      return new Promise(function (resolve) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 1;
          canvas.height = 1;
          canvas.toBlob(function (blob) {
            resolve(!!blob && blob.type === 'image/webp');
          }, 'image/webp');
        } catch (e) {
          resolve(false);
        }
      });
    }

    let webpSupported = null; // null = not yet checked, true/false once resolved

    function refreshWebp() {
      const webpOption = formatLabels.find(function (label) {
        const radio = label.querySelector('input');
        return radio && radio.value === 'image/webp';
      });
      if (!webpOption) return;

      supportsWebpEncoding().then(function (supported) {
        webpSupported = supported;
        const radio = webpOption.querySelector('input');
        if (!radio) return;

        radio.disabled = !supported;
        if (!supported && radio.checked) {
          const jpg = formatOptions.find(function (r) { return r.value === 'image/jpeg'; });
          if (jpg) jpg.checked = true;
        }
        updateFormatStyles();
        updateFormatNote();
        updateButtonState();
      });
    }

    function refreshAvif() {
      if (!avifOption) return;
      const radio = avifOption.querySelector('input');
      if (!radio) return;
      const supported = supportsMime('image/avif');
      radio.disabled = !supported;
      if (!supported && radio.checked) {
        const jpg = formatOptions.find(function (r) { return r.value === 'image/jpeg'; });
        if (jpg) jpg.checked = true;
      }
      updateFormatStyles();
      updateFormatNote();
      updateButtonState();
    }

    function loadImage(file) {
      return new Promise(function (resolve, reject) {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = function () { URL.revokeObjectURL(url); resolve(image); };
        image.onerror = function () { URL.revokeObjectURL(url); reject(new Error('The selected image could not be opened.')); };
        image.src = url;
      });
    }

    function canvasToBlob(canvas, mime, quality) {
      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (!blob || !blob.size) return reject(new Error('The browser could not create the selected output format.'));
          // canvas.toBlob() silently falls back to image/png when the
          // requested mime type isn't actually supported for encoding — it
          // does not throw or return null. Checking blob.type here catches
          // that silent substitution (most notably WebP on Safari, which can
          // decode WebP but cannot encode it) instead of shipping a
          // mislabeled file to the person downloading it.
          if (blob.type !== mime) {
            return reject(new Error('Your browser could not encode this image as ' + mime.replace('image/', '').toUpperCase() + '. Try a different output format.'));
          }
          resolve(blob);
        }, mime, quality);
      });
    }

    async function encode(image, mime, quality, scale) {
      const sourceWidth = image.naturalWidth || image.width;
      const sourceHeight = image.naturalHeight || image.height;
      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(sourceHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas processing is not supported in this browser.');

      if (mime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, 0, 0, width, height);

      return {
        blob: await canvasToBlob(canvas, mime, mime === 'image/png' ? undefined : quality),
        width: width,
        height: height,
        quality: quality,
        scale: scale
      };
    }

    async function findAtOrBelowTarget(image, targetBytes, mime) {
      let scale = Math.min(1, 2600 / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
      let bestBelow = null;

      for (let round = 0; round < 14; round += 1) {
        if (mime === 'image/png') {
          const pngResult = await encode(image, mime, 1, scale);
          if (pngResult.blob.size <= targetBytes) return pngResult;
          scale *= 0.78;
          continue;
        }

        let low = 0.04;
        let high = 0.96;
        let below = null;

        for (let attempt = 0; attempt < 15; attempt += 1) {
          const quality = (low + high) / 2;
          const result = await encode(image, mime, quality, scale);
          if (result.blob.size <= targetBytes) {
            below = result;
            low = quality;
          } else {
            high = quality;
          }
        }

        if (below) {
          if (!bestBelow || below.blob.size > bestBelow.blob.size) bestBelow = below;
          return below;
        }

        scale *= 0.84;
      }

      return bestBelow;
    }

    async function compressImage() {
      const validation = updateButtonState();
      if (!selectedFile || !validation.valid || !getSelectedFormat()) return;

      const targetBytes = validation.bytes;
      const mime = getSelectedFormat();
      const label = targetLabel();

      compressButton.disabled = true;
      clearButton.disabled = true;
      compressButton.textContent = 'Compressing…';
      clearResult();
      setHint('Finding a result at or below ' + label + '…');

      try {
        const image = await loadImage(selectedFile);
        const best = await findAtOrBelowTarget(image, targetBytes, mime);

        if (!best || best.blob.size > targetBytes) {
          throw new Error('This target could not be reached with the selected format. Try a larger target or another output format.');
        }

        revokeLastUrl();
        lastOutputUrl = URL.createObjectURL(best.blob);

        const extension = mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1];
        const filename = selectedFile.name.replace(/\.[^.]+$/, '') + '-compressed.' + extension;
        const saved = Math.max(0, Math.round((1 - best.blob.size / selectedFile.size) * 100));

        showResult('success', 'Your compressed image is ready',
          '<div class="tool-results tool-results--grid">' +
            '<div class="tool-result-box"><span>Original</span><strong>' + formatBytes(selectedFile.size) + '</strong></div>' +
            '<div class="tool-result-box"><span>Target</span><strong>≤ ' + escapeHtml(label) + '</strong></div>' +
            '<div class="tool-result-box tool-result-box--featured"><span>Compressed</span><strong>' + formatBytes(best.blob.size) + '</strong></div>' +
            '<div class="tool-result-box"><span>Saved</span><strong>' + saved + '%</strong></div>' +
          '</div>' +
          '<p class="tool-note">Output: ' + escapeHtml(extension.toUpperCase()) + ' · Dimensions: ' + best.width + ' × ' + best.height + ' px</p>' +
          '<div class="tool-action-row">' +
            '<a class="btn-primary" href="' + lastOutputUrl + '" download="' + escapeHtml(filename) + '">Download image ↓</a>' +
            '<a class="btn-secondary" href="' + lastOutputUrl + '" target="_blank" rel="noopener">Preview</a>' +
            '<button class="btn-secondary" id="startOverBtn" type="button">Start over</button>' +
          '</div>'
        );

        const startOver = document.getElementById('startOverBtn');
        if (startOver) startOver.addEventListener('click', clearSelection);
        setHint('Done. The result is at or below your selected target.');
      } catch (error) {
        showResult('error', 'Compression could not finish', '<p>' + escapeHtml(error.message || 'Please try another image, target size or format.') + '</p>');
        setHint('Choose another target or output format and try again.');
      } finally {
        clearButton.disabled = false;
        compressButton.textContent = 'Compress image →';
        updateButtonState();
      }
    }

    presetButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        const target = button.dataset.target;
        if (target === 'custom') {
          currentTarget = { custom: true, value: Number(customSize.value) || 200, unit: unit.value || 'KB' };
          customGroup.hidden = false;
          customSize.focus();
          customSize.select();
        } else {
          currentTarget = { custom: false, value: Number(target), unit: button.dataset.unit || 'KB' };
          customGroup.hidden = true;
        }
        updatePresetStyles();
        clearResult();
        updateButtonState();
      });
    });

    customSize.addEventListener('input', function () {
      currentTarget.custom = true;
      updateButtonState();
    });

    unit.addEventListener('change', function () {
      currentTarget.custom = true;
      currentTarget.unit = unit.value;
      updateButtonState();
    });

    formatOptions.forEach(function (radio) {
      radio.addEventListener('change', function () {
        updateFormatStyles();
        updateFormatNote();
        updateButtonState();
      });
    });

    input.addEventListener('change', function () {
      if (input.files && input.files[0]) selectFile(input.files[0]);
    });

    ['dragenter', 'dragover'].forEach(function (name) {
      dropzone.addEventListener(name, function (event) {
        event.preventDefault();
        event.stopPropagation();
        dropzone.classList.add('is-dragover');
      });
    });

    ['dragleave', 'drop'].forEach(function (name) {
      dropzone.addEventListener(name, function (event) {
        event.preventDefault();
        event.stopPropagation();
        dropzone.classList.remove('is-dragover');
      });
    });

    dropzone.addEventListener('drop', function (event) {
      const dropped = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (dropped) selectFile(dropped);
    });

    clearButton.addEventListener('click', clearSelection);
    compressButton.addEventListener('click', compressImage);

    customGroup.hidden = true;
    updatePresetStyles();
    updateFormatStyles();
    refreshAvif();
    refreshWebp();
    renderFile();
    setHint('Choose a target size and upload an image to begin.');
  });
})();
