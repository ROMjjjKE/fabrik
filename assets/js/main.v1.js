(function () {
  'use strict';
  var WA = '375293546215';
  var LOCK = 'is-locked';
  var COLS = 48;

  /* ---------- меню ---------- */
  function initDrawer() {
    var drawer = document.getElementById('drawer');
    var burger = document.querySelector('.burger');
    if (!drawer || !burger) return;
    var inner = drawer.querySelector('.drawer__inner');
    var lastFocus = null;

    function focusables() {
      return Array.prototype.slice.call(
        inner.querySelectorAll('a[href], button:not([disabled]), input, select, textarea')
      ).filter(function (el) { return el.offsetParent !== null; });
    }
    function open() {
      lastFocus = document.activeElement;
      drawer.hidden = false;
      document.body.classList.add(LOCK);
      burger.setAttribute('aria-expanded', 'true');
      var f = focusables();
      if (f.length) f[0].focus();
      document.addEventListener('keydown', onKey);
    }
    function close() {
      drawer.hidden = true;
      document.body.classList.remove(LOCK);
      burger.setAttribute('aria-expanded', 'false');
      document.removeEventListener('keydown', onKey);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    burger.addEventListener('click', function () {
      if (drawer.hidden) open(); else close();
    });
    Array.prototype.forEach.call(drawer.querySelectorAll('[data-close]'), function (el) {
      el.addEventListener('click', close);
    });
    Array.prototype.forEach.call(drawer.querySelectorAll('a[href]'), function (a) {
      a.addEventListener('click', close);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1180 && !drawer.hidden) close();
    });
  }

  /* ---------- конструктор ---------- */
  var PRESETS = {
    compact: { wall: 1600, items: ['f400', 'sink', 'w400'] },
    standard: { wall: 2400, items: ['f600', 'sink', 'hob', 'w600', 'w600'] },
    big: { wall: 3200, items: ['f400', 'f600', 'sink', 'hob', 'tall', 'w600', 'w600'] }
  };

  function initConfigurators() {
    var roots = document.querySelectorAll('[data-cfg]');
    if (!roots.length) return;

    Array.prototype.forEach.call(roots, function (root) {
      var catalog = {};
      Array.prototype.forEach.call(root.querySelectorAll('[data-add]'), function (btn) {
        catalog[btn.getAttribute('data-add')] = {
          id: btn.getAttribute('data-add'),
          name: btn.querySelector('.cfg__add-n').textContent.trim(),
          w: parseInt(btn.getAttribute('data-w'), 10),
          row: btn.getAttribute('data-row')
        };
      });

      var elev = root.querySelector('.cfg__elev');
      var range = root.querySelector('.cfg__range');
      var wallOut = root.querySelector('.cfg__wall');
      var occOut = root.querySelector('[data-occupied]');
      var note = root.querySelector('[data-note]');
      var chips = root.querySelector('[data-chips]');
      var send = root.querySelector('[data-send]');
      var clear = root.querySelector('[data-clear]');
      var state = { wall: parseInt(range.value, 10) || 2400, items: [] };

      function sum(list) {
        return list.reduce(function (s, i) { return s + i.w; }, 0);
      }

      function render() {
        var floorItems = state.items.filter(function (i) { return i.row === 'floor' || i.row === 'tall'; });
        var wallItems = state.items.filter(function (i) { return i.row === 'wall' || i.row === 'tall'; });
        var floorSum = sum(floorItems);
        var wallSum = sum(wallItems);
        var occupied = Math.max(floorSum, wallSum);
        var over = occupied > state.wall;

        root.classList.toggle('is-over', over);
        wallOut.textContent = state.wall + ' мм';
        occOut.textContent = occupied ? occupied + ' мм занято' : '0 мм';

        elev.innerHTML = '';
        elev.style.gridTemplateColumns = 'repeat(' + COLS + ', minmax(0, 1fr))';

        function place(list, rowName) {
          var cursor = 0;
          list.forEach(function (item) {
            var start = Math.round(cursor / state.wall * COLS);
            var span = Math.max(1, Math.round(item.w / state.wall * COLS));
            var d = document.createElement('div');
            d.className = 'mod mod--' + (item.row === 'tall' ? 'tall' : rowName);
            d.style.gridColumn = (start + 1) + ' / span ' + span;
            d.style.gridRow = item.row === 'tall' ? '1 / 4' : (rowName === 'wall' ? '1' : '3');
            d.setAttribute('title', item.name + ' · ' + item.w + ' мм');
            var s = document.createElement('span');
            s.textContent = String(item.w);
            d.appendChild(s);
            elev.appendChild(d);
            cursor += item.w;
          });
        }
        place(floorItems, 'floor');
        if (floorItems.length) place(wallItems.filter(function (i) { return i.row === 'wall'; }), 'wall');

        if (!state.items.length) {
          note.textContent = 'Выберите модули слева или возьмите готовую раскладку.';
        } else if (over) {
          note.textContent = 'Не влезает: самый длинный ряд ' + occupied + ' мм при стене ' + state.wall +
            ' мм. Уберите модуль или увеличьте ширину стены на ' + (occupied - state.wall) + ' мм.';
        } else {
          var rest = state.wall - occupied;
          note.textContent = 'Нижний ряд ' + floorSum + ' мм, верхний ' + wallSum + ' мм. По стене занято ' +
            occupied + ' мм из ' + state.wall + ', остаётся ' + rest + ' мм: закрывается добором или столешницей.';
        }

        chips.innerHTML = '';
        state.items.forEach(function (item, idx) {
          var li = document.createElement('li');
          li.className = 'cfg__chip';
          var span = document.createElement('span');
          span.textContent = item.name;
          li.appendChild(span);
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', 'Убрать ' + item.name);
          b.textContent = '×';
          b.addEventListener('click', function () {
            state.items.splice(idx, 1);
            render();
          });
          li.appendChild(b);
          chips.appendChild(li);
        });

        var lines = ['Заявка из конструктора («ФабрикСтайл»):', 'Ширина стены: ' + state.wall + ' мм'];
        if (state.items.length) {
          lines.push('Модули: ' + state.items.map(function (i) { return i.name; }).join(', '));
          lines.push('Нижний ряд: ' + floorSum + ' мм, верхний ряд: ' + wallSum + ' мм' +
            (over ? ' (не влезает, нужно поправить)' : ''));
        } else {
          lines.push('Модули пока не выбраны, нужна помощь с раскладкой');
        }
        send.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(lines.join('\n').slice(0, 1200));
      }

      Array.prototype.forEach.call(root.querySelectorAll('[data-add]'), function (btn) {
        btn.addEventListener('click', function () {
          var m = catalog[btn.getAttribute('data-add')];
          if (m) { state.items.push(m); render(); }
        });
      });

      range.addEventListener('input', function () {
        state.wall = parseInt(range.value, 10);
        render();
      });

      Array.prototype.forEach.call(root.querySelectorAll('[data-preset]'), function (btn) {
        btn.addEventListener('click', function () {
          var p = PRESETS[btn.getAttribute('data-preset')];
          if (!p) return;
          state.items = p.items.map(function (id) { return catalog[id]; }).filter(Boolean);
          state.wall = p.wall;
          range.value = String(p.wall);
          render();
        });
      });

      if (clear) {
        clear.addEventListener('click', function () {
          state.items = [];
          render();
        });
      }

      render();
    });
  }

  /* ---------- форма ---------- */
  function initForm() {
    var form = document.querySelector('.form');
    if (!form) return;
    var warn = document.getElementById('order-warn');
    var ok = document.getElementById('order-ok');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var val = function (sel) {
        var el = form.querySelector(sel);
        return el ? el.value.trim() : '';
      };
      var name = val('#f-name');
      var contact = val('#f-contact');
      if (!name || !contact) {
        if (warn) warn.hidden = false;
        return;
      }
      if (warn) warn.hidden = true;
      var rows = ['Заявка с сайта («ФабрикСтайл»):', 'Имя: ' + name, 'Контакт: ' + contact, 'Что нужно: ' + val('#f-what')];
      if (val('#f-city')) rows.push('Город: ' + val('#f-city'));
      if (val('#f-width')) rows.push('Ширина стены, мм: ' + val('#f-width'));
      if (val('#f-note')) rows.push('Комментарий: ' + val('#f-note'));
      var href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(rows.join('\n').slice(0, 1200));
      window.open(href, '_blank', 'noopener');
      if (ok) ok.hidden = false;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initDrawer();
    initConfigurators();
    initForm();
  });
})();
