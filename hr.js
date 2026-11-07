/* hr.js — สำหรับฝ่ายทรัพยากรบุคคลและผู้บริหาร: ภาพรวมทุกฝ่าย (ธง "หัวหน้าฝ่ายยังไม่ยืนยัน") · รายงาน Excel · หน้าพิมพ์ */
'use strict';
var OV = { f: 'all' };
function pageOverview() {
  if (!me().viewAll) { location.hash = '#/home'; return; }
  shell('<div id="ob">' + loadingHtml() + '</div>', 'ภาพรวมทุกฝ่าย');
  Promise.all([api('overview'), refreshBoot()]).then(function (r) { drawOverview(r[0]); }).catch(function (e) { $('#ob').innerHTML = errorHtml(e.message); });
}
function drawOverview(o) {
  var divs = S.boot.divisions.filter(function (d) { return d.active; }), st = {}; o.divisions.forEach(function (x) { st[x.id] = x; });
  var conf = function (id) { var c = confirmOf(id); return !!c && c.status === 'confirmed'; };
  var req = divs.filter(function (d) { return d.required; }), tot = o.divisions.reduce(function (a, x) { a.e += x.edit; a.c += x.cancel; a.n += x.add; a.p += x.people.length; return a; }, { e: 0, c: 0, n: 0, p: 0 });
  var waiting = divs.filter(function (d) { return !conf(d.id) && (d.required || (st[d.id] && st[d.id].edit + st[d.id].cancel + st[d.id].add)); });
  var stateOf = function (d) { var x = st[d.id] || {}; if (conf(d.id)) return 'done'; if (x.edit + x.cancel + x.add) return 'wait'; return d.required ? 'none' : 'idle'; };
  var F = [['all', 'ทุกฝ่าย', divs.length], ['wait', 'หัวหน้าฝ่ายยังไม่ยืนยัน', waiting.length], ['done', 'ยืนยันแล้ว', divs.filter(function (d) { return conf(d.id); }).length], ['none', 'ยังไม่มีการกรอก', divs.filter(function (d) { return stateOf(d) === 'none'; }).length]];
  var list = divs.filter(function (d) { var s = stateOf(d); return OV.f === 'all' || (OV.f === 'wait' ? waiting.indexOf(d) >= 0 : s === OV.f); });
  var html = pageHead('ฝ่ายทรัพยากรบุคคล', 'ภาพรวมทุกฝ่าย', 'สถานะการกรอกและการยืนยันของหัวหน้าฝ่าย · ข้อมูล ณ ' + esc(thDT(o.at)), me().isAdmin ? '<button class="btn" id="annc">' + ic('mail') + 'ส่งอีเมลประกาศ</button><button class="btn primary" id="remind">' + ic('mail') + 'ส่งอีเมลเตือน</button>' : '', 'overview') +
    '<div class="kpis"><div class="kpi"><span class="ic ok">' + ic('check') + '</span><div><b>' + req.filter(function (d) { return conf(d.id); }).length + '<small class="muted" style="font-size:15px"> / ' + req.length + '</small></b><span>ฝ่ายตามหนังสือเวียนที่ยืนยันแล้ว</span></div></div>' +
    '<div class="kpi"><span class="ic cancel">' + ic('flag') + '</span><div><b>' + waiting.length + '</b><span>หัวหน้าฝ่ายยังไม่ยืนยัน</span></div></div>' +
    '<div class="kpi"><span class="ic edit">' + ic('pencil') + '</span><div><b>' + (tot.e + tot.c) + '</b><span>เสนอแก้ไข ' + tot.e + ' · ยกเลิก ' + tot.c + '</span></div></div>' +
    '<div class="kpi"><span class="ic new">' + ic('plus') + '</span><div><b>' + tot.n + '</b><span>เสนอรายการใหม่</span></div></div></div>' +
    '<section class="card" style="margin-top:16px"><div class="chips" style="padding:14px 16px">' + F.map(function (f) { return '<button class="chip" data-of="' + f[0] + '" aria-pressed="' + (OV.f === f[0]) + '">' + f[1] + ' <i>' + f[2] + '</i></button>'; }).join('') + '</div>' +
    '<div class="tw"><table class="t"><thead><tr>' + (me().isAdmin ? '<th><span class="sr">เลือก</span></th>' : '') + '<th>ฝ่าย</th><th>สถานะ</th><th class="r">แก้ไข</th><th class="r">ยกเลิก</th><th class="r">เสนอใหม่</th><th>แพทย์ที่ร่วมกรอก</th><th>ล่าสุด</th><th></th></tr></thead><tbody>' +
    list.map(function (d) {
      var x = st[d.id] || { edit: 0, cancel: 0, add: 0, people: [], last: '', logged: 0, members: 0 }, s = stateOf(d), c = confirmOf(d.id);
      var pill = s === 'done' ? '<span class="pill ok">ยืนยันแล้ว</span><div class="tiny muted">' + esc(thDT(c.at)) + '</div>' : s === 'wait' ? '<span class="pill flag">หัวหน้าฝ่ายยังไม่ยืนยัน</span>' : s === 'none' ? '<span class="pill bad">ยังไม่มีการกรอก</span>' : '<span class="pill idle">ยังไม่มีการกรอก</span>';
      if (c && c.status === 'reopened') pill += '<div class="tiny muted">HR เปิดให้แก้</div>';
      return '<tr class="click" data-div="' + d.id + '">' + (me().isAdmin ? '<td onclick="event.stopPropagation()"><input type="checkbox" class="pick" value="' + d.id + '"' + (s === 'done' ? ' disabled' : '') + ' aria-label="เลือก ' + esc(d.short) + '"></td>' : '') +
        '<td><b>' + esc(d.name) + '</b>' + (d.required ? ' <span class="tag">หนังสือเวียน</span>' : '') + '<div class="small muted">หัวหน้า: ' + esc(d.headName || 'ยังไม่ระบุ') + '</div></td><td>' + pill + '</td>' +
        '<td class="r">' + (x.edit || '–') + '</td><td class="r">' + (x.cancel || '–') + '</td><td class="r">' + (x.add || '–') + '</td>' +
        '<td class="small">' + (x.people.length ? esc(x.people.slice(0, 3).join(', ')) + (x.people.length > 3 ? ' +' + (x.people.length - 3) : '') : '<span class="muted">–</span>') + '<div class="tiny muted">เข้าระบบแล้ว ' + x.logged + (x.members ? ' / ' + x.members : '') + ' ท่าน</div></td>' +
        '<td class="small nowrap">' + (x.last ? esc(ago(x.last)) : '–') + '</td><td><a class="btn sm" href="#/confirm/' + d.id + '" onclick="event.stopPropagation()">เปิด</a></td></tr>';
    }).join('') + '</tbody></table></div></section>';
  $('#ob').innerHTML = html; bindHelpQ();
  $$('[data-of]').forEach(function (b) { b.onclick = function () { OV.f = b.dataset.of; drawOverview(o); }; });
  $$('tr[data-div]').forEach(function (r) { r.onclick = function () { location.hash = '#/confirm/' + r.dataset.div; }; });
  if ($('#annc')) $('#annc').onclick = function () { mailAction('mailAnnounce', 'ส่งอีเมลประกาศเปิดระบบ', 'ส่งถึงหัวหน้าฝ่าย/ผู้รับมอบทุกฝ่าย (หรือเฉพาะฝ่ายที่ติ๊กเลือก) พร้อมลิงก์และขั้นตอน', this); };
  if ($('#remind')) $('#remind').onclick = function () { mailAction('mailRemind', 'ส่งอีเมลเตือนหัวหน้าฝ่าย', 'ส่งถึงหัวหน้าฝ่ายที่ยังไม่ยืนยัน (ฝ่ายตามหนังสือเวียน และฝ่ายอื่นที่มีการกรอกแล้ว) หรือเฉพาะฝ่ายที่ติ๊กเลือก', this); };
}
function mailAction(action, title, text, btn) {
  var picked = $$('.pick:checked').map(function (x) { return x.value; });
  confirmBox(title + '?', text + (picked.length ? '<br><br>เฉพาะ: ' + picked.map(function (x) { return esc(divName(x, true)); }).join(', ') : ''), 'ส่งอีเมล').then(function (y) {
    if (!y) return; busy(btn, true, 'กำลังส่ง…');
    apiW(action, { divIds: picked }).then(function (r) { busy(btn, false); toast('ส่งแล้ว ' + r.sent + ' ฉบับ' + (r.skipped && r.skipped.length ? ' · ไม่มีอีเมล: ' + r.skipped.join(', ') : '')); }).catch(function (e) { busy(btn, false); toast(e.message, true); });
  });
}

/* ---------- รายงาน ---------- */
function pageExport() {
  if (!me().viewAll) { location.hash = '#/home'; return; }
  shell(pageHead('ฝ่ายทรัพยากรบุคคล', 'รายงาน', 'ทุกไฟล์ระบุวันเวลาที่ดาวน์โหลด ข้อมูลมาจากระบบ ณ เวลาที่กด', '', 'export') +
    '<div class="big3"><a href="#" id="x1"><span class="n">' + ic('download') + '</span><h3>Excel รวมทุกฝ่าย</h3><p>แบบฟอร์มเดิม (ทุกรายการ + ข้อเสนอของแต่ละฝ่าย) · รายการที่เสนอแก้/ยกเลิกพร้อมชื่อผู้กรอก · รายการเสนอใหม่ · สถานะการยืนยันของแต่ละฝ่าย</p><span class="go">ดาวน์โหลด Excel</span></a>' +
    '<a href="#" id="x2"><span class="n">' + ic('print') + '</span><h3>หน้าพิมพ์สรุปข้อเสนอ</h3><p>ตารางเทียบอัตราเดิมกับข้อเสนอของทุกฝ่าย สำหรับนำเข้าที่ประชุม (A4 แนวนอน)</p><span class="go">เปิดหน้าพิมพ์</span></a>' +
    '<a href="#/overview"><span class="n">' + ic('chart') + '</span><h3>ภาพรวมทุกฝ่าย</h3><p>ติดตามฝ่ายที่หัวหน้าฝ่ายยังไม่ยืนยัน และส่งอีเมลเตือน</p><span class="go">เปิดภาพรวม</span></a></div>', 'รายงาน');
  $('#x1').onclick = function (e) { e.preventDefault(); var a = this; a.style.opacity = .6; Promise.all([api('exportAll'), loadXlsx()]).then(function (r) { exportXlsx(r[0]); a.style.opacity = 1; }).catch(function (er) { a.style.opacity = 1; toast(er.message, true); }); };
  $('#x2').onclick = function (e) { e.preventDefault(); api('exportAll').then(printReport).catch(function (er) { toast(er.message, true); }); };
}
function loadXlsx() {
  if (window.XLSX) return Promise.resolve();
  return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = res; s.onerror = function () { rej(new Error('โหลดตัวสร้าง Excel ไม่สำเร็จ ตรวจสอบอินเทอร์เน็ต')); }; document.head.appendChild(s); });
}
function stamp() { var d = new Date(Date.now() + 7 * 36e5).toISOString(); return { iso: d.slice(0, 16).replace('T', ' '), file: d.slice(0, 16).replace(/[-:]/g, '').replace('T', '-') }; }
function rowText(r) { return [B().labels.status[r.status], r.newName ? 'ชื่อ: ' + r.newName : '', r.newRate !== '' ? 'อัตรา ' + r.newRate + (r.newUnit ? ' ' + r.newUnit : '') : '', r.note || ''].filter(Boolean).join(' · '); }
function exportXlsx(X) {
  var st = stamp(), wb = XLSX.utils.book_new(), by = {}, L = B().labels.status;
  X.rows.forEach(function (r) { (by[r.itemId] = by[r.itemId] || []).push(r); });
  var head = [['ส่งออกจาก SOMDEJ CORE เมื่อ ' + st.iso + ' น. · ' + (B().settings.roundName || '')], []];
  function sheet(name, rows, w) { var ws = XLSX.utils.aoa_to_sheet(head.concat(rows)); ws['!cols'] = w.map(function (x) { return { wch: x }; }); XLSX.utils.book_append_sheet(wb, ws, name); }
  var r1 = [['ลำดับ', 'หมวดที่', 'หมวดหัตถการ', 'ข้อที่', 'รายการหัตถการ', 'อัตราค่าตอบแทน (บาท)', 'หน่วย', 'อ้างอิงคำสั่ง', 'จำนวนฝ่ายที่เสนอแก้ไข', 'จำนวนฝ่ายที่เสนอยกเลิก', 'ข้อเสนอของแต่ละฝ่าย']];
  S.boot.items.forEach(function (i, k) { var rs = by[i.id] || []; r1.push([k + 1, catLabel(i.cat), (catByNo(i.cat) || {}).name, i.code, i.name, i.rate, i.unit, i.cmd, rs.filter(function (r) { return r.status === 'edit'; }).length || '', rs.filter(function (r) { return r.status === 'cancel'; }).length || '', rs.map(function (r) { return divName(r.divId, true) + ': ' + rowText(r); }).join('\n')]); });
  sheet('แบบฟอร์มเดิม_รวมทุกฝ่าย', r1, [6, 6, 30, 8, 60, 10, 12, 10, 10, 10, 60]);
  var r2 = [['ฝ่าย', 'หมวด', 'ข้อ', 'รายการเดิม', 'อัตราเดิม', 'สถานะ', 'แก้ไขชื่อเป็น', 'อัตราใหม่', 'หน่วย', 'อ้างอิง', 'เทียบเคียงที่', 'อัตราที่เทียบเคียง', 'หมายเหตุ/เหตุผล', 'ลิงก์', 'ไฟล์แนบ', 'กรอกครั้งแรกโดย', 'เวลา', 'แก้ล่าสุดโดย', 'เวลา']];
  X.rows.slice().sort(function (a, b) { return divName(a.divId).localeCompare(divName(b.divId), 'th') || itemById(a.itemId).order - itemById(b.itemId).order; }).forEach(function (r) { var i = itemById(r.itemId); r2.push([divName(r.divId), catLabel(i.cat), i.code, i.name, i.rate, L[r.status], r.newName, r.newRate !== '' ? +r.newRate : '', r.newUnit, r.refText, r.cmpHosp, r.cmpRate !== '' ? +r.cmpRate : '', r.note, (r.links || []).map(function (l) { return l.url; }).join('\n'), (r.files || []).map(function (f) { return f.name; }).join(', '), r.createdName, r.createdAt, r.updatedName, r.updatedAt]); });
  sheet('เสนอแก้ไข_ยกเลิก', r2, [24, 6, 8, 50, 10, 10, 36, 10, 10, 26, 18, 10, 36, 30, 20, 22, 17, 22, 17]);
  var r3 = [['ฝ่าย', 'ชื่อหัตถการที่เสนอ', 'หมวด', 'อัตราที่เสนอ', 'หน่วย', 'เทียบกับข้อ', 'รายการที่เทียบ', 'อัตราเดิมของข้อที่เทียบ', 'ส่วนต่าง', 'เทียบเคียงที่', 'อัตราที่เทียบเคียง', 'อ้างอิง', 'หมายเหตุ', 'ลิงก์', 'ไฟล์แนบ', 'เสนอโดย', 'เวลา', 'แก้ล่าสุดโดย', 'เวลา']];
  X.newItems.forEach(function (n) { var c = itemById(n.compareId); r3.push([divName(n.divId), n.name, n.catNo ? catLabel(n.catNo) : '', +n.rate, n.unit, c ? c.code : '', c ? c.name : '', c ? c.rate : '', c && c.rate ? +n.rate - c.rate : '', n.cmpHosp, n.cmpRate !== '' ? +n.cmpRate : '', n.refText, n.note, (n.links || []).map(function (l) { return l.url; }).join('\n'), (n.files || []).map(function (f) { return f.name; }).join(', '), n.createdName, n.createdAt, n.updatedName, n.updatedAt]); });
  sheet('เสนอรายการใหม่', r3, [24, 40, 6, 10, 10, 8, 40, 10, 10, 18, 10, 26, 36, 30, 20, 22, 17, 22, 17]);
  var r4 = [['ฝ่าย', 'ฝ่ายตามหนังสือเวียน', 'หัวหน้าฝ่าย', 'สถานะ', 'ยืนยันโดย', 'เวลา', 'หมายเหตุ']], cf = {}; X.confirms.forEach(function (c) { cf[c.divId] = c; });
  S.boot.divisions.forEach(function (d) { var c = cf[d.id]; r4.push([d.name, d.required ? 'ใช่' : '', d.headName, c && c.status === 'confirmed' ? 'ยืนยันแล้ว' : 'หัวหน้าฝ่ายยังไม่ยืนยัน', c ? c.byName : '', c ? c.at : '', c ? c.note : '']); });
  sheet('สถานะการยืนยัน', r4, [32, 12, 28, 22, 26, 18, 30]);
  XLSX.writeFile(wb, 'SOMDEJ-CORE_ทบทวนหัตถการ_' + st.file + '.xlsx');
  toast('ดาวน์โหลด Excel แล้ว');
}
function printReport(X) {
  var st = stamp(), by = {}; X.rows.forEach(function (r) { (by[r.itemId] = by[r.itemId] || []).push(r); });
  var rows = S.boot.items.filter(function (i) { return by[i.id]; }).map(function (i) { return '<tr><td>' + esc(i.code) + '</td><td>' + esc(i.name) + '</td><td class="r">' + fmt(i.rate) + '</td><td>' + by[i.id].map(function (r) { return '<b>' + esc(divName(r.divId, true)) + '</b>: ' + esc(rowText(r)) + (r.cmpHosp ? ' (เทียบ ' + esc(r.cmpHosp) + (r.cmpRate !== '' ? ' ' + fmt(r.cmpRate) : '') + ')' : ''); }).join('<br>') + '</td></tr>'; }).join('');
  var news = X.newItems.map(function (n) { var c = itemById(n.compareId); return '<tr><td>ใหม่</td><td>' + esc(n.name) + ' <i>(' + esc(divName(n.divId, true)) + ')</i></td><td class="r">' + fmt(n.rate) + '</td><td>' + (c ? 'เทียบข้อ ' + esc(c.code) + ' ' + fmt(c.rate) + ' บาท' : '') + (n.cmpHosp ? ' · ' + esc(n.cmpHosp) + ' ' + fmt(n.cmpRate) : '') + (n.note ? ' · ' + esc(n.note) : '') + '</td></tr>'; }).join('');
  var w = window.open('', '_blank'); if (!w) { toast('เบราว์เซอร์บล็อกหน้าต่างใหม่ กรุณาอนุญาตป๊อปอัป', true); return; }
  w.document.write('<!doctype html><html lang="th"><head><meta charset="utf-8"><title>สรุปข้อเสนอ</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;600&display=swap"><style>@page{size:A4 landscape;margin:12mm}body{font-family:"IBM Plex Sans Thai",sans-serif;font-size:12px;color:#111}h1{font-size:16px;margin:0}p{margin:2px 0 10px;color:#555}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:4px 6px;vertical-align:top;text-align:left}th{background:#f4eef0}.r{text-align:right;white-space:nowrap}</style></head><body><h1>สรุปข้อเสนอการทบทวนรายการหัตถการและอัตราค่าตอบแทนแพทย์เวรที่ปรึกษา</h1><p>ข้อมูลจาก SOMDEJ CORE ณ ' + esc(st.iso) + ' น.</p><table><thead><tr><th>ข้อ</th><th>รายการ</th><th class="r">อัตรา</th><th>ข้อเสนอของฝ่าย</th></tr></thead><tbody>' + rows + news + '</tbody></table><script>setTimeout(function(){print()},600)<\/script></body></html>');
  w.document.close();
}
