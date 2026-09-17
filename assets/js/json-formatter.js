(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('jsonFile');
    const sampleBtn = document.getElementById('jsonSampleBtn');
    const clearBtn = document.getElementById('jsonClearBtn');
    const jsonInput = document.getElementById('jsonInput');
    const hint = document.getElementById('jsonHint');
    const formatBtn = document.getElementById('jsonFormatBtn');
    const minifyBtn = document.getElementById('jsonMinifyBtn');
    const result = document.getElementById('jsonResult');
    const outputPanel = document.getElementById('jsonOutputPanel');
    const jsonOutput = document.getElementById('jsonOutput');
    const copyBtn = document.getElementById('jsonCopyBtn');
    const downloadBtn = document.getElementById('jsonDownloadBtn');

    if (
      !fileInput || !sampleBtn || !clearBtn || !jsonInput || !hint ||
      !formatBtn || !minifyBtn || !result || !outputPanel || !jsonOutput ||
      !copyBtn || !downloadBtn
    ) {
      return;
    }

    const SAMPLE_JSON = '{\n  "name": "Ada Lovelace",\n  "born": 1815,\n  "active": true,\n  "skills": ["mathematics", "computing"],\n  "profile": {"country": "United Kingdom"}\n}';

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

    function clearResult() {
      result.hidden = true;
      result.innerHTML = '';
    }

    function showMessage(type, title, message) {
      result.className = 'result-box' + (type ? ' result-box--' + type : '');
      result.innerHTML = '<strong>' + escapeHtml(title) + '</strong><p>' + message + '</p>';
      result.hidden = false;
    }

    // Converts a JSON.parse SyntaxError (which only gives a raw character
    // position in older engines, e.g. "Unexpected token } in JSON at
    // position 47") into a line/column reference, which is far more useful
    // for finding the actual problem in a large pasted document. Newer V8
    // versions already include their own "(line N column M)" in the message,
    // so we only append our own when the engine hasn't already provided one.
    function describeJsonError(error, text) {
      const rawMessage = error && error.message ? error.message : 'Invalid JSON.';

      if (/line \d+ column \d+/i.test(rawMessage)) {
        return escapeHtml(rawMessage);
      }

      const positionMatch = rawMessage.match(/position (\d+)/i);

      if (!positionMatch) {
        return escapeHtml(rawMessage);
      }

      const pos = parseInt(positionMatch[1], 10);
      const before = text.slice(0, pos);
      const line = (before.match(/\n/g) || []).length + 1;
      const lastNewline = before.lastIndexOf('\n');
      const column = pos - lastNewline;

      return escapeHtml(rawMessage) + ' (line ' + line + ', column ' + column + ')';
    }

    function updateButtonState() {
      const hasContent = jsonInput.value.trim().length > 0;
      formatBtn.disabled = !hasContent;
      minifyBtn.disabled = !hasContent;
      hint.textContent = hasContent ? 'Ready to format or validate.' : 'Paste JSON above, or upload a .json file.';
    }

    function loadTextFile(file) {
      return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () { resolve(String(reader.result || '')); };
        reader.onerror = function () { reject(new Error('Could not read this file.')); };
        reader.readAsText(file);
      });
    }

    fileInput.addEventListener('change', async function () {
      const file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (!file) return;

      try {
        const text = await loadTextFile(file);
        jsonInput.value = text;
        clearResult();
        outputPanel.hidden = true;
        updateButtonState();
      } catch (error) {
        showMessage('error', 'Could not read file', 'Please choose a valid text or .json file.');
      }
    });

    sampleBtn.addEventListener('click', function () {
      jsonInput.value = SAMPLE_JSON;
      clearResult();
      outputPanel.hidden = true;
      updateButtonState();
    });

    clearBtn.addEventListener('click', function () {
      jsonInput.value = '';
      jsonOutput.value = '';
      outputPanel.hidden = true;
      clearResult();
      updateButtonState();
    });

    jsonInput.addEventListener('input', function () {
      updateButtonState();
    });

    function runFormat(minify) {
      const raw = jsonInput.value;

      if (!raw.trim()) {
        showMessage('error', 'Nothing to format', 'Paste some JSON first.');
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        outputPanel.hidden = true;
        showMessage('error', 'Invalid JSON', describeJsonError(error, raw));
        return;
      }

      const output = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
      jsonOutput.value = output;
      outputPanel.hidden = false;

      showMessage(
        'success',
        minify ? 'JSON is valid — minified' : 'JSON is valid — formatted',
        'Output is ' + output.length.toLocaleString() + ' characters.'
      );
    }

    formatBtn.addEventListener('click', function () { runFormat(false); });
    minifyBtn.addEventListener('click', function () { runFormat(true); });

    copyBtn.addEventListener('click', async function () {
      if (!jsonOutput.value) return;
      try {
        await navigator.clipboard.writeText(jsonOutput.value);
        const original = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(function () { copyBtn.textContent = original; }, 1500);
      } catch (error) {
        // Fallback for browsers without Clipboard API permission granted.
        jsonOutput.select();
        try {
          document.execCommand('copy');
          const original = copyBtn.textContent;
          copyBtn.textContent = 'Copied!';
          setTimeout(function () { copyBtn.textContent = original; }, 1500);
        } catch (fallbackError) {
          showMessage('error', 'Could not copy', 'Please select and copy the text manually.');
        }
      }
    });

    downloadBtn.addEventListener('click', function () {
      if (!jsonOutput.value) return;
      const blob = new Blob([jsonOutput.value], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'formatted.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
    });

    updateButtonState();
  });
})();
