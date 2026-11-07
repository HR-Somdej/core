/* admin.js — ตั้งค่าระบบ (ผู้ดูแลระบบ/ฝ่ายทรัพยากรบุคคล)
 * แท็บ: ทั่วไปและกำหนดเวลา · ฝ่ายและหัวหน้าฝ่าย · ผู้ใช้และสิทธิ์ · หมวดและรายการ · อีเมล · ประวัติการใช้งาน */
'use strict';
var AD = { tab: 'general', uq: '' };
function pageSettings(q, parts) {
  if (!me().isAdmin) { location.hash = '#/home'; return; }
  if (parts[1]) AD.tab = parts[1];
  var T = [['general', 'ทั่วไปและกำหนดเวลา'], ['divisions', 'ฝ่ายและหัวหน้าฝ่าย'], ['users', 'ผู้ใช้และสิทธิ์'], ['items', 'หมวดและรายการ'], ['mail', 'อีเมล'], ['audit', 'ประวัติการใช้งาน']];
  shell(pageHead('ผู้ดูแลระบบ', 'ตั้งค่าระบบ', 'ทุกการเปลี่ยนแปลงถูกบันทึกในประวัติการใช้งาน', '', 'settings') + '<div class="tabs" role="tablist">' + T.map(function (t) { return '<a role="tab" href="#/settings/' + t[0] + '" aria-selected="' + (AD.tab === t[0]) + '">' + t[1] + '</a>'; }).join('') + '</div><div id="adbody">' + loadingHtml() + '</div>', 'ตั้งค่า');
  (S.admin && AD.tab !== 'general' ? Promise.resolve(S.admin) : api('getAdmin')).then(function (a) { S.admin = a; drawAdmin(); }).catch(function (e) { $('#adbody').innerHTML = errorHtml(e.message); });
}
function drawAdmin() { ({ general: adGeneral, divisions: adDivisions, users: adUsers, items: adItems, mail: adMail, audit: adAudit }[AD.tab] || adGeneral)(); }
function afterAdmin(a, msg) { S.admin = a; toast(msg || 'บันทึกแล้ว'); return refreshBoot().then(drawAdmin); }

/* ---------- ทั่วไป ---------- */
function adGeneral() {
  var s = S.admin.settings, c = S.admin.connection;
  var dt = function (k, l, h) { return '<label class="f"><span>' + l + '</span><input class="in" type="datetime-local" data-s="' + k + '" value="' + esc(s[k]) + '">' + (h ? '<small>' + h + '</small>' : '') + '</label>'; };
  var tx = function (k, l, h, area) { return '<label class="f"><span>' + l + '</span>' + (area ? '<textarea class="in" data-s="' + k + '" rows="3">' + esc(s[k]) + '</textarea>' : '<input class="in" data-s="' + k + '" value="' + esc(s[k]) + '">') + (h ? '<small>' + h + '</small>' : '') + '</label>'; };
  $('#adbody').innerHTML = '<div class="stack">' +
    '<section class="panel"><div class="panel-h"><div class="grow"><h2>สถานะการเชื่อมต่อ</h2></div></div><div class="panel-b"><dl class="kv">' +
    '<dt>รหัสผ่าน HIS (abs_login)</dt><dd>' + (c.his ? '<span class="st ok">เชื่อมแล้ว</span>' : c.setupPass ? '<span class="st change">ยังไม่เชื่อม · ใช้รหัสทดสอบ SETUP_PASS</span>' : '<span class="st red">ยังไม่เชื่อม</span>') + '</dd>' +
    '<dt>ข้อมูลบุคลากร HRMi (SmartAPI)</dt><dd>' + (c.smart ? '<span class="st ok">เชื่อมแล้ว</span>' : '<span class="st red">ยังไม่ตั้งค่า · ใช้ทะเบียนแพทย์แทน</span>') + '</dd>' +
    '<dt>โควตาอีเมลคงเหลือวันนี้</dt><dd>' + (c.quota >= 0 ? fmt(c.quota) + ' ฉบับ' : '–') + '</dd><dt>ทะเบียนแพทย์</dt><dd>' + fmt(S.admin.roster) + ' รายชื่อ</dd></dl></div></section>' +
    '<section class="panel"><div class="panel-h"><div class="grow"><h2>กำหนดเวลา</h2><p>แพทย์กรอกได้ระหว่างวันเปิด–ปิด · หลังปิดรับ แพทย์และหัวหน้าฝ่ายแก้ไม่ได้ (ผู้ดูแลระบบยังแก้ได้)</p></div></div><div class="panel-b stack">' +
    '<div class="g2">' + dt('openAt', 'เปิดให้กรอก') + dt('closeAt', 'ปิดรับ / กำหนดหัวหน้าฝ่ายยืนยัน') + '</div>' +
    '</div></section>' +
    '<section class="panel"><div class="panel-h"><h2>ข้อความและการติดต่อ</h2></div><div class="panel-b stack">' +
    tx('roundName', 'ชื่อรอบการทบทวน') + tx('welcome', 'ข้อความต้อนรับในหน้าแรก', '', true) +
    '<div class="g3">' + tx('contactName', 'ผู้ประสานงาน HR') + tx('contactPhone', 'โทรภายใน') + tx('maxFileMb', 'ขนาดไฟล์แนบสูงสุด (MB)') + '</div>' + tx('contactText', 'ข้อความติดต่อ') + tx('siteUrl', 'ลิงก์ระบบ (ใช้ในอีเมล/QR)') + '</div></section>' +
    '<div class="row"><button class="btn primary lg" id="gsave">บันทึกการตั้งค่า</button></div></div>';
  $('#gsave').onclick = function () {
    var b = this, o = {}; $$('[data-s]').forEach(function (x) { o[x.dataset.s] = x.value; }); $$('[data-sb]').forEach(function (x) { o[x.dataset.sb] = x.checked; });
    busy(b, true); apiW('saveSettings', { settings: o }).then(function (a) { return afterAdmin(a, 'บันทึกการตั้งค่าแล้ว'); }).catch(function (e) { busy(b, false); toast(e.message, true); });
  };
}

/* ---------- ฝ่าย ---------- */
function adDivisions() {
  var D = S.admin.divisions.slice().sort(function (a, b) { return a.order - b.order; });
  $('#adbody').innerHTML = '<div class="row wrap" style="margin-bottom:12px"><p class="muted grow" style="margin:0">หัวหน้าฝ่ายและผู้รับมอบ (รักษาการ) กด "ยืนยันส่ง HR" ได้ อีเมลใช้สำหรับประกาศ เตือน และสรุปรายวัน · ชื่อเรียกอื่นใช้จับคู่กับชื่อฝ่ายใน HRMi</p><button class="btn" id="dnew">' + ic('plus') + 'เพิ่มฝ่าย</button><button class="btn" id="dsync">' + ic('hist') + 'ดึงอีเมลจาก HRMi</button></div>' +
    '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>ฝ่าย</th><th>หนังสือเวียน</th><th>หัวหน้าฝ่าย</th><th>อีเมล</th><th>ผู้รับมอบ</th><th>สถานะ</th></tr></thead><tbody>' +
    D.map(function (d) { return '<tr class="click" data-d="' + d.id + '"><td><b>' + esc(d.name) + '</b><div class="tiny muted">' + esc(d.id) + (d.aliases ? ' · ' + esc(d.aliases) : '') + '</div></td><td>' + (d.required ? '<span class="st own">ต้องส่ง</span>' : '<span class="faint small">ร่วมเสนอได้</span>') + '</td><td class="small">' + esc(d.headName || '') + '<div class="tiny muted">' + esc(d.headEmp || 'ยังไม่ระบุ') + '</div></td><td class="small">' + (d.headEmail ? esc(d.headEmail) : '<span class="st red">ไม่มีอีเมล</span>') + (d.ccEmails ? '<div class="tiny muted">สำเนา ' + esc(d.ccEmails) + '</div>' : '') + '</td><td class="small">' + esc(d.delegates || '–') + '</td><td>' + (d.active ? '<span class="st ok">ใช้งาน</span>' : '<span class="st none">ปิด</span>') + '</td></tr>'; }).join('') + '</tbody></table></div>';
  $$('[data-d]').forEach(function (r) { r.onclick = function () { divForm(D.filter(function (x) { return x.id === r.dataset.d; })[0]); }; });
  $('#dnew').onclick = function () { divForm(null); };
  $('#dsync').onclick = function () { var b = this; busy(b, true); b.dataset.busy = 'กำลังซิงก์…'; apiW('syncUsers', {}).then(function (a) { return afterAdmin(a, 'ซิงก์ HRMi แล้ว · ผู้ใช้ ' + a.synced.users + ' · เติมอีเมล ' + a.synced.emails); }).catch(function (e) { busy(b, false); toast(e.message, true); }); };
}
function divForm(d) {
  d = d || { id: '', name: '', short: '', aliases: '', required: false, headEmp: '', headName: '', headEmail: '', delegates: '', ccEmails: '', active: true, order: S.admin.divisions.length + 1 };
  var m = modal('<h2>' + (d.id ? 'แก้ไข' + esc(d.name) : 'เพิ่มฝ่าย') + '</h2><div class="stack" style="margin-top:14px">' +
    '<div class="grid2"><label class="f"><span>รหัสฝ่าย (อังกฤษ)</span><input class="in" id="f_id" value="' + esc(d.id) + '"' + (d.id ? ' readonly' : '') + ' placeholder="เช่น MED"></label><label class="f"><span>ลำดับแสดง</span><input class="in" id="f_order" inputmode="numeric" value="' + esc(d.order) + '"></label></div>' +
    '<label class="f"><span>ชื่อฝ่าย</span><input class="in" id="f_name" value="' + esc(d.name) + '"></label><div class="grid2"><label class="f"><span>ชื่อย่อ</span><input class="in" id="f_short" value="' + esc(d.short) + '"></label><label class="f"><span>ชื่อเรียกอื่นใน HRMi</span><input class="in" id="f_alias" value="' + esc(d.aliases || '') + '" placeholder="คั่นด้วย |"></label></div>' +
    '<div class="grid2"><label class="f"><span>รหัสหัวหน้าฝ่าย</span><input class="in" id="f_head" inputmode="numeric" maxlength="7" value="' + esc(d.headEmp) + '"></label><label class="f"><span>ชื่อหัวหน้าฝ่าย</span><input class="in" id="f_hname" value="' + esc(d.headName) + '"></label></div>' +
    '<label class="f"><span>อีเมลหัวหน้าฝ่าย</span><input class="in" id="f_mail" type="email" value="' + esc(d.headEmail) + '"></label>' +
    '<label class="f"><span>ผู้รับมอบ/รักษาการ (รหัส 7 หลัก คั่นด้วย ,)</span><input class="in" id="f_del" value="' + esc(d.delegates || '') + '"><small>กด "ยืนยันส่ง HR" แทนหัวหน้าฝ่ายได้ · อีเมลของผู้รับมอบใช้ตามข้อมูลผู้ใช้</small></label>' +
    '<label class="f"><span>อีเมลสำเนา (ถ้ามี)</span><input class="in" id="f_cc" value="' + esc(d.ccEmails || '') + '" placeholder="เช่น เลขาฝ่าย"></label>' +
    '<div class="row wrap" style="gap:20px"><label class="check"><input type="checkbox" id="f_req"' + (d.required ? ' checked' : '') + '> ฝ่ายตามหนังสือเวียน (ติดตามการยืนยัน · ส่งเตือนอัตโนมัติ)</label><label class="check"><input type="checkbox" id="f_act"' + (d.active ? ' checked' : '') + '> เปิดใช้งาน</label></div><div id="ferr"></div></div>' +
    '<div class="act"><button class="btn" data-x>ยกเลิก</button><button class="btn primary" data-ok>บันทึก</button></div>');
  m.querySelector('[data-x]').onclick = closeModal;
  m.querySelector('[data-ok]').onclick = function () {
    var b = this; busy(b, true);
    apiW('saveDivision', { division: { id: $('#f_id').value, name: $('#f_name').value, short: $('#f_short').value, aliases: $('#f_alias').value, headEmp: $('#f_head').value, headName: $('#f_hname').value, headEmail: $('#f_mail').value, delegates: $('#f_del').value, ccEmails: $('#f_cc').value, required: $('#f_req').checked, active: $('#f_act').checked, order: $('#f_order').value } })
      .then(function (a) { closeModal(); return afterAdmin(a, 'บันทึกฝ่ายแล้ว'); }).catch(function (e) { busy(b, false); $('#ferr').innerHTML = '<div class="alert err">' + esc(e.message) + '</div>'; });
  };
}

/* ---------- ผู้ใช้ ---------- */
function adUsers() {
  var U = S.admin.users, q = AD.uq.toLowerCase();
  var list = U.filter(function (u) { return !q || (u.emp + ' ' + u.name + ' ' + divName(u.divId)).toLowerCase().indexOf(q) >= 0; }).sort(function (a, b) { return (b.roles.length + b.coordDivs.length) - (a.roles.length + a.coordDivs.length) || (b.lastLogin || '').localeCompare(a.lastLogin || ''); });
  $('#adbody').innerHTML = '<div class="toolbar"><label class="search"><span class="sr">ค้นหา</span>' + ic('search') + '<input class="in" id="uq" placeholder="ค้นหาชื่อ รหัส หรือฝ่าย" value="' + esc(AD.uq) + '"></label><button class="btn primary" id="unew">' + ic('plus') + 'เพิ่มผู้ใช้ / ผู้ประสานงาน</button></div>' +
    '<p class="muted small">แพทย์ทุกคนที่มีบัญชี HIS เข้าระบบได้เองโดยไม่ต้องเพิ่มที่นี่ ระบบดึงชื่อและฝ่ายจาก HRMi ให้อัตโนมัติ เพิ่มที่นี่เมื่อต้องการกำหนดสิทธิ์ ผู้ประสานงาน หรือแก้ฝ่าย · ' + U.length + ' ผู้ใช้</p>' +
    '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>ชื่อ</th><th>ฝ่าย</th><th>สิทธิ์</th><th>บัญชี</th><th>เข้าล่าสุด</th></tr></thead><tbody>' +
    list.slice(0, 300).map(function (u) {
      var r = []; if (u.roles.indexOf('admin') >= 0) r.push('<span class="st red">ผู้ดูแลระบบ</span>'); if (u.roles.indexOf('exec') >= 0) r.push('<span class="st own">ผู้บริหาร</span>'); if (u.coordDivs.length) r.push('<span class="st change">ผู้ประสานงาน ' + esc(u.coordDivs.map(function (x) { return divName(x, true); }).join(', ')) + '</span>');
      S.boot.divisions.forEach(function (d) { if (d.headEmp === u.emp) r.push('<span class="st ok">หัวหน้า' + esc(d.short) + '</span>'); });
      return '<tr class="click" data-u="' + u.emp + '"><td><b>' + esc(u.name) + '</b><div class="tiny muted">' + esc(u.emp) + ' · ' + esc(u.position || '') + '</div></td><td class="small">' + esc(divName(u.divId, true)) + (u.divLock ? ' ' + ic('lock') : '') + (u.hrDivision && divName(u.divId) !== u.hrDivision ? '<div class="tiny muted">HRMi: ' + esc(u.hrDivision) + '</div>' : '') + '</td><td><div class="tally">' + (r.join('') || '<span class="faint small">แพทย์</span>') + '</div></td><td class="small">' + (u.hasPw ? 'บัญชีระบบ' + (u.mustChange ? ' <span class="st change">รอเปลี่ยนรหัส</span>' : '') : 'HIS') + (!u.active ? ' <span class="st red">ระงับ</span>' : '') + '</td><td class="small">' + (u.lastLogin ? esc(ago(u.lastLogin)) : '<span class="faint">ยังไม่เข้า</span>') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  $('#uq').oninput = debounce(function () { AD.uq = this.value; adUsers(); var i = $('#uq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250);
  $$('[data-u]').forEach(function (r) { r.onclick = function () { userForm(U.filter(function (x) { return x.emp === r.dataset.u; })[0]); }; });
  $('#unew').onclick = function () { userForm(null); };
}
function userForm(u) {
  var isNew = !u; u = u || { emp: '', name: '', roles: [], coordDivs: [], divId: '', divLock: false, active: true, email: '', hasPw: false };
  var divOpts = '<option value="">— ไม่ระบุ —</option>' + S.boot.divisions.map(function (d) { return '<option value="' + d.id + '"' + (u.divId === d.id ? ' selected' : '') + '>' + esc(d.name) + '</option>'; }).join('');
  var m = modal('<h2>' + (isNew ? 'เพิ่มผู้ใช้' : esc(u.name)) + '</h2><div class="stack" style="margin-top:14px">' +
    (isNew ? '<div class="row" style="align-items:flex-end"><label class="f grow"><span>เลขประจำตัวบุคลากร 7 หลัก</span><input class="in" id="u_emp" inputmode="numeric" maxlength="7"></label><button class="btn" id="u_look">ค้นจาก HRMi</button></div><div id="u_info"></div>' : '<p class="muted" style="margin:0">' + esc(u.emp) + ' · ' + esc(u.position || '') + (u.hrDivision ? '<br>HRMi: ' + esc(u.hrDivision) : '') + '</p>') +
    '<label class="f"><span>ฝ่ายที่ให้ความเห็น</span><select class="in" id="u_div">' + divOpts + '</select></label><label class="check"><input type="checkbox" id="u_lock"' + (u.divLock ? ' checked' : '') + '> ล็อกฝ่ายนี้ (ไม่เปลี่ยนตาม HRMi)</label>' +
    '<label class="f"><span>อีเมล</span><input class="in" id="u_mail" type="email" value="' + esc(u.email || '') + '"></label>' +
    '<div><span class="f-label">สิทธิ์</span><div class="row wrap" style="gap:18px"><label class="check"><input type="checkbox" id="u_admin"' + (u.roles.indexOf('admin') >= 0 ? ' checked' : '') + '> ผู้ดูแลระบบ (HR)</label><label class="check"><input type="checkbox" id="u_exec"' + (u.roles.indexOf('exec') >= 0 ? ' checked' : '') + '> ผู้บริหาร (เห็นทุกฝ่าย ลงผลพิจารณา)</label></div></div>' +
    '<div><span class="f-label">ผู้ประสานงานของฝ่าย (กรอกแผ่นงานของฝ่ายแทนแพทย์ได้)</span><div class="row wrap" style="gap:6px 16px">' + S.boot.divisions.map(function (d) { return '<label class="check small"><input type="checkbox" class="u_co" value="' + d.id + '"' + (u.coordDivs.indexOf(d.id) >= 0 ? ' checked' : '') + '> ' + esc(d.short) + '</label>'; }).join('') + '</div></div>' +
    (!u.hasPw ? '<label class="check"><input type="checkbox" id="u_local"> สร้างบัญชีระบบ (สำหรับผู้ที่ไม่มีบัญชี HIS) และออกรหัสผ่านชั่วคราว</label>' : '') +
    '<label class="check"><input type="checkbox" id="u_act"' + (u.active ? ' checked' : '') + '> เปิดใช้งาน</label><div id="uerr"></div></div>' +
    '<div class="act">' + (u.hasPw ? '<button class="btn ghost" id="u_reset" style="margin-right:auto">' + ic('key') + 'ออกรหัสผ่านชั่วคราวใหม่</button>' : '') + '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" data-ok>บันทึก</button></div>');
  m.querySelector('[data-x]').onclick = closeModal;
  if ($('#u_look')) $('#u_look').onclick = function () {
    var b = this; busy(b, true);
    api('lookupEmp', { emp: $('#u_emp').value }).then(function (x) { busy(b, false); $('#u_info').innerHTML = '<div class="alert info"><span><b>' + esc(x.name) + '</b> · ' + esc(x.position || '') + '<br>' + esc(x.hrDivision || divName(x.divId)) + ' · ' + esc(x.email || 'ไม่มีอีเมล') + ' <span class="faint">(' + esc(x.source) + ')</span>' + (x.exists ? '<br>มีผู้ใช้นี้แล้ว จะแก้ไขสิทธิ์ของผู้ใช้เดิม' : '') + '</span></div>'; if (x.divId) $('#u_div').value = x.divId; if (x.email && !$('#u_mail').value) $('#u_mail').value = x.email; })
      .catch(function (e) { busy(b, false); $('#u_info').innerHTML = '<div class="alert err">' + esc(e.message) + '</div>'; });
  };
  if ($('#u_reset')) $('#u_reset').onclick = function () { var b = this; busy(b, true); apiW('resetPassword', { emp: u.emp }).then(function (a) { S.admin = a; showTemp(a.tempPassword); }).catch(function (e) { busy(b, false); toast(e.message, true); }); };
  m.querySelector('[data-ok]').onclick = function () {
    var b = this, roles = []; if ($('#u_admin').checked) roles.push('admin'); if ($('#u_exec').checked) roles.push('exec');
    busy(b, true);
    apiW('saveUser', { user: { emp: isNew ? $('#u_emp').value : u.emp, roles: roles, coordDivs: $$('.u_co:checked').map(function (x) { return x.value; }), divId: $('#u_div').value, divLock: $('#u_lock').checked, email: $('#u_mail').value, active: $('#u_act').checked, local: $('#u_local') ? $('#u_local').checked : false } })
      .then(function (a) { S.admin = a; if (a.tempPassword) showTemp(a.tempPassword); else { closeModal(); afterAdmin(a, 'บันทึกผู้ใช้แล้ว'); } })
      .catch(function (e) { busy(b, false); $('#uerr').innerHTML = '<div class="alert err">' + esc(e.message) + '</div>'; });
  };
}
function showTemp(t) {
  var m = modal('<h2>รหัสผ่านชั่วคราว</h2><p class="muted">แจ้งรหัสนี้แก่ผู้ใช้โดยตรง (ระบบจะไม่แสดงอีก) ผู้ใช้เข้าที่แท็บ <b>บัญชีระบบ (ไม่มี HIS)</b> และต้องตั้งรหัสผ่านใหม่ในครั้งแรก</p>' +
    '<div class="ratebox"><div><span>เลขประจำตัว</span><b>' + esc(t.emp) + '</b></div><div><span>รหัสผ่านชั่วคราว</span><b style="letter-spacing:.06em">' + esc(t.password) + '</b></div></div><div class="act"><button class="btn" id="cpy">คัดลอก</button><button class="btn primary" data-ok>เสร็จแล้ว</button></div>');
  $('#cpy').onclick = function () { try { navigator.clipboard.writeText('SOMDEJ CORE ' + (B().settings.siteUrl || '') + '\nเลขประจำตัว ' + t.emp + '\nรหัสผ่านชั่วคราว ' + t.password); toast('คัดลอกแล้ว'); } catch (e) { } };
  m.querySelector('[data-ok]').onclick = function () { closeModal(); refreshBoot().then(drawAdmin); };
}

/* ---------- หมวดและรายการ ---------- */
function adItems() {
  var cats = S.boot.categories;
  $('#adbody').innerHTML = '<section class="panel"><div class="panel-h"><div class="grow"><h2>ฝ่ายที่สรุปแต่ละหมวด</h2><p>ระบบเปิดหมวดของฝ่ายให้แพทย์เห็นก่อนในแผ่นงาน · "ทุกฝ่าย" = หมวดกลาง</p></div></div>' +
    '<div class="tbl-wrap" style="border:0;border-radius:0"><table class="tbl"><thead><tr><th>หมวด</th><th>ฝ่ายที่สรุป</th><th></th></tr></thead><tbody>' + cats.map(function (c) {
      return '<tr><td><b>' + catLabel(c.no) + '</b> ' + esc(c.name) + '</td><td><select class="in" data-cat="' + c.no + '" style="min-width:200px"><option value="ALL"' + (c.owners[0] === 'ALL' ? ' selected' : '') + '>ทุกฝ่าย (หมวดกลาง)</option>' + S.boot.divisions.map(function (d) { return '<option value="' + d.id + '"' + (c.owners[0] === d.id ? ' selected' : '') + '>' + esc(d.name) + '</option>'; }).join('') + '</select></td><td><button class="btn sm" data-csave="' + c.no + '">บันทึก</button></td></tr>';
    }).join('') + '</tbody></table></div></section>' +
    '<section class="panel"><div class="panel-h"><div class="grow"><h2>แก้ไขข้อความ/อัตราในรายการตั้งต้น</h2><p>ใช้เมื่อพบว่าข้อความพิมพ์ผิดจากคำสั่งต้นฉบับ (การแก้ทุกครั้งเก็บในประวัติ) ข้อเสนอของแพทย์ให้ทำผ่านความเห็นตามปกติ</p></div><button class="btn" id="inew">' + ic('plus') + 'เพิ่มรายการที่ตกหล่น</button></div><div class="panel-b"><label class="search" style="display:block"><span class="sr">ค้นหา</span>' + ic('search') + '<input class="in" id="aiq" placeholder="ค้นหาเลขข้อหรือชื่อรายการเพื่อแก้ไข"></label><div id="ailist" style="margin-top:10px"></div></div></section>';
  $$('[data-csave]').forEach(function (b) { b.onclick = function () { var no = b.dataset.csave; busy(b, true); apiW('saveCategory', { no: no, owners: [$('[data-cat="' + no + '"]').value] }).then(function () { busy(b, false); toast('บันทึกเจ้าของหมวดแล้ว'); return refreshBoot(); }).catch(function (e) { busy(b, false); toast(e.message, true); }); }; });
  $('#aiq').oninput = debounce(function () {
    var q = this.value.trim().toLowerCase(); if (!q) { $('#ailist').innerHTML = ''; return; }
    var r = S.boot.items.filter(function (i) { return (i.code + ' ' + i.name).toLowerCase().indexOf(q) >= 0; }).slice(0, 15);
    $('#ailist').innerHTML = '<div class="sched">' + r.map(function (i) { return '<button class="it" data-ei="' + i.id + '"><span class="code">' + esc(i.code) + '</span><span class="nm">' + esc(i.name) + '</span><span class="rt"><b>' + fmt(i.rate) + '</b></span><span class="me"><span class="btn sm">แก้ไข</span></span></button>'; }).join('') + '</div>';
    $$('[data-ei]').forEach(function (b) { b.onclick = function () { itemForm(itemById(b.dataset.ei)); }; });
  }, 200);
  $('#inew').onclick = function () { itemForm(null); };
}
function itemForm(i) {
  var v = i || { id: '', cmd: '359/2553', cat: 2, code: '', name: '', rate: '', unit: 'ต่อราย', note: '', order: '' };
  var m = modal('<h2>' + (i ? 'แก้ไขข้อ ' + esc(i.code) : 'เพิ่มรายการ') + '</h2><div class="stack" style="margin-top:14px"><div class="grid3"><label class="f"><span>หมวด</span><select class="in" id="i_cat">' + S.boot.categories.map(function (c) { return '<option value="' + c.no + '"' + (v.cat === c.no ? ' selected' : '') + '>' + catLabel(c.no) + '</option>'; }).join('') + '</select></label><label class="f"><span>ข้อที่</span><input class="in" id="i_code" value="' + esc(v.code) + '"></label><label class="f"><span>คำสั่ง</span><input class="in" id="i_cmd" value="' + esc(v.cmd) + '"></label></div>' +
    '<label class="f"><span>ชื่อรายการ</span><textarea class="in" id="i_name" rows="3">' + esc(v.name) + '</textarea></label><div class="grid3"><label class="f"><span>อัตรา (บาท)</span><input class="in" id="i_rate" value="' + esc(v.rate == null ? '' : v.rate) + '"></label><label class="f"><span>หน่วย</span><input class="in" id="i_unit" value="' + esc(v.unit) + '"></label><label class="f"><span>ลำดับ</span><input class="in" id="i_ord" value="' + esc(v.order) + '"></label></div>' +
    '<label class="f"><span>หมายเหตุ</span><input class="in" id="i_note" value="' + esc(v.note) + '"></label>' + (i ? '<label class="check"><input type="checkbox" id="i_off"> ซ่อนรายการนี้ (กรณีซ้ำ/ผิด)</label>' : '') + '<div id="ierr"></div></div><div class="act"><button class="btn" data-x>ยกเลิก</button><button class="btn primary" data-ok>บันทึก</button></div>');
  m.querySelector('[data-x]').onclick = closeModal;
  m.querySelector('[data-ok]').onclick = function () {
    var b = this; busy(b, true);
    apiW('saveItem', { item: { id: v.id, cat: $('#i_cat').value, code: $('#i_code').value, cmd: $('#i_cmd').value, name: $('#i_name').value, rate: $('#i_rate').value, unit: $('#i_unit').value, order: $('#i_ord').value, note: $('#i_note').value, active: !($('#i_off') && $('#i_off').checked) } })
      .then(function () { closeModal(); toast('บันทึกรายการแล้ว'); return refreshBoot(); }).then(adItems).catch(function (e) { busy(b, false); $('#ierr').innerHTML = '<div class="alert err">' + esc(e.message) + '</div>'; });
  };
}

/* ---------- อีเมล ---------- */
function adMail() {
  var s = S.admin.settings, sw = function (k, l, h) { return '<label class="check"><input type="checkbox" data-sb="' + k + '"' + (s[k] === 'TRUE' ? ' checked' : '') + '> <span><b>' + l + '</b>' + (h ? '<br><span class="muted small">' + h + '</span>' : '') + '</span></label>'; };
  $('#adbody').innerHTML = '<div class="stack"><section class="panel"><div class="panel-h"><div class="grow"><h2>การส่งอีเมล</h2><p>ส่งจากบัญชีที่ติดตั้งระบบ (hr-somdej) โควตาคงเหลือวันนี้ ' + fmt(S.admin.connection.quota) + ' ฉบับ</p></div></div><div class="panel-b stack">' +
    sw('mailOn', 'เปิดการส่งอีเมลทั้งหมด') + sw('mailAnnounce', 'ประกาศเปิดระบบ', 'กดส่งเองที่หน้า ภาพรวมทุกฝ่าย') +
    sw('mailRemind', 'เตือนหัวหน้าฝ่ายที่ยังไม่ยืนยัน', 'ส่งอัตโนมัติก่อนปิดรับตามจำนวนวันด้านล่าง (ฝ่ายตามหนังสือเวียน + ฝ่ายอื่นที่มีการกรอกแล้ว) และกดส่งเองได้ที่หน้าภาพรวม') +
    '<div class="grid2" style="padding-left:28px"><label class="f"><span>ก่อนปิดรับ (วัน คั่นด้วย ,)</span><input class="in" data-s="mailRemindDays" value="' + esc(s.mailRemindDays) + '"></label><label class="f"><span>เวลาส่ง (ชั่วโมง 0–23)</span><input class="in" data-s="mailRemindHour" value="' + esc(s.mailRemindHour) + '"></label></div>' +
    sw('mailDigest', 'สรุปความเคลื่อนไหวรายวันถึงหัวหน้าฝ่าย', 'เฉพาะวันที่มีการแก้ไข/ยกเลิก/เสนอใหม่ในฝ่าย') + '<div style="padding-left:28px;max-width:260px"><label class="f"><span>เวลาส่ง (ชั่วโมง)</span><input class="in" data-s="mailDigestHour" value="' + esc(s.mailDigestHour) + '"></label></div>' +
    sw('mailCertify', 'แจ้งฝ่ายทรัพยากรบุคคลเมื่อหัวหน้าฝ่ายยืนยัน') + '<label class="f"><span>อีเมล HR ที่รับแจ้ง (คั่นด้วย ,)</span><input class="in" data-s="hrEmails" value="' + esc(s.hrEmails) + '" placeholder="ว่างไว้ = อีเมลของผู้ดูแลระบบ"></label>' +
    '<label class="f"><span>ชื่อผู้ส่ง</span><input class="in" data-s="mailSenderName" value="' + esc(s.mailSenderName) + '"></label>' +
    '<div class="row wrap"><button class="btn primary" id="msave">บันทึก</button><span class="grow"></span><input class="in" id="mt" placeholder="อีเมลทดสอบ" style="max-width:260px" value="' + esc(me().email || '') + '"><button class="btn" id="mtest">ส่งทดสอบ</button></div></div></section>' +
    '<section class="panel"><div class="panel-h"><h2>ประวัติการส่ง</h2></div><div class="tbl-wrap" style="border:0;border-radius:0"><table class="tbl"><thead><tr><th>เวลา</th><th>ชนิด</th><th>ผู้รับ</th><th>หัวเรื่อง</th><th>ผล</th></tr></thead><tbody>' +
    (S.admin.mail.length ? S.admin.mail.map(function (x) { return '<tr><td class="small nowrap">' + esc(thDT(x.at)) + '</td><td class="small">' + esc({ announce: 'ประกาศ', remind: 'เตือน', digest: 'สรุปรายวัน', certify: 'แจ้งยืนยัน', test: 'ทดสอบ' }[x.kind] || x.kind) + '</td><td class="small">' + esc(x.to) + '</td><td class="small">' + esc(x.subject) + '</td><td>' + (x.status === 'sent' ? '<span class="st ok">ส่งแล้ว</span>' : '<span class="st red">' + esc(x.status) + '</span>') + '</td></tr>'; }).join('') : '<tr><td colspan="5" class="muted">ยังไม่มี</td></tr>') + '</tbody></table></div></section></div>';
  $('#msave').onclick = function () { var b = this, o = {}; $$('[data-s]').forEach(function (x) { o[x.dataset.s] = x.value; }); $$('[data-sb]').forEach(function (x) { o[x.dataset.sb] = x.checked; }); busy(b, true); apiW('saveSettings', { settings: o }).then(function (a) { return afterAdmin(a, 'บันทึกการตั้งค่าอีเมลแล้ว'); }).catch(function (e) { busy(b, false); toast(e.message, true); }); };
  $('#mtest').onclick = function () { var b = this; busy(b, true); api('mailTest', { to: $('#mt').value }).then(function (r) { busy(b, false); toast(r.ok ? 'ส่งอีเมลทดสอบแล้ว' : 'ส่งไม่สำเร็จ ดูประวัติการส่ง', !r.ok); return api('getAdmin'); }).then(function (a) { S.admin = a; adMail(); }).catch(function (e) { busy(b, false); toast(e.message, true); }); };
}

/* ---------- ประวัติ ---------- */
function adAudit() {
  $('#adbody').innerHTML = loadingHtml();
  api('getAudit', { limit: 600 }).then(function (rows) {
    $('#adbody').innerHTML = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>เวลา</th><th>ผู้ใช้</th><th>การกระทำ</th><th>ฝ่าย</th><th>อ้างอิง</th><th>รายละเอียด</th></tr></thead><tbody>' + rows.map(function (r) {
      var it = itemById(r.ref);
      return '<tr><td class="small nowrap">' + esc(thDT(r.at)) + '</td><td class="small">' + esc(r.name || r.emp) + '<div class="tiny muted">' + esc(r.emp) + '</div></td><td class="small"><b>' + esc(r.action) + '</b></td><td class="small">' + esc(r.divId ? divName(r.divId, true) : '') + '</td><td class="small">' + esc(it ? 'ข้อ ' + it.code : r.ref) + '</td><td class="tiny muted" style="max-width:380px;word-break:break-word">' + esc(r.detail) + '</td></tr>';
    }).join('') + '</tbody></table></div><p class="muted small">แสดง 600 รายการล่าสุด · ข้อมูลทั้งหมดอยู่ในชีท AuditLog ของฐานข้อมูล</p>';
  }).catch(function (e) { $('#adbody').innerHTML = errorHtml(e.message); });
}
