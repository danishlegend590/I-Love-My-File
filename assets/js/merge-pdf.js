(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('pdfFiles');
    const zone = document.getElementById('dropzone');
    const list = document.getElementById('fileList');
    const mergeBtn = document.getElementById('mergeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const result = document.getElementById('result');

    if (!input || !zone || !list || !mergeBtn || !clearBtn || !result) {
      return;
    }

    let files = [];

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
      if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + ' KB';
      }
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function showResult(type, title, message, downloadLink) {
      result.className = 'result-box' + (type ? ' result-box--' + type : '');

      result.innerHTML =
        '<strong>' + escapeHtml(title) + '</strong>' +
        '<p>' + message + '</p>';

      if (downloadLink) {
        result.appendChild(downloadLink);
      }

      result.hidden = false;
    }

    function render() {
      list.innerHTML = '';

      list.hidden = files.length === 0;
      clearBtn.hidden = files.length === 0;
      mergeBtn.disabled = files.length < 2;

      files.forEach(function (file, index) {
        const row = document.createElement('div');
        row.className = 'file-row';

        const text = document.createElement('span');
        text.innerHTML =
          '<strong>' + (index + 1) + '.</strong> ' +
          escapeHtml(file.name) +
          ' <small>· ' +
          formatSize(file.size) +
          '</small>';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.setAttribute('aria-label', 'Remove ' + file.name);
        removeBtn.textContent = '×';

        removeBtn.addEventListener('click', function () {
          files.splice(index, 1);
          result.hidden = true;
          render();
        });

        row.appendChild(text);
        row.appendChild(removeBtn);
        list.appendChild(row);
      });
    }

    function addFiles(fileList) {
      const incoming = Array.from(fileList || []).filter(function (file) {
        return (
          file.type === 'application/pdf' ||
          /\.pdf$/i.test(file.name)
        );
      });

      if (!incoming.length) {
        showResult(
          'error',
          'No PDF files found',
          'Please select valid PDF files and try again.'
        );
        return;
      }

      files = files.concat(incoming);
      result.hidden = true;
      render();
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

    clearBtn.addEventListener('click', function () {
      files = [];
      result.hidden = true;
      render();
    });

    mergeBtn.addEventListener('click', async function () {
      if (files.length < 2) {
        showResult(
          'error',
          'Select at least 2 PDFs',
          'Choose two or more PDF files to merge them.'
        );
        return;
      }

      if (
        !window.PDFLib ||
        typeof window.PDFLib.PDFDocument !== 'function'
      ) {
        showResult(
          'error',
          'PDF engine could not load',
          'Please refresh the page and try again.'
        );
        return;
      }

      const originalText = mergeBtn.textContent;

      mergeBtn.disabled = true;
      clearBtn.disabled = true;
      mergeBtn.textContent = 'Merging…';
      result.hidden = true;

      try {
        const PDFDocument = window.PDFLib.PDFDocument;
        const outputPdf = await PDFDocument.create();

        for (const file of files) {
          const sourceBytes = await file.arrayBuffer();

          const sourcePdf = await PDFDocument.load(sourceBytes, {
            ignoreEncryption: false,
            updateMetadata: false
          });

          const pageIndices = sourcePdf.getPageIndices();

          const copiedPages = await outputPdf.copyPages(
            sourcePdf,
            pageIndices
          );

          copiedPages.forEach(function (page) {
            outputPdf.addPage(page);
          });
        }

        const mergedBytes = await outputPdf.save({
          useObjectStreams: true,
          addDefaultPage: false
        });

        const blob = new Blob(
          [mergedBytes],
          { type: 'application/pdf' }
        );

        const url = URL.createObjectURL(blob);

        const fileName =
          'merged-pdf-' +
          new Date().toISOString().slice(0, 10) +
          '.pdf';

        const downloadLink = document.createElement('a');

        downloadLink.href = url;
        downloadLink.download = fileName;
        downloadLink.className = 'btn-primary';
        downloadLink.textContent = 'Download merged PDF →';

        showResult(
          'success',
          'PDFs merged successfully',
          files.length +
            ' PDF files were combined in your browser.',
          downloadLink
        );

        downloadLink.click();

        setTimeout(function () {
          URL.revokeObjectURL(url);
        }, 120000);

      } catch (error) {
        console.error('Merge PDF error:', error);

        let message =
          'The PDFs could not be merged. Please check that the files are valid and try again.';

        if (
          error &&
          /encrypted|password|password-protected/i.test(
            String(error.message || error)
          )
        ) {
          message =
            'One of the PDFs appears to be password-protected or encrypted. Remove the protection and try again.';
        }

        showResult(
          'error',
          'Could not merge the PDFs',
          message
        );

      } finally {
        clearBtn.disabled = false;
        mergeBtn.disabled = files.length < 2;
        mergeBtn.textContent = originalText;
      }
    });

    render();
  });
})();