// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  window.$ = window.jQuery = require('jquery');

  setTimeout(function() {
    $('#ctn-preloader').addClass('loaded');
    $('body').removeClass('no-scroll-y');

    if ($('#ctn-preloader').hasClass('loaded')) {
      $('#preloader').delay(1000).queue(function() {
        $(this).remove();
      });
    }
  }, 4000);
});
