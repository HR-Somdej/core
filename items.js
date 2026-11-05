/* items.js — ทะเบียนรายการหัตถการ · ความเห็นต่อรายการ (ลิ้นชัก) · เสนอรายการใหม่ · ไฟล์แนบ/ลิงก์อ้างอิง */
'use strict';
var IF = { cat: 0, q: '', f: 'all' };

/* ---------- สถานะของฉัน/ฝ่ายต่อรายการ ---------- */
function myOp(d, itemId) { var u = me().user; return d.opinions.filter(function (o) { return o.itemId === itemId && o.emp === u; })[0] || null; }
function opsOf(d, itemId) { return d.opinions.filter(function (o) { return o.itemId === itemId; }); }
function consOf(d, ref) { return d.consensus.filter(function (x) { return x.ref === ref && x.decision; })[0] || null; }
function tallyHtml(list) {
  var t = { keep: 0, change: 0, cancel: 0 }; list.forEach(function (o) { t[o.status]++; });
  return ['change', 'cancel', 'keep'].filter(function (k) { return t[k]; }).map(function (k) { return stChip(k, S.boot.labels.status[k] + ' ' + t[k]); }).join('');
}

/* ---------- หน้าทะเบียนรายการ ---------- */
function pageItems(q) {
  q = q || {};
  if (q.cat !== undefined) IF.cat = +q.cat || 0;
  if (q.f) IF.f = q.f;
  var m = me();
  shell('<div class="page-head"><div><h1>รายการหัตถการและอัตราค่าตอบแทน</h1><p>ตามคำสั่งโรงพยาบาลที่ 359/2553 · 961/2565 · 182/2565 แตะรายการเพื่อให้ความเห็น คงเดิม เปลี่ยนแปลง หรือยกเลิก</p></div>' +
    '<div class="act"><a class="btn primary" href="#/propose">' + ic('plus') + 'เสนอรายการใหม่</a></div></div><div id="ibody">' + loadingHtml() + '</div>', 'รายการหัตถการ');
  loadDiv(m.divId).then(function () { drawItems(); }).catch(function (e) { $('#ibody').innerHTML = errorHtml(e.message); });
}
function drawItems() {
  var m = me(), d = S.div[m.divId] || { opinions: [], consensus: [] }, cats = S.boot.categories, items = S.boot.items;
  var cnt = {}; items.forEach(function (i) { cnt[i.cat] = (cnt[i.cat] || 0) + 1; });
  var rail = '<button data-cat="0" aria-pressed="' + (IF.cat === 0) + '"><span class="no"></span><span>ทุกหมวด</span><span class="cnt">' + items.length + '</span></button>' + cats.map(function (c) {
    var own = m.divId && c.owners.indexOf(m.divId) >= 0;
    return '<button data-cat="' + c.no + '" aria-pressed="' + (IF.cat === c.no) + '" class="' + (own ? 'own' : '') + '"><span class="no">' + catLabel(c.no) + '</span><span>' + esc(c.name.replace(/\s*\(.*\)$/, '')) + (own ? '<span class="own-mark" title="หมวดของฝ่ายท่าน"></span>' : '') + '</span><span class="cnt">' + cnt[c.no] + '</span></button>';
  }).join('');
  var sel = '<select class="in cat-select" id="catsel" aria-label="เลือกหมวด"><option value="0">ทุกหมวด (' + items.length + ' รายการ)</option>' + cats.map(function (c) { return '<option value="' + c.no + '"' + (IF.cat === c.no ? ' selected' : '') + '>' + catLabel(c.no) + '. ' + esc(c.name.replace(/\s*\(.*\)$/, '')) + (m.divId && c.owners.indexOf(m.divId) >= 0 ? ' ★' : '') + '</option>'; }).join('') + '</select>';
  var F = [['all', 'ทั้งหมด'], ['own', 'หมวดของฝ่ายฉัน'], ['mine', 'ที่ฉันให้ความเห็นแล้ว'], ['todo', 'ที่ฉันยังไม่ให้ความเห็น'], ['flag', 'มีข้อเสนอเปลี่ยน/ยกเลิกในฝ่าย']];
  $('#ibody').innerHTML = '<div class="cat-layout"><aside class="cat-rail" aria-label="หมวด">' + rail + '</aside><div>' +
    '<div class="toolbar">' + sel + '<label class="search"><span class="sr">ค้นหา</span>' + ic('search') + '<input class="in" id="iq" placeholder="ค้นหาชื่อหัตถการ เลขข้อ หรืออัตรา" value="' + esc(IF.q) + '"></label></div>' +
    '<div class="chips" role="group" aria-label="ตัวกรอง" style="margin-bottom:14px">' + F.map(function (f) { return '<button class="chip" data-f="' + f[0] + '" aria-pressed="' + (IF.f === f[0]) + '">' + f[1] + '</button>'; }).join('') + '</div>' +
    '<div id="ilist"></div></div></div>';
  $$('.cat-rail [data-cat]').forEach(function (b) { b.onclick = function () { IF.cat = +b.dataset.cat; drawItems(); window.scrollTo({ top: 0 }); }; });
  $('#catsel').onchange = function () { IF.cat = +this.value; drawItems(); };
  $$('[data-f]').forEach(function (b) { b.onclick = function () { IF.f = b.dataset.f; drawItems(); }; });
  $('#iq').oninput = debounce(function () { IF.q = this.value.trim(); drawList(); }, 160);
  drawList();
}
function drawList() {
  var m = me(), d = S.div[m.divId] || { opinions: [], consensus: [] }, q = IF.q.toLowerCase();
  var flagged = {}; d.opinions.forEach(function (o) { if (o.status !== 'keep') flagged[o.itemId] = 1; });
  var list = S.boot.items.filter(function (i) {
    if (IF.cat && i.cat !== IF.cat) return false;
    if (IF.f === 'own' && !(m.divId && ownsCat(m.divId, i.cat))) return false;
    if (IF.f === 'mine' && !myOp(d, i.id)) return false;
    if (IF.f === 'todo' && myOp(d, i.id)) return false;
    if (IF.f === 'flag' && !flagged[i.id]) return false;
    if (q && (i.code + ' ' + i.name + ' ' + (i.rate || '') + ' ' + i.unit).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
  if (!list.length) { $('#ilist').innerHTML = '<div class="sched"><div class="empty"><h3>ไม่พบรายการ</h3><p>ลองเปลี่ยนคำค้นหาหรือตัวกรอง หากหัตถการที่ทำจริงยังไม่มีในคำสั่ง เสนอเป็นรายการใหม่ได้</p><a class="btn primary" href="#/propose">เสนอรายการใหม่</a></div></div>'; return; }
  var html = '', lastCat = null;
  list.forEach(function (i) {
    if (i.cat !== lastCat) {
      if (lastCat !== null) html += '</div>';
      var c = catByNo(i.cat), own = m.divId && c.owners.indexOf(m.divId) >= 0;
      html += '<div class="sched" style="margin-bottom:16px"><div class="sched-cat"><h3>' + (i.cat === 20 ? 'หมวดศัลยกรรมเด็ก' : 'หมวด ' + i.cat) + ' ' + esc(c.name) + '</h3>' + (own ? '<span class="st own">หมวดของฝ่ายท่าน</span>' : '') +
        '<span class="muted">' + (c.owners[0] === 'ALL' ? 'ทุกฝ่ายให้ความเห็นได้' : 'ฝ่ายที่สรุป: ' + c.owners.map(function (x) { return divName(x, true); }).join(', ')) + (i.cat === 20 ? ' · คำสั่ง 961/2565' : '') + '</span></div>';
      lastCat = i.cat;
    }
    var my = myOp(d, i.id), ops = opsOf(d, i.id), rule = i.cat === 1;
    html += '<button class="it' + (rule ? ' rule' : '') + '" data-id="' + i.id + '"><span class="code">' + esc(i.code) + '</span><span class="nm">' + esc(i.name) + (i.note ? '<small>' + esc(i.note) + '</small>' : '') + (i.cmd === '182/2565' ? '<small>คำสั่ง 182/2565</small>' : '') + '</span>' +
      (rule ? '' : '<span class="rt"><b>' + fmt(i.rate) + '</b><small>บาท' + (i.unit ? ' ' + esc(i.unit) : '') + '</small></span>') +
      '<span class="me">' + (my ? stChip(my.status, 'ฉัน: ' + S.boot.labels.status[my.status]) : '<span class="st none">ยังไม่ให้ความเห็น</span>') + (ops.length > (my ? 1 : 0) ? '<span class="faint tiny">ในฝ่าย ' + ops.length + ' ความเห็น</span>' : '') + '</span></button>';
  });
  $('#ilist').innerHTML = html + '</div>';
  $$('#ilist .it').forEach(function (b) { b.onclick = function () { location.hash = '#/item/' + b.dataset.id; }; });
}

/* ---------- ลิ้นชักรายการ ---------- */
function openItem(id, divId) {
  var it = itemById(id); if (!it) { toast('ไม่พบรายการ', true); return; }
  var m = me(); divId = divId || m.divId;
  var dr = openDrawer('<div class="drawer-h"><span class="code">' + esc(it.code) + '</span><div class="grow"><h2>' + esc(it.name) + '</h2></div><button class="btn ghost sm" data-close aria-label="ปิด">' + ic('x') + '</button></div><div class="drawer-b">' + loadingHtml() + '</div>');
  dr.querySelector('[data-close]').onclick = function () { closeDrawer(); };
  loadDiv(divId).then(function (d) { drawItem(it, d); }).catch(function (e) { $('.drawer-b', dr).innerHTML = errorHtml(e.message); });
}
function drawItem(it, d) {
  var dr = $('#drawer'); if (!dr) return;
  var m = me(), divId = d.divId, c = catByNo(it.cat), rule = it.cat === 1, lead = isLead(divId), canW = writable(divId) && (divId === m.divId || lead);
  var mine = d.opinions.filter(function (o) { return o.itemId === it.id && o.emp === m.user; })[0];
  var ops = opsOf(d, it.id), cons = consOf(d, it.id), owned = d.owned.indexOf(it.id) >= 0;
  var head = '<div class="drawer-h"><span class="code">' + esc(it.code) + '</span><div class="grow"><h2>' + esc(it.name) + '</h2><div class="meta"><span class="tag">' + (it.cat === 20 ? 'ศัลยกรรมเด็ก' : 'หมวด ' + it.cat) + ' ' + esc(c.name.replace(/\s*\(.*\)$/, '')) + '</span><span class="tag">คำสั่ง ' + esc(it.cmd) + '</span>' + (owned ? '<span class="st own">หมวดของ' + esc(divName(divId, true)) + '</span>' : '') + (divId !== m.divId ? '<span class="st red">กำลังดู ' + esc(divName(divId, true)) + '</span>' : '') + '</div></div><button class="btn ghost sm" data-close aria-label="ปิด">' + ic('x') + '</button></div>';
  var body = '';
  if (!rule) body += '<div class="ratebox"><div><span>อัตราปัจจุบัน</span><b>' + fmt(it.rate) + ' <small style="font-size:15px;font-weight:500">บาท</small></b><span>' + esc(it.unit || 'ต่อราย') + (it.note ? ' · ' + esc(it.note) : '') + '</span></div><div><span>ความเห็นในฝ่าย</span><b>' + ops.length + '</b><span class="tally">' + (tallyHtml(ops) || 'ยังไม่มี') + '</span></div></div>';
  else body += '<div class="alert info">' + ic('help') + '<span>หลักเกณฑ์ข้อ ' + esc(it.code) + ' ของเอกสารแนบ 1 ท้ายคำสั่ง 359/2553 ท่านเสนอปรับถ้อยคำหรือหลักการได้</span></div>';
  // ฟอร์มความเห็น
  var proxyOpts = '';
  if (lead && canW) {
    proxyOpts = '<label class="f" style="max-width:420px"><span>บันทึกในนามของ</span><select class="in" id="forEmp"><option value="">ตัวท่านเอง (' + esc(m.name) + ')</option>' +
      (d.members || []).filter(function (x) { return x.emp !== m.user && !x.coord; }).sort(function (a, b) { return a.name.localeCompare(b.name, 'th'); }).map(function (x) { return '<option value="' + esc(x.emp) + '">' + esc(x.name) + '</option>'; }).join('') +
      '<option value="DIV">ความเห็นในนามฝ่าย</option></select><small>ผู้ประสานงาน/หัวหน้าฝ่ายบันทึกแทนแพทย์ได้ ระบบจะระบุว่ากรอกแทนโดยท่าน</small></label>';
  }
  if (divId === m.divId || lead) {
    body += '<section class="sect"><h3>ความเห็นของ' + (lead && canW ? 'ท่าน / บันทึกแทน' : 'ท่าน') + (mine ? '<span class="muted">บันทึกล่าสุด ' + esc(ago(mine.updatedAt)) + '</span>' : '') + '</h3>' +
      (canW ? '<div class="form-card" id="opf">' + proxyOpts + '<div id="opform"></div></div>' : '<div class="alert ' + (locked(divId) ? 'good' : 'info') + '">' + ic(locked(divId) ? 'lock' : 'clock') + '<span>' + (!m.divId ? 'ยังไม่ได้ระบุฝ่ายของท่าน จึงยังให้ความเห็นไม่ได้' : locked(divId) ? 'ฝ่ายรับรองส่งแล้ว ข้อมูลถูกล็อก' : esc(B().phaseTh)) + '</span></div>' + (mine ? opView(mine) : '')) + '</section>';
  }
  // ความเห็นในฝ่าย
  var others = ops.filter(function (o) { return o.emp !== m.user; });
  body += '<section class="sect"><h3>ความเห็นใน' + esc(divName(divId, true)) + '<span class="muted">' + ops.length + ' ความเห็น</span></h3>' + (others.length ? '<div class="panel"><div class="panel-b" style="padding-top:4px;padding-bottom:4px">' + others.map(opView).join('') + '</div></div>' : '<p class="muted" style="margin:0">ยังไม่มีความเห็นจากแพทย์ท่านอื่นในฝ่าย</p>') + '</section>';
  // ข้อสรุปของฝ่าย
  if (lead || cons) body += '<section class="sect" id="consSect"></section>';
  if (lead || m.viewAll) body += '<section class="sect"><h3>' + ic('hist') + 'ประวัติการแก้ไข</h3><div id="hist"><button class="btn sm" id="loadHist">แสดงประวัติ</button></div></section>';
  dr.innerHTML = head + '<div class="drawer-b">' + body + '</div>';
  dr.querySelector('[data-close]').onclick = function () { closeDrawer(); };
  if ($('#opform', dr)) {
    var draw = function () { var who = $('#forEmp') ? $('#forEmp').value : ''; var cur = who ? d.opinions.filter(function (o) { return o.itemId === it.id && o.emp === who; })[0] : mine; opForm($('#opform'), it, cur, d, who); };
    if ($('#forEmp')) $('#forEmp').onchange = draw;
    draw();
  }
  if ($('#consSect', dr)) consensusPanel($('#consSect'), it.id, d, lead && writable(divId), it);
  if ($('#loadHist', dr)) $('#loadHist').onclick = function () { histInto($('#hist'), it.id, divId); };
  bindFileLinks(dr);
}
function opView(o) {
  var L = S.boot.labels, it = itemById(o.itemId), parts = [];
  if (o.status === 'change') {
    if (o.changes.length) parts.push('<p><span class="lbl">เปลี่ยน:</span> ' + o.changes.map(function (x) { return L.change[x]; }).join(', ') + '</p>');
    if (o.newName) parts.push('<p><span class="lbl">' + (it && it.cat === 1 ? 'ถ้อยคำที่เสนอ' : 'ชื่อที่เสนอ') + ':</span> ' + esc(o.newName) + '</p>');
    if (o.newScope) parts.push('<p><span class="lbl">ขอบเขตที่เสนอ:</span> ' + esc(o.newScope) + '</p>');
    if (o.newRate !== '') parts.push('<p><span class="lbl">อัตราที่เสนอ:</span> <b>' + baht(o.newRate) + '</b> ' + esc(o.newUnit || '') + (it && it.rate ? ' <span class="faint">(เดิม ' + fmt(it.rate) + ')</span>' : '') + '</p>');
  }
  if (o.reason) parts.push('<p><span class="lbl">เหตุผล:</span> ' + esc(o.reason) + '</p>');
  if (o.refText || o.refHosp) parts.push('<p><span class="lbl">อ้างอิง:</span> ' + esc([o.refText, o.refHosp, o.refRate !== '' ? baht(o.refRate) : ''].filter(Boolean).join(' · ')) + '</p>');
  var att = (o.links || []).map(function (l) { return '<a class="file" href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' + ic('link') + '<span class="nm">' + esc(l.label || l.url) + '</span></a>'; })
    .concat((o.files || []).map(function (f) { return '<span class="file">' + ic('file') + '<a data-file="' + esc(f.id) + '" class="nm">' + esc(f.name) + '</a></span>'; }));
  if (att.length) parts.push('<div class="files" style="margin-top:6px">' + att.join('') + '</div>');
  return '<div class="op"><span class="avatar">' + esc(initials(o.empName)) + '</span><div><div class="h"><b>' + esc(o.empName) + '</b>' + stChip(o.status) + (o.byName ? '<span class="proxy">กรอกแทนโดย ' + esc(o.byName) + '</span>' : '') + '<span class="faint small">' + esc(ago(o.updatedAt)) + '</span></div><div class="b">' + parts.join('') + '</div></div></div>';
}
function bindFileLinks(root) { $$('[data-file]', root).forEach(function (a) { a.onclick = function (e) { e.preventDefault(); downloadFile(a.dataset.file, a.textContent); }; a.setAttribute('href', '#'); }); }
function downloadFile(id, name) {
  toast('กำลังเปิดไฟล์…');
  api('getFile', { id: id }).then(function (f) {
    var bin = atob(f.data), u8 = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    var url = URL.createObjectURL(new Blob([u8], { type: f.mime })), a = document.createElement('a'); a.href = url; a.download = f.name || name; a.target = '_blank'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  }).catch(function (e) { toast(e.message, true); });
}
function histInto(el, ref, divId) {
  el.innerHTML = loadingHtml();
  api('history', { ref: ref, divId: divId }).then(function (h) {
    var A = { OPINION_NEW: 'ให้ความเห็น', OPINION_EDIT: 'แก้ไขความเห็น', OPINION_DELETE: 'ลบความเห็น', CONSENSUS: 'สรุปความเห็นฝ่าย', CONSENSUS_CLEAR: 'ล้างข้อสรุป', DECISION: 'ลงผลพิจารณา', DECISION_CLEAR: 'ล้างผลพิจารณา', PROPOSAL_NEW: 'เสนอรายการใหม่', PROPOSAL_EDIT: 'แก้ไขรายการเสนอ', PROPOSAL_DELETE: 'ถอนรายการเสนอ', ITEM_EDIT: 'แก้ไขข้อความรายการ' };
    el.innerHTML = h.length ? '<div class="timeline">' + h.map(function (x) {
      var dt = x.detail || {}, extra = [];
      if (dt.status) extra.push(S.boot.labels.status[dt.status] || dt.status); if (dt.decision) extra.push(S.boot.labels.status[dt.decision] || S.boot.labels.pdec[dt.decision] || dt.decision);
      if (dt.rate) extra.push(fmt(dt.rate) + ' บาท'); if (dt.proxy) extra.push('บันทึกแทน'); if (dt.emp && dt.emp !== x.emp) extra.push('ของ ' + dt.emp);
      return '<div><b>' + esc(x.name || x.emp) + '</b> ' + esc(A[x.action] || x.action) + (extra.length ? ' <span class="muted">(' + esc(extra.join(' · ')) + ')</span>' : '') + '<br><span class="faint tiny">' + esc(thDT(x.at)) + '</span></div>';
    }).join('') + '</div>' : '<p class="muted">ยังไม่มีประวัติ</p>';
  }).catch(function (e) { el.innerHTML = '<p class="muted">' + esc(e.message) + '</p>'; });
}

/* ---------- ฟอร์มความเห็น ---------- */
function opForm(box, it, cur, d, forEmp) {
  var rule = it.cat === 1, L = S.boot.labels;
  var v = cur ? JSON.parse(JSON.stringify(cur)) : { status: '', changes: [], newName: '', newScope: '', newRate: '', newUnit: it.unit || '', reason: '', refText: '', refHosp: '', refRate: '', links: [], files: [] };
  function draw() {
    var st = v.status;
    box.innerHTML = '<div><span class="f-label">' + (forEmp ? 'ความเห็นของ ' + esc(forEmp === 'DIV' ? 'ฝ่าย' : ($('#forEmp option:checked') || {}).textContent || '') : 'ท่านเห็นว่ารายการนี้ควร') + '</span><div class="seg big" role="group">' +
      ['keep', 'change', 'cancel'].map(function (k) { return '<button type="button" data-v="' + k + '" aria-pressed="' + (st === k) + '">' + (st === k ? ic('check') : '') + L.status[k] + '</button>'; }).join('') + '</div></div>' +
      (st === 'change' && !rule ? '<div class="reveal"><span class="f-label">สิ่งที่ต้องการเปลี่ยน (เลือกได้หลายข้อ)</span><div class="row wrap" style="gap:18px">' + ['name', 'scope', 'rate'].map(function (k) { return '<label class="check"><input type="checkbox" data-ch="' + k + '"' + (v.changes.indexOf(k) >= 0 ? ' checked' : '') + '> ' + L.change[k] + '</label>'; }).join('') + '</div></div>' : '') +
      (st === 'change' && (rule || v.changes.indexOf('name') >= 0) ? '<label class="f reveal"><span>' + (rule ? 'ถ้อยคำหลักเกณฑ์ที่เสนอ' : 'ชื่อรายการที่เสนอ') + '</span><textarea class="in" data-k="newName" rows="2">' + esc(v.newName || (rule || !cur ? it.name : '')) + '</textarea></label>' : '') +
      (st === 'change' && v.changes.indexOf('scope') >= 0 ? '<label class="f reveal"><span>ขอบเขตงานที่เสนอ</span><textarea class="in" data-k="newScope" rows="2" placeholder="เช่น ครอบคลุมกรณี… / ไม่รวม…">' + esc(v.newScope) + '</textarea></label>' : '') +
      (st === 'change' && v.changes.indexOf('rate') >= 0 ? '<div class="grid2 reveal"><label class="f"><span>อัตราที่เสนอ (บาท)</span><div class="in-pre"><b>฿</b><input class="in" data-k="newRate" inputmode="decimal" value="' + esc(v.newRate) + '" placeholder="' + esc(it.rate || '') + '"></div><small id="rdelta"></small></label><label class="f"><span>หน่วย</span><input class="in" data-k="newUnit" value="' + esc(v.newUnit) + '" placeholder="ต่อราย"></label></div>' : '') +
      (st ? '<label class="f reveal"><span>เหตุผลประกอบ' + (st === 'keep' ? ' (ถ้ามี)' : '') + '</span><textarea class="in" data-k="reason" rows="3" placeholder="' + (st === 'cancel' ? 'เช่น ไม่มีการปฏิบัติแล้ว / ซ้ำกับข้อ…' : st === 'change' ? 'เช่น เทคนิคปัจจุบันซับซ้อนขึ้น ใช้เวลามากขึ้น…' : '') + '">' + esc(v.reason) + '</textarea></label>' +
        (st !== 'keep' ? refsEditor(v, d.divId) : '') : '<p class="muted small" style="margin:0">เลือกคงเดิมได้ทันทีหากรายการยังเหมาะสม</p>') +
      '<div id="operr"></div><div class="row wrap"><button class="btn primary" id="opsave"' + (st ? '' : ' disabled') + '>' + (cur ? 'บันทึกการแก้ไข' : 'บันทึกความเห็น') + '</button>' + (cur ? '<button class="btn ghost" id="opdel">' + ic('trash') + 'ลบความเห็น</button>' : '') + '</div>';
    $$('[data-v]', box).forEach(function (b) { b.onclick = function () { sync(); v.status = b.dataset.v; draw(); }; });
    $$('[data-ch]', box).forEach(function (cb) { cb.onchange = function () { sync(); var k = cb.dataset.ch; v.changes = v.changes.filter(function (x) { return x !== k; }); if (cb.checked) v.changes.push(k); draw(); }; });
    var rr = $('[data-k="newRate"]', box); if (rr) { var upd = function () { var n = +String(rr.value).replace(/,/g, ''); $('#rdelta').innerHTML = rr.value && it.rate ? (n > it.rate ? '<span style="color:var(--change)">เพิ่มขึ้น ' + fmt(n - it.rate) + ' บาท (+' + pct(n - it.rate, it.rate) + '%)</span>' : n < it.rate ? '<span style="color:var(--cancel)">ลดลง ' + fmt(it.rate - n) + ' บาท</span>' : 'เท่าเดิม') : ''; }; rr.oninput = upd; upd(); }
    bindRefs(box, v, d.divId, sync, draw);
    $('#opsave').onclick = function () {
      sync(); var b = this; busy(b, true);
      var p = { itemId: it.id, status: v.status, changes: v.changes, newName: v.newName, newScope: v.newScope, newRate: v.newRate, newUnit: v.newUnit, reason: v.reason, refText: v.refText, refHosp: v.refHosp, refRate: v.refRate, links: v.links.filter(function (l) { return l.url; }), files: v.files.map(function (f) { return f.id; }) };
      if (forEmp) { p.forEmp = forEmp; p.divId = d.divId; }
      apiW('saveOpinion', p).then(function (o) {
        var arr = d.opinions.filter(function (x) { return x.id !== o.id; }); arr.push(o); d.opinions = arr;
        toast(forEmp ? 'บันทึกแทน ' + o.empName + ' แล้ว' : 'บันทึกความเห็นแล้ว'); drawItem(it, d); if ($('#ilist')) drawList();
      }).catch(function (e) { busy(b, false); $('#operr').innerHTML = '<div class="alert err">' + ic('x') + '<span>' + esc(e.message) + '</span></div>'; });
    };
    if ($('#opdel')) $('#opdel').onclick = function () {
      confirmBox('ลบความเห็นนี้?', 'ความเห็นจะถูกลบออกจากการพิจารณา (ประวัติยังถูกเก็บไว้)', 'ลบความเห็น', true).then(function (y) {
        if (!y) return;
        var p = { itemId: it.id, remove: true }; if (forEmp) { p.forEmp = forEmp; p.divId = d.divId; }
        apiW('saveOpinion', p).then(function () { d.opinions = d.opinions.filter(function (x) { return x.id !== cur.id; }); toast('ลบความเห็นแล้ว'); drawItem(it, d); if ($('#ilist')) drawList(); }).catch(function (e) { toast(e.message, true); });
      });
    };
  }
  function sync() { $$('[data-k]', box).forEach(function (el) { v[el.dataset.k] = el.value; }); syncRefs(box, v); }
  draw();
}

/* ---------- อ้างอิง: ข้อความ · โรงพยาบาลที่เทียบเคียง · อัตรา · ลิงก์ · ไฟล์ ---------- */
function refsEditor(v, divId) {
  if (!v.links.length) v.links.push({ url: '', label: '' });
  return '<div class="reveal" style="border-top:1px dashed var(--line-2);padding-top:14px"><span class="f-label">แหล่งอ้างอิง / ข้อมูลเทียบเคียง</span>' +
    '<label class="f"><span class="muted" style="font-weight:500">ระเบียบหรือเอกสารอ้างอิง</span><input class="in" data-k="refText" value="' + esc(v.refText) + '" placeholder="เช่น ข้อบังคับกระทรวงสาธารณสุขฯ พ.ศ. 2566 (สธ.0202.3.7/ว.79)"></label>' +
    '<div class="grid2" style="margin-top:10px"><label class="f"><span class="muted" style="font-weight:500">โรงพยาบาลที่เทียบเคียง</span><input class="in" data-k="refHosp" value="' + esc(v.refHosp) + '" placeholder="เช่น รพ.ชลบุรี"></label><label class="f"><span class="muted" style="font-weight:500">อัตราของที่เทียบเคียง (บาท)</span><div class="in-pre"><b>฿</b><input class="in" data-k="refRate" inputmode="decimal" value="' + esc(v.refRate) + '"></div></label></div>' +
    '<div style="margin-top:12px"><span class="f-label muted" style="font-weight:500">ลิงก์ข้อมูลอ้างอิง</span><div class="refs">' + v.links.map(function (l, i) { return '<div class="ref-row"><input class="in" data-lu="' + i + '" placeholder="https://…" value="' + esc(l.url) + '"><input class="in" data-ll="' + i + '" placeholder="คำอธิบาย (ถ้ามี)" value="' + esc(l.label) + '"><button type="button" class="btn ghost sm" data-ldel="' + i + '" aria-label="ลบลิงก์">' + ic('x') + '</button></div>'; }).join('') + '</div>' +
    (v.links.length < 6 ? '<button type="button" class="btn ghost sm" data-ladd style="margin-top:6px">' + ic('plus') + 'เพิ่มลิงก์</button>' : '') + '</div>' +
    '<div style="margin-top:12px"><span class="f-label muted" style="font-weight:500">ไฟล์แนบ (PDF รูปภาพ Word Excel ไม่เกิน ' + esc(S.boot.settings.maxFileMb || 10) + ' MB)</span><div class="files">' +
    v.files.map(function (f, i) { return '<span class="file">' + ic('file') + '<a data-file="' + esc(f.id) + '" class="nm">' + esc(f.name) + '</a><button type="button" data-fdel="' + i + '" aria-label="นำไฟล์ออก">' + ic('x') + '</button></span>'; }).join('') +
    (v.files.length < 6 ? '<label class="btn sm">' + ic('clip') + 'แนบไฟล์<input type="file" data-fadd hidden accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"></label>' : '') + '</div></div></div>';
}
function syncRefs(box, v) {
  $$('[data-lu]', box).forEach(function (el) { var i = +el.dataset.lu; if (v.links[i]) v.links[i].url = el.value.trim(); });
  $$('[data-ll]', box).forEach(function (el) { var i = +el.dataset.ll; if (v.links[i]) v.links[i].label = el.value.trim(); });
}
function bindRefs(box, v, divId, sync, redraw) {
  var add = $('[data-ladd]', box); if (add) add.onclick = function () { sync(); v.links.push({ url: '', label: '' }); redraw(); };
  $$('[data-ldel]', box).forEach(function (b) { b.onclick = function () { sync(); v.links.splice(+b.dataset.ldel, 1); redraw(); }; });
  $$('[data-fdel]', box).forEach(function (b) { b.onclick = function () { sync(); v.files.splice(+b.dataset.fdel, 1); redraw(); }; });
  bindFileLinks(box);
  var fi = $('[data-fadd]', box); if (fi) fi.onchange = function () {
    var f = fi.files[0]; if (!f) return; sync();
    var max = (+S.boot.settings.maxFileMb || 10) * 1048576; if (f.size > max) { toast('ไฟล์ใหญ่เกิน ' + S.boot.settings.maxFileMb + ' MB', true); return; }
    var lab = fi.parentNode; lab.innerHTML = '<span class="spin"></span>กำลังอัปโหลด…';
    var rd = new FileReader(); rd.onload = function () {
      var data = String(rd.result).split(',')[1];
      apiW('uploadFile', { divId: divId, name: f.name, mime: f.type || guessMime(f.name), data: data }).then(function (x) { v.files.push(x); toast('แนบไฟล์ ' + x.name + ' แล้ว'); redraw(); })
        .catch(function (e) { toast(e.message, true); redraw(); });
    }; rd.readAsDataURL(f);
  };
}
function guessMime(n) { var e = String(n).split('.').pop().toLowerCase(); return { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }[e] || ''; }

/* ---------- ข้อสรุปของฝ่าย (แผงในลิ้นชัก/หน้าฝ่าย) ---------- */
function consensusPanel(el, ref, d, canEdit, it, prop) {
  var cur = consOf(d, ref), isP = ref.charAt(0) === 'P', L = S.boot.labels, opts = isP ? L.pdec : L.status;
  var ops = isP ? [] : opsOf(d, ref), rates = ops.filter(function (o) { return o.newRate !== ''; }).map(function (o) { return +o.newRate; });
  var v = cur ? { decision: cur.decision, newName: cur.newName, newRate: cur.newRate, newUnit: cur.newUnit, reason: cur.reason } : { decision: '', newName: '', newRate: '', newUnit: '', reason: '' };
  function draw(edit) {
    if (!canEdit || (cur && !edit)) {
      el.innerHTML = '<div class="consensus' + (cur ? ' done' : '') + '"><div class="row wrap"><h3 class="grow">ข้อสรุปของ' + esc(divName(d.divId, true)) + '</h3>' + (cur ? stChip(cur.decision) : '<span class="st none">ยังไม่สรุป</span>') + (cur && canEdit ? '<button class="btn sm" data-edit>แก้ข้อสรุป</button>' : '') + '</div>' +
        (cur ? '<div class="small" style="margin-top:8px">' + (cur.newName ? '<p style="margin:2px 0"><span class="muted">ชื่อ/ถ้อยคำ:</span> ' + esc(cur.newName) + '</p>' : '') + (cur.newRate !== '' ? '<p style="margin:2px 0"><span class="muted">อัตรา:</span> <b>' + baht(cur.newRate) + '</b> ' + esc(cur.newUnit || '') + '</p>' : '') + (cur.reason ? '<p style="margin:2px 0"><span class="muted">เหตุผล:</span> ' + esc(cur.reason) + '</p>' : '') + '<p class="faint tiny" style="margin:6px 0 0">โดย ' + esc(cur.byName) + ' · ' + esc(thDT(cur.at)) + '</p></div>' : '<p class="muted small" style="margin:6px 0 0">หัวหน้าฝ่ายหรือผู้รับมอบเป็นผู้สรุป</p>') + '</div>';
      var eb = $('[data-edit]', el); if (eb) eb.onclick = function () { draw(true); };
      return;
    }
    var dec = v.decision, needs = dec === 'change' || dec === 'revise';
    el.innerHTML = '<div class="consensus"><h3>ข้อสรุปของ' + esc(divName(d.divId, true)) + '</h3><p class="muted small" style="margin:4px 0 12px">' + (isP ? 'พิจารณารายการที่แพทย์ในฝ่ายเสนอเพิ่ม' : (ops.length ? 'ความเห็นในฝ่าย: ' + tallyHtml(ops) + (rates.length ? ' · อัตราที่เสนอ ' + fmt(Math.min.apply(null, rates)) + (rates.length > 1 ? '–' + fmt(Math.max.apply(null, rates)) : '') + ' บาท' : '') : 'ยังไม่มีแพทย์ในฝ่ายให้ความเห็น')) + '</p>' +
      '<div class="seg" role="group">' + Object.keys(opts).map(function (k) { return '<button type="button" data-v="' + k + '" aria-pressed="' + (dec === k) + '">' + opts[k] + '</button>'; }).join('') + '</div>' +
      (needs ? '<div class="grid2 reveal" style="margin-top:12px"><label class="f" style="grid-column:1/-1"><span>' + (it && it.cat === 1 ? 'ถ้อยคำที่ฝ่ายเสนอ' : 'ชื่อรายการที่ฝ่ายเสนอ (ถ้าเปลี่ยน)') + '</span><textarea class="in" data-k="newName" rows="2">' + esc(v.newName) + '</textarea></label>' +
        (it && it.cat === 1 ? '' : '<label class="f"><span>อัตราที่ฝ่ายเสนอ (บาท)</span><div class="in-pre"><b>฿</b><input class="in" data-k="newRate" inputmode="decimal" value="' + esc(v.newRate !== '' ? v.newRate : prop ? prop.rate : '') + '"></div></label><label class="f"><span>หน่วย</span><input class="in" data-k="newUnit" value="' + esc(v.newUnit || (prop ? prop.unit : it ? it.unit : '')) + '"></label>') + '</div>' : '') +
      (dec ? '<label class="f reveal" style="margin-top:12px"><span>เหตุผลของข้อสรุป' + (dec === 'keep' || dec === 'support' ? ' (ถ้ามี)' : '') + '</span><textarea class="in" data-k="reason" rows="2">' + esc(v.reason) + '</textarea></label>' : '') +
      '<div id="cerr"></div><div class="row wrap" style="margin-top:12px"><button class="btn primary" data-save' + (dec ? '' : ' disabled') + '>บันทึกข้อสรุป</button>' + (cur ? '<button class="btn ghost" data-cancel>ยกเลิก</button>' : '') + '</div></div>';
    $$('[data-v]', el).forEach(function (b) { b.onclick = function () { sync(); v.decision = b.dataset.v; draw(true); }; });
    function sync() { $$('[data-k]', el).forEach(function (x) { v[x.dataset.k] = x.value; }); }
    if ($('[data-cancel]', el)) $('[data-cancel]', el).onclick = function () { draw(false); };
    $('[data-save]', el).onclick = function () {
      sync(); var b = this; busy(b, true);
      apiW('saveConsensus', { divId: d.divId, ref: ref, decision: v.decision, newName: v.newName, newRate: v.newRate, newUnit: v.newUnit, reason: v.reason }).then(function (x) {
        d.consensus = d.consensus.filter(function (y) { return y.ref !== ref; }); d.consensus.push(x); cur = x; toast('บันทึกข้อสรุปของฝ่ายแล้ว'); draw(false);
        if (typeof onConsensusSaved === 'function') onConsensusSaved(d);
      }).catch(function (e) { busy(b, false); $('#cerr', el).innerHTML = '<div class="alert err" style="margin-top:10px">' + esc(e.message) + '</div>'; });
    };
  }
  draw(false);
}

/* ---------- เสนอรายการใหม่ ---------- */
function pagePropose() {
  var m = me();
  shell('<div class="page-head"><div><h1>เสนอรายการใหม่</h1><p>หัตถการที่แพทย์ในฝ่ายปฏิบัติจริงนอกเวลาราชการแต่ยังไม่มีในคำสั่ง ให้ระบุรายการเดิมที่ใช้เทียบเคียง (ลักษณะ ความซับซ้อน ระยะเวลา ความเสี่ยงใกล้เคียงกัน) และอัตราที่เสนอ</p></div>' +
    (m.divId || m.leadDivs.length ? '<div class="act"><button class="btn primary" id="newp">' + ic('plus') + 'เสนอรายการใหม่</button></div>' : '') + '</div><div id="pbody">' + loadingHtml() + '</div>', 'เสนอรายการใหม่');
  loadDiv(m.divId).then(function (d) {
    drawProps(d);
    if ($('#newp')) $('#newp').onclick = function () { if (!writable(m.divId) && !m.leadDivs.length) { toast(locked(m.divId) ? 'ฝ่ายรับรองส่งแล้ว ข้อมูลถูกล็อก' : B().phaseTh, true); return; } openProposal(null, d); };
  }).catch(function (e) { $('#pbody').innerHTML = errorHtml(e.message); });
}
function drawProps(d) {
  var m = me(), mine = d.proposals.filter(function (p) { return p.emp === m.user; }), others = d.proposals.filter(function (p) { return p.emp !== m.user; });
  function card(p) {
    var cmp = p.compareId && p.compareId !== 'NONE' ? itemById(p.compareId) : null, cons = consOf(d, p.id);
    return '<tr class="click" data-p="' + esc(p.id) + '"><td><b>' + esc(p.nameEn || p.nameTh) + '</b>' + (p.nameEn && p.nameTh ? '<br><span class="muted small">' + esc(p.nameTh) + '</span>' : '') + '</td><td class="r nowrap"><b>' + fmt(p.rate) + '</b><br><span class="muted tiny">' + esc(p.unit) + '</span></td>' +
      '<td class="small">' + (cmp ? 'ข้อ ' + esc(cmp.code) + ' ' + esc(cmp.name.slice(0, 50)) + '<br><span class="muted">' + fmt(cmp.rate) + ' บาท</span>' : '<span class="muted">ไม่มีรายการเทียบเคียงได้</span>') + '</td>' +
      '<td class="small">' + esc(p.empName) + (p.byName ? '<br><span class="proxy">กรอกแทนโดย ' + esc(p.byName) + '</span>' : '') + '<br><span class="faint tiny">' + esc(ago(p.updatedAt)) + '</span></td><td>' + (cons ? stChip(cons.decision) : '<span class="st none">รอฝ่ายสรุป</span>') + '</td></tr>';
  }
  var head = '<thead><tr><th>หัตถการที่เสนอ</th><th class="r">อัตรา (บาท)</th><th>เทียบเคียงกับ</th><th>ผู้เสนอ</th><th>ข้อสรุปฝ่าย</th></tr></thead>';
  $('#pbody').innerHTML = (mine.length ? '<h2 style="font-size:18px;margin-bottom:10px">รายการที่ท่านเสนอ</h2><div class="tbl-wrap"><table class="tbl">' + head + '<tbody>' + mine.map(card).join('') + '</tbody></table></div>' : '<div class="panel"><div class="empty"><h3>ท่านยังไม่ได้เสนอรายการใหม่</h3><p>เริ่มจากชื่อหัตถการ แล้วเลือกรายการเดิมที่ความยากง่ายใกล้เคียงที่สุดเพื่อเทียบอัตรา</p>' + (me().divId ? '<button class="btn primary" onclick="openProposal(null, S.div[me().divId])">' + ic('plus') + 'เสนอรายการใหม่</button>' : '') + '</div></div>') +
    '<h2 style="font-size:18px;margin:26px 0 10px">รายการที่แพทย์ท่านอื่นใน' + esc(divName(d.divId, true)) + 'เสนอ <span class="muted" style="font:400 15px var(--f-body)">' + others.length + ' รายการ</span></h2>' +
    (others.length ? '<div class="tbl-wrap"><table class="tbl">' + head + '<tbody>' + others.map(card).join('') + '</tbody></table></div>' : '<p class="muted">ยังไม่มี</p>');
  $$('[data-p]').forEach(function (r) { r.onclick = function () { openProposal(d.proposals.filter(function (p) { return p.id === r.dataset.p; })[0], d); }; });
}
function openProposal(p, d) {
  var m = me(), divId = p ? p.divId : d.divId, editable = writable(divId) && (!p || p.emp === m.user || isLead(divId)), lead = isLead(divId);
  var v = p ? JSON.parse(JSON.stringify(p)) : { nameEn: '', nameTh: '', catNo: '', rate: '', unit: 'ต่อราย', compareId: '', cmpComplexity: '', cmpTime: '', cmpRisk: '', cmpNote: '', refText: '', refHosp: '', refRate: '', freq: '', links: [], files: [], note: '' };
  var dr = openDrawer('<div class="drawer-h"><span class="code">' + (p ? 'เสนอ' : 'ใหม่') + '</span><div class="grow"><h2>' + (p ? esc(p.nameEn || p.nameTh) : 'เสนอรายการหัตถการใหม่') + '</h2><div class="meta"><span class="tag">' + esc(divName(divId)) + '</span>' + (p ? '<span class="tag">เสนอโดย ' + esc(p.empName) + '</span>' : '') + '</div></div><button class="btn ghost sm" data-close aria-label="ปิด">' + ic('x') + '</button></div><div class="drawer-b" id="pdb"></div><div class="drawer-f" id="pdf"></div>');
  dr.querySelector('[data-close]').onclick = function () { closeDrawer(); };
  function sync() { $$('#pdb [data-k]').forEach(function (el) { v[el.dataset.k] = el.value; }); syncRefs($('#pdb'), v); }
  function cmpBar() {
    var c = v.compareId && v.compareId !== 'NONE' ? itemById(v.compareId) : null, r = +String(v.rate).replace(/,/g, '');
    if (!c) return v.compareId === 'NONE' ? '<div class="alert warn">ไม่มีรายการเทียบเคียงได้ กรุณาอธิบายเหตุผลและที่มาของอัตราที่เสนอในช่องด้านล่าง</div>' : '';
    var dl = r && c.rate ? r - c.rate : null;
    return '<div class="cmpbar"><div class="side"><span>เทียบเคียง ข้อ ' + esc(c.code) + '</span><b>' + fmt(c.rate) + '</b><span>' + esc(c.name.slice(0, 60)) + '</span></div><span class="delta" style="color:' + (dl > 0 ? 'var(--change)' : dl < 0 ? 'var(--cancel)' : 'var(--muted)') + '">' + (dl == null ? '—' : dl === 0 ? 'เท่ากัน' : (dl > 0 ? '+' : '−') + fmt(Math.abs(dl)) + ' (' + (dl > 0 ? '+' : '') + pct(dl, c.rate) + '%)') + '</span><div class="side" style="text-align:right"><span>อัตราที่เสนอ</span><b>' + (r ? fmt(r) : '–') + '</b><span>' + esc(v.unit || '') + '</span></div></div>';
  }
  function scale(k, label) { var x = v[k]; return '<div class="scale"><span>' + label + '</span><div class="seg" role="group" data-scale="' + k + '">' + [['lower', 'น้อยกว่า'], ['similar', 'ใกล้เคียง'], ['higher', 'มากกว่า']].map(function (o) { return '<button type="button" data-sv="' + o[0] + '" aria-pressed="' + (x === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div></div>'; }
  function draw() {
    var cats = S.boot.categories.filter(function (c) { return c.no !== 1; }), cmp = v.compareId && v.compareId !== 'NONE' ? itemById(v.compareId) : null;
    if (!editable) {
      $('#pdb').innerHTML = (p ? proposalView(p) : '') + (consOf(d, p.id) || lead ? '<section class="sect" id="pcons"></section>' : '');
      $('#pdf').innerHTML = '<span class="muted small grow">' + (locked(divId) ? 'ฝ่ายรับรองส่งแล้ว' : !writable(divId) ? esc(B().phaseTh) : 'แก้ไขได้เฉพาะผู้เสนอ ผู้ประสานงาน หรือหัวหน้าฝ่าย') + '</span><button class="btn" data-close2>ปิด</button>';
      $('[data-close2]').onclick = function () { closeDrawer(); };
      if ($('#pcons')) consensusPanel($('#pcons'), p.id, d, false, null, p);
      bindFileLinks($('#pdb'));
      return;
    }
    $('#pdb').innerHTML = '<div class="stack">' +
      (!p && lead ? '<label class="f" style="max-width:420px"><span>เสนอในนามของ</span><select class="in" id="pfor"><option value="">ตัวท่านเอง</option>' + (d.members || []).filter(function (x) { return x.emp !== m.user && !x.coord; }).map(function (x) { return '<option value="' + esc(x.emp) + '">' + esc(x.name) + '</option>'; }).join('') + '<option value="DIV">ในนามฝ่าย</option></select></label>' : '') +
      '<div class="grid2"><label class="f"><span>ชื่อหัตถการ (ภาษาอังกฤษ)</span><input class="in" data-k="nameEn" value="' + esc(v.nameEn) + '" placeholder="เช่น Continuous renal replacement therapy"></label><label class="f"><span>ชื่อหัตถการ (ภาษาไทย)</span><input class="in" data-k="nameTh" value="' + esc(v.nameTh) + '" placeholder="ถ้ามี"></label></div>' +
      '<label class="f"><span>รายการเดิมที่ใช้เทียบเคียง</span><div class="combo"><input class="in" id="cmpq" autocomplete="off" placeholder="พิมพ์ชื่อหรือเลขข้อ เช่น 9.18 หรือ Cholecystectomy" value="' + esc(cmp ? cmp.code + ' ' + cmp.name : v.compareId === 'NONE' ? 'ไม่มีรายการเทียบเคียงได้' : '') + '"><div class="combo-list" id="cmpl" hidden></div></div><small>เลือกรายการที่ลักษณะ ความซับซ้อน ระยะเวลา และความเสี่ยงใกล้เคียงที่สุด ระบบจะแสดงอัตราเทียบให้</small></label>' +
      '<div class="grid3"><label class="f"><span>อัตราที่เสนอ (บาท)</span><div class="in-pre"><b>฿</b><input class="in" data-k="rate" inputmode="decimal" value="' + esc(v.rate) + '"></div></label><label class="f"><span>หน่วย</span><input class="in" data-k="unit" value="' + esc(v.unit) + '" list="units"><datalist id="units"><option value="ต่อราย"><option value="ต่อราย (ตรวจรักษาครั้งแรก)"><option value="ต่อครั้ง"><option value="ต่อศพ"><option value="เหมาจ่ายทั้งทีม"></datalist></label>' +
      '<label class="f"><span>หมวดที่ควรอยู่</span><select class="in" data-k="catNo"><option value="">ตามรายการเทียบเคียง</option>' + cats.map(function (c) { return '<option value="' + c.no + '"' + (+v.catNo === c.no ? ' selected' : '') + '>' + catLabel(c.no) + '. ' + esc(c.name.replace(/\s*\(.*\)$/, '')) + '</option>'; }).join('') + '</select></label></div>' +
      '<div id="cmpbar">' + cmpBar() + '</div>' +
      '<div class="form-card"><span class="f-label">เทียบกับรายการเดิม หัตถการที่เสนอมี…</span>' + scale('cmpComplexity', 'ความซับซ้อน') + scale('cmpTime', 'ระยะเวลา') + scale('cmpRisk', 'ความเสี่ยง') +
      '<label class="f"><span>คำอธิบายการเทียบเคียง</span><textarea class="in" data-k="cmpNote" rows="3" placeholder="เช่น ขั้นตอนใกล้เคียง Hemodialysis แต่ต้องเฝ้าระวังต่อเนื่องและปรับยาตลอดเวร">' + esc(v.cmpNote) + '</textarea></label></div>' +
      '<label class="f"><span>ความถี่โดยประมาณนอกเวลาราชการ</span><input class="in" data-k="freq" value="' + esc(v.freq) + '" placeholder="เช่น 4 ครั้ง/เดือน" style="max-width:280px"></label>' +
      '<div class="form-card">' + refsEditor(v, divId).replace('class="reveal" style="border-top:1px dashed var(--line-2);padding-top:14px"', '') + '</div>' +
      '<label class="f"><span>หมายเหตุ</span><textarea class="in" data-k="note" rows="2">' + esc(v.note) + '</textarea></label><div id="perr"></div></div>' +
      (p && (lead || consOf(d, p.id)) ? '<section class="sect" id="pcons"></section>' : '');
    $('#pdf').innerHTML = '<button class="btn primary" id="psave">' + (p ? 'บันทึกการแก้ไข' : 'ส่งรายการเสนอ') + '</button><button class="btn" data-close2>ยกเลิก</button><span class="grow"></span>' + (p ? '<button class="btn ghost" id="pdel">' + ic('trash') + 'ถอนรายการ</button>' : '');
    $('[data-close2]').onclick = function () { closeDrawer(); };
    $$('[data-scale]').forEach(function (g) { $$('[data-sv]', g).forEach(function (b) { b.onclick = function () { sync(); v[g.dataset.scale] = v[g.dataset.scale] === b.dataset.sv ? '' : b.dataset.sv; draw(); }; }); });
    $('[data-k="rate"]').oninput = function () { v.rate = this.value; $('#cmpbar').innerHTML = cmpBar(); };
    $('[data-k="unit"]').oninput = function () { v.unit = this.value; $('#cmpbar').innerHTML = cmpBar(); };
    bindCombo(function (id) { sync(); v.compareId = id; var c = itemById(id); if (c && !v.catNo) v.catNo = ''; draw(); });
    bindRefs($('#pdb'), v, divId, sync, draw);
    if ($('#pcons')) consensusPanel($('#pcons'), p.id, d, lead && writable(divId), null, p);
    $('#psave').onclick = function () {
      sync(); var b = this; busy(b, true);
      var pl = { nameEn: v.nameEn, nameTh: v.nameTh, catNo: v.catNo, rate: v.rate, unit: v.unit, compareId: v.compareId, cmpComplexity: v.cmpComplexity, cmpTime: v.cmpTime, cmpRisk: v.cmpRisk, cmpNote: v.cmpNote, refText: v.refText, refHosp: v.refHosp, refRate: v.refRate, freq: v.freq, note: v.note, links: v.links.filter(function (l) { return l.url; }), files: v.files.map(function (f) { return f.id; }) };
      if (p) pl.id = p.id; else if ($('#pfor') && $('#pfor').value) { pl.forEmp = $('#pfor').value; pl.divId = divId; }
      apiW('saveProposal', pl).then(function (x) {
        d.proposals = d.proposals.filter(function (y) { return y.id !== x.id; }); d.proposals.push(x);
        toast(p ? 'บันทึกการแก้ไขแล้ว' : 'ส่งรายการเสนอแล้ว'); closeDrawer(true); if ($('#pbody')) drawProps(d); else route();
      }).catch(function (e) { busy(b, false); $('#perr').innerHTML = '<div class="alert err">' + ic('x') + '<span>' + esc(e.message) + '</span></div>'; $('#perr').scrollIntoView({ block: 'center', behavior: 'smooth' }); });
    };
    if ($('#pdel')) $('#pdel').onclick = function () {
      confirmBox('ถอนรายการเสนอนี้?', 'รายการจะไม่ถูกนำไปพิจารณา (ประวัติยังถูกเก็บไว้)', 'ถอนรายการ', true).then(function (y) {
        if (!y) return;
        apiW('saveProposal', { id: p.id, remove: true }).then(function () { d.proposals = d.proposals.filter(function (x) { return x.id !== p.id; }); toast('ถอนรายการแล้ว'); closeDrawer(true); if ($('#pbody')) drawProps(d); else route(); }).catch(function (e) { toast(e.message, true); });
      });
    };
  }
  draw();
}
function bindCombo(onPick) {
  var q = $('#cmpq'), l = $('#cmpl'), hl = -1, res = [];
  function show() {
    var s = q.value.trim().toLowerCase();
    res = S.boot.items.filter(function (i) { return i.cat !== 1 && (!s || (i.code + ' ' + i.name).toLowerCase().indexOf(s) >= 0); }).slice(0, 40);
    l.innerHTML = res.map(function (i, k) { return '<button type="button" data-i="' + k + '"' + (k === hl ? ' class="hl"' : '') + '><span class="c">' + esc(i.code) + '</span><span>' + esc(i.name) + '</span><span class="r">' + fmt(i.rate) + '</span></button>'; }).join('') +
      '<button type="button" data-i="none"><span class="c">–</span><span>ไม่มีรายการเทียบเคียงได้</span><span></span></button>';
    l.hidden = false;
    $$('[data-i]', l).forEach(function (b) { b.onmousedown = function (e) { e.preventDefault(); pick(b.dataset.i); }; });
  }
  function pick(k) { l.hidden = true; onPick(k === 'none' ? 'NONE' : res[+k].id); }
  q.onfocus = function () { q.select(); show(); }; q.oninput = function () { hl = -1; show(); };
  q.onblur = function () { setTimeout(function () { l.hidden = true; }, 120); };
  q.onkeydown = function (e) {
    if (e.key === 'ArrowDown') { hl = Math.min(hl + 1, res.length - 1); show(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { hl = Math.max(hl - 1, 0); show(); e.preventDefault(); }
    else if (e.key === 'Enter' && hl >= 0) { e.preventDefault(); pick(hl); }
  };
}
function proposalView(p) {
  var cmp = p.compareId && p.compareId !== 'NONE' ? itemById(p.compareId) : null, LV = { lower: 'น้อยกว่า', similar: 'ใกล้เคียง', higher: 'มากกว่า' };
  var dl = cmp && cmp.rate ? +p.rate - cmp.rate : null;
  return '<div class="ratebox"><div><span>อัตราที่เสนอ</span><b>' + fmt(p.rate) + ' <small style="font-size:15px;font-weight:500">บาท</small></b><span>' + esc(p.unit) + '</span></div><div><span>เทียบเคียง' + (cmp ? ' ข้อ ' + esc(cmp.code) : '') + '</span><b class="' + (dl > 0 ? 'up' : dl < 0 ? 'down' : '') + '">' + (cmp ? fmt(cmp.rate) : '–') + '</b><span>' + (cmp ? esc(cmp.name.slice(0, 70)) : 'ไม่มีรายการเทียบเคียงได้') + '</span></div></div>' +
    '<dl class="kv">' + (p.nameTh ? '<dt>ชื่อภาษาไทย</dt><dd>' + esc(p.nameTh) + '</dd>' : '') + (p.catNo ? '<dt>หมวด</dt><dd>' + esc(catLabel(p.catNo)) + ' ' + esc((catByNo(p.catNo) || {}).name || '') + '</dd>' : '') +
    '<dt>เทียบความยาก</dt><dd>ซับซ้อน' + (LV[p.cmpComplexity] || '–') + ' · เวลา' + (LV[p.cmpTime] || '–') + ' · ความเสี่ยง' + (LV[p.cmpRisk] || '–') + '</dd>' + (p.cmpNote ? '<dt>คำอธิบาย</dt><dd>' + esc(p.cmpNote) + '</dd>' : '') +
    (p.freq ? '<dt>ความถี่</dt><dd>' + esc(p.freq) + '</dd>' : '') + (p.refText || p.refHosp ? '<dt>อ้างอิง</dt><dd>' + esc([p.refText, p.refHosp, p.refRate !== '' ? baht(p.refRate) : ''].filter(Boolean).join(' · ')) + '</dd>' : '') +
    (p.note ? '<dt>หมายเหตุ</dt><dd>' + esc(p.note) + '</dd>' : '') + '<dt>ผู้เสนอ</dt><dd>' + esc(p.empName) + (p.byName ? ' <span class="proxy">กรอกแทนโดย ' + esc(p.byName) + '</span>' : '') + ' · ' + esc(thDT(p.updatedAt)) + '</dd></dl>' +
    ((p.links || []).length || (p.files || []).length ? '<div class="files" style="margin-top:12px">' + (p.links || []).map(function (l) { return '<a class="file" href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' + ic('link') + '<span class="nm">' + esc(l.label || l.url) + '</span></a>'; }).join('') + (p.files || []).map(function (f) { return '<span class="file">' + ic('file') + '<a data-file="' + esc(f.id) + '" class="nm">' + esc(f.name) + '</a></span>'; }).join('') + '</div>' : '');
}
