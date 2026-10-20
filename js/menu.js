/* Mobile menu toggle (same markup as felixfeger.com) */
(function () {
  var btn = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.nav-mobile');
  if (!btn || !nav) return;
  btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();