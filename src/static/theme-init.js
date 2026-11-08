// Inline script in <head>, before the stylesheet, allowed by its sha256 hash in the CSP.
// Kept under 300 bytes. Changing it changes the hash; the build writes the new one into _headers.
// Applies a saved theme before first paint and marks that JavaScript is running.
(function (d) {
  d.classList.add('js');
  try {
    var t = localStorage.getItem('trace-theme');
    if (t === 'light' || t === 'dark') d.dataset.theme = t;
  } catch (e) {}
})(document.documentElement);
