(function () {
  'use strict';

  function padZero(value) { return String(value).padStart(2, '0'); }
  function localDateString(date) {
    return date.getFullYear() + '-' + padZero(date.getMonth() + 1) + '-' + padZero(date.getDate());
  }

  var todayStr = localDateString(new Date());
  var dateElem = document.getElementById('current-date');
  dateElem.textContent = new Date().toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', weekday: 'short' });

  var tabNames = ['log', 'grid', 'todo', 'list'];
  window.switchTab = function (target) {
    if (tabNames.indexOf(target) < 0) return;
    tabNames.forEach(function (name) {
      document.getElementById('tab-pane-' + name).classList.toggle('hidden', name !== target);
      var button = document.getElementById('tab-btn-' + name);
      button.className = name === target
        ? 'flex-1 py-2 rounded-lg transition-all bg-white text-slate-900 shadow-sm'
        : 'flex-1 py-2 rounded-lg transition-all text-slate-500 hover:text-slate-900';
      button.setAttribute('aria-selected', name === target ? 'true' : 'false');
    });
    if (target === 'grid') renderGrid();
    if (target === 'list') renderLogs();
    if (target === 'todo') renderTodos();
  };

  var allSlots = [];
  for (var h = 0; h < 24; h++) {
    allSlots.push(padZero(h) + ':00 - ' + padZero(h) + ':30');
    allSlots.push(padZero(h) + ':30 - ' + padZero((h + 1) % 24) + ':00');
  }
  function getCurrentTimeSlot() {
    var now = new Date();
    var startMin = now.getMinutes() < 30 ? '00' : '30';
    var endMin = startMin === '00' ? '30' : '00';
    var startHour = now.getHours();
    var endHour = startMin === '00' ? startHour : (startHour + 1) % 24;
    return padZero(startHour) + ':' + startMin + ' - ' + padZero(endHour) + ':' + endMin;
  }

  var selectElem = document.getElementById('time-slot-select');
  allSlots.forEach(function (slot) {
    var option = document.createElement('option');
    option.value = slot;
    option.textContent = slot;
    selectElem.appendChild(option);
  });
  selectElem.value = getCurrentTimeSlot();
  document.getElementById('reset-slot-btn').addEventListener('click', function () {
    selectElem.value = getCurrentTimeSlot();
  });

  var TODO_STORAGE_KEY = 'simple_todos_' + todayStr;
  function getTodos() {
    try { return JSON.parse(localStorage.getItem(TODO_STORAGE_KEY) || '[]'); }
    catch (error) { return []; }
  }
  function renderTodos() {
    var todos = getTodos();
    document.getElementById('todo-stats').textContent = todos.filter(function (todo) { return todo.done; }).length + '/' + todos.length;
    var list = document.getElementById('todo-list');
    list.replaceChildren();
    if (!todos.length) {
      list.textContent = '設定 1~3 個今天最重要的目標吧！';
      list.className = 'space-y-1.5 max-h-72 overflow-y-auto pr-1 text-xs text-slate-400 py-2';
      return;
    }
    list.className = 'space-y-1.5 max-h-72 overflow-y-auto pr-1';
    todos.forEach(function (todo) {
      var row = document.createElement('div');
      row.className = 'flex items-center gap-2 rounded-lg border border-slate-100 px-2.5 py-2';
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = Boolean(todo.done);
      checkbox.className = 'accent-slate-900';
      checkbox.setAttribute('aria-label', '完成目標：' + todo.text);
      checkbox.addEventListener('change', function () {
        var items = getTodos();
        var item = items.find(function (entry) { return entry.id === todo.id; });
        if (item) { item.done = checkbox.checked; saveTodos(items); }
      });
      var label = document.createElement('span');
      label.className = 'flex-1 text-xs ' + (todo.done ? 'line-through text-slate-400' : 'text-slate-700 font-medium');
      label.textContent = todo.text;
      var remove = document.createElement('button');
      remove.type = 'button'; remove.textContent = '✕';
      remove.className = 'text-xs text-slate-300 hover:text-rose-500 px-1';
      remove.setAttribute('aria-label', '刪除目標：' + todo.text);
      remove.addEventListener('click', function () { saveTodos(getTodos().filter(function (entry) { return entry.id !== todo.id; })); });
      row.append(checkbox, label, remove);
      list.appendChild(row);
    });
  }
  function saveTodos(todos) { localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos)); renderTodos(); }
  function addTodo() {
    var input = document.getElementById('todo-input');
    var text = input.value.trim();
    if (!text) return;
    var todos = getTodos();
    if (todos.length >= 3) { alert('今天先聚焦在 1~3 個目標。'); return; }
    todos.push({ id: Date.now(), text: text, done: false });
    saveTodos(todos); input.value = '';
  }
  document.getElementById('add-todo-btn').addEventListener('click', addTodo);
  document.getElementById('todo-input').addEventListener('keydown', function (event) { if (event.key === 'Enter') { event.preventDefault(); addTodo(); } });

  var TAGS_KEY = 'user_custom_tags';
  var defaultTags = ['吃早餐/用餐', '出門/通勤', '專注工作', '開會', '滑手機/放空', '打爐石', '運動/散步'];
  function getCustomTags() {
    try { return JSON.parse(localStorage.getItem(TAGS_KEY) || 'null') || defaultTags.slice(); }
    catch (error) { return defaultTags.slice(); }
  }
  function renderTags() {
    var container = document.getElementById('tag-container');
    container.replaceChildren();
    getCustomTags().forEach(function (tag, index) {
      var chip = document.createElement('span');
      chip.className = 'inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 text-[11px] pl-2.5 pr-1 py-1';
      var choose = document.createElement('button');
      choose.type = 'button'; choose.textContent = tag; choose.className = 'hover:text-slate-900';
      choose.addEventListener('click', function () { document.getElementById('action-input').value = tag; });
      var remove = document.createElement('button');
      remove.type = 'button'; remove.textContent = '×'; remove.className = 'text-slate-400 hover:text-rose-500 px-1';
      remove.setAttribute('aria-label', '刪除標籤：' + tag);
      remove.addEventListener('click', function () { var tags = getCustomTags(); tags.splice(index, 1); localStorage.setItem(TAGS_KEY, JSON.stringify(tags)); renderTags(); });
      chip.append(choose, remove); container.appendChild(chip);
    });
  }
  function addTag() {
    var input = document.getElementById('new-tag-input'); var value = input.value.trim();
    if (!value) return;
    var tags = getCustomTags();
    if (tags.indexOf(value) === -1) { tags.push(value); localStorage.setItem(TAGS_KEY, JSON.stringify(tags)); renderTags(); }
    input.value = '';
  }
  document.getElementById('add-tag-btn').addEventListener('click', addTag);
  document.getElementById('new-tag-input').addEventListener('keydown', function (event) { if (event.key === 'Enter') { event.preventDefault(); addTag(); } });
  renderTags();

  var STORAGE_KEY = 'simple_logs_' + todayStr;
  function getLogs() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch (error) { return []; }
  }
  function saveLogs(logs) {
    logs.sort(function (a, b) { return allSlots.indexOf(a.slot) - allSlots.indexOf(b.slot); });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    renderLogs(); renderGrid();
  }
  function saveLog(slot, action) {
    var logs = getLogs();
    var found = logs.find(function (log) { return log.slot === slot; });
    if (found) found.action = action; else logs.push({ slot: slot, action: action });
    saveLogs(logs);
  }
  var logList = document.getElementById('log-list');
  function getSlotStart(slot) { return slot.slice(0, 5); }
  function getSlotEnd(slot) { return slot.slice(8); }
  function groupAdjacentLogs(logs) {
    var ordered = logs.slice().sort(function (a, b) { return allSlots.indexOf(a.slot) - allSlots.indexOf(b.slot); });
    var groups = [];
    ordered.forEach(function (log) {
      var index = allSlots.indexOf(log.slot);
      var previous = groups[groups.length - 1];
      if (previous && previous.action === log.action && allSlots.indexOf(previous.slots[previous.slots.length - 1]) + 1 === index) {
        previous.slots.push(log.slot);
        previous.end = getSlotEnd(log.slot);
      } else {
        groups.push({ action: log.action, slots: [log.slot], start: getSlotStart(log.slot), end: getSlotEnd(log.slot) });
      }
    });
    return groups.reverse();
  }
  function renderLogs() {
    var groups = groupAdjacentLogs(getLogs());
    logList.replaceChildren();
    if (!groups.length) { logList.textContent = '今天還沒有紀錄'; logList.className = 'space-y-2 max-h-80 overflow-y-auto pr-1 text-xs text-slate-400 py-2'; return; }
    logList.className = 'space-y-2 max-h-80 overflow-y-auto pr-1';
    groups.forEach(function (group) {
      var row = document.createElement('div');
      row.className = 'flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4';
      var slot = document.createElement('span'); slot.className = 'text-base font-mono font-bold text-slate-500 whitespace-nowrap'; slot.textContent = group.start + ' - ' + group.end;
      var action = document.createElement('span'); action.className = 'flex-1 min-w-0 text-base text-slate-900 break-words'; action.textContent = group.action;
      var edit = document.createElement('button'); edit.type = 'button'; edit.textContent = '修改'; edit.className = 'text-sm text-indigo-500 hover:text-indigo-700';
      edit.addEventListener('click', function () {
        var updatedAction = prompt('修改 ' + group.start + ' - ' + group.end + ' 這段足跡：', group.action);
        if (updatedAction === null || !updatedAction.trim()) return;
        var logs = getLogs();
        group.slots.forEach(function (slotName) {
          var item = logs.find(function (entry) { return entry.slot === slotName; });
          if (item) item.action = updatedAction.trim();
        });
        saveLogs(logs);
      });
      var remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '✕'; remove.className = 'text-2xl leading-none text-slate-300 hover:text-rose-500 px-1';
      remove.setAttribute('aria-label', '刪除 ' + group.start + ' - ' + group.end + ' 這段紀錄');
      remove.addEventListener('click', function () {
        if (!confirm('確定要刪除 ' + group.start + ' - ' + group.end + ' 這段足跡嗎？')) return;
        var slotsToRemove = new Set(group.slots);
        saveLogs(getLogs().filter(function (item) { return !slotsToRemove.has(item.slot); }));
      });
      row.append(slot, action, edit, remove); logList.appendChild(row);
    });
  }

  var gridContainer = document.getElementById('grid-container');
  var selectedSlots = new Set();
  var batchMode = false;
  var isDraggingSelection = false;
  var dragSelectionValue = true;
  var visitedDuringDrag = new Set();
  var batchTools = document.getElementById('batch-tools');
  var batchModeButton = document.getElementById('batch-mode-btn');
  var batchCount = document.getElementById('selected-count');
  function refreshBatchControls() {
    batchTools.classList.toggle('hidden', !batchMode);
    batchModeButton.textContent = batchMode ? '結束選取' : '開始選取';
    document.getElementById('batch-help').textContent = batchMode
      ? '按住方格拖曳即可連續選取；已記錄的格子也可以覆寫'
      : '選取多個格子後，統一填寫活動';
    batchCount.textContent = '已選 ' + selectedSlots.size + ' 格';
  }
  batchModeButton.addEventListener('click', function () {
    batchMode = !batchMode;
    if (!batchMode) selectedSlots.clear();
    refreshBatchControls();
    renderGrid();
  });
  document.getElementById('clear-selection-btn').addEventListener('click', function () {
    selectedSlots.clear(); refreshBatchControls(); renderGrid();
  });
  document.getElementById('apply-batch-btn').addEventListener('click', function () {
    var action = document.getElementById('batch-action-input').value.trim();
    if (!selectedSlots.size) { alert('請先選取至少一個時段。'); return; }
    if (!action) { alert('請先輸入要填入的活動。'); document.getElementById('batch-action-input').focus(); return; }
    var logs = getLogs();
    selectedSlots.forEach(function (slot) {
      var existing = logs.find(function (log) { return log.slot === slot; });
      if (existing) existing.action = action;
      else logs.push({ slot: slot, action: action });
    });
    var count = selectedSlots.size;
    saveLogs(logs);
    selectedSlots.clear();
    document.getElementById('batch-action-input').value = '';
    batchMode = false;
    refreshBatchControls();
    renderGrid();
    alert('已將「' + action + '」填入 ' + count + ' 個時段。');
  });
  function renderGrid() {
    var logs = getLogs(); var logMap = new Map(logs.map(function (log) { return [log.slot, log.action]; }));
    document.getElementById('grid-stats').textContent = logs.length + '/48 格 (' + Math.round(logs.length / 48 * 100) + '%)';
    gridContainer.replaceChildren();
    allSlots.forEach(function (slot) {
      var action = logMap.get(slot); var current = slot === getCurrentTimeSlot();
      var button = document.createElement('button'); button.type = 'button';
      var isSelected = selectedSlots.has(slot);
      button.className = 'aspect-square rounded-md text-[9px] font-mono transition ' + (batchMode ? 'touch-none select-none cursor-crosshair' : 'cursor-pointer') + (action ? ' bg-emerald-500 text-white font-semibold hover:bg-emerald-600' : ' bg-white text-slate-400 border border-slate-200 hover:border-slate-400') + (current ? ' ring-2 ring-indigo-500 ring-offset-1 font-bold' : '') + (isSelected ? ' outline outline-2 outline-amber-400 outline-offset-1 scale-105' : '');
      button.textContent = slot.slice(0, 5);
      button.title = slot + (action ? '：' + action : '（未記錄）');
      button.setAttribute('aria-label', button.title);
      button.dataset.slot = slot;
      button.addEventListener('pointerdown', function (event) {
        if (!batchMode) return;
        event.preventDefault();
        isDraggingSelection = true;
        dragSelectionValue = !selectedSlots.has(slot);
        visitedDuringDrag.clear();
        selectSlotWhileDragging(slot);
        button.setPointerCapture(event.pointerId);
      });
      button.addEventListener('pointerenter', function () {
        if (batchMode && isDraggingSelection) selectSlotWhileDragging(slot);
      });
      button.addEventListener('pointermove', function (event) {
        if (!batchMode || !isDraggingSelection) return;
        var target = document.elementFromPoint(event.clientX, event.clientY);
        var targetButton = target && target.closest('#grid-container [data-slot]');
        if (targetButton) selectSlotWhileDragging(targetButton.dataset.slot);
      });
      button.addEventListener('click', function () {
        if (!batchMode) window.clickGridSlot(slot, action || '');
      });
      gridContainer.appendChild(button);
    });
  }
  function selectSlotWhileDragging(slot) {
    if (visitedDuringDrag.has(slot)) return;
    visitedDuringDrag.add(slot);
    if (dragSelectionValue) selectedSlots.add(slot);
    else selectedSlots.delete(slot);
    refreshBatchControls();
    var cell = gridContainer.querySelector('[data-slot="' + slot + '"]');
    if (cell) {
      cell.classList.toggle('outline', selectedSlots.has(slot));
      cell.classList.toggle('outline-2', selectedSlots.has(slot));
      cell.classList.toggle('outline-offset-1', selectedSlots.has(slot));
      cell.classList.toggle('scale-105', selectedSlots.has(slot));
      cell.classList.toggle('outline-amber-400', selectedSlots.has(slot));
    }
  }
  function finishDragSelection() {
    if (!isDraggingSelection) return;
    isDraggingSelection = false;
    visitedDuringDrag.clear();
  }
  document.addEventListener('pointerup', finishDragSelection);
  document.addEventListener('pointercancel', finishDragSelection);
  window.clickGridSlot = function (slot, action) {
    window.switchTab('log'); selectElem.value = slot; document.getElementById('action-input').value = action; document.getElementById('action-input').focus();
  };
  window.editSlot = window.clickGridSlot;
  window.deleteSlot = function (slot) {
    if (!confirm('確定要刪除【' + slot + '】這筆紀錄嗎？')) return;
    saveLogs(getLogs().filter(function (log) { return log.slot !== slot; }));
  };

  document.getElementById('log-form').addEventListener('submit', function (event) {
    event.preventDefault(); var input = document.getElementById('action-input'); var action = input.value.trim();
    if (!action || !selectElem.value) return;
    saveLog(selectElem.value, action); input.value = '';
  });

  function csvEscape(value) { return '"' + String(value).replace(/"/g, '""') + '"'; }
  document.getElementById('export-btn').addEventListener('click', function () {
    var logs = getLogs(); if (!logs.length) { alert('目前尚無資料可匯出'); return; }
    var csv = '\uFEFF時段,做了什麼\r\n' + logs.map(function (log) { return csvEscape(log.slot) + ',' + csvEscape(log.action); }).join('\r\n');
    var url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    var link = document.createElement('a'); link.href = url; link.download = '30分足跡_' + todayStr + '.csv'; link.click(); URL.revokeObjectURL(url);
  });
  var APP_DATA_KEY_PATTERN = /^(simple_logs_|simple_todos_|user_custom_tags$)/;
  document.getElementById('backup-export-btn').addEventListener('click', function () {
    var data = {};
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (APP_DATA_KEY_PATTERN.test(key)) data[key] = localStorage.getItem(key);
    }
    var backup = { app: 'Find Your Life', version: 1, exportedAt: new Date().toISOString(), data: data };
    var url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8;' }));
    var link = document.createElement('a'); link.href = url; link.download = 'Find-Your-Life-backup_' + todayStr + '.json'; link.click(); URL.revokeObjectURL(url);
    alert('完整備份已下載。請到 localhost 頁面選「還原備份」載入這個檔案。');
  });
  document.getElementById('backup-import-input').addEventListener('change', function (event) {
    var file = event.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var backup = JSON.parse(String(reader.result || ''));
        if (!backup || backup.app !== 'Find Your Life' || backup.version !== 1 || !backup.data || typeof backup.data !== 'object') {
          throw new Error('格式不符');
        }
        var restored = 0;
        Object.keys(backup.data).forEach(function (key) {
          if (!APP_DATA_KEY_PATTERN.test(key) || typeof backup.data[key] !== 'string') return;
          var incoming = backup.data[key];
          var existing = localStorage.getItem(key);
          if (existing && (key.indexOf('simple_logs_') === 0 || key.indexOf('simple_todos_') === 0 || key === 'user_custom_tags')) {
            try {
              var importedItems = JSON.parse(incoming);
              var existingItems = JSON.parse(existing);
              if (key.indexOf('simple_logs_') === 0) {
                existingItems.forEach(function (item) {
                  var found = importedItems.find(function (entry) { return entry.slot === item.slot; });
                  if (found) found.action = item.action; else importedItems.push(item);
                });
              } else if (key.indexOf('simple_todos_') === 0) {
                existingItems.forEach(function (item) {
                  var found = importedItems.find(function (entry) { return entry.id === item.id; });
                  if (found) Object.assign(found, item); else importedItems.push(item);
                });
              } else {
                importedItems = Array.from(new Set(importedItems.concat(existingItems)));
              }
              incoming = JSON.stringify(importedItems);
            } catch (mergeError) {
              // Keep the existing value if a particular saved item cannot be merged.
              return;
            }
          }
          localStorage.setItem(key, incoming);
          restored++;
        });
        alert('備份還原完成，共匯入 ' + restored + ' 項資料。頁面即將重新整理。');
        location.reload();
      } catch (error) {
        alert('無法還原這個備份檔，請確認它是由本工具匯出的 JSON 備份。');
      }
      event.target.value = '';
    };
    reader.onerror = function () { alert('讀取備份檔失敗。'); event.target.value = ''; };
    reader.readAsText(file, 'UTF-8');
  });
  function parseCsv(text) {
    var rows = [], row = [], field = '', quoted = false;
    for (var i = 0; i < text.length; i++) {
      var char = text[i];
      if (quoted) {
        if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (char === '"') quoted = false;
        else field += char;
      } else if (char === '"') quoted = true;
      else if (char === ',') { row.push(field); field = ''; }
      else if (char === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
      else field += char;
    }
    if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
    return rows;
  }
  document.getElementById('import-input').addEventListener('change', function (event) {
    var file = event.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var rows = parseCsv(String(reader.result || '').replace(/^\uFEFF/, '')); var logs = getLogs(); var changed = 0;
      rows.slice(1).forEach(function (row) {
        var slot = (row[0] || '').trim(); var action = (row.slice(1).join(',') || '').trim();
        if (allSlots.indexOf(slot) < 0 || !action) return;
        var existing = logs.find(function (log) { return log.slot === slot; });
        if (existing) existing.action = action; else logs.push({ slot: slot, action: action });
        changed++;
      });
      saveLogs(logs); alert('成功匯入 ' + changed + ' 筆紀錄！'); event.target.value = '';
    };
    reader.onerror = function () { alert('讀取檔案失敗，請確認 CSV 檔案格式。'); event.target.value = ''; };
    reader.readAsText(file, 'UTF-8');
  });

  var notifyBtn = document.getElementById('notify-btn');
  var NOTIFY_ENABLED_KEY = 'simple_sound_reminders_enabled';
  var reminderAudioContext = null;
  function playReminderSound() {
    var AudioContextType = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextType) { alert('這個瀏覽器不支援網頁播放提示音。'); return; }
    try {
      if (!reminderAudioContext) reminderAudioContext = new AudioContextType();
      var context = reminderAudioContext;
      var startTone = function (frequency, startAt) {
        var oscillator = context.createOscillator();
        var volume = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        volume.gain.setValueAtTime(0.0001, startAt);
        volume.gain.exponentialRampToValueAtTime(0.22, startAt + 0.03);
        volume.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.28);
        oscillator.connect(volume);
        volume.connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.3);
      };
      var playTones = function () {
        var start = context.currentTime + 0.02;
        startTone(880, start);
        startTone(660, start + 0.34);
        startTone(880, start + 0.68);
      };
      if (context.state === 'suspended') context.resume().then(playTones);
      else playTones();
    } catch (error) {
      alert('無法播放提示音，請確認瀏覽器沒有靜音。');
    }
  }
  function isReminderEnabled() {
    return localStorage.getItem(NOTIFY_ENABLED_KEY) === 'true';
  }
  function updateNotificationButton() {
    var enabled = isReminderEnabled();
    notifyBtn.textContent = enabled ? '聲音提醒：已開啟' : '聲音提醒：未開啟';
    notifyBtn.className = enabled
      ? 'max-w-[118px] shrink-0 rounded-full bg-emerald-50 px-3 py-2 text-center text-[11px] leading-snug font-medium text-emerald-700 transition'
      : 'max-w-[118px] shrink-0 rounded-full bg-slate-100 px-3 py-2 text-center text-[11px] leading-snug font-medium text-slate-600 hover:bg-slate-200 transition';
  }
  notifyBtn.addEventListener('click', function () {
    if (isReminderEnabled()) {
      localStorage.setItem(NOTIFY_ENABLED_KEY, 'false');
      updateNotificationButton();
      return;
    }
    localStorage.setItem(NOTIFY_ENABLED_KEY, 'true');
    updateNotificationButton();
    playReminderSound();
  });
  updateNotificationButton();
  var lastReminderKey = '';
  setInterval(function () {
    var now = new Date();
    if ((now.getMinutes() !== 0 && now.getMinutes() !== 30) || now.getSeconds() !== 0) return;
    var slot = getCurrentTimeSlot(); var reminderKey = todayStr + '_' + slot;
    if (lastReminderKey === reminderKey) return;
    lastReminderKey = reminderKey;
    if (!getLogs().some(function (log) { return log.slot === slot; }) && isReminderEnabled()) playReminderSound();
    renderGrid();
  }, 1000);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./service-worker.js').catch(function (error) {
        console.error('無法啟用離線快取：', error);
      });
    });
  }

  renderTodos(); renderLogs(); renderGrid();
}());
