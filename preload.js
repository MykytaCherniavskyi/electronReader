// добавление обработчика событий при загрузки контента страницы
window.addEventListener('DOMContentLoaded', () => {
  window.$ = window.jQuery = require('jquery');
  const fileData = document.getElementById('fileData');

  // обработка логики прелоудера на старте приложения
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
  // ipcRenderer.send - отправка
  // ipcRenderer.on - принятие
  const {ipcRenderer} = electron;
  // Поиск эллементов в index.html
  const ul = document.querySelector('ul');
  const dragArea = document.getElementById('drag');
  const tableBody = $('#table > tbody');
  // массив правил для регулярного выражения
  let rules = [];

  // обработка нажатия кнопки search
  document.getElementById('search').addEventListener('click', function (e) {
    e.preventDefault();
    const textFieldData = fileData.value;
    const rulesCoincidence = [];

    rules.forEach(rule => {
      // каждое правило применяется к тексту в textarea поле
      // флаг g указывает, что это правило пройдется по всему тексту, а не до первого совпадения
      const coincidence = textFieldData.match(new RegExp(rule, 'g'));

      rulesCoincidence.push({
        rule,
        count: coincidence ? coincidence.length : 0
      });
    });
    addDataToTable(rulesCoincidence);
  });

  // Добавление количества совпадений в таблицу
  // data - {rule: ruleName, count: <integer>}
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

  // обработка события перемещения файла. Берется последний перемещенный файл и шлется его путь в main.js с id обработки - ondrop
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

  // Обработчик для считанные данные из main.js и записи их в textarea с id fileData
  ipcRenderer.on('fileData', function (e, data) {
    fileData.value = data;
  });

  // Обработка правила пришедшего из main.js и добавление в список правил и глобальный массив правил
  ipcRenderer.on('rule:add', function (e, rule) {
    // создание графического эллемента правила
    ul.className = 'collection';
    const li = document.createElement('li');
    li.className = 'collection-item';
    const RuleText = document.createTextNode(rule);
    // добавление правила в глобальный список правил
    rules.push(rule);
    // добавление правила в список главного окна
    li.appendChild(RuleText);
    ul.appendChild(li);
  });

  // Очистка всех правил
  ipcRenderer.on('rule:clear', function () {
    ul.innerHTML = '';
    ul.className = '';
    rules = [];
  });

  // Очистка правила по двойному клику
  ul.addEventListener('dblclick', removeRule);

  function removeRule(e) {
    // берется текст из нажатого елемента
    const ruleText = $(e.target).text();
    // ищется индекс этого текста в массиве правил
    const indexRule = rules.indexOf(ruleText);
    // удаляется найденный эллемент из массива
    rules.splice(indexRule, 1);
    // удаляется правило из списка в окне
    e.target.remove();

    if (ul.children.length === 0) {
      ul.className = '';
    }
  }
});
