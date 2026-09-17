(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('searchInput');
    const grid = document.getElementById('popularGrid');
    const emptyState = document.getElementById('searchEmpty');

    if (!input || !grid || !emptyState) {
      return;
    }

    const cards = Array.prototype.slice.call(grid.querySelectorAll('.tool-card'));

    function normalize(value) {
      return (value || '').toLowerCase().trim();
    }

    function filter() {
      const query = normalize(input.value);
      let visibleCount = 0;

      cards.forEach(function (card) {
        const haystack = normalize(card.dataset.tool);
        const matches = query === '' || haystack.indexOf(query) !== -1;
        card.style.display = matches ? '' : 'none';
        if (matches) visibleCount++;
      });

      emptyState.hidden = visibleCount !== 0;
    }

    input.addEventListener('input', filter);

    // Support the ⌘K / Ctrl+K shortcut shown in the search box UI.
    document.addEventListener('keydown', function (event) {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (isShortcut) {
        event.preventDefault();
        input.focus();
        input.select();
      }
    });
  });
})();
