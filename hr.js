/* hr.js — สำหรับฝ่ายทรัพยากรบุคคลและผู้บริหาร: ภาพรวมทุกฝ่าย · ผลพิจารณา (รอบ 2) · ส่งออก Excel / ร่างเอกสารแนบท้ายคำสั่ง (Word) */
'use strict';
var DEC = { f: 'todo', q: '' };

/* ---------- ภาพรวม ---------- */
function pageOverview() {
  if (!me().viewAll) { location.hash = '#/home'; return; }
  shell('<div class="page-head"><div><h1>ภาพรวมทุกฝ่าย</h1><p>ความคืบหน้าการให้ความเห็นและการรับรองส่งของแต่ละฝ่าย แตะชื่อฝ่ายเพื่อดูรายละเอียด</p></div><div class="act" id="ovact"></div></div><div id="ovbody">' + loadingHtml() + '</div>', 'ภาพรวม');
  api('overview').then(function (o) {
    var divs = S.boot.divisions.filter(function (d) { return d.active; }), st = {}; o.divisions.forEach(function (x) { st[x.id] = x; });
    var req = divs.filter(function (d) { return d.required; }), sub = function (id) { var s = S.boot.subs[id + '|1']; return s && s.status === 'submitted'; };
    var tot = o.divisions.reduce(function (a, x) { a.p += x.participants; a.o += x.opinions; a.r += x.proposals; a.l += x.logged; return a; }, { p: 0, o: 0, r: 0, l: 0 });
    var html = '<div class="stats"><div><b>' + req.filter(function (d) { return sub(d.id); }).length + ' <small class="muted" style="font-size:16px">/ ' + req.length + '</small></b><span>ฝ่ายตามหนังสือเวียนที่รับรองส่งแล้ว</span></div><div><b>' + tot.p + '</b><span>แพทย์ที่ร่วมให้ความเห็น (เข้าระบบ ' + tot.l + ')</span></div><div><b>' + tot.o + '</b><span>ความเห็นต่อรายการเดิม</span></div><div><b>' + tot.r + '</b><span>รายการเสนอเพิ่ม</span></div></div>';
    function table(list, title) {
      return '<h2 style="font-size:18px;margin:26px 0 10px">' + title + '</h2><div class="tbl-wrap"><table class="tbl"><thead><tr>' + (me().isAdmin ? '<th><span class="sr">เลือก</span></th>' : '') + '<th>ฝ่าย</th><th>สถานะ</th><th class="r">แพทย์ร่วม</th><th class="r">ความเห็น</th><th class="r">เปลี่ยน/ยกเลิก</th><th class="r">เสนอเพิ่ม</th><th>สรุปหมวดของฝ่าย</th><th>ล่าสุด</th></tr></thead><tbody>' +
        list.map(function (d) {
          var x = st[d.id] || {}, s = S.boot.subs[d.id + '|1'];
          return '<tr class="click" data-div="' + d.id + '">' + (me().isAdmin ? '<td onclick="event.stopPropagation()"><input type="checkbox" class="pick" value="' + d.id + '"' + (sub(d.id) ? ' disabled' : '') + ' aria-label="เลือก ' + esc(d.short) + '"></td>' : '') + '<td><b>' + esc(d.name) + '</b><div class="small muted">' + esc(d.headName || 'ยังไม่ระบุหัวหน้า') + '</div></td>' +
            '<td>' + (s && s.status === 'submitted' ? '<span class="st ok">รับรองส่งแล้ว</span><div class="tiny muted">' + esc(thDT(s.at)) + '</div>' : s && s.status === 'reopened' ? '<span class="st change">เปิดให้แก้ไข</span>' : '<span class="st none">ยังไม่ส่ง</span>') + '</td>' +
            '<td class="r">' + (x.participants || 0) + '<span class="faint"> / ' + (x.members || 0) + '</span></td><td class="r">' + (x.opinions || 0) + '</td><td class="r">' + ((x.changes || 0) + (x.cancels || 0)) + '</td><td class="r">' + (x.proposals || 0) + '</td>' +
            '<td>' + (x.owned ? '<div class="prog"><div class="meter' + (x.decided >= x.owned ? ' ok' : '') + '"><i style="width:' + pct(x.decided, x.owned) + '%"></i></div><span class="small nowrap">' + x.decided + '/' + x.owned + '</span></div>' : '<span class="faint small">ไม่มีหมวดเฉพาะ</span>') + '</td><td class="small nowrap">' + (x.last ? esc(ago(x.last)) : '–') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    html += table(req, 'ฝ่ายที่ได้รับหนังสือเวียน (' + req.length + ' ฝ่าย)') + table(divs.filter(function (d) { return !d.required; }), 'ฝ่ายอื่นที่ร่วมเสนอได้');
    html += '<p class="faint small" style="margin-top:10px">ข้อมูล ณ ' + esc(thDT(o.at)) + '</p>';
    $('#ovbody').innerHTML = html;
    $$('[data-div]').forEach(function (r) { r.onclick = function () { location.hash = '#/division/' + r.dataset.div; }; });
    if (me().isAdmin) {
      $('#ovact').innerHTML = '<button class="btn" id="annc">' + ic('mail') + 'ส่งอีเมลประกาศ</button><button class="btn danger" id="remind">' + ic('mail') + 'ส่งเตือนฝ่ายที่ยังไม่ส่ง</button>';
      $('#annc').onclick = function () { mailAction('mailAnnounce', 'ส่งอีเมลประกาศเปิดระบบ', 'ส่งถึงหัวหน้าฝ่าย/ผู้รับมอบทุกฝ่าย (หรือเฉพาะฝ่ายที่เลือก) พร้อมลิงก์เข้าระบบและกำหนดวัน', this); };
      $('#remind').onclick = function () { mailAction('mailRemind', 'ส่งอีเมลเตือน', 'ส่งถึงหัวหน้าฝ่ายที่ยังไม่รับรองส่ง (ฝ่ายตามหนังสือเวียน และฝ่ายอื่นที่มีความเห็นแล้ว) หรือเฉพาะฝ่ายที่เลือก', this); };
    }
  }).catch(function (e) { $('#ovbody').innerHTML = errorHtml(e.message); });
}
function mailAction(action, title, text, btn) {
  var picked = $$('.pick:checked').map(function (x) { return x.value; });
  confirmBox(title + '?', text + (picked.length ? '<br><br>เฉพาะ ' + picked.length + ' ฝ่ายที่เลือก: ' + picked.map(function (x) { return esc(divName(x, true)); }).join(', ') : ''), 'ส่งอีเมล').then(function (y) {
    if (!y) return; busy(btn, true);
    apiW(action, { divIds: picked }).then(function (r) { busy(btn, false); toast('ส่งแล้ว ' + r.sent + ' ฉบับ' + (r.skipped && r.skipped.length ? ' · ไม่มีอีเมล: ' + r.skipped.join(', ') : '')); }).catch(function (e) { busy(btn, false); toast(e.message, true); });
  });
}

/* ---------- ข้อมูลรวม (ใช้ทั้งหน้าผลพิจารณาและส่งออก) ---------- */
function loadAll(force) { if (S.all && !force) return Promise.resolve(S.all); return api('exportAll').then(function (x) { S.all = x; return x; }); }
function refsAll(X) {
  var by = {};
  function g(ref) { return by[ref] || (by[ref] = { ref: ref, ops: [], cons: [], dec: null }); }
  X.opinions.forEach(function (o) { g(o.itemId).ops.push(o); });
  X.consensus.forEach(function (c) { g(c.ref).cons.push(c); });
  X.decisions.forEach(function (d) { g(d.ref).dec = d; });
  X.proposals.forEach(function (p) { g(p.id).prop = p; });
  return by;
}
function needsDecision(r) { if (r.prop) return true; return r.cons.some(function (c) { return c.decision !== 'keep'; }) || r.ops.some(function (o) { return o.status !== 'keep'; }); }

/* ---------- ผลพิจารณา ---------- */
function pageDecisions(q) {
  if (!me().viewAll) { location.hash = '#/home'; return; }
  shell('<div class="page-head"><div><h1>ผลพิจารณา</h1><p>ฝ่ายทรัพยากรบุคคลและผู้บริหารลงผลพิจารณารายการที่มีข้อเสนอเปลี่ยนแปลง ยกเลิก หรือเสนอเพิ่ม ผลนี้ใช้สร้างร่างเอกสารแนบท้ายคำสั่งฉบับใหม่ และส่งให้ฝ่ายยืนยันในรอบ 2</p></div><div class="act"><button class="btn" id="decref">' + ic('hist') + 'โหลดข้อมูลล่าสุด</button></div></div><div id="decbody">' + loadingHtml() + '</div>', 'ผลพิจารณา');
  $('#decref').onclick = function () { $('#decbody').innerHTML = loadingHtml(); loadAll(true).then(drawDecisions); };
  loadAll(true).then(drawDecisions).catch(function (e) { $('#decbody').innerHTML = errorHtml(e.message); });
}
function drawDecisions(X) {
  var by = refsAll(X), L = S.boot.labels;
  var list = Object.keys(by).map(function (k) { return by[k]; }).filter(needsDecision);
  var done = list.filter(function (r) { return r.dec && r.dec.status; }).length;
  var view = list.filter(function (r) {
    if (DEC.f === 'todo' && r.dec && r.dec.status) return false;
    if (DEC.f === 'done' && !(r.dec && r.dec.status)) return false;
    if (DEC.f === 'new' && !r.prop) return false;
    if (DEC.f === 'old' && r.prop) return false;
    if (DEC.q) { var it = itemById(r.ref), t = it ? it.code + ' ' + it.name : (r.prop.nameEn + ' ' + r.prop.nameTh); if (t.toLowerCase().indexOf(DEC.q.toLowerCase()) < 0) return false; }
    return true;
  }).sort(function (a, b) { var x = itemById(a.ref), y = itemById(b.ref); return (x ? x.order : 9e3) - (y ? y.order : 9e3); });
  var html = '<div class="stats" style="grid-template-columns:repeat(3,1fr)"><div><b>' + list.length + '</b><span>รายการที่ต้องพิจารณา</span></div><div><b>' + done + '</b><span>ลงผลแล้ว</span></div><div><b>' + (list.length - done) + '</b><span>คงเหลือ</span></div></div>' +
    '<div class="toolbar" style="margin-top:18px"><label class="search"><span class="sr">ค้นหา</span>' + ic('search') + '<input class="in" id="dq" placeholder="ค้นหารายการ" value="' + esc(DEC.q) + '"></label><div class="chips">' + [['todo', 'ยังไม่ลงผล'], ['done', 'ลงผลแล้ว'], ['old', 'รายการเดิม'], ['new', 'เสนอเพิ่ม'], ['all', 'ทั้งหมด']].map(function (f) { return '<button class="chip" data-df="' + f[0] + '" aria-pressed="' + (DEC.f === f[0]) + '">' + f[1] + '</button>'; }).join('') + '</div></div>' +
    (view.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>ข้อ</th><th>รายการ</th><th class="r">อัตราเดิม</th><th>ความเห็นแพทย์</th><th>ข้อสรุปของฝ่าย</th><th>ผลพิจารณา</th></tr></thead><tbody>' + view.map(function (r) {
      var it = itemById(r.ref), p = r.prop, t = { keep: 0, change: 0, cancel: 0 }; r.ops.forEach(function (o) { t[o.status]++; });
      return '<tr class="click" data-ref="' + esc(r.ref) + '"><td class="nowrap"><b>' + (it ? esc(it.code) : 'ใหม่') + '</b></td><td>' + (it ? esc(it.name.slice(0, 110)) : '<b>' + esc(p.nameEn || p.nameTh) + '</b><div class="small muted">' + esc(divName(p.divId, true)) + ' · ' + esc(p.empName) + '</div>') + '</td>' +
        '<td class="r nowrap">' + (it ? fmt(it.rate) : '<span class="muted">เสนอ</span> ' + fmt(p.rate)) + '</td><td><div class="tally">' + (it ? ['change', 'cancel', 'keep'].filter(function (k) { return t[k]; }).map(function (k) { return stChip(k, L.status[k] + ' ' + t[k]); }).join('') : '') + '</div></td>' +
        '<td><div class="tally">' + (r.cons.map(function (c) { return stChip(c.decision, divName(c.divId, true) + ': ' + (L.status[c.decision] || L.pdec[c.decision]) + (c.newRate !== '' ? ' ' + fmt(c.newRate) : '')); }).join('') || '<span class="faint small">–</span>') + '</div></td>' +
        '<td>' + (r.dec && r.dec.status ? stChip(r.dec.status, L.final[r.dec.status] + (r.dec.finalRate !== '' ? ' ' + fmt(r.dec.finalRate) : '')) : '<span class="st none">ยังไม่ลงผล</span>') + '</td></tr>';
    }).join('') + '</tbody></table></div>' : '<div class="panel"><div class="empty"><h3>ไม่มีรายการในมุมมองนี้</h3><p>' + (list.length ? 'ลองเปลี่ยนตัวกรอง' : 'ยังไม่มีข้อเสนอเปลี่ยนแปลงหรือเสนอเพิ่มจากฝ่ายใด') + '</p></div></div>');
  $('#decbody').innerHTML = html;
  $$('[data-df]').forEach(function (b) { b.onclick = function () { DEC.f = b.dataset.df; drawDecisions(X); }; });
  $('#dq').oninput = debounce(function () { DEC.q = this.value.trim(); drawDecisions(X); var i = $('#dq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250);
  $$('[data-ref]').forEach(function (r) { r.onclick = function () { openDecision(by[r.dataset.ref], X); }; });
}
function openDecision(r, X) {
  var it = itemById(r.ref), p = r.prop, L = S.boot.labels, dec = r.dec || {};
  var opts = p ? ['add', 'reject', 'defer'] : (it.cat === 1 ? ['keep', 'change', 'defer'] : ['keep', 'change', 'cancel', 'defer']);
  var v = { status: dec.status || '', finalName: dec.finalName || '', finalRate: dec.finalRate != null && dec.finalRate !== '' ? dec.finalRate : '', finalUnit: dec.finalUnit || '', finalCat: dec.finalCat || (p ? p.catNo : ''), note: dec.note || '' };
  var dr = openDrawer('<div class="drawer-h"><span class="code">' + (it ? esc(it.code) : 'ใหม่') + '</span><div class="grow"><h2>' + esc(it ? it.name : (p.nameEn || p.nameTh)) + '</h2><div class="meta">' + (it ? '<span class="tag">อัตราเดิม ' + baht(it.rate) + ' ' + esc(it.unit) + '</span><span class="tag">คำสั่ง ' + esc(it.cmd) + '</span>' : '<span class="tag">เสนอโดย ' + esc(p.empName) + ' · ' + esc(divName(p.divId, true)) + '</span>') + '</div></div><button class="btn ghost sm" data-close aria-label="ปิด">' + ic('x') + '</button></div><div class="drawer-b" id="ddb"></div><div class="drawer-f" id="ddf"></div>');
  dr.querySelector('[data-close]').onclick = function () { closeDrawer(true); };
  var users = X.users;
  function body() {
    var html = '';
    if (p) html += proposalView(p);
    html += '<section class="sect"><h3>ข้อสรุปของฝ่าย<span class="muted">' + r.cons.length + ' ฝ่าย</span></h3>' + (r.cons.length ? '<div class="panel"><div class="panel-b" style="padding-top:4px;padding-bottom:4px">' + r.cons.map(function (c) {
      return '<div class="op"><span class="avatar">' + esc(initials(divName(c.divId, true))) + '</span><div><div class="h"><b>' + esc(divName(c.divId)) + '</b>' + stChip(c.decision) + '<span class="faint small">' + esc(c.byName) + ' · ' + esc(thDT(c.at)) + '</span></div><div class="b">' + (c.newName ? '<p><span class="lbl">ชื่อ/ถ้อยคำ:</span> ' + esc(c.newName) + '</p>' : '') + (c.newRate !== '' ? '<p><span class="lbl">อัตรา:</span> <b>' + baht(c.newRate) + '</b> ' + esc(c.newUnit || '') + '</p>' : '') + (c.reason ? '<p><span class="lbl">เหตุผล:</span> ' + esc(c.reason) + '</p>' : '') + '</div></div></div>';
    }).join('') + '</div></div>' : '<p class="muted">ยังไม่มีฝ่ายสรุป</p>') + '</section>';
    if (r.ops.length) html += '<section class="sect"><h3>ความเห็นรายบุคคล<span class="muted">' + r.ops.length + ' ความเห็น</span></h3><div class="panel"><div class="panel-b" style="padding-top:4px;padding-bottom:4px">' + r.ops.map(function (o) { return opView(o).replace('<b>' + esc(o.empName) + '</b>', '<b>' + esc(o.empName) + '</b><span class="tag">' + esc(divName(o.divId, true)) + '</span>'); }).join('') + '</div></div></section>';
    html += '<section class="sect"><h3>ผลพิจารณา' + (dec.status ? '<span class="muted">ล่าสุดโดย ' + esc(dec.byName) + ' · ' + esc(thDT(dec.at)) + '</span>' : '') + '</h3><div class="form-card">' +
      '<div class="seg big" role="group">' + opts.map(function (k) { return '<button type="button" data-v="' + k + '" aria-pressed="' + (v.status === k) + '">' + L.final[k] + '</button>'; }).join('') + '</div>' +
      (v.status === 'change' || v.status === 'add' ? '<label class="f reveal"><span>' + (it && it.cat === 1 ? 'ถ้อยคำหลักเกณฑ์ฉบับใหม่' : 'ชื่อรายการในคำสั่งใหม่') + '</span><textarea class="in" data-k="finalName" rows="2">' + esc(v.finalName || (it ? it.name : (p.nameEn + (p.nameTh ? ' (' + p.nameTh + ')' : '')))) + '</textarea></label>' +
        (it && it.cat === 1 ? '' : '<div class="grid3 reveal"><label class="f"><span>อัตราใหม่ (บาท)</span><div class="in-pre"><b>฿</b><input class="in" data-k="finalRate" inputmode="decimal" value="' + esc(v.finalRate !== '' ? v.finalRate : it ? it.rate : p.rate) + '"></div></label><label class="f"><span>หน่วย</span><input class="in" data-k="finalUnit" value="' + esc(v.finalUnit || (it ? it.unit : p.unit)) + '"></label>' +
          (p ? '<label class="f"><span>หมวดในคำสั่งใหม่</span><select class="in" data-k="finalCat">' + S.boot.categories.filter(function (c) { return c.no !== 1; }).map(function (c) { return '<option value="' + c.no + '"' + (+v.finalCat === c.no ? ' selected' : '') + '>' + catLabel(c.no) + '. ' + esc(c.name.replace(/\s*\(.*\)$/, '')) + '</option>'; }).join('') + '</select></label>' : '') + '</div>') : '') +
      '<label class="f"><span>หมายเหตุ / เหตุผลการพิจารณา</span><textarea class="in" data-k="note" rows="2">' + esc(v.note) + '</textarea></label><div id="derr"></div></div></section>';
    $('#ddb').innerHTML = html; bindFileLinks($('#ddb'));
    $$('#ddb [data-v]').forEach(function (b) { b.onclick = function () { sync(); v.status = b.dataset.v; body(); }; });
  }
  function sync() { $$('#ddb [data-k]').forEach(function (x) { v[x.dataset.k] = x.value; }); }
  body();
  $('#ddf').innerHTML = '<button class="btn primary" id="dsave">บันทึกผลพิจารณา</button>' + (dec.status ? '<button class="btn ghost" id="dclr">ล้างผลพิจารณา</button>' : '') + '<span class="grow"></span><button class="btn" data-close2>ปิด</button>';
  $('[data-close2]').onclick = function () { closeDrawer(true); };
  function save(clear, b) {
    sync(); if (!clear && !v.status) { $('#derr').innerHTML = '<div class="alert err">กรุณาเลือกผลพิจารณา</div>'; return; }
    busy(b, true);
    apiW('saveDecision', clear ? { ref: r.ref, status: '' } : { ref: r.ref, status: v.status, finalName: v.finalName, finalRate: v.finalRate, finalUnit: v.finalUnit, finalCat: v.finalCat, note: v.note }).then(function (x) {
      X.decisions = X.decisions.filter(function (y) { return y.ref !== r.ref; }); if (x.status) X.decisions.push(x);
      toast(clear ? 'ล้างผลพิจารณาแล้ว' : 'บันทึกผลพิจารณาแล้ว'); closeDrawer(true); drawDecisions(X);
    }).catch(function (e) { busy(b, false); $('#derr').innerHTML = '<div class="alert err">' + esc(e.message) + '</div>'; });
  }
  $('#dsave').onclick = function () { save(false, this); };
  if ($('#dclr')) $('#dclr').onclick = function () { save(true, this); };
}

/* ---------- ส่งออก ---------- */
function pageExport() {
  if (!me().viewAll) { location.hash = '#/home'; return; }
  shell('<div class="page-head"><div><h1>ส่งออกรายงาน</h1><p>ทุกไฟล์ระบุวันเวลาที่ส่งออก ข้อมูลมาจากระบบ ณ เวลาที่กด</p></div></div>' +
    '<div class="panel"><div class="panel-h"><div class="grow"><h2>สมุดงาน Excel รวมทุกฝ่าย</h2><p>สรุปรายการเดิม (รูปแบบเดียวกับไฟล์เวียนเดิม) · ความเห็นรายบุคคลพร้อมชื่อผู้เสนอและเวลา · รายการเสนอเพิ่ม · ข้อสรุปของฝ่าย · ตารางเทียบอัตรา · สถานะการรับรองส่ง · ผลพิจารณา</p></div><button class="btn primary" id="xlsx">' + ic('download') + 'ดาวน์โหลด Excel</button></div></div>' +
    '<div class="panel"><div class="panel-h"><div class="grow"><h2>ร่างเอกสารแนบท้ายคำสั่ง (Word)</h2><p>สร้างจากผลพิจารณา: รายการคงเดิม/แก้ไข/เพิ่มใหม่เรียงตามหมวด รายการที่ยกเลิกแยกไว้ท้ายเอกสาร รายการที่ยังไม่ลงผลใช้ข้อความเดิม</p></div><div class="row wrap"><label class="check small"><input type="checkbox" id="mark" checked> แสดงเครื่องหมายรายการแก้ไข/เพิ่มใหม่</label><button class="btn primary" id="docx">' + ic('download') + 'ดาวน์โหลดร่าง Word</button></div></div></div>' +
    '<div class="panel"><div class="panel-h"><div class="grow"><h2>ตารางเทียบอัตรา (พิมพ์)</h2><p>อัตราเดิม · อัตราที่แพทย์เสนอ (ต่ำสุด–สูงสุด) · ข้อสรุปของฝ่าย · ผลพิจารณา สำหรับนำเข้าที่ประชุม</p></div><button class="btn" id="cmpp">' + ic('print') + 'เปิดหน้าพิมพ์</button></div></div>', 'ส่งออก');
  $('#xlsx').onclick = function () { var b = this; busy(b, true); b.dataset.busy = 'กำลังสร้างไฟล์…'; Promise.all([loadAll(true), loadXlsx()]).then(function (r) { exportXlsx(r[0]); busy(b, false); }).catch(function (e) { busy(b, false); toast(e.message, true); }); };
  $('#docx').onclick = function () { var b = this; busy(b, true); loadAll(true).then(function (X) { exportWord(X, $('#mark').checked); busy(b, false); }).catch(function (e) { busy(b, false); toast(e.message, true); }); };
  $('#cmpp').onclick = function () { var b = this; busy(b, true); loadAll(true).then(function (X) { printCompare(X); busy(b, false); }).catch(function (e) { busy(b, false); toast(e.message, true); }); };
}
function loadXlsx() {
  if (window.XLSX) return Promise.resolve();
  return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = res; s.onerror = function () { rej(new Error('โหลดตัวสร้าง Excel ไม่สำเร็จ ตรวจสอบอินเทอร์เน็ต')); }; document.head.appendChild(s); });
}
function stamp() { var d = new Date(Date.now() + 7 * 3600e3).toISOString(); return { iso: d.slice(0, 16).replace('T', ' '), file: d.slice(0, 16).replace(/[-:]/g, '').replace('T', '-') }; }
function statsOf(list) { var a = list.slice().sort(function (x, y) { return x - y; }); if (!a.length) return null; return { min: a[0], max: a[a.length - 1], med: a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2, n: a.length }; }
function exportXlsx(X) {
  var L = S.boot.labels, st = stamp(), by = refsAll(X), U = X.users, wb = XLSX.utils.book_new();
  var ownerDiv = function (cat) { var c = catByNo(cat); return c && c.owners[0] !== 'ALL' ? c.owners : []; };
  var head = [['ส่งออกจาก SOMDEJ CORE เมื่อ ' + st.iso + ' น. · ' + (S.boot.settings.roundName || '')], []];
  function sheet(name, rows, widths) { var ws = XLSX.utils.aoa_to_sheet(head.concat(rows)); ws['!cols'] = (widths || []).map(function (w) { return { wch: w }; }); XLSX.utils.book_append_sheet(wb, ws, name); }
  // 1 สรุปรายการเดิม (รูปแบบไฟล์เวียนเดิม + ผล)
  var r1 = [['ลำดับ', 'หมวดที่', 'หมวดหัตถการ', 'ข้อที่', 'รายการหัตถการ', 'อัตราค่าตอบแทน (บาท)', 'หน่วย', 'อ้างอิงคำสั่ง', 'แพทย์: คงเดิม', 'แพทย์: เปลี่ยนแปลง', 'แพทย์: ยกเลิก', 'อัตราที่แพทย์เสนอ (ต่ำสุด)', 'อัตราที่แพทย์เสนอ (สูงสุด)', 'ข้อสรุปฝ่ายเจ้าของหมวด', 'แก้ไขเป็น (ชื่อ)', 'แก้ไขเป็น (อัตรา)', 'ข้อสรุปฝ่ายอื่น', 'ผลพิจารณา', 'ชื่อในคำสั่งใหม่', 'อัตราใหม่', 'หมายเหตุผลพิจารณา']];
  S.boot.items.forEach(function (i, k) {
    var r = by[i.id] || { ops: [], cons: [] }, t = { keep: 0, change: 0, cancel: 0 }; r.ops.forEach(function (o) { t[o.status]++; });
    var rs = statsOf(r.ops.filter(function (o) { return o.newRate !== ''; }).map(function (o) { return +o.newRate; })), own = ownerDiv(i.cat);
    var oc = r.cons.filter(function (c) { return own.indexOf(c.divId) >= 0; })[0], other = r.cons.filter(function (c) { return own.indexOf(c.divId) < 0; });
    r1.push([k + 1, catLabel(i.cat), (catByNo(i.cat) || {}).name, i.code, i.name, i.rate, i.unit, i.cmd, t.keep || '', t.change || '', t.cancel || '', rs ? rs.min : '', rs ? rs.max : '', oc ? L.status[oc.decision] : '', oc ? oc.newName : '', oc && oc.newRate !== '' ? +oc.newRate : '',
      other.map(function (c) { return divName(c.divId, true) + ': ' + L.status[c.decision] + (c.newRate !== '' ? ' ' + c.newRate : ''); }).join(' | '), r.dec ? L.final[r.dec.status] : '', r.dec ? r.dec.finalName : '', r.dec && r.dec.finalRate !== '' ? +r.dec.finalRate : '', r.dec ? r.dec.note : '']);
  });
  sheet('สรุปรายการเดิม', r1, [6, 6, 30, 8, 60, 10, 14, 12, 8, 8, 8, 10, 10, 14, 30, 10, 30, 12, 30, 10, 30]);
  // 2 ความเห็นรายบุคคล
  var r2 = [['ฝ่าย', 'หมวด', 'ข้อ', 'รายการ', 'อัตราเดิม', 'รหัสแพทย์', 'ชื่อแพทย์', 'ความเห็น', 'สิ่งที่เปลี่ยน', 'ชื่อ/ถ้อยคำที่เสนอ', 'ขอบเขตที่เสนอ', 'อัตราที่เสนอ', 'หน่วย', 'เหตุผล', 'ระเบียบ/เอกสารอ้างอิง', 'โรงพยาบาลที่เทียบเคียง', 'อัตราที่เทียบเคียง', 'ลิงก์', 'ไฟล์แนบ', 'กรอกแทนโดย', 'บันทึกครั้งแรก', 'แก้ไขล่าสุด']];
  X.opinions.slice().sort(function (a, b) { return divName(a.divId).localeCompare(divName(b.divId), 'th') || ((itemById(a.itemId) || {}).order - (itemById(b.itemId) || {}).order); }).forEach(function (o) {
    var i = itemById(o.itemId) || {};
    r2.push([divName(o.divId), catLabel(i.cat), i.code, i.name, i.rate, o.emp === 'DIV' ? '' : o.emp, o.empName, L.status[o.status], o.changes.map(function (c) { return L.change[c]; }).join(', '), o.newName, o.newScope, o.newRate !== '' ? +o.newRate : '', o.newUnit, o.reason, o.refText, o.refHosp, o.refRate !== '' ? +o.refRate : '', (o.links || []).map(function (l) { return l.url; }).join('\n'), (o.files || []).map(function (f) { return f.name; }).join(', '), o.byName, o.createdAt, o.updatedAt]);
  });
  sheet('ความเห็นรายบุคคล', r2, [22, 6, 8, 50, 10, 10, 26, 10, 18, 30, 30, 10, 10, 40, 30, 20, 10, 30, 20, 22, 18, 18]);
  // 3 เสนอเพิ่ม
  var LV = { lower: 'น้อยกว่า', similar: 'ใกล้เคียง', higher: 'มากกว่า' };
  var r3 = [['ฝ่าย', 'ชื่อหัตถการ (EN)', 'ชื่อหัตถการ (TH)', 'หมวดที่เสนอ', 'อัตราที่เสนอ', 'หน่วย', 'เทียบเคียงข้อ', 'รายการเทียบเคียง', 'อัตราเทียบเคียง', 'ส่วนต่าง', 'ความซับซ้อน', 'ระยะเวลา', 'ความเสี่ยง', 'คำอธิบายการเทียบเคียง', 'ความถี่', 'ระเบียบ/เอกสารอ้างอิง', 'โรงพยาบาลที่เทียบเคียง', 'อัตราที่เทียบเคียง', 'ลิงก์', 'ไฟล์แนบ', 'หมายเหตุ', 'รหัสผู้เสนอ', 'ผู้เสนอ', 'กรอกแทนโดย', 'ข้อสรุปฝ่าย', 'อัตราที่ฝ่ายเสนอ', 'ผลพิจารณา', 'อัตราใหม่', 'เสนอเมื่อ', 'แก้ไขล่าสุด']];
  X.proposals.forEach(function (p) {
    var c = p.compareId && p.compareId !== 'NONE' ? itemById(p.compareId) : null, r = by[p.id] || { cons: [] }, cs = r.cons[0];
    r3.push([divName(p.divId), p.nameEn, p.nameTh, p.catNo ? catLabel(p.catNo) : '', +p.rate, p.unit, c ? c.code : 'ไม่มี', c ? c.name : '', c ? c.rate : '', c && c.rate ? +p.rate - c.rate : '', LV[p.cmpComplexity] || '', LV[p.cmpTime] || '', LV[p.cmpRisk] || '', p.cmpNote, p.freq, p.refText, p.refHosp, p.refRate !== '' ? +p.refRate : '', (p.links || []).map(function (l) { return l.url; }).join('\n'), (p.files || []).map(function (f) { return f.name; }).join(', '), p.note, p.emp === 'DIV' ? '' : p.emp, p.empName, p.byName, cs ? L.pdec[cs.decision] : '', cs && cs.newRate !== '' ? +cs.newRate : '', r.dec ? L.final[r.dec.status] : '', r.dec && r.dec.finalRate !== '' ? +r.dec.finalRate : '', p.createdAt, p.updatedAt]);
  });
  sheet('เสนอเพิ่ม', r3, [22, 36, 30, 8, 10, 10, 8, 40, 10, 10, 10, 10, 10, 40, 14, 30, 20, 10, 30, 20, 30, 10, 24, 22, 16, 10, 12, 10, 18, 18]);
  // 4 ข้อสรุปของฝ่าย
  var r4 = [['ฝ่าย', 'ข้อ', 'รายการ', 'อัตราเดิม', 'ข้อสรุป', 'ชื่อ/ถ้อยคำที่ฝ่ายเสนอ', 'อัตราที่ฝ่ายเสนอ', 'หน่วย', 'เหตุผล', 'สรุปโดย', 'เวลา']];
  X.consensus.forEach(function (c) {
    var i = itemById(c.ref), p = i ? null : X.proposals.filter(function (x) { return x.id === c.ref; })[0];
    r4.push([divName(c.divId), i ? i.code : 'เสนอเพิ่ม', i ? i.name : p ? (p.nameEn || p.nameTh) : c.ref, i ? i.rate : p ? +p.rate : '', L.status[c.decision] || L.pdec[c.decision], c.newName, c.newRate !== '' ? +c.newRate : '', c.newUnit, c.reason, c.byName, c.at]);
  });
  sheet('ข้อสรุปของฝ่าย', r4, [22, 8, 50, 10, 14, 30, 10, 10, 40, 22, 18]);
  // 5 เทียบอัตรา
  var r5 = [['ข้อ', 'รายการ', 'อัตราเดิม', 'จำนวนความเห็นเสนออัตรา', 'แพทย์เสนอต่ำสุด', 'แพทย์เสนอสูงสุด', 'มัธยฐาน', 'ฝ่ายเสนอ', 'ผลพิจารณา', 'อัตราใหม่', 'เปลี่ยนแปลง (%)']];
  Object.keys(by).map(function (k) { return by[k]; }).filter(needsDecision).forEach(function (r) {
    var i = itemById(r.ref), p = r.prop, rs = statsOf(r.ops.filter(function (o) { return o.newRate !== ''; }).map(function (o) { return +o.newRate; })), base = i ? i.rate : null, fr = r.dec && r.dec.finalRate !== '' ? +r.dec.finalRate : '';
    r5.push([i ? i.code : 'ใหม่', i ? i.name : (p.nameEn || p.nameTh), base == null ? '' : base, rs ? rs.n : (p ? 1 : 0), rs ? rs.min : p ? +p.rate : '', rs ? rs.max : p ? +p.rate : '', rs ? rs.med : '', r.cons.map(function (c) { return divName(c.divId, true) + ' ' + (c.newRate !== '' ? c.newRate : (L.status[c.decision] || L.pdec[c.decision])); }).join(' | '), r.dec ? L.final[r.dec.status] : '', fr, base && fr !== '' ? Math.round((fr - base) * 1000 / base) / 10 : '']);
  });
  sheet('เทียบอัตรา', r5, [8, 50, 10, 10, 10, 10, 10, 30, 12, 10, 10]);
  // 6 สถานะฝ่าย
  var r6 = [['ฝ่าย', 'ฝ่ายตามหนังสือเวียน', 'หัวหน้าฝ่าย', 'รอบ 1', 'รับรองโดย', 'เวลา', 'หมายเหตุ', 'รอบ 2', 'โดย', 'เวลา', 'ข้อสังเกต']];
  S.boot.divisions.forEach(function (d) {
    var s1 = X.submissions.filter(function (s) { return s.id === d.id + '|1'; })[0], s2 = X.submissions.filter(function (s) { return s.id === d.id + '|2'; })[0], T = { submitted: 'รับรองส่งแล้ว', reopened: 'เปิดให้แก้ไข', agreed: 'ยืนยัน', commented: 'มีข้อสังเกต' };
    r6.push([d.name, d.required ? 'ใช่' : '', d.headName, s1 ? T[s1.status] : 'ยังไม่ส่ง', s1 ? s1.byName : '', s1 ? s1.at : '', s1 ? s1.note : '', s2 ? T[s2.status] : '', s2 ? s2.byName : '', s2 ? s2.at : '', s2 ? s2.note : '']);
  });
  sheet('สถานะฝ่าย', r6, [30, 12, 26, 14, 24, 18, 30, 12, 24, 18, 30]);
  XLSX.writeFile(wb, 'SOMDEJ-CORE_ทบทวนหัตถการ_' + st.file + '.xlsx');
  toast('ดาวน์โหลด Excel แล้ว');
}
function finalDoc(X) {
  var by = refsAll(X), cats = S.boot.categories.slice().sort(function (a, b) { return a.order - b.order; }), out = { cats: [], cancelled: [], rules: [] };
  cats.forEach(function (c) {
    var rows = [];
    S.boot.items.filter(function (i) { return i.cat === c.no; }).forEach(function (i) {
      var d = (by[i.id] || {}).dec, st = d && d.status;
      if (st === 'cancel') { out.cancelled.push(i); return; }
      rows.push({ code: i.code, name: st === 'change' && d.finalName ? d.finalName : i.name, rate: st === 'change' && d.finalRate !== '' ? +d.finalRate : i.rate, unit: st === 'change' && d.finalUnit ? d.finalUnit : i.unit, mark: st === 'change' ? 'แก้ไข' : '', old: st === 'change' ? i.rate : null });
    });
    var n = rows.length ? rows.reduce(function (mx, r) { var x = parseInt(String(r.code).replace(/ .*/, '').split('.').pop(), 10) || 0; return Math.max(mx, x); }, 0) : 0;
    X.proposals.forEach(function (p) {
      var d = (by[p.id] || {}).dec; if (!d || d.status !== 'add') return;
      if (+(d.finalCat || p.catNo) !== c.no) return;
      n++; rows.push({ code: (c.no === 20 ? 'ศด.1.' : c.no + '.') + n, name: d.finalName || p.nameEn || p.nameTh, rate: d.finalRate !== '' ? +d.finalRate : +p.rate, unit: d.finalUnit || p.unit, mark: 'ใหม่' });
    });
    if (rows.length) out.cats.push({ cat: c, rows: rows });
  });
  return out;
}
function exportWord(X, mark) {
  var doc = finalDoc(X), st = stamp(), body = '';
  doc.cats.forEach(function (g) {
    var c = g.cat;
    body += '<p class="h">' + (c.no === 1 ? '1. ' : c.no === 20 ? 'หมวดศัลยกรรมเด็ก ' : c.no + '. ') + esc(c.name) + '</p>';
    if (c.no === 1) { g.rows.forEach(function (r) { body += '<p class="ind">' + esc(r.code) + ' ' + esc(r.name) + (mark && r.mark ? ' <span class="mk">[' + r.mark + ']</span>' : '') + '</p>'; }); return; }
    body += '<table class="t">' + g.rows.map(function (r) { return '<tr><td class="c">' + esc(r.code.replace(/^ศด\./, '')) + '</td><td>' + esc(r.name) + (mark && r.mark ? ' <span class="mk">[' + r.mark + (r.old != null && r.old !== r.rate ? ' เดิม ' + fmt(r.old) : '') + ']</span>' : '') + '</td><td class="r">' + fmt(r.rate) + '</td><td class="u">บาท' + (r.unit && r.unit !== 'ต่อราย' ? ' ' + esc(r.unit) : '') + '</td></tr>'; }).join('') + '</table>';
  });
  if (doc.cancelled.length) body += '<p class="h" style="page-break-before:always">รายการที่ยกเลิก (ไม่รวมในเอกสารแนบฉบับใหม่)</p><table class="t">' + doc.cancelled.map(function (i) { return '<tr><td class="c">' + esc(i.code) + '</td><td>' + esc(i.name) + '</td><td class="r">' + fmt(i.rate) + '</td><td class="u">บาท</td></tr>'; }).join('') + '</table>';
  var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>ร่างเอกสารแนบท้ายคำสั่ง</title><style>@page{size:21cm 29.7cm;margin:2.5cm 2cm 2cm 3cm}body{font-family:"TH SarabunPSK","TH Sarabun New",Sarabun,sans-serif;font-size:16pt;line-height:1.15}p{margin:0 0 4pt}.top{text-align:right}.ti{text-align:center;font-weight:bold;font-size:18pt}.h{font-weight:bold;margin-top:10pt}.ind{text-indent:1.25cm}.t{border-collapse:collapse;width:100%;margin-left:.6cm}.t td{padding:1pt 4pt;vertical-align:top;font-size:16pt}.c{width:1.5cm;white-space:nowrap}.r{text-align:right;width:2.2cm;white-space:nowrap}.u{width:1.4cm;white-space:nowrap}.mk{color:#c00000;font-size:13pt}.draft{color:#c00000;text-align:center;font-size:14pt}</style></head><body>' +
    '<p class="draft">ร่าง · สร้างจาก SOMDEJ CORE เมื่อ ' + esc(st.iso) + ' น.</p><p class="top">เอกสารแนบ 1 แนบท้ายคำสั่งโรงพยาบาลที่ ........../..........</p>' +
    '<p class="ti">อัตราค่าตอบแทนตามคุณภาพและปริมาณงานแพทย์เวรที่ปรึกษาประจำฝ่ายหรือหน่วยการแพทย์</p><p class="ti">โรงพยาบาลสมเด็จพระบรมราชเทวี ณ ศรีราชา</p><br>' + body + '</body></html>';
  var blob = new Blob(['﻿' + html], { type: 'application/msword' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'ร่างเอกสารแนบท้ายคำสั่ง_WL_' + st.file + '.doc'; document.body.appendChild(a); a.click(); a.remove();
  toast('ดาวน์โหลดร่าง Word แล้ว');
}
function printCompare(X) {
  var by = refsAll(X), L = S.boot.labels, st = stamp();
  var rows = Object.keys(by).map(function (k) { return by[k]; }).filter(needsDecision).sort(function (a, b) { var x = itemById(a.ref), y = itemById(b.ref); return (x ? x.order : 9e3) - (y ? y.order : 9e3); }).map(function (r) {
    var i = itemById(r.ref), p = r.prop, rs = statsOf(r.ops.filter(function (o) { return o.newRate !== ''; }).map(function (o) { return +o.newRate; })), t = { keep: 0, change: 0, cancel: 0 }; r.ops.forEach(function (o) { t[o.status]++; });
    return '<tr><td>' + (i ? esc(i.code) : 'ใหม่') + '</td><td>' + esc(i ? i.name : (p.nameEn || p.nameTh) + ' (' + divName(p.divId, true) + ')') + '</td><td class="r">' + (i ? fmt(i.rate) : '') + '</td><td class="r">' + (rs ? fmt(rs.min) + (rs.max !== rs.min ? '–' + fmt(rs.max) : '') : p ? fmt(p.rate) : '') + '</td><td>' + (i ? 'คง ' + t.keep + ' / เปลี่ยน ' + t.change + ' / ยกเลิก ' + t.cancel : '') + '</td><td>' + r.cons.map(function (c) { return esc(divName(c.divId, true)) + ': ' + (L.status[c.decision] || L.pdec[c.decision]) + (c.newRate !== '' ? ' ' + fmt(c.newRate) : ''); }).join('<br>') + '</td><td>' + (r.dec ? L.final[r.dec.status] + (r.dec.finalRate !== '' ? ' ' + fmt(r.dec.finalRate) : '') : '') + '</td></tr>';
  }).join('');
  var w = window.open('', '_blank'); if (!w) { toast('เบราว์เซอร์บล็อกหน้าต่างใหม่ กรุณาอนุญาตป๊อปอัป', true); return; }
  w.document.write('<!doctype html><html lang="th"><head><meta charset="utf-8"><title>ตารางเทียบอัตรา</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600&display=swap"><style>@page{size:A4 landscape;margin:12mm}body{font-family:Sarabun,sans-serif;font-size:12.5px;color:#111}h1{font-size:17px;margin:0}p{margin:2px 0 10px;color:#555}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:4px 6px;vertical-align:top;text-align:left}th{background:#eef1f6}.r{text-align:right;white-space:nowrap}</style></head><body><h1>ตารางเทียบอัตราค่าตอบแทนตามคุณภาพและปริมาณงานแพทย์เวรที่ปรึกษา</h1><p>ข้อมูลจาก SOMDEJ CORE ณ ' + esc(st.iso) + ' น.</p><table><thead><tr><th>ข้อ</th><th>รายการ</th><th class="r">อัตราเดิม</th><th class="r">แพทย์เสนอ</th><th>ความเห็นแพทย์</th><th>ข้อสรุปของฝ่าย</th><th>ผลพิจารณา</th></tr></thead><tbody>' + rows + '</tbody></table><script>setTimeout(function(){print()},600)<\/script></body></html>');
  w.document.close();
}
