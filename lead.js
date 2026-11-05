/* lead.js — พื้นที่ของฝ่าย: ความเห็นในฝ่าย · สรุปความเห็นของฝ่าย · รับรองส่ง · ยืนยันร่างผลพิจารณารอบ 2 */
'use strict';
var DV = { tab: 'todo' };
function onConsensusSaved(d) { if (/^\/division/.test(S.route) && $('#dvbody')) drawDivision(d); }

function pageDivision(q, parts) {
  var m = me(), divId = parts[1] || m.leadDivs[0] || m.divId;
  if (!divId && m.viewAll) { location.hash = '#/overview'; return; }
  if (!divId) { shell('<div class="empty"><h3>ยังไม่ได้ระบุฝ่ายของท่าน</h3><p>กรุณาติดต่อฝ่ายทรัพยากรบุคคลเพื่อระบุฝ่าย</p></div>', 'ฝ่าย'); return; }
  if (q.tab) DV.tab = q.tab;
  shell('<div id="dvbody">' + loadingHtml() + '</div>', divName(divId, true));
  loadDiv(divId, true).then(drawDivision).catch(function (e) { $('#dvbody').innerHTML = errorHtml(e.message); });
}
function divCalc(d) {
  var cons = {}; d.consensus.forEach(function (x) { if (x.decision) cons[x.ref] = x; });
  var flagged = {}; d.opinions.forEach(function (o) { if (o.status !== 'keep') flagged[o.itemId] = 1; });
  var ownedLeft = d.owned.filter(function (id) { return !cons[id]; });
  var sharedFlag = Object.keys(flagged).filter(function (id) { return d.owned.indexOf(id) < 0; });
  var sharedLeft = sharedFlag.filter(function (id) { return !cons[id]; });
  var propLeft = d.proposals.filter(function (p) { return !cons[p.id]; });
  var total = d.owned.length + sharedFlag.length + d.proposals.length, done = total - ownedLeft.length - sharedLeft.length - propLeft.length;
  var ppl = {}; d.opinions.forEach(function (o) { ppl[o.emp] = 1; }); d.proposals.forEach(function (o) { ppl[o.emp] = 1; });
  return { cons: cons, flagged: flagged, ownedLeft: ownedLeft, sharedFlag: sharedFlag, sharedLeft: sharedLeft, propLeft: propLeft, total: total, done: done, people: Object.keys(ppl).length };
}
function ring(done, total) {
  var r = 46, c = 2 * Math.PI * r, p = total ? done / total : 0;
  return '<div class="ring' + (total && done >= total ? ' ok' : '') + '" role="img" aria-label="สรุปแล้ว ' + done + ' จาก ' + total + '"><svg viewBox="0 0 112 112"><circle class="bg" cx="56" cy="56" r="' + r + '"/><circle class="fg" cx="56" cy="56" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + c.toFixed(1) + '" data-off="' + (c * (1 - p)).toFixed(1) + '"/></svg><div><span><b>' + pct(done, total) + '%</b>สรุปแล้ว</span></div></div>';
}
function drawDivision(d) {
  var m = me(), divId = d.divId, dv = divById(divId), lead = isLead(divId), cert = canCertify(divId), k = divCalc(d), sub = d.sub1, ph = phase();
  var switcher = '';
  var opts = m.viewAll ? S.boot.divisions : S.boot.divisions.filter(function (x) { return m.viewDivs.indexOf(x.id) >= 0; });
  if (opts.length > 1) switcher = '<select class="in" id="dvsel" style="width:auto;min-width:220px" aria-label="เลือกฝ่าย">' + opts.map(function (x) { return '<option value="' + x.id + '"' + (x.id === divId ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select>';
  var subTxt = sub && sub.status === 'submitted' ? '<span class="st ok">รับรองส่งแล้ว ' + esc(thDT(sub.at)) + '</span>' : sub && sub.status === 'reopened' ? '<span class="st change">HR เปิดให้แก้ไข ' + esc(thDT(sub.at)) + '</span>' : '<span class="st none">ยังไม่รับรองส่ง</span>';
  var html = '<div class="div-head"><div><div class="row wrap" style="margin-bottom:6px">' + subTxt + (dv && dv.required ? '<span class="tag">ฝ่ายที่ได้รับหนังสือเวียน</span>' : '') + '</div><h1>' + esc(dv ? dv.name : divId) + '</h1>' +
    '<p class="muted" style="margin:4px 0 0">หัวหน้าฝ่าย ' + esc(dv && dv.headName || 'ยังไม่ระบุ') + (m.certDivs.indexOf(divId) >= 0 ? ' · ท่านเป็นผู้รับรองส่งของฝ่ายนี้' : m.coordDivs.indexOf(divId) >= 0 ? ' · ท่านเป็นผู้ประสานงานของฝ่ายนี้' : '') + '</p>' +
    '<div class="agg" style="margin-top:12px"><span>แพทย์ร่วมให้ความเห็น <b>' + k.people + '</b>' + (d.members.length ? ' / ' + d.members.filter(function (x) { return !x.coord; }).length + ' ท่าน' : ' ท่าน') + '</span><span>ความเห็นต่อรายการเดิม <b>' + d.opinions.length + '</b></span><span>เสนอเพิ่ม <b>' + d.proposals.length + '</b></span><span>หมวดของฝ่าย <b>' + d.owned.length + '</b> รายการ</span></div>' +
    (switcher ? '<div style="margin-top:14px">' + switcher + '</div>' : '') + '</div>' + ring(k.done, k.total) + '</div>';
  // รอบ 2
  if ((ph === 'confirm' || ph === 'closed' || m.viewAll) && d.decisions && d.decisions.length) html += round2Panel(d);
  // แท็บ
  var tabs = [['todo', 'ต้องสรุป', k.ownedLeft.length + k.sharedLeft.length + k.propLeft.length], ['flag', 'มีข้อเสนอเปลี่ยน/ยกเลิก', Object.keys(k.flagged).length], ['owned', 'รายการในหมวดของฝ่าย', d.owned.length], ['props', 'รายการเสนอเพิ่ม', d.proposals.length]];
  if (lead) tabs.push(['people', 'แพทย์ในฝ่าย', d.members.filter(function (x) { return !x.coord; }).length]);
  if (!lead) tabs = tabs.filter(function (t) { return t[0] !== 'todo'; });
  if (!tabs.some(function (t) { return t[0] === DV.tab; })) DV.tab = tabs[0][0];
  html += '<div class="tabs" role="tablist" style="margin-top:22px">' + tabs.map(function (t) { return '<button role="tab" data-tab="' + t[0] + '" aria-selected="' + (DV.tab === t[0]) + '">' + t[1] + ' <span class="faint">' + t[2] + '</span></button>'; }).join('') + '</div><div id="dvtab"></div>';
  if (cert || (m.isAdmin && lead)) html += certifyPanel(d, k);
  $('#dvbody').innerHTML = html;
  setTimeout(function () { var fg = $('.ring .fg'); if (fg) fg.style.strokeDashoffset = fg.dataset.off; }, 60);
  if ($('#dvsel')) $('#dvsel').onchange = function () { location.hash = '#/division/' + this.value; };
  $$('[data-tab]').forEach(function (b) { b.onclick = function () { DV.tab = b.dataset.tab; $$('[data-tab]').forEach(function (x) { x.setAttribute('aria-selected', x === b); }); drawTab(d, k); }; });
  drawTab(d, k);
  bindCertify(d, k);
  bindRound2(d);
}
function rowItem(i, d, k) {
  var ops = opsOf(d, i.id), rates = ops.filter(function (o) { return o.newRate !== ''; }).map(function (o) { return +o.newRate; }), c = k.cons[i.id];
  return '<tr class="click" data-item="' + i.id + '"><td class="nowrap"><b>' + esc(i.code) + '</b></td><td>' + esc(i.name.length > 140 ? i.name.slice(0, 140) + '…' : i.name) + '</td><td class="r nowrap">' + (i.cat === 1 ? '' : fmt(i.rate)) + '</td>' +
    '<td><div class="tally">' + (tallyHtml(ops) || '<span class="faint small">–</span>') + '</div>' + (rates.length ? '<div class="small muted" style="margin-top:4px">เสนอ ' + fmt(Math.min.apply(null, rates)) + (rates.length > 1 && Math.max.apply(null, rates) !== Math.min.apply(null, rates) ? '–' + fmt(Math.max.apply(null, rates)) : '') + ' บาท</div>' : '') + '</td>' +
    '<td>' + (c ? stChip(c.decision) + (c.newRate !== '' ? '<div class="small" style="margin-top:4px">' + baht(c.newRate) + '</div>' : '') : '<span class="st none">ยังไม่สรุป</span>') + '</td></tr>';
}
function rowProp(p, d, k) {
  var c = k.cons[p.id], cmp = p.compareId && p.compareId !== 'NONE' ? itemById(p.compareId) : null;
  return '<tr class="click" data-prop="' + p.id + '"><td><b>' + esc(p.nameEn || p.nameTh) + '</b><div class="small muted">' + esc(p.empName) + (p.byName ? ' · กรอกแทนโดย ' + esc(p.byName) : '') + '</div></td><td class="r nowrap"><b>' + fmt(p.rate) + '</b><div class="tiny muted">' + esc(p.unit) + '</div></td><td class="small">' + (cmp ? 'ข้อ ' + esc(cmp.code) + ' · ' + fmt(cmp.rate) + ' บาท' : '<span class="muted">ไม่มี</span>') + '</td><td>' + (c ? stChip(c.decision) : '<span class="st none">ยังไม่สรุป</span>') + '</td></tr>';
}
var ITH = '<thead><tr><th>ข้อ</th><th>รายการ</th><th class="r">อัตราเดิม</th><th>ความเห็นในฝ่าย</th><th>ข้อสรุปฝ่าย</th></tr></thead>';
var PTH = '<thead><tr><th>รายการที่เสนอ</th><th class="r">อัตราที่เสนอ</th><th>เทียบเคียง</th><th>ข้อสรุปฝ่าย</th></tr></thead>';
function drawTab(d, k) {
  var el = $('#dvtab'), lead = isLead(d.divId), wr = writable(d.divId), t = DV.tab, html = '';
  function itemsTable(ids, empty) { var rows = ids.map(itemById).filter(Boolean); return rows.length ? '<div class="tbl-wrap"><table class="tbl">' + ITH + '<tbody>' + rows.map(function (i) { return rowItem(i, d, k); }).join('') + '</tbody></table></div>' : '<div class="panel"><div class="empty"><p>' + empty + '</p></div></div>'; }
  function propsTable(list, empty) { return list.length ? '<div class="tbl-wrap"><table class="tbl">' + PTH + '<tbody>' + list.map(function (p) { return rowProp(p, d, k); }).join('') + '</tbody></table></div>' : '<div class="panel"><div class="empty"><p>' + empty + '</p></div></div>'; }
  if (t === 'todo') {
    var flagOwned = k.ownedLeft.filter(function (id) { return k.flagged[id]; }), quiet = k.ownedLeft.filter(function (id) { return !k.flagged[id]; });
    html += '<div class="stack">';
    html += '<h3 style="font-size:16px">รายการที่แพทย์เสนอเปลี่ยน/ยกเลิก และยังไม่สรุป <span class="muted" style="font:400 14px var(--f-body)">' + (flagOwned.length + k.sharedLeft.length) + ' รายการ</span></h3>' + itemsTable(flagOwned.concat(k.sharedLeft), 'ไม่มีรายการค้าง');
    html += '<h3 style="font-size:16px;margin-top:22px">รายการเสนอเพิ่มที่ยังไม่สรุป <span class="muted" style="font:400 14px var(--f-body)">' + k.propLeft.length + ' รายการ</span></h3>' + propsTable(k.propLeft, 'ไม่มีรายการค้าง');
    html += '<div class="row wrap" style="margin-top:22px"><h3 style="font-size:16px" class="grow">รายการในหมวดของฝ่ายที่ไม่มีข้อเสนอเปลี่ยน <span class="muted" style="font:400 14px var(--f-body)">' + quiet.length + ' รายการ ยังไม่สรุป</span></h3>' + (lead && wr && quiet.length ? '<button class="btn" id="bulk">' + ic('check') + 'สรุป "คงเดิม" ทั้ง ' + quiet.length + ' รายการ</button>' : '') + '</div>' + (quiet.length ? itemsTable(quiet, '') : '<div class="panel"><div class="empty"><p>สรุปครบแล้ว</p></div></div>') + '</div>';
  } else if (t === 'flag') html = itemsTable(Object.keys(k.flagged).sort(function (a, b) { return (itemById(a) || {}).order - (itemById(b) || {}).order; }), 'ยังไม่มีแพทย์ในฝ่ายเสนอเปลี่ยนหรือยกเลิกรายการเดิม');
  else if (t === 'owned') html = itemsTable(d.owned, 'ฝ่ายนี้ไม่มีหมวดที่ต้องสรุปโดยตรง (ให้ความเห็นต่อหมวดกลางและเสนอรายการใหม่ได้)');
  else if (t === 'props') html = propsTable(d.proposals, 'ยังไม่มีรายการเสนอเพิ่ม');
  else if (t === 'people') {
    var cnt = {}; d.opinions.forEach(function (o) { (cnt[o.emp] = cnt[o.emp] || { o: 0, p: 0, last: '' }).o++; if (o.updatedAt > cnt[o.emp].last) cnt[o.emp].last = o.updatedAt; });
    d.proposals.forEach(function (o) { (cnt[o.emp] = cnt[o.emp] || { o: 0, p: 0, last: '' }).p++; if (o.updatedAt > cnt[o.emp].last) cnt[o.emp].last = o.updatedAt; });
    var mem = d.members.slice().sort(function (a, b) { var x = cnt[a.emp] ? 1 : 0, y = cnt[b.emp] ? 1 : 0; return y - x || (b.login || '').localeCompare(a.login || '') || a.name.localeCompare(b.name, 'th'); });
    html = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>ชื่อ</th><th>ตำแหน่ง</th><th>เข้าระบบล่าสุด</th><th class="r">ความเห็น</th><th class="r">เสนอเพิ่ม</th><th>บันทึกล่าสุด</th></tr></thead><tbody>' +
      mem.map(function (x) { var c = cnt[x.emp] || { o: 0, p: 0, last: '' }; return '<tr><td><b>' + esc(x.name) + '</b>' + (x.coord ? ' <span class="proxy">ผู้ประสานงาน</span>' : '') + (x.note ? ' <span class="tag">' + esc(x.note) + '</span>' : '') + '</td><td class="small">' + esc(x.position || '') + '</td><td class="small">' + (x.login ? esc(ago(x.login)) : '<span class="faint">ยังไม่เคยเข้า</span>') + '</td><td class="r">' + (c.o || '–') + '</td><td class="r">' + (c.p || '–') + '</td><td class="small">' + (c.last ? esc(ago(c.last)) : '') + '</td></tr>'; }).join('') +
      (cnt.DIV ? '<tr><td><b>ความเห็นในนามฝ่าย</b></td><td></td><td></td><td class="r">' + cnt.DIV.o + '</td><td class="r">' + cnt.DIV.p + '</td><td class="small">' + esc(ago(cnt.DIV.last)) + '</td></tr>' : '') + '</tbody></table></div>' +
      '<p class="muted small">รายชื่อจากทะเบียนอัตรากำลังแพทย์และผู้ที่เข้าระบบโดยสังกัดฝ่ายนี้ตาม HRMi หากรายชื่อไม่ถูกต้อง แจ้งฝ่ายทรัพยากรบุคคล</p>';
  }
  el.innerHTML = html;
  $$('[data-item]', el).forEach(function (r) { r.onclick = function () { location.hash = '#/item/' + r.dataset.item + '?div=' + d.divId; }; });
  $$('[data-prop]', el).forEach(function (r) { r.onclick = function () { openProposal(d.proposals.filter(function (p) { return p.id === r.dataset.prop; })[0], d); }; });
  if ($('#bulk')) $('#bulk').onclick = function () {
    var b = this;
    confirmBox('สรุป "คงเดิม" ทั้งหมด?', 'รายการในหมวดของฝ่ายที่ไม่มีแพทย์เสนอเปลี่ยนหรือยกเลิกจะถูกสรุปเป็น <b>คงเดิม</b> ในครั้งเดียว (แก้ไขรายรายการได้ภายหลังจนกว่าจะรับรองส่ง)', 'สรุปคงเดิม').then(function (y) {
      if (!y) return; busy(b, true);
      apiW('bulkKeep', { divId: d.divId }).then(function (r) { toast('สรุปคงเดิม ' + r.count + ' รายการ'); return loadDiv(d.divId, true); }).then(drawDivision).catch(function (e) { busy(b, false); toast(e.message, true); });
    });
  };
}
function certifyPanel(d, k) {
  var sub = d.sub1, sent = sub && sub.status === 'submitted', wr = writable(d.divId), ready = k.done >= k.total;
  if (sent) return '<section class="certify sent" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><svg class="seal" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="34"/><path d="M25 41l10 10 20-22"/></svg><div class="grow"><h2 style="font-size:19px">รับรองส่งแล้ว</h2><p style="margin:4px 0 0">โดย ' + esc(sub.byName) + ' · ' + esc(thDT(sub.at, { long: true })) + (sub.note ? '<br>หมายเหตุ: ' + esc(sub.note) : '') + '</p><p class="small muted" style="margin:6px 0 0">ข้อมูลของฝ่ายถูกล็อก หากต้องการแก้ไข ติดต่อฝ่ายทรัพยากรบุคคลเพื่อเปิดให้แก้</p></div>' + (me().isAdmin ? '<button class="btn" id="reopen">' + ic('unlock') + 'เปิดให้ฝ่ายแก้ไข</button>' : '') + '</section>';
  var li = function (ok, t) { return '<li class="' + (ok ? 'y' : '') + '"><i>' + (ok ? '✓' : '') + '</i>' + t + '</li>'; };
  return '<section class="certify' + (ready ? ' ready' : '') + '"><div class="row wrap" style="align-items:flex-start"><div class="grow"><h2 style="font-size:19px">รับรองส่งความเห็นของฝ่าย</h2><p class="muted" style="margin:4px 0 0">เมื่อรับรองส่ง ความเห็นทั้งหมดของฝ่ายจะถูกส่งถึงฝ่ายทรัพยากรบุคคลและล็อกการแก้ไข</p>' +
    '<ul class="checklist">' + li(!k.ownedLeft.length, 'สรุปรายการในหมวดของฝ่ายครบ (' + (d.owned.length - k.ownedLeft.length) + '/' + d.owned.length + ')') + li(!k.sharedLeft.length, 'สรุปรายการหมวดกลางที่แพทย์ในฝ่ายเสนอเปลี่ยนครบ (' + (k.sharedFlag.length - k.sharedLeft.length) + '/' + k.sharedFlag.length + ')') + li(!k.propLeft.length, 'สรุปรายการเสนอเพิ่มครบ (' + (d.proposals.length - k.propLeft.length) + '/' + d.proposals.length + ')') + '</ul></div>' +
    '<div style="min-width:min(100%,320px)">' + (canCertify(d.divId) ? '<label class="f"><span>หมายเหตุถึงฝ่ายทรัพยากรบุคคล (ถ้ามี)</span><textarea class="in" id="cnote" rows="2" placeholder="เช่น ผ่านที่ประชุมฝ่ายวันที่…"></textarea></label><button class="btn danger lg block" id="certify" style="margin-top:10px"' + (ready && wr ? '' : ' disabled') + '>' + ic('seal') + 'รับรองส่ง</button>' + (!wr ? '<p class="small muted">' + esc(B().phaseTh) + '</p>' : '') : '<p class="small muted">การรับรองส่งทำได้เฉพาะหัวหน้าฝ่ายหรือผู้รับมอบ</p>') + '</div></div></section>';
}
function bindCertify(d, k) {
  var b = $('#certify'); if (b) b.onclick = function () {
    var note = $('#cnote').value;
    confirmBox('รับรองส่งความเห็นของ' + divName(d.divId, true) + '?', 'ความเห็นของแพทย์ ' + k.people + ' ท่าน รายการเดิม ' + d.opinions.length + ' ความเห็น และรายการเสนอเพิ่ม ' + d.proposals.length + ' รายการ จะถูกส่งถึงฝ่ายทรัพยากรบุคคล และ<b>ล็อกการแก้ไข</b>', 'รับรองส่ง', true).then(function (y) {
      if (!y) return; busy(b, true);
      apiW('certify', { divId: d.divId, note: note }).then(function () { toast('รับรองส่งแล้ว'); return loadDiv(d.divId, true); }).then(function () { route(); setTimeout(function () { var s = $('.certify'); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 400); }).catch(function (e) { busy(b, false); toast(e.message, true); });
    });
  };
  var r = $('#reopen'); if (r) r.onclick = function () {
    var m = modal('<h2>เปิดให้' + esc(divName(d.divId, true)) + 'แก้ไข</h2><p class="muted">ฝ่ายจะแก้ไขความเห็นได้อีกครั้ง และต้องรับรองส่งใหม่</p><label class="f"><span>เหตุผล</span><textarea class="in" id="rnote" rows="2"></textarea></label><div class="act"><button class="btn" data-x>ยกเลิก</button><button class="btn primary" data-ok>เปิดให้แก้ไข</button></div>');
    m.querySelector('[data-x]').onclick = closeModal;
    m.querySelector('[data-ok]').onclick = function () { var bb = this; busy(bb, true); apiW('reopen', { divId: d.divId, note: $('#rnote').value }).then(function () { closeModal(); toast('เปิดให้แก้ไขแล้ว'); return loadDiv(d.divId, true); }).then(drawDivision).catch(function (e) { busy(bb, false); toast(e.message, true); }); };
  };
}

/* ---------- รอบ 2: ร่างผลพิจารณา ---------- */
function round2Panel(d) {
  var L = S.boot.labels, s2 = d.sub2, can = canCertify(d.divId) && phase() === 'confirm';
  var rows = d.decisions.map(function (x) {
    var it = x.ref.charAt(0) === 'P' ? null : itemById(x.ref), p = it ? null : d.proposals.filter(function (y) { return y.id === x.ref; })[0];
    return '<tr><td class="nowrap"><b>' + esc(it ? it.code : 'เสนอใหม่') + '</b></td><td>' + esc(it ? it.name.slice(0, 120) : p ? (p.nameEn || p.nameTh) : x.ref) + (x.finalName ? '<div class="small">→ ' + esc(x.finalName) + '</div>' : '') + '</td><td class="r nowrap">' + (it ? fmt(it.rate) : p ? fmt(p.rate) : '') + '</td><td>' + stChip(x.status, L.final[x.status]) + '</td><td class="r nowrap"><b>' + (x.finalRate !== '' ? fmt(x.finalRate) : '') + '</b></td><td class="small">' + esc(x.note || '') + '</td></tr>';
  }).join('');
  return '<section class="panel" style="margin-top:18px"><div class="panel-h"><div class="grow"><h2>รอบ 2 · ร่างผลพิจารณาของฝ่ายทรัพยากรบุคคลและผู้บริหาร</h2><p>รายการที่เกี่ยวข้องกับฝ่าย ' + d.decisions.length + ' รายการ ขอให้หัวหน้าฝ่ายยืนยันหรือแจ้งข้อสังเกต' + (B().phase.r2CloseAt ? ' ภายใน ' + esc(thDT(B().phase.r2CloseAt)) : '') + '</p></div>' +
    (s2 ? stChip(s2.status === 'agreed' ? 'ok' : 'change', s2.status === 'agreed' ? 'ยืนยันแล้ว' : 'แจ้งข้อสังเกตแล้ว') : '<span class="st none">รอฝ่ายยืนยัน</span>') + '</div>' +
    '<div class="tbl-wrap" style="border:0;border-radius:0"><table class="tbl"><thead><tr><th>ข้อ</th><th>รายการ</th><th class="r">อัตราเดิม/เสนอ</th><th>ผลพิจารณา</th><th class="r">อัตราใหม่</th><th>หมายเหตุ</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    (s2 && s2.note ? '<div class="panel-b"><b>ข้อสังเกตของฝ่าย:</b> ' + esc(s2.note) + ' <span class="faint small">(' + esc(s2.byName) + ' · ' + esc(thDT(s2.at)) + ')</span></div>' : '') +
    (can ? '<div class="panel-b" style="border-top:1px solid var(--line)"><label class="f"><span>ข้อสังเกตของฝ่าย (ถ้ามี)</span><textarea class="in" id="r2note" rows="2"></textarea></label><div class="row wrap" style="margin-top:10px"><button class="btn primary" id="r2ok">' + ic('check') + 'ยืนยันร่างผลพิจารณา</button><button class="btn" id="r2c">ส่งข้อสังเกต</button></div></div>' : '') + '</section>';
}
function bindRound2(d) {
  function send(agree, b) {
    busy(b, true);
    apiW('confirmRound2', { divId: d.divId, agree: agree, note: $('#r2note').value }).then(function () { toast(agree ? 'ยืนยันแล้ว' : 'ส่งข้อสังเกตแล้ว'); return loadDiv(d.divId, true); }).then(drawDivision).catch(function (e) { busy(b, false); toast(e.message, true); });
  }
  if ($('#r2ok')) $('#r2ok').onclick = function () { send(true, this); };
  if ($('#r2c')) $('#r2c').onclick = function () { send(false, this); };
}
