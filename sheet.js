/* sheet.js — งานของฝ่าย: ① ทบทวนรายการเดิม (แผ่นงาน) · ② เสนอรายการใหม่ · ③ ตรวจและยืนยันส่ง HR */
'use strict';
var SF = { cat: 'own', q: '', f: 'all', div: '' }, ED = {}, OPEN = {};

function divFromParts(parts) { return parts[1] || myDiv(); }
function divPicker(divId, base) {
  var m = me(), opts = m.viewAll ? S.boot.divisions : S.boot.divisions.filter(function (x) { return m.viewDivs.indexOf(x.id) >= 0; });
  if (opts.length < 2) return '';
  return '<select class="in" id="divsel" style="width:auto;min-width:230px" aria-label="เลือกฝ่าย">' + opts.map(function (x) { return '<option value="' + x.id + '"' + (x.id === divId ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select>';
}
function bindDivPicker(base) { var s = $('#divsel'); if (s) s.onchange = function () { location.hash = '#/' + base + '/' + this.value; }; }
function stateBanner(divId) {
  var m = me(), cf = confirmOf(divId), ph = phase();
  if (cf && cf.status === 'confirmed') return '<div class="alert ok" style="margin-bottom:16px">' + ic('lock') + '<span><b>หัวหน้าฝ่ายยืนยันส่ง HR แล้ว</b> เมื่อ ' + esc(thDT(cf.at)) + ' โดย ' + esc(cf.by) + ' ข้อมูลถูกล็อก หากต้องแก้ไขติดต่อฝ่ายทรัพยากรบุคคล</span></div>';
  if (!canEdit(divId)) {
    if (ph === 'before') return '<div class="alert info" style="margin-bottom:16px">' + ic('clock') + '<span>ยังไม่ถึงวันเปิดให้กรอก (เปิด ' + esc(thDT(B().phase.openAt, { long: true })) + ') ดูรายการได้ล่วงหน้า</span></div>';
    if (ph === 'closed') return '<div class="alert warn" style="margin-bottom:16px">' + ic('clock') + '<span>ปิดรับแล้วเมื่อ ' + esc(thDT(B().phase.closeAt, { long: true })) + '</span></div>';
    return '<div class="alert info" style="margin-bottom:16px">' + ic('eye') + '<span>ท่านกำลังดูแผ่นงานของ<b>' + esc(divName(divId)) + '</b> (ดูอย่างเดียว)</span></div>';
  }
  return '';
}

/* ========== ① ทบทวนรายการเดิม ========== */
function pageSheet(q, parts) {
  var divId = divFromParts(parts);
  if (!divId) { if (me().viewAll) { location.hash = '#/overview'; return; } shell(pageHead('', 'ทบทวนรายการเดิม') + '<div class="alert warn">' + ic('flag') + '<span>ยังไม่ได้ระบุฝ่ายของท่าน กรุณาติดต่อฝ่ายทรัพยากรบุคคล</span></div>', 'ทบทวนรายการเดิม'); return; }
  if (SF.div !== divId) { SF = { cat: 'own', q: '', f: 'all', div: divId }; ED = {}; OPEN = {}; }
  if (q.f) SF.f = q.f;
  shell('<div id="sb">' + loadingHtml() + '</div>', 'ขั้นที่ 1 · ทบทวนรายการเดิม');
  loadDiv(divId, true).then(function (d) {
    if (!d.owned.length && SF.cat === 'own') SF.cat = 'all';
    var tipOff = lsGet('tip1', false);
    $('#sb').innerHTML = pageHead('ขั้นที่ 1 จาก 3', 'ทบทวนรายการเดิม', 'แผ่นงานของ<b>' + esc(divName(divId)) + '</b> · แพทย์ทุกคนในฝ่ายกรอกร่วมกันได้ ระบบบันทึกชื่อผู้แก้ทุกครั้ง', divPicker(divId) + '<button class="btn" id="histall">' + ic('hist') + 'ประวัติการแก้ไข</button>', 'sheet') +
      stepsHtml(d, 1) + stateBanner(divId) +
      (tipOff ? '' : '<div class="tip">' + ic('bulb') + '<span><b>รายการที่ยังเหมาะสม ไม่ต้องกดอะไร</b> (ถือว่าคงเดิม) · กด <b>แก้ไข</b> หรือ <b>ยกเลิก</b> เฉพาะแถวที่ต้องการ กรอกรายละเอียด แล้วกด <b>บันทึก</b> ที่แถบด้านล่าง</span><button class="x" id="tipx" aria-label="ปิดคำแนะนำ">' + ic('x') + '</button></div>') +
      '<section class="card" id="sheetcard"><div class="filters"><label class="f"><span>หมวด</span><select class="in" id="fcat"></select></label><label class="search"><span class="sr">ค้นหา</span>' + ic('search') + '<input class="in" id="fq" placeholder="ค้นหาชื่อหัตถการ เลขข้อ หรืออัตรา" value="' + esc(SF.q) + '"></label></div><div class="chips" id="fchips"></div>' +
      '<div class="sheet"><div class="shead"><span>ข้อ</span><span>รายการหัตถการ</span><span class="r">อัตราเดิม (บาท)</span><span>สถานะ</span><span>แก้ล่าสุด</span></div><div id="slist"></div></div></section>';
    bindHelpQ(); bindDivPicker('sheet');
    if ($('#tipx')) $('#tipx').onclick = function () { lsSet('tip1', true); this.parentNode.remove(); };
    $('#histall').onclick = function () { histDrawer(divId, ''); };
    $('#fcat').onchange = function () { SF.cat = this.value; drawSheet(d); };
    $('#fq').oninput = debounce(function () { SF.q = this.value.trim(); drawSheet(d); }, 180);
    drawSheet(d);
    drawSaveBar(d);
  }).catch(function (e) { $('#sb').innerHTML = errorHtml(e.message); });
}
function curVal(d, id) { return ED[id] || d.map[id] || { status: 'keep' }; }
function sheetList(d) {
  var q = SF.q.toLowerCase();
  return S.boot.items.filter(function (i) {
    if (SF.cat === 'own' ? !d.ownSet[i.id] : SF.cat !== 'all' && i.cat !== +SF.cat) return false;
    if (q && (i.code + ' ' + i.name + ' ' + (i.rate || '')).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
}
function drawSheet(d) {
  var cats = S.boot.categories, base = sheetList({ ownSet: d.ownSet, map: d.map }), cnt = { all: 0, edit: 0, cancel: 0, keep: 0 };
  var catCnt = {}; S.boot.items.forEach(function (i) { catCnt[i.cat] = (catCnt[i.cat] || 0) + 1; });
  $('#fcat').innerHTML = (d.owned.length ? '<option value="own"' + (SF.cat === 'own' ? ' selected' : '') + '>★ หมวดของ' + esc(divName(d.divId, true)) + ' (' + d.owned.length + ')</option>' : '') + '<option value="all"' + (SF.cat === 'all' ? ' selected' : '') + '>ทุกหมวด (' + S.boot.items.length + ')</option>' +
    cats.map(function (c) { return '<option value="' + c.no + '"' + (String(SF.cat) === String(c.no) ? ' selected' : '') + '>' + catLabel(c.no) + '. ' + esc(catShort(c)) + ' (' + catCnt[c.no] + ')</option>'; }).join('');
  base.forEach(function (i) { var s = curVal(d, i.id).status || 'keep'; cnt.all++; cnt[s]++; });
  var F = [['all', 'ทั้งหมด'], ['edit', 'แก้ไข'], ['cancel', 'ยกเลิก'], ['keep', 'คงเดิม']];
  $('#fchips').innerHTML = F.map(function (f) { return '<button class="chip" data-f="' + f[0] + '" aria-pressed="' + (SF.f === f[0]) + '">' + f[1] + ' <i>' + cnt[f[0]] + '</i></button>'; }).join('');
  $$('#fchips [data-f]').forEach(function (b) { b.onclick = function () { SF.f = b.dataset.f; drawSheet(d); }; });
  var list = base.filter(function (i) { return SF.f === 'all' || (curVal(d, i.id).status || 'keep') === SF.f; });
  if (!list.length) { $('#slist').innerHTML = '<div class="empty"><h3>ไม่พบรายการ</h3><p>ลองเปลี่ยนหมวด คำค้นหา หรือตัวกรอง' + (SF.f !== 'all' ? '' : '<br>หากหัตถการที่ทำจริงยังไม่มีในคำสั่ง ให้เสนอเป็นรายการใหม่') + '</p><a class="btn" href="#/new">' + ic('plus') + 'เสนอรายการใหม่</a></div>'; return; }
  var html = '', last = null;
  list.forEach(function (i) {
    if (i.cat !== last) { var c = catByNo(i.cat); html += '<div class="scat"><h3>' + (i.cat === 20 ? 'หมวดศัลยกรรมเด็ก' : 'หมวด ' + i.cat) + ' ' + esc(c.name) + '</h3>' + (c.owners.indexOf(d.divId) >= 0 ? '<span class="own">หมวดของฝ่าย</span>' : '') + '</div>'; last = i.cat; }
    html += '<div class="sitem" data-id="' + i.id + '">' + itemHtml(d, i) + '</div>';
  });
  $('#slist').innerHTML = html;
  bindItems(d, $('#slist'));
}
function itemHtml(d, i) {
  var v = curVal(d, i.id), st = v.status || 'keep', saved = d.map[i.id], dirty = !!ED[i.id], rule = i.cat === 1, can = canEdit(d.divId);
  var sum = '';
  if (st === 'edit') sum = [v.newName ? '→ ' + esc(v.newName) : '', v.newRate !== '' && v.newRate != null ? '<b>อัตราใหม่ ' + fmt(v.newRate) + ' บาท</b>' + (v.newUnit ? ' ' + esc(v.newUnit) : '') : '', v.note ? esc(v.note) : ''].filter(Boolean).join(' · ');
  if (st === 'cancel') sum = v.note ? 'เหตุผล: ' + esc(v.note) : '';
  var row = '<div class="srow ' + (st !== 'keep' ? st : '') + (dirty ? ' dirty' : '') + '"><span class="code">' + esc(i.code) + '</span><span class="nm">' + esc(i.name) + (i.note ? '<small>' + esc(i.note) + '</small>' : '') + (sum && !OPEN[i.id] ? '<small style="color:var(--' + (st === 'edit' ? 'edit' : 'cancel') + ');text-decoration:none">' + sum + '</small>' : '') + '</span>' +
    '<span class="rt">' + (rule ? '' : '<b>' + fmt(i.rate) + '</b><small>' + esc(i.unit || '') + '</small>') + '</span>' +
    '<div class="tri" role="group" aria-label="สถานะข้อ ' + esc(i.code) + '">' + ['keep', 'edit', 'cancel'].map(function (s) { return '<button type="button" data-s="' + s + '" aria-pressed="' + (st === s) + '"' + (can ? '' : ' disabled') + '>' + (s === 'edit' ? ic('pencil') : s === 'cancel' ? ic('ban') : '') + B().labels.status[s] + '</button>'; }).join('') + '</div>' +
    '<span class="who2">' + (dirty ? '<b style="color:var(--brand-ink)">ยังไม่บันทึก</b>' : saved ? '<b>' + esc(saved.updatedName) + '</b>' + esc(ago(saved.updatedAt)) : '') + (saved ? ' · <a href="#" data-hist>ประวัติ</a>' : '') + (st !== 'keep' && can && !OPEN[i.id] ? ' · <a href="#" data-open>แก้รายละเอียด</a>' : '') + '</span></div>';
  return row + (OPEN[i.id] && st !== 'keep' ? editorHtml(d, i, v) : '');
}
function editorHtml(d, i, v) {
  var st = v.status, rule = i.cat === 1, can = canEdit(d.divId), dis = can ? '' : ' disabled';
  var h = '<div class="editor" style="margin:0 16px 12px">';
  if (st === 'edit') {
    h += '<div class="g4"><label class="f"><span>' + (rule ? 'ถ้อยคำที่เสนอ' : 'แก้ไขชื่อเป็น') + '</span><textarea class="in" rows="2" data-k="newName" placeholder="เว้นว่างถ้าไม่เปลี่ยนชื่อ"' + dis + '>' + esc(v.newName || '') + '</textarea></label>' +
      (rule ? '<span></span><span></span>' : '<label class="f"><span>อัตราใหม่ (บาท)</span><div class="pre"><b>฿</b><input class="in" data-k="newRate" inputmode="decimal" value="' + esc(v.newRate || '') + '" placeholder="' + esc(i.rate || '') + '"' + dis + '></div><small data-delta></small></label><label class="f"><span>หน่วย</span><input class="in" data-k="newUnit" value="' + esc(v.newUnit || '') + '" placeholder="' + esc(i.unit || 'ต่อราย') + '"' + dis + '></label>') + '</div>';
  }
  h += '<div class="g3" style="margin-top:10px"><label class="f"><span>อ้างอิง (ระเบียบ/คำสั่ง/เอกสาร)</span><input class="in" data-k="refText" value="' + esc(v.refText || '') + '" placeholder="เช่น สธ.0202.3.7/ว.79"' + dis + '></label>' +
    '<label class="f"><span>เทียบเคียงที่</span><input class="in" data-k="cmpHosp" value="' + esc(v.cmpHosp || '') + '" placeholder="เช่น รพ.ชลบุรี"' + dis + '></label><label class="f"><span>อัตราที่เทียบเคียง (บาท)</span><div class="pre"><b>฿</b><input class="in" data-k="cmpRate" inputmode="decimal" value="' + esc(v.cmpRate || '') + '"' + dis + '></div></label></div>' +
    '<label class="f" style="margin-top:10px"><span>' + (st === 'cancel' ? 'เหตุผลที่ยกเลิก <em>*</em>' : 'หมายเหตุ / เหตุผล') + '</span><textarea class="in" rows="2" data-k="note" placeholder="' + (st === 'cancel' ? 'เช่น ไม่มีการปฏิบัติแล้ว / ซ้ำกับข้อ…' : 'เช่น เทคนิคปัจจุบันใช้เวลามากขึ้น') + '"' + dis + '>' + esc(v.note || '') + '</textarea></label>' +
    refsHtml(v, can) +
    '<div class="foot">' + (can ? '<button class="btn sm dark" data-close-ed>' + ic('check') + 'เสร็จ</button>' + (ED[i.id] ? '<button class="btn sm ghost" data-revert>' + ic('undo') + 'ยกเลิกการเปลี่ยนแปลงแถวนี้</button>' : '') : '<button class="btn sm" data-close-ed>ปิด</button>') + '<span class="grow"></span><span class="tiny muted">' + (d.map[i.id] ? 'กรอกครั้งแรกโดย ' + esc(d.map[i.id].createdName) + ' · ' + esc(thDT(d.map[i.id].createdAt)) : '') + '</span></div></div>';
  return h;
}
function refsHtml(v, can) {
  var links = (v.links || []).slice(); if (can && !links.length) links.push({ url: '', label: '' });
  return '<div class="g2" style="margin-top:10px"><div><span class="flabel">ลิงก์ข้อมูลอ้างอิง</span><div class="links">' + links.map(function (l, k) { return '<div class="lrow"><input class="in" data-lu="' + k + '" placeholder="https://…" value="' + esc(l.url) + '"' + (can ? '' : ' disabled') + '><input class="in" data-ll="' + k + '" placeholder="คำอธิบาย" value="' + esc(l.label || '') + '"' + (can ? '' : ' disabled') + '>' + (can ? '<button type="button" class="btn ghost sm" data-ldel="' + k + '" aria-label="ลบลิงก์">' + ic('x') + '</button>' : '') + '</div>'; }).join('') + '</div>' +
    (can && links.length < 6 ? '<button type="button" class="btn ghost sm" data-ladd style="margin-top:4px">' + ic('plus') + 'เพิ่มลิงก์</button>' : '') + '</div>' +
    '<div><span class="flabel">ไฟล์แนบ (PDF รูป Word Excel ≤ ' + esc(B().settings.maxFileMb || 10) + ' MB)</span><div class="files">' + (v.files || []).map(function (f, k) { return '<span class="file">' + ic('file') + '<a data-file="' + esc(f.id) + '">' + esc(f.name) + '</a>' + (can ? '<button type="button" data-fdel="' + k + '" aria-label="นำไฟล์ออก">' + ic('x') + '</button>' : '') + '</span>'; }).join('') +
    (can && (v.files || []).length < 6 ? '<label class="btn sm">' + ic('clip') + 'แนบไฟล์<input type="file" data-fadd hidden accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"></label>' : '') + (!can && !(v.files || []).length ? '<span class="muted small">–</span>' : '') + '</div></div></div>';
}
function cloneVal(d, id) { var v = curVal(d, id); return JSON.parse(JSON.stringify({ status: v.status || 'keep', newName: v.newName || '', newRate: v.newRate == null ? '' : v.newRate, newUnit: v.newUnit || '', refText: v.refText || '', cmpHosp: v.cmpHosp || '', cmpRate: v.cmpRate == null ? '' : v.cmpRate, note: v.note || '', links: v.links || [], files: v.files || [] })); }
function sameAsSaved(d, id, v) {
  var s = d.map[id] || { status: 'keep' }, keys = ['status', 'newName', 'newRate', 'newUnit', 'refText', 'cmpHosp', 'cmpRate', 'note'];
  if ((s.status || 'keep') === 'keep' && v.status === 'keep') return true;
  return keys.every(function (k) { return String(s[k] == null ? '' : s[k]) === String(v[k] == null ? '' : v[k]); }) && JSON.stringify((s.links || []).filter(function (l) { return l.url; })) === JSON.stringify((v.links || []).filter(function (l) { return l.url; })) && JSON.stringify((s.files || []).map(function (f) { return f.id; })) === JSON.stringify((v.files || []).map(function (f) { return f.id; }));
}
function setEdit(d, id, v) { if (sameAsSaved(d, id, v)) delete ED[id]; else ED[id] = v; S.dirty = Object.keys(ED).length; drawSaveBar(d); }
function redrawItem(d, id) {
  var box = $('.sitem[data-id="' + id + '"]'); if (!box) return;
  box.innerHTML = itemHtml(d, itemById(id)); bindItems(d, box);
  var cnt = $('#fchips'); if (cnt) { var base = sheetList(d), c = { all: 0, edit: 0, cancel: 0, keep: 0 }; base.forEach(function (i) { c.all++; c[curVal(d, i.id).status || 'keep']++; }); $$('#fchips [data-f]').forEach(function (b) { b.querySelector('i').textContent = c[b.dataset.f]; }); }
}
function bindItems(d, root) {
  $$('.sitem', root).concat(root.classList && root.classList.contains('sitem') ? [root] : []).forEach(function (box) {
    var id = box.dataset.id, it = itemById(id);
    $$('.tri [data-s]', box).forEach(function (b) {
      b.onclick = function () {
        var v = cloneVal(d, id), s = b.dataset.s; if (v.status === s) { if (s !== 'keep') { OPEN[id] = !OPEN[id]; redrawItem(d, id); } return; }
        v.status = s; OPEN[id] = s !== 'keep'; setEdit(d, id, v); redrawItem(d, id);
        var f = $('.sitem[data-id="' + id + '"] .editor [data-k="' + (s === 'cancel' ? 'note' : it.cat === 1 ? 'newName' : 'newRate') + '"]'); if (f) f.focus();
      };
    });
    var a = $('[data-hist]', box); if (a) a.onclick = function (e) { e.preventDefault(); histDrawer(d.divId, id); };
    var o = $('[data-open]', box); if (o) o.onclick = function (e) { e.preventDefault(); OPEN[id] = true; redrawItem(d, id); };
    var ed = $('.editor', box); if (!ed) return;
    var sync = function () { var v = cloneVal(d, id); $$('[data-k]', ed).forEach(function (x) { v[x.dataset.k] = x.value.trim(); }); v.links = $$('[data-lu]', ed).map(function (x) { return { url: x.value.trim(), label: ($('[data-ll="' + x.dataset.lu + '"]', ed) || {}).value || '' }; }); setEdit(d, id, v); var r = $('.srow', box); r.classList.toggle('dirty', !!ED[id]); $('.who2', box).innerHTML = ED[id] ? '<b style="color:var(--brand-ink)">ยังไม่บันทึก</b>' : ''; delta(); };
    var delta = function () { var dl = $('[data-delta]', ed), n = $('[data-k="newRate"]', ed); if (!dl || !n) return; var x = +String(n.value).replace(/,/g, ''); dl.innerHTML = n.value && it.rate ? (x > it.rate ? '<span style="color:var(--edit)">เพิ่มขึ้น ' + fmt(x - it.rate) + ' บาท (+' + pct(x - it.rate, it.rate) + '%)</span>' : x < it.rate ? '<span style="color:var(--cancel)">ลดลง ' + fmt(it.rate - x) + ' บาท</span>' : 'เท่าเดิม') : ''; };
    delta();
    $$('input[data-k], textarea[data-k], [data-lu], [data-ll]', ed).forEach(function (x) { x.oninput = sync; });
    var close = $('[data-close-ed]', ed); if (close) close.onclick = function () { sync(); OPEN[id] = false; redrawItem(d, id); };
    var rv = $('[data-revert]', ed); if (rv) rv.onclick = function () { delete ED[id]; S.dirty = Object.keys(ED).length; OPEN[id] = false; drawSaveBar(d); redrawItem(d, id); };
    var la = $('[data-ladd]', ed); if (la) la.onclick = function () { sync(); var v = cloneVal(d, id); v.links.push({ url: '', label: '' }); ED[id] = v; S.dirty = Object.keys(ED).length; drawSaveBar(d); redrawItem(d, id); };
    $$('[data-ldel]', ed).forEach(function (b) { b.onclick = function () { sync(); var v = cloneVal(d, id); v.links.splice(+b.dataset.ldel, 1); setEdit(d, id, v); redrawItem(d, id); }; });
    $$('[data-fdel]', ed).forEach(function (b) { b.onclick = function () { sync(); var v = cloneVal(d, id); v.files.splice(+b.dataset.fdel, 1); setEdit(d, id, v); redrawItem(d, id); }; });
    bindFileLinks(ed);
    var fi = $('[data-fadd]', ed); if (fi) fi.onchange = function () { sync(); uploadInto(fi, d.divId, function (f) { var v = cloneVal(d, id); v.files.push(f); setEdit(d, id, v); redrawItem(d, id); }, function () { redrawItem(d, id); }); };
  });
}
function drawSaveBar(d) {
  var n = Object.keys(ED).length, bar = $('#savebar');
  if (!n) { if (bar) bar.remove(); return; }
  if (!bar) { bar = document.createElement('div'); bar.className = 'savebar'; bar.id = 'savebar'; document.body.appendChild(bar); }
  bar.innerHTML = ic('save') + '<div class="grow"><b>ยังไม่บันทึก ' + n + ' รายการ</b><div class="tiny" style="opacity:.75">กด "บันทึก" เพื่อให้แพทย์ท่านอื่นและหัวหน้าฝ่ายเห็น</div></div><button class="btn ghost sm" id="sbx">ยกเลิกการเปลี่ยนแปลง</button><button class="btn primary" id="sbs">' + ic('check') + 'บันทึก ' + n + ' รายการ</button>';
  $('#sbx').onclick = function () { confirmBox('ยกเลิกการเปลี่ยนแปลงทั้งหมด?', 'รายการที่ยังไม่บันทึก ' + n + ' รายการจะกลับเป็นค่าเดิม', 'ยกเลิกการเปลี่ยนแปลง', true).then(function (y) { if (!y) return; ED = {}; OPEN = {}; S.dirty = 0; drawSaveBar(d); drawSheet(d); }); };
  $('#sbs').onclick = function () { saveSheet(d, this); };
}
function saveSheet(d, btn, force) {
  var ids = Object.keys(ED), bad = [];
  ids.forEach(function (id) { var v = ED[id], it = itemById(id); if (v.status === 'cancel' && !v.note) bad.push('ข้อ ' + it.code + ': ใส่เหตุผลที่ยกเลิก'); if (v.status === 'edit' && !v.newName && v.newRate === '' && !v.note) bad.push('ข้อ ' + it.code + ': ใส่ชื่อใหม่ อัตราใหม่ หรือหมายเหตุอย่างน้อย 1 ช่อง'); v.links.forEach(function (l) { if (l.url && !/^https?:\/\//i.test(l.url)) bad.push('ข้อ ' + it.code + ': ลิงก์ต้องขึ้นต้นด้วย https://'); }); });
  if (bad.length) { modal('<h2>กรอกยังไม่ครบ</h2><ul style="margin:12px 0 0;padding-left:20px">' + bad.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><div class="act"><button class="btn primary" onclick="closeModal()">กลับไปแก้</button></div>'); ids.forEach(function (id) { if (bad.some(function (b) { return b.indexOf('ข้อ ' + itemById(id).code + ':') === 0; })) { OPEN[id] = true; redrawItem(d, id); } }); return; }
  busy(btn, true);
  var rows = ids.map(function (id) { var v = ED[id]; return { itemId: id, status: v.status, newName: v.newName, newRate: v.newRate, newUnit: v.newUnit, refText: v.refText, cmpHosp: v.cmpHosp, cmpRate: v.cmpRate, note: v.note, links: v.links.filter(function (l) { return l.url; }), files: v.files.map(function (f) { return f.id; }), base: force && force[id] ? force[id] : (d.map[id] ? d.map[id].updatedAt : '') }; });
  apiW('saveRows', { divId: d.divId, rows: rows }).then(function (r) {
    r.saved.forEach(function (row) { d.map[row.itemId] = row; delete ED[row.itemId]; OPEN[row.itemId] = false; });
    ids.forEach(function (id) { if (ED[id] && ED[id].status === 'keep' && !r.conflicts.some(function (c) { return c.itemId === id; })) { delete d.map[id]; delete ED[id]; } });
    d.rows = Object.keys(d.map).map(function (k) { return d.map[k]; }).filter(function (x) { return x.status && x.status !== 'keep'; });
    Object.keys(d.map).forEach(function (k) { if (!d.map[k].status || d.map[k].status === 'keep') delete d.map[k]; });
    S.dirty = Object.keys(ED).length; drawSaveBar(d); drawSheet(d);
    if (r.conflicts.length) conflictModal(d, r.conflicts);
    else toast('บันทึกแล้ว ' + r.saved.length + ' รายการ');
  }).catch(function (e) { busy(btn, false); toast(e.message, true); });
}
function conflictModal(d, cs) {
  var m = modal('<h2>มีแพทย์ท่านอื่นแก้รายการเดียวกันก่อน</h2><p class="muted" style="margin:8px 0 12px">รายการต่อไปนี้ยังไม่ถูกบันทึก เพื่อไม่ให้ทับข้อมูลของผู้อื่น</p>' +
    cs.map(function (c) { var r = c.row; return '<div class="card" style="padding:12px 14px;margin-bottom:8px"><b>ข้อ ' + esc(c.code) + '</b> แก้โดย <b>' + esc(c.by) + '</b> ' + esc(ago(c.at)) + '<div class="small muted">' + esc(B().labels.status[r.status] || 'คงเดิม') + (r.newRate ? ' · อัตราใหม่ ' + fmt(r.newRate) : '') + (r.newName ? ' · ' + esc(r.newName) : '') + (r.note ? ' · ' + esc(r.note) : '') + '</div></div>'; }).join('') +
    '<div class="act"><button class="btn" data-theirs>ใช้ข้อมูลล่าสุดของเขา</button><button class="btn primary" data-mine>บันทึกของฉันทับ</button></div>');
  m.querySelector('[data-theirs]').onclick = function () { cs.forEach(function (c) { delete ED[c.itemId]; if (c.row.status && c.row.status !== 'keep') d.map[c.itemId] = c.row; }); S.dirty = Object.keys(ED).length; closeModal(); drawSaveBar(d); drawSheet(d); };
  m.querySelector('[data-mine]').onclick = function () { var f = {}; cs.forEach(function (c) { f[c.itemId] = c.at; }); closeModal(); saveSheet(d, $('#sbs'), f); };
}
var FIELD_TH = { status: 'สถานะ', newName: 'ชื่อใหม่', newRate: 'อัตราใหม่', newUnit: 'หน่วย', refText: 'อ้างอิง', cmpHosp: 'เทียบเคียงที่', cmpRate: 'อัตราเทียบเคียง', note: 'หมายเหตุ', links: 'ลิงก์', files: 'ไฟล์', name: 'ชื่อ', catNo: 'หมวด', rate: 'อัตรา', unit: 'หน่วย', compareId: 'เทียบกับข้อ' };
function fieldVal(k, v) { if (k === 'status') return B().labels.status[v] || v || 'คงเดิม'; if (k === 'links' || k === 'files') { var a = []; try { a = JSON.parse(v || '[]'); } catch (e) { } return a.length ? a.length + ' รายการ' : '–'; } if (k === 'compareId') { var it = itemById(v); return it ? 'ข้อ ' + it.code : '–'; } return v === '' || v == null ? '–' : v; }
function histDrawer(divId, ref) {
  var it = itemById(ref), dr = drawer(ic('hist') + ' ประวัติการแก้ไข' + (it ? ' · ข้อ ' + esc(it.code) : ''), loadingHtml());
  api('history', { divId: divId, ref: ref }).then(function (h) {
    $('.db', dr).innerHTML = (it ? '<p class="small" style="margin:0 0 12px">' + esc(it.name) + '</p>' : '') + (h.length ? h.map(function (x) {
      var dt = x.detail && typeof x.detail === 'object' ? x.detail : {}, t = itemById(x.ref);
      var ch = Object.keys(dt).filter(function (k) { return FIELD_TH[k] && Array.isArray(dt[k]); }).map(function (k) { return '<div class="tiny"><span class="muted">' + FIELD_TH[k] + ':</span> ' + esc(fieldVal(k, dt[k][0])) + ' → <b>' + esc(fieldVal(k, dt[k][1])) + '</b></div>'; }).join('');
      return '<div style="padding:11px 0;border-bottom:1px solid var(--line-2)"><div class="row"><span class="avatar" style="width:30px;height:30px;font-size:12px;background:var(--surface-2);color:var(--ink-2);border:1px solid var(--line)">' + esc(initials(x.name)) + '</span><div class="grow small"><b>' + esc(x.name || x.emp) + '</b> ' + esc(ACT_TH[x.action] || x.action) + (!ref && t ? ' · ข้อ ' + esc(t.code) : '') + '</div><span class="tiny muted nowrap">' + esc(thDT(x.at)) + '</span></div><div style="padding-left:40px;margin-top:4px">' + ch + (x.action === 'CONFIRM' || x.action === 'REOPEN' ? '<div class="tiny muted">' + esc(typeof x.detail === 'string' ? x.detail : '') + '</div>' : '') + '</div></div>';
    }).join('') : '<p class="muted">ยังไม่มีประวัติ</p>');
  }).catch(function (e) { $('.db', dr).innerHTML = '<p class="muted">' + esc(e.message) + '</p>'; });
}

/* ---------- ไฟล์ ---------- */
function bindFileLinks(root) { $$('[data-file]', root).forEach(function (a) { a.setAttribute('href', '#'); a.onclick = function (e) { e.preventDefault(); downloadFile(a.dataset.file, a.textContent); }; }); }
function downloadFile(id, name) {
  toast('กำลังเปิดไฟล์…');
  api('getFile', { id: id }).then(function (f) { var bin = atob(f.data), u8 = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); var url = URL.createObjectURL(new Blob([u8], { type: f.mime })), a = document.createElement('a'); a.href = url; a.download = f.name || name; a.target = '_blank'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 30000); })
    .catch(function (e) { toast(e.message, true); });
}
function guessMime(n) { var e = String(n).split('.').pop().toLowerCase(); return { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }[e] || ''; }
function uploadInto(input, divId, done, fail) {
  var f = input.files[0]; if (!f) return;
  var max = (+B().settings.maxFileMb || 10) * 1048576; if (f.size > max) { toast('ไฟล์ใหญ่เกิน ' + B().settings.maxFileMb + ' MB', true); return; }
  input.parentNode.innerHTML = '<span class="spin"></span>กำลังอัปโหลด…';
  var rd = new FileReader(); rd.onload = function () {
    apiW('uploadFile', { divId: divId, name: f.name, mime: f.type || guessMime(f.name), data: String(rd.result).split(',')[1] }).then(function (x) { toast('แนบไฟล์แล้ว'); done(x); }).catch(function (e) { toast(e.message, true); fail(); });
  }; rd.readAsDataURL(f);
}

/* ========== ② เสนอรายการใหม่ ========== */
var NV = { draft: null, open: {} };
function pageNew(q, parts) {
  var divId = divFromParts(parts);
  if (!divId) { if (me().viewAll) { location.hash = '#/overview'; return; } shell(pageHead('', 'เสนอรายการใหม่') + '<div class="alert warn">' + ic('flag') + '<span>ยังไม่ได้ระบุฝ่ายของท่าน</span></div>', 'เสนอรายการใหม่'); return; }
  NV = { draft: null, open: {}, div: divId };
  shell('<div id="nb">' + loadingHtml() + '</div>', 'ขั้นที่ 2 · เสนอรายการใหม่');
  loadDiv(divId, true).then(function (d) {
    if (q.add && canEdit(divId)) NV.draft = { name: '', catNo: '', rate: '', unit: 'ต่อราย', compareId: '', cmpHosp: '', cmpRate: '', refText: '', note: '', links: [], files: [] };
    drawNew(d);
  }).catch(function (e) { $('#nb').innerHTML = errorHtml(e.message); });
}
function drawNew(d) {
  var can = canEdit(d.divId);
  $('#nb').innerHTML = pageHead('ขั้นที่ 2 จาก 3', 'เสนอรายการใหม่', 'หัตถการที่แพทย์ใน' + esc(divName(d.divId, true)) + 'ทำจริงนอกเวลาราชการ แต่ยังไม่มีในคำสั่ง · ไม่มีก็ข้ามขั้นนี้ได้', divPicker(d.divId) + (can ? '<button class="btn primary" id="addn">' + ic('plus') + 'เพิ่มรายการใหม่</button>' : ''), 'new') +
    stepsHtml(d, 2) + stateBanner(d.divId) + '<div id="nlist"></div>';
  bindHelpQ(); bindDivPicker('new');
  if ($('#addn')) $('#addn').onclick = function () { if (NV.draft) { var f = $('#nlist [data-k="name"]'); if (f) f.focus(); return; } NV.draft = { name: '', catNo: '', rate: '', unit: 'ต่อราย', compareId: '', cmpHosp: '', cmpRate: '', refText: '', note: '', links: [], files: [] }; drawNewList(d); var f = $('#nlist [data-k="name"]'); if (f) f.focus(); };
  drawNewList(d);
}
function drawNewList(d) {
  var can = canEdit(d.divId), html = '';
  if (NV.draft) html += newCard(d, null, NV.draft, true);
  d.newItems.slice().sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); }).forEach(function (n) { html += newCard(d, n, n, !!NV.open[n.id]); });
  if (!html) html = '<section class="card"><div class="empty"><h3>ยังไม่มีรายการเสนอใหม่ในฝ่ายนี้</h3><p>ถ้าแพทย์ในฝ่ายทำหัตถการนอกเวลาราชการที่ยังไม่อยู่ในคำสั่ง ให้เพิ่มที่นี่<br>ไม่มีก็ข้ามไปขั้นที่ 3 ได้เลย</p>' + (can ? '<button class="btn primary" onclick="$(\'#addn\').click()">' + ic('plus') + 'เพิ่มรายการใหม่</button> ' : '') + '<a class="btn" href="#/confirm' + (d.divId !== myDiv() ? '/' + d.divId : '') + '">ไปขั้นที่ 3</a></div></section>';
  $('#nlist').innerHTML = html;
  $$('#nlist .ncard').forEach(function (c) { bindNewCard(d, c); });
}
function newCard(d, n, v, open) {
  var can = canEdit(d.divId), cmp = itemById(v.compareId), id = n ? n.id : 'draft', c = catByNo(v.catNo);
  var head = '<div class="ch" style="cursor:' + (n ? 'pointer' : 'default') + '" ' + (n ? 'data-toggle' : '') + '><span class="ic new" style="width:36px;height:36px;border-radius:11px;display:grid;place-items:center">' + ic('plus') + '</span><div class="grow"><h2 style="font-size:16px">' + (n ? esc(n.name) : 'รายการใหม่') + '</h2><p>' + (n ? '<b style="color:var(--ink)">' + fmt(n.rate) + ' บาท</b> ' + esc(n.unit) + (c ? ' · หมวด ' + catLabel(c.no) + ' ' + esc(catShort(c)) : '') + (cmp ? ' · เทียบข้อ ' + esc(cmp.code) + ' (' + fmt(cmp.rate) + ')' : '') : 'กรอกชื่อและอัตราที่เสนอ แล้วกดบันทึก') + '</p></div>' +
    (n ? '<span class="tiny muted" style="text-align:right">เสนอโดย <b>' + esc(n.createdName) + '</b><br>' + (n.updatedName !== n.createdName ? 'แก้ล่าสุด ' + esc(n.updatedName) + ' · ' : '') + esc(ago(n.updatedAt)) + '</span>' : '') + '</div>';
  if (!open) return '<section class="card ncard" data-id="' + id + '">' + head + '</section>';
  var dis = can ? '' : ' disabled';
  var body = '<div class="cb"><div class="g4"><label class="f"><span>ชื่อหัตถการ <em>*</em></span><input class="in" data-k="name" value="' + esc(v.name) + '" placeholder="เช่น Continuous renal replacement therapy (CRRT)"' + dis + '></label><label class="f"><span>อัตราที่เสนอ (บาท) <em>*</em></span><div class="pre"><b>฿</b><input class="in" data-k="rate" inputmode="decimal" value="' + esc(v.rate) + '"' + dis + '></div></label><label class="f"><span>หน่วย</span><input class="in" data-k="unit" value="' + esc(v.unit) + '" list="units"' + dis + '><datalist id="units"><option value="ต่อราย"><option value="ต่อครั้ง"><option value="ต่อศพ"><option value="เหมาจ่ายทั้งทีม"></datalist></label></div>' +
    '<div class="g2" style="margin-top:10px"><label class="f"><span>เทียบกับรายการเดิมข้อ</span><div style="position:relative"><input class="in" data-cmp autocomplete="off" placeholder="พิมพ์เลขข้อหรือชื่อ เช่น 9.18" value="' + esc(cmp ? cmp.code + ' ' + cmp.name : '') + '"' + dis + '><div class="card" data-cmpl hidden style="position:absolute;z-index:10;left:0;right:0;top:calc(100% + 4px);max-height:260px;overflow:auto;box-shadow:var(--shadow-lg)"></div></div><small data-cmpinfo>' + cmpInfo(cmp, v.rate) + '</small></label>' +
    '<label class="f"><span>หมวด</span><select class="in" data-k="catNo"' + dis + '><option value="">ตามรายการที่เทียบ</option>' + S.boot.categories.filter(function (x) { return x.no !== 1; }).map(function (x) { return '<option value="' + x.no + '"' + (+v.catNo === x.no ? ' selected' : '') + '>' + catLabel(x.no) + '. ' + esc(catShort(x)) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="g3" style="margin-top:10px"><label class="f"><span>อ้างอิง (ระเบียบ/คำสั่ง/เอกสาร)</span><input class="in" data-k="refText" value="' + esc(v.refText) + '"' + dis + '></label><label class="f"><span>เทียบเคียงที่</span><input class="in" data-k="cmpHosp" value="' + esc(v.cmpHosp) + '" placeholder="เช่น รพ.ศิริราช"' + dis + '></label><label class="f"><span>อัตราที่เทียบเคียง (บาท)</span><div class="pre"><b>฿</b><input class="in" data-k="cmpRate" inputmode="decimal" value="' + esc(v.cmpRate) + '"' + dis + '></div></label></div>' +
    '<label class="f" style="margin-top:10px"><span>หมายเหตุ / เหตุผล</span><textarea class="in" rows="2" data-k="note"' + dis + '>' + esc(v.note) + '</textarea></label>' + refsHtml(v, can) +
    '<div class="row wrap" style="margin-top:14px;padding-top:12px;border-top:1px dashed var(--line)">' + (can ? '<button class="btn primary" data-save>' + ic('check') + 'บันทึก</button><button class="btn ghost" data-cancel>ยกเลิก</button><span class="grow"></span>' + (n ? '<button class="btn ghost" data-del style="color:var(--cancel)">' + ic('trash') + 'ลบรายการนี้</button>' : '') : '<button class="btn" data-cancel>ปิด</button>') + (n ? '<button class="btn ghost sm" data-hist>' + ic('hist') + 'ประวัติ</button>' : '') + '</div></div>';
  return '<section class="card ncard" data-id="' + id + '" style="border-color:var(--new)">' + head + body + '</section>';
}
function cmpInfo(cmp, rate) { if (!cmp) return 'ไม่บังคับ แต่ช่วยให้พิจารณาอัตราได้ง่ายขึ้น'; var r = +String(rate || '').replace(/,/g, ''), dl = r && cmp.rate ? r - cmp.rate : null; return 'อัตราเดิมของข้อ ' + esc(cmp.code) + ' = <b>' + fmt(cmp.rate) + ' บาท</b>' + (dl ? ' · ที่เสนอ' + (dl > 0 ? 'สูงกว่า ' : 'ต่ำกว่า ') + fmt(Math.abs(dl)) + ' บาท (' + (dl > 0 ? '+' : '') + pct(dl, cmp.rate) + '%)' : ''); }
function bindNewCard(d, card) {
  var id = card.dataset.id, n = id === 'draft' ? null : d.newItems.filter(function (x) { return x.id === id; })[0];
  var tg = $('[data-toggle]', card); if (tg) tg.onclick = function () { NV.open[id] = !NV.open[id]; drawNewList(d); };
  if (!$('.cb', card)) return;
  var v = n ? JSON.parse(JSON.stringify(n)) : NV.draft;
  if (n) NV.edit = NV.edit || {}; if (n && NV.edit[id]) v = NV.edit[id]; else if (n) NV.edit[id] = v;
  var sync = function () { $$('[data-k]', card).forEach(function (x) { v[x.dataset.k] = x.value.trim(); }); v.links = $$('[data-lu]', card).map(function (x) { return { url: x.value.trim(), label: ($('[data-ll="' + x.dataset.lu + '"]', card) || {}).value || '' }; }); S.dirty = 1; };
  $$('[data-k], [data-lu], [data-ll]', card).forEach(function (x) { x.oninput = function () { sync(); if (x.dataset.k === 'rate') $('[data-cmpinfo]', card).innerHTML = cmpInfo(itemById(v.compareId), v.rate); }; x.onchange = x.oninput; });
  var q = $('[data-cmp]', card), l = $('[data-cmpl]', card);
  if (q) {
    var show = function () { var s = q.value.trim().toLowerCase(), res = S.boot.items.filter(function (i) { return i.cat !== 1 && (!s || (i.code + ' ' + i.name).toLowerCase().indexOf(s) >= 0); }).slice(0, 30);
      l.innerHTML = res.map(function (i) { return '<button type="button" class="btn ghost" style="width:100%;justify-content:flex-start;border-radius:0;font-weight:500;white-space:normal;text-align:left" data-pick="' + i.id + '"><b style="min-width:52px">' + esc(i.code) + '</b><span class="grow">' + esc(i.name) + '</span><b>' + fmt(i.rate) + '</b></button>'; }).join('') + '<button type="button" class="btn ghost" style="width:100%;border-radius:0" data-pick="">ไม่เทียบกับรายการใด</button>'; l.hidden = false;
      $$('[data-pick]', l).forEach(function (b) { b.onmousedown = function (e) { e.preventDefault(); sync(); v.compareId = b.dataset.pick; var c = itemById(v.compareId); q.value = c ? c.code + ' ' + c.name : ''; l.hidden = true; $('[data-cmpinfo]', card).innerHTML = cmpInfo(c, v.rate); S.dirty = 1; }; }); };
    q.onfocus = function () { q.select(); show(); }; q.oninput = show; q.onblur = function () { setTimeout(function () { l.hidden = true; }, 150); };
  }
  var la = $('[data-ladd]', card); if (la) la.onclick = function () { sync(); v.links.push({ url: '', label: '' }); drawNewList(d); };
  $$('[data-ldel]', card).forEach(function (b) { b.onclick = function () { sync(); v.links.splice(+b.dataset.ldel, 1); drawNewList(d); }; });
  $$('[data-fdel]', card).forEach(function (b) { b.onclick = function () { sync(); v.files.splice(+b.dataset.fdel, 1); drawNewList(d); }; });
  bindFileLinks(card);
  var fi = $('[data-fadd]', card); if (fi) fi.onchange = function () { sync(); uploadInto(fi, d.divId, function (f) { v.files.push(f); drawNewList(d); }, function () { drawNewList(d); }); };
  $('[data-cancel]', card).onclick = function () { if (n) { delete NV.edit[id]; NV.open[id] = false; } else NV.draft = null; S.dirty = 0; drawNewList(d); };
  var h = $('[data-hist]', card); if (h) h.onclick = function () { histDrawer(d.divId, id); };
  var sv = $('[data-save]', card); if (sv) sv.onclick = function () {
    sync(); if (!v.name) { $('[data-k="name"]', card).classList.add('err'); $('[data-k="name"]', card).focus(); toast('กรุณาใส่ชื่อหัตถการ', true); return; }
    if (v.rate === '') { $('[data-k="rate"]', card).classList.add('err'); $('[data-k="rate"]', card).focus(); toast('กรุณาใส่อัตราที่เสนอ', true); return; }
    busy(sv, true);
    apiW('saveNew', { divId: d.divId, item: { id: n ? n.id : '', base: n ? n.updatedAt : '', name: v.name, catNo: v.catNo, rate: v.rate, unit: v.unit, compareId: v.compareId, cmpHosp: v.cmpHosp, cmpRate: v.cmpRate, refText: v.refText, note: v.note, links: v.links.filter(function (x) { return x.url; }), files: v.files.map(function (f) { return f.id; }) } })
      .then(function (x) { d.newItems = d.newItems.filter(function (y) { return y.id !== x.id; }); d.newItems.push(x); if (n) { delete NV.edit[id]; NV.open[id] = false; } else NV.draft = null; S.dirty = 0; toast(n ? 'บันทึกการแก้ไขแล้ว' : 'เพิ่มรายการเสนอใหม่แล้ว'); drawNew(d); })
      .catch(function (e) { busy(sv, false); toast(e.message, true); });
  };
  var dl = $('[data-del]', card); if (dl) dl.onclick = function () {
    confirmBox('ลบรายการเสนอนี้?', esc(n.name) + '<br>ประวัติการแก้ไขยังถูกเก็บไว้', 'ลบรายการ', true).then(function (y) {
      if (!y) return; apiW('saveNew', { divId: d.divId, item: { id: n.id }, remove: true }).then(function () { d.newItems = d.newItems.filter(function (x) { return x.id !== n.id; }); S.dirty = 0; toast('ลบรายการแล้ว'); drawNew(d); }).catch(function (e) { toast(e.message, true); });
    });
  };
}

/* ========== ③ ตรวจและยืนยันส่ง HR ========== */
function pageConfirm(q, parts) {
  var divId = divFromParts(parts);
  if (!divId) { location.hash = me().viewAll ? '#/overview' : '#/home'; return; }
  shell('<div id="cb">' + loadingHtml() + '</div>', 'ขั้นที่ 3 · ยืนยันส่ง HR');
  loadDiv(divId, true).then(function (d) { drawConfirm(d); }).catch(function (e) { $('#cb').innerHTML = errorHtml(e.message); });
}
function drawConfirm(d) {
  var m = me(), cf = d.confirm, done = cf && cf.status === 'confirmed', head = canConfirm(d.divId), dv = divById(d.divId);
  var ed = d.rows.filter(function (r) { return r.status === 'edit'; }), ca = d.rows.filter(function (r) { return r.status === 'cancel'; });
  var ppl = {}; d.rows.forEach(function (r) { ppl[r.createdName] = 1; ppl[r.updatedName] = 1; }); d.newItems.forEach(function (r) { ppl[r.createdName] = 1; ppl[r.updatedName] = 1; }); delete ppl.undefined; delete ppl[''];
  var html = pageHead('ขั้นที่ 3 จาก 3', head ? 'ตรวจและยืนยันส่ง HR' : 'สถานะการยืนยันของหัวหน้าฝ่าย', 'สรุปทุกรายการที่' + esc(divName(d.divId)) + 'เสนอ พร้อมชื่อผู้กรอก', divPicker(d.divId) + '<button class="btn" onclick="window.print()">' + ic('print') + 'พิมพ์สรุป</button>', 'confirm') + stepsHtml(d, 3);
  html += '<section class="confirm ' + (done ? 'done' : 'wait') + '"><span class="big">' + ic(done ? 'check' : 'flag') + '</span><div><h2>' + (done ? 'หัวหน้าฝ่ายยืนยันส่ง HR แล้ว' : 'หัวหน้าฝ่ายยังไม่ยืนยัน') + '</h2><p>' +
    (done ? 'โดย ' + esc(cf.byName) + ' · ' + esc(thDT(cf.at, { long: true })) + (cf.note ? '<br>หมายเหตุ: ' + esc(cf.note) : '') + '<br>ข้อมูลของฝ่ายถูกล็อกแล้ว' : 'หัวหน้าฝ่าย: ' + esc(dv && dv.headName || 'ยังไม่ระบุ') + ' · ต้องยืนยันภายใน ' + esc(thDT(B().phase.closeAt, { long: true })) + (cf && cf.status === 'reopened' ? '<br>HR เปิดให้แก้ไขเมื่อ ' + esc(thDT(cf.at)) + (cf.note ? ' (' + esc(cf.note) + ')' : '') : '')) + '</p></div>' +
    '<div>' + (done ? (m.isAdmin ? '<button class="btn" id="reopen">' + ic('unlock') + 'เปิดให้ฝ่ายแก้ไข</button>' : '') : head && canEdit(d.divId) ? '<button class="btn primary lg" id="doconf">' + ic('send') + 'ยืนยันส่ง HR</button>' : '<span class="pill flag">รอหัวหน้าฝ่ายยืนยัน</span>') + '</div></section>';
  html += '<div class="kpis" style="margin-top:16px"><div class="kpi"><span class="ic edit">' + ic('pencil') + '</span><div><b>' + ed.length + '</b><span>เสนอแก้ไข</span></div></div><div class="kpi"><span class="ic cancel">' + ic('ban') + '</span><div><b>' + ca.length + '</b><span>เสนอยกเลิก</span></div></div><div class="kpi"><span class="ic new">' + ic('plus') + '</span><div><b>' + d.newItems.length + '</b><span>เสนอรายการใหม่</span></div></div><div class="kpi"><span class="ic idle">' + ic('users') + '</span><div><b>' + Object.keys(ppl).length + '</b><span>แพทย์ที่ร่วมกรอก</span></div></div></div>';
  function tbl(rows, empty) {
    return rows.length ? '<div class="tw"><table class="t"><thead><tr><th>ข้อ</th><th>รายการเดิม</th><th class="r">อัตราเดิม</th><th>ข้อเสนอ</th><th>ผู้กรอก</th></tr></thead><tbody>' + rows.map(function (r) {
      var it = itemById(r.itemId);
      return '<tr class="click" data-go="' + r.itemId + '"><td class="nowrap"><b>' + esc(it.code) + '</b></td><td>' + esc(it.name) + '</td><td class="r nowrap">' + fmt(it.rate) + '</td><td><span class="pill ' + r.status + '">' + B().labels.status[r.status] + '</span><div class="small" style="margin-top:4px">' +
        [r.newName ? '→ ' + esc(r.newName) : '', r.newRate !== '' ? '<b>' + fmt(r.newRate) + ' บาท</b> ' + esc(r.newUnit || '') : '', r.cmpHosp ? 'เทียบ ' + esc(r.cmpHosp) + (r.cmpRate !== '' ? ' ' + fmt(r.cmpRate) : '') : '', r.refText ? 'อ้างอิง ' + esc(r.refText) : '', r.note ? esc(r.note) : ''].filter(Boolean).join('<br>') + '</div></td><td class="small">' + esc(r.updatedName) + (r.createdName !== r.updatedName ? '<div class="muted">เริ่มโดย ' + esc(r.createdName) + '</div>' : '') + '<div class="muted">' + esc(thDT(r.updatedAt)) + '</div></td></tr>';
    }).join('') + '</tbody></table></div>' : '<div class="empty" style="padding:24px">' + empty + '</div>';
  }
  html += '<section class="card"><div class="ch"><h2 class="grow">รายการเดิมที่เสนอแก้ไข / ยกเลิก</h2><a class="btn sm" href="#/sheet' + (d.divId !== myDiv() ? '/' + d.divId : '') + '">' + ic('sheet') + 'เปิดแผ่นงาน</a></div>' + tbl(ed.concat(ca), 'ไม่มี (คงเดิมทุกรายการ)') + '</section>';
  html += '<section class="card"><div class="ch"><h2 class="grow">รายการเสนอใหม่</h2><a class="btn sm" href="#/new' + (d.divId !== myDiv() ? '/' + d.divId : '') + '">' + ic('plus') + 'เปิดหน้าเสนอใหม่</a></div>' + (d.newItems.length ? '<div class="tw"><table class="t"><thead><tr><th>หัตถการที่เสนอ</th><th class="r">อัตรา</th><th>เทียบกับ</th><th>ผู้เสนอ</th></tr></thead><tbody>' + d.newItems.map(function (n) { var c = itemById(n.compareId); return '<tr><td><b>' + esc(n.name) + '</b>' + (n.note ? '<div class="small muted">' + esc(n.note) + '</div>' : '') + '</td><td class="r nowrap"><b>' + fmt(n.rate) + '</b><div class="tiny muted">' + esc(n.unit) + '</div></td><td class="small">' + (c ? 'ข้อ ' + esc(c.code) + ' · ' + fmt(c.rate) + ' บาท' : '–') + (n.cmpHosp ? '<div>' + esc(n.cmpHosp) + (n.cmpRate !== '' ? ' ' + fmt(n.cmpRate) : '') + '</div>' : '') + '</td><td class="small">' + esc(n.createdName) + '<div class="muted">' + esc(thDT(n.updatedAt)) + '</div></td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="empty" style="padding:24px">ไม่มี</div>') + '</section>';
  if (head || m.viewAll || m.coordDivs.indexOf(d.divId) >= 0) html += '<section class="card"><div class="ch"><div class="grow"><h2>แพทย์ในฝ่าย</h2><p>ใครเข้าระบบแล้ว และใครร่วมกรอก</p></div></div><div class="tw"><table class="t"><thead><tr><th>ชื่อ</th><th>ตำแหน่ง</th><th>เข้าระบบล่าสุด</th><th>ร่วมกรอก</th></tr></thead><tbody>' +
    d.members.slice().sort(function (a, b) { return (ppl[b.name] ? 1 : 0) - (ppl[a.name] ? 1 : 0) || (b.login || '').localeCompare(a.login || ''); }).map(function (x) { return '<tr><td><b>' + esc(x.name) + '</b>' + (x.coord ? ' <span class="tag">ผู้ประสานงาน</span>' : '') + '</td><td class="small">' + esc(x.position || '') + '</td><td class="small">' + (x.login ? esc(ago(x.login)) : '<span class="muted">ยังไม่เคยเข้า</span>') + '</td><td>' + (ppl[x.name] ? '<span class="pill ok">ร่วมกรอก</span>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
  $('#cb').innerHTML = html;
  bindHelpQ(); bindDivPicker('confirm');
  $$('[data-go]').forEach(function (r) { r.onclick = function () { SF = { cat: 'all', q: itemById(r.dataset.go).code, f: 'all', div: d.divId }; location.hash = '#/sheet' + (d.divId !== myDiv() ? '/' + d.divId : ''); }; });
  var b = $('#doconf'); if (b) b.onclick = function () {
    var mm = modal('<h2>ยืนยันส่ง HR</h2><p class="muted" style="margin:8px 0 12px">' + esc(divName(d.divId)) + ' เสนอแก้ไข <b>' + ed.length + '</b> · ยกเลิก <b>' + ca.length + '</b> · เสนอใหม่ <b>' + d.newItems.length + '</b> รายการ<br>รายการอื่นทั้งหมดถือว่า <b>คงเดิม</b> เมื่อยืนยันแล้วข้อมูลจะถูกล็อก</p><label class="f"><span>หมายเหตุถึงฝ่ายทรัพยากรบุคคล (ถ้ามี)</span><textarea class="in" id="cnote" rows="2" placeholder="เช่น ผ่านที่ประชุมฝ่ายวันที่…"></textarea></label><div class="act"><button class="btn" data-x>ยกเลิก</button><button class="btn primary" data-ok>' + ic('send') + 'ยืนยันส่ง HR</button></div>');
    mm.querySelector('[data-x]').onclick = closeModal;
    mm.querySelector('[data-ok]').onclick = function () { var bb = this; busy(bb, true); apiW('confirmDiv', { divId: d.divId, note: $('#cnote').value }).then(function (nd) { indexDiv(nd); S.div[d.divId] = nd; S.boot.confirms[d.divId] = { status: 'confirmed', by: nd.confirm.byName, at: nd.confirm.at }; closeModal(); route(); setTimeout(function () { modal('<div style="text-align:center"><svg class="seal" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="34"/><path d="M25 41l10 10 20-22"/></svg><h2 style="margin-top:10px">ยืนยันส่ง HR เรียบร้อย</h2><p class="muted">ฝ่ายทรัพยากรบุคคลได้รับแจ้งแล้ว ขอบคุณครับ/ค่ะ</p></div><div class="act" style="justify-content:center"><button class="btn primary" onclick="closeModal()">ปิด</button></div>'); }, 300); }).catch(function (e) { busy(bb, false); toast(e.message, true); }); };
  };
  var r = $('#reopen'); if (r) r.onclick = function () {
    var mm = modal('<h2>เปิดให้' + esc(divName(d.divId, true)) + 'แก้ไข</h2><p class="muted">ฝ่ายจะแก้ไขได้อีกครั้ง และหัวหน้าฝ่ายต้องยืนยันใหม่</p><label class="f"><span>เหตุผล</span><textarea class="in" id="rnote" rows="2"></textarea></label><div class="act"><button class="btn" data-x>ยกเลิก</button><button class="btn primary" data-ok>เปิดให้แก้ไข</button></div>');
    mm.querySelector('[data-x]').onclick = closeModal;
    mm.querySelector('[data-ok]').onclick = function () { var bb = this; busy(bb, true); apiW('reopen', { divId: d.divId, note: $('#rnote').value }).then(function (nd) { indexDiv(nd); S.div[d.divId] = nd; S.boot.confirms[d.divId] = { status: 'reopened', by: nd.confirm.byName, at: nd.confirm.at }; closeModal(); toast('เปิดให้แก้ไขแล้ว'); route(); }).catch(function (e) { busy(bb, false); toast(e.message, true); }); };
  };
}
