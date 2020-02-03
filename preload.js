// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  window.$ = window.jQuery = require('jquery');
  window.M = require('materialize-css/dist/js/materialize.min');
  const fileData = document.getElementById('fileData');
  M.textareaAutoResize(fileData);

  setTimeout(function() {
    $('#ctn-preloader').addClass('loaded');
    $('body').removeClass('no-scroll-y');

    if ($('#ctn-preloader').hasClass('loaded')) {
      $('#preloader').delay(1000).queue(function() {
        $(this).remove();
      });
    }
  }, 4000);

  const electron = require('electron');
  const {ipcRenderer} = electron;
  const ul = document.querySelector('ul');
  const dragArea = document.getElementById('drag');

  dragArea.addEventListener('drop', function (e) {
    e.preventDefault();
    let filePath = null;

    for (let fileItem of e.dataTransfer.files) {
      filePath = fileItem.path;
    }

    ipcRenderer.send('ondrop', filePath);
  }, false);

  dragArea.addEventListener('dragover', function (e) {
    e.preventDefault();
  }, false);

  ipcRenderer.on('fileData', function (e, data) {
    fileData.value = data;
    M.textareaAutoResize(fileData);
    console.log(data);
  });

  // add rule
  ipcRenderer.on('rule:add', function (e, rule) {
    ul.className = 'collection';
    const li = document.createElement('li');
    li.className = 'collection-item';
    const RuleText = document.createTextNode(rule);
    li.appendChild(RuleText);
    ul.appendChild(li);
  });

  // clear rules
  ipcRenderer.on('rule:clear', function () {
    ul.innerHTML = '';
    ul.className = '';
  });

  // remove rule
  ul.addEventListener('dblclick', removeRule);

  function removeRule(e) {
    e.target.remove();

    if (ul.children.length === 0) {
      ul.className = '';
    }
  }
});
