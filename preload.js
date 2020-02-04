// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  window.$ = window.jQuery = require('jquery');
  const fileData = document.getElementById('fileData');

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
  const tableBody = $('#table > tbody');
  let rules = [];

  document.getElementById('search').addEventListener('click', function (e) {
    e.preventDefault();
    const textFieldData = fileData.value;
    const rulesCoincidence = [];

    rules.forEach(rule => {
      const coincidence = textFieldData.match(new RegExp(rule, 'g'));

      rulesCoincidence.push({
        rule,
        count: coincidence ? coincidence.length : 0
      });
    });
    addDataToTable(rulesCoincidence);
  });

  function addDataToTable(data) {
    tableBody.empty();

    data.forEach(({rule, count}) => {
      const row = `<tr>
          <td>${rule}</td>
          <td>${count}</td>
      </tr>`;
      tableBody.append(row);
    })
  }

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
  });

  // add rule
  ipcRenderer.on('rule:add', function (e, rule) {
    ul.className = 'collection';
    const li = document.createElement('li');
    li.className = 'collection-item';
    const RuleText = document.createTextNode(rule);
    rules.push(rule);
    li.appendChild(RuleText);
    ul.appendChild(li);
  });

  // clear rules
  ipcRenderer.on('rule:clear', function () {
    ul.innerHTML = '';
    ul.className = '';
    rules = [];
  });

  // remove rule
  ul.addEventListener('dblclick', removeRule);

  function removeRule(e) {
    const ruleText = $(e.target).text();
    const indexRule = rules.indexOf(ruleText);
    rules.splice(indexRule, 1);
    e.target.remove();

    if (ul.children.length === 0) {
      ul.className = '';
    }
  }
});
