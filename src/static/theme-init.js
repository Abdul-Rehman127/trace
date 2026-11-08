// Classic blocking script, loaded in <head> before the stylesheet. Kept under 300 bytes.
// Applies a saved theme before first paint and marks that JavaScript is running.
(function (d) {
  d.classList.add('js');
  try {
    var t = localStorage.getItem('trace-theme');
    if (t === 'light' || t === 'dark') d.dataset.theme = t;
  } catch (e) {}
})(document.documentElement);
