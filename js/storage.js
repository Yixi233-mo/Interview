/* js/storage.js — localStorage 封装 */
(function () {
  const KEYS = {
    checks: 'hb_checks',
    collapsed: 'hb_collapsed',
    quizStats: 'hb_quiz_stats',
    tagsOpen: 'hb_tags_open'
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  window.HBStorage = {
    getChecks() { return read(KEYS.checks, []); },
    setChecks(arr) { write(KEYS.checks, arr); },
    toggleCheck(id) {
      const arr = this.getChecks();
      const idx = arr.indexOf(id);
      if (idx >= 0) arr.splice(idx, 1); else arr.push(id);
      this.setChecks(arr);
      return arr;
    },
    clearChecks() { write(KEYS.checks, []); },

    getCollapsed() { return read(KEYS.collapsed, []); },
    setCollapsed(arr) { write(KEYS.collapsed, arr); },

    getQuizStats() { return read(KEYS.quizStats, { done: 0, ok: 0, no: 0 }); },
    setQuizStats(s) { write(KEYS.quizStats, s); },

    getTagsOpen() { return read(KEYS.tagsOpen, false); },
    setTagsOpen(v) { write(KEYS.tagsOpen, !!v); },

    clearAll() {
      Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    }
  };
})();