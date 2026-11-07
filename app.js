/* app.js — แกนหน้าเว็บ SOMDEJ CORE รุ่น 2: เรียกหลังบ้าน · เข้าสู่ระบบ · โครงหน้า · เส้นทาง · หน้าแรก · วิธีใช้ · พาชมระบบ
 * หน้าอื่น: sheet.js (แผ่นงาน/เสนอใหม่/ยืนยันส่ง) · hr.js (ภาพรวม/รายงาน) · admin.js (ตั้งค่า) */
'use strict';
var S = { token: '', boot: null, div: {}, route: '', admin: null, dirty: 0 };
var $ = function (s, el) { return (el || document).querySelector(s); };
var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
function lsGet(k, d) { try { var v = localStorage.getItem('core2:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem('core2:' + k, JSON.stringify(v)); } catch (e) { } }
function lsDel(k) { try { localStorage.removeItem('core2:' + k); } catch (e) { } }
function ssGet(k) { try { return sessionStorage.getItem('core2:' + k); } catch (e) { return null; } }
function ssSet(k, v) { try { sessionStorage.setItem('core2:' + k, v); } catch (e) { } }

/* ---------- เรียกหลังบ้าน ---------- */
var RIDN = 0;
function api(action, payload, opt) {
  opt = opt || {}; payload = payload || {};
  var run = function () {
    if (window.DEMO_RPC) return new Promise(function (res) { setTimeout(function () { res(window.DEMO_RPC(action, S.token, JSON.parse(JSON.stringify(payload)))); }, 120); });
    if (!window.API_URL) return Promise.reject(new Error('ยังไม่ได้ใส่ลิงก์ระบบหลังบ้านใน config.js'));
    return fetch(window.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: action, token: S.token, payload: payload }), redirect: 'follow' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  };
  var tries = 0, go = function () {
    return run().catch(function (e) {
      if (++tries < (opt.retry == null ? 2 : opt.retry + 1)) return new Promise(function (r) { setTimeout(r, 900 * tries); }).then(go);
      throw new Error(/Failed to fetch|NetworkError|Load failed/i.test(e.message) ? 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง' : e.message);
    });
  };
  return go().then(function (r) {
    if (!r || !r.ok) { var err = r && r.error || 'เกิดข้อผิดพลาด'; if (err === 'SESSION_EXPIRED') { logout(true); throw new Error('หมดเวลาการเข้าใช้ กรุณาเข้าสู่ระบบใหม่'); } throw new Error(err); }
    return r.data;
  });
}
function apiW(action, payload) { payload = payload || {}; payload._rid = Date.now().toString(36) + '-' + (++RIDN) + '-' + Math.random().toString(36).slice(2, 7); return api(action, payload); }

/* ---------- ตัวช่วย ---------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function fmt(n) { if (n === '' || n == null || isNaN(+n)) return '–'; return (+n).toLocaleString('th-TH', { maximumFractionDigits: 2 }); }
var TH_M = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'], TH_MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
function thDT(s, o) {
  if (!s) return ''; o = o || {};
  var p = String(s).split(/[-T: ]/).map(Number), d = p[2] + ' ' + (o.long ? TH_M : TH_MS)[p[1] - 1] + ' ' + (o.long ? p[0] + 543 : String(p[0] + 543).slice(-2));
  return o.date || p.length < 5 ? d : d + ' ' + ('0' + p[3]).slice(-2) + '.' + ('0' + p[4]).slice(-2) + ' น.';
}
function msOf(s) { if (!s) return 0; var p = String(s).split(/[-T: ]/).map(Number); return Date.UTC(p[0], p[1] - 1, p[2], (p[3] || 0) - 7, p[4] || 0, p[5] || 0); }
function ago(s) { if (!s) return ''; var m = (Date.now() - msOf(s)) / 60000; if (m < 1) return 'เมื่อสักครู่'; if (m < 60) return Math.floor(m) + ' นาทีที่แล้ว'; if (m < 1440) return Math.floor(m / 60) + ' ชม.ที่แล้ว'; if (m < 10080) return Math.floor(m / 1440) + ' วันที่แล้ว'; return thDT(s, { date: true }); }
function initials(n) { n = String(n || '').replace(/^(ผศ\.\(พิเศษ\) นพ\.|รศ\.นพ\.|นพ\.|พญ\.|ทพญ\.|ทพ\.|นาย|นางสาว|นาง|พว\.)\s*/, '').trim(); return n.charAt(0) || '?'; }
function debounce(fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; }
function B() { return S.boot; } function me() { return S.boot.me; }
function divById(id) { return (S.boot.divisions || []).filter(function (d) { return d.id === id; })[0] || null; }
function divName(id, short) { var d = divById(id); return d ? (short ? d.short : d.name) : (id || 'ยังไม่ระบุฝ่าย'); }
function itemById(id) { if (!S._ii) { S._ii = {}; S.boot.items.forEach(function (i) { S._ii[i.id] = i; }); } return S._ii[id] || null; }
function catByNo(no) { return S.boot.categories.filter(function (c) { return c.no === +no; })[0] || null; }
function catLabel(no) { return +no === 20 ? 'ศด.' : String(no); }
function catShort(c) { return String(c.name).replace(/\s*\(.*\)$/, '').replace(/^หัตถการทาง/, ''); }
function confirmOf(divId) { return S.boot.confirms[divId] || null; }
function locked(divId) { var c = confirmOf(divId); return !!c && c.status === 'confirmed'; }
function phase() { return S.boot.phase.phase; }
function canEdit(divId) { var m = me(); if (!divId || locked(divId)) return false; if (m.isAdmin) return true; return phase() === 'open' && (divId === m.divId || m.leadDivs.indexOf(divId) >= 0); }
function canConfirm(divId) { var m = me(); return m.certDivs.indexOf(divId) >= 0 || m.isAdmin; }
function myDiv() { var m = me(); return m.divId || m.leadDivs[0] || ''; }
function roleText() { var m = me(), o = []; if (m.isAdmin) o.push('ผู้ดูแลระบบ (HR)'); if (m.isExec) o.push('ผู้บริหาร'); m.headOf.forEach(function (d) { o.push('หัวหน้า' + divName(d, true)); }); m.delegOf.forEach(function (d) { o.push('ผู้รับมอบ ' + divName(d, true)); }); m.coordDivs.forEach(function (d) { o.push('ผู้ประสานงาน ' + divName(d, true)); }); if (!o.length) o.push('แพทย์'); return o; }
function pct(a, b) { return b ? Math.round(a * 100 / b) : 0; }
function busy(b, on, label) { if (!b) return; if (on) { b.dataset.h = b.innerHTML; b.disabled = true; b.innerHTML = '<span class="spin"></span>' + esc(label || 'กำลังบันทึก…'); } else { b.disabled = false; if (b.dataset.h) b.innerHTML = b.dataset.h; } }

/* ---------- ไอคอน ---------- */
var IC = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>', sheet: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>', chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>', download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.8 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3.1 14H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 20.9 10H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', check: '<path d="M20 6 9 17l-5-5"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>', eyeoff: '<path d="M17.9 17.9A10 10 0 0 1 12 19c-7 0-11-7-11-7a18 18 0 0 1 5.1-5.9M9.9 4.2A9 9 0 0 1 12 4c7 0 11 7 11 7a18 18 0 0 1-2.2 3.2M1 1l22 22"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>', moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>', key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  clip: '<path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>', link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>', trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>', clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>', flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', unlock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>', users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  hist: '<path d="M3 3v5h5"/><path d="M3.1 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/>', mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>', bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>', print: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>', save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>', refresh: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/>'
};
function ic(n, cls) { return '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || '') + '</svg>'; }

/* ---------- Toast / Modal / ลิ้นชัก ---------- */
function toast(msg, err) {
  var box = $('.toasts') || document.body.appendChild(Object.assign(document.createElement('div'), { className: 'toasts' })); box.setAttribute('role', 'status');
  var t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.innerHTML = ic(err ? 'x' : 'check') + '<span>' + esc(msg) + '</span>'; box.appendChild(t);
  setTimeout(function () { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 320); }, err ? 5500 : 2600);
}
function modal(html) {
  closeModal();
  var sc = document.createElement('div'); sc.className = 'scrim'; sc.id = 'mscrim';
  var m = document.createElement('div'); m.className = 'modal'; m.id = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.innerHTML = html;
  document.body.appendChild(sc); document.body.appendChild(m); sc.onclick = closeModal;
  var f = m.querySelector('[autofocus], textarea, input, .btn.primary'); if (f) setTimeout(function () { f.focus(); }, 30);
  return m;
}
function closeModal() { ['#modal', '#mscrim'].forEach(function (s) { var e = $(s); if (e) e.remove(); }); }
function confirmBox(title, html, ok, danger) {
  return new Promise(function (res) {
    var m = modal('<h2>' + esc(title) + '</h2><div class="muted" style="margin-top:10px">' + html + '</div><div class="act"><button class="btn" data-x>ยกเลิก</button><button class="btn ' + (danger ? 'primary' : 'dark') + '" data-ok>' + esc(ok || 'ยืนยัน') + '</button></div>');
    m.querySelector('[data-x]').onclick = function () { closeModal(); res(false); }; m.querySelector('[data-ok]').onclick = function () { closeModal(); res(true); };
  });
}
function drawer(title, html) {
  closeDrawer();
  var sc = document.createElement('div'); sc.className = 'scrim'; sc.id = 'dscrim';
  var d = document.createElement('aside'); d.className = 'drawer'; d.id = 'drawer'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
  d.innerHTML = '<div class="dh"><h2 class="grow">' + title + '</h2><button class="btn ghost sm" data-close aria-label="ปิด">' + ic('x') + '</button></div><div class="db">' + html + '</div>';
  document.body.appendChild(sc); document.body.appendChild(d); sc.onclick = closeDrawer; d.querySelector('[data-close]').onclick = closeDrawer;
  setTimeout(function () { d.querySelector('[data-close]').focus(); }, 30);
  return d;
}
function closeDrawer() { ['#drawer', '#dscrim'].forEach(function (s) { var e = $(s); if (e) e.remove(); }); }
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if ($('#modal')) closeModal(); else if ($('#drawer')) closeDrawer(); else if ($('.tour-pop')) endTour(); } });

/* ---------- ธีม ---------- */
function applyTheme() { var t = lsGet('theme', ''); if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
function toggleTheme() { var cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); lsSet('theme', cur === 'dark' ? 'light' : 'dark'); applyTheme(); }
applyTheme();

/* ---------- เข้าสู่ระบบ ---------- */
function renderLogin(msg) {
  document.title = 'เข้าสู่ระบบ · SOMDEJ CORE';
  var mode = lsGet('mode', 'his'), last = lsGet('emp', ''), dl = window.PUBLIC_DATES || {};
  $('#app').innerHTML = '<main class="login"><div class="lcard">' +
    '<div class="lbrand"><span class="mark"></span><div><b>SOMDEJ CORE</b><span>ฝ่ายทรัพยากรบุคคล โรงพยาบาลสมเด็จพระบรมราชเทวี ณ ศรีราชา</span></div></div>' +
    '<p class="ltitle">ระบบทบทวน<b>รายการหัตถการและอัตราค่าตอบแทน</b>แพทย์เวรที่ปรึกษาประจำฝ่ายหรือหน่วยการแพทย์</p>' +
    (dl.closeAt ? '<div class="ldue"><div>เปิดให้กรอก<b>' + esc(thDT(dl.openAt)) + '</b></div><div class="due">หัวหน้าฝ่ายยืนยันภายใน<b>' + esc(thDT(dl.closeAt)) + '</b></div></div>' : '') +
    '<div class="seg-tabs" role="tablist"><button role="tab" data-mode="his" aria-selected="' + (mode === 'his') + '">แพทย์ (รหัสผ่าน HIS)</button><button role="tab" data-mode="local" aria-selected="' + (mode === 'local') + '">บัญชีระบบ (ไม่มี HIS)</button></div>' +
    '<form id="lf" novalidate>' + (msg ? '<div class="alert err" role="alert">' + ic('x') + '<span>' + esc(msg) + '</span></div>' : '') +
    '<label class="f"><span>เลขประจำตัวบุคลากร 7 หลัก</span><input class="in" id="emp" inputmode="numeric" autocomplete="username" maxlength="7" placeholder="5XXXXXX" value="' + esc(last) + '"></label>' +
    '<label class="f"><span>' + (mode === 'his' ? 'รหัสผ่าน HIS (รหัสเดียวกับที่ใช้เปิดเวชระเบียน)' : 'รหัสผ่านของระบบนี้') + '</span><div class="pw"><input class="in" id="pw" type="password" autocomplete="current-password"><button type="button" id="pwt" aria-label="แสดงรหัสผ่าน">' + ic('eye') + '</button></div></label>' +
    '<label class="check small"><input type="checkbox" id="rem"' + (lsGet('rem', true) ? ' checked' : '') + '> จดจำการเข้าสู่ระบบในเครื่องนี้ 7 วัน</label>' +
    '<button class="btn primary lg block" id="lb">เข้าสู่ระบบ</button></form>' +
    (window.DEMO_ACCOUNTS ? '<div class="demo"><div class="flabel">หน้าทดลองใช้ · เลือกบทบาทเพื่อเข้าทันที</div><div class="row">' + window.DEMO_ACCOUNTS.map(function (a, i) { return '<button class="btn sm" data-demo="' + i + '">' + esc(a.label) + '</button>'; }).join('') + '</div></div>' : '') +
    '<div class="lfoot">' + (mode === 'his' ? 'ไม่มีบัญชี HIS (เช่น เลขาฝ่าย)? เลือกแท็บ "บัญชีระบบ" และขอรหัสผ่านจากฝ่ายทรัพยากรบุคคล<br>' : 'บัญชีระบบสร้างโดยฝ่ายทรัพยากรบุคคล ครั้งแรกระบบจะให้ตั้งรหัสผ่านใหม่<br>') + 'สอบถาม ' + esc(window.APP_CONTACT || 'ฝ่ายทรัพยากรบุคคล โทรภายใน 23411') + '</div></div></main>';
  $$('[data-mode]').forEach(function (b) { b.onclick = function () { lsSet('mode', b.dataset.mode); renderLogin(); }; });
  $('#pwt').onclick = function () { var p = $('#pw'), sh = p.type === 'password'; p.type = sh ? 'text' : 'password'; this.innerHTML = ic(sh ? 'eyeoff' : 'eye'); };
  $('#emp').oninput = function () { this.value = this.value.replace(/\D/g, '').slice(0, 7); this.classList.remove('err'); };
  (last ? $('#pw') : $('#emp')).focus();
  $('#lf').onsubmit = function (e) {
    e.preventDefault(); var emp = $('#emp').value.trim(), pw = $('#pw').value;
    if (!/^\d{7}$/.test(emp)) { $('#emp').classList.add('err'); $('#emp').focus(); return; }
    if (!pw) { $('#pw').classList.add('err'); $('#pw').focus(); return; }
    doLogin(emp, pw, lsGet('mode', 'his'), $('#rem').checked, $('#lb'));
  };
  $$('[data-demo]').forEach(function (b) { b.onclick = function () { var a = window.DEMO_ACCOUNTS[+b.dataset.demo]; lsSet('mode', a.mode); doLogin(a.emp, a.pass, a.mode, true, b); }; });
}
function doLogin(emp, pw, mode, rem, btn) {
  busy(btn, true, 'กำลังตรวจสอบ…');
  api('login', { emp: emp, pass: pw, mode: mode, remember: rem, ua: navigator.userAgent }, { retry: 0 }).then(function (d) {
    lsSet('emp', emp); lsSet('rem', rem); S.token = d.token;
    if (rem) lsSet('token', d.token); else { lsDel('token'); ssSet('token', d.token); }
    setBoot(d.boot); if (!location.hash) location.hash = '#/home'; route();
  }).catch(function (e) { renderLogin(e.message); });
}
function setBoot(b) { S.boot = b; S._ii = null; window.PUBLIC_DATES = { openAt: b.phase.openAt, closeAt: b.phase.closeAt }; lsSet('dates', window.PUBLIC_DATES); }
function logout(expired) {
  S.token = ''; S.boot = null; S.div = {}; S.dirty = 0; lsDel('token'); try { sessionStorage.removeItem('core2:token'); } catch (e) { }
  closeDrawer(); closeModal(); endTour();
  history.replaceState(null, '', location.pathname + location.search);
  renderLogin(expired ? 'หมดเวลาการเข้าใช้ กรุณาเข้าสู่ระบบใหม่' : '');
}
function renderChangePw(forced) {
  var m = modal('<h2>' + (forced ? 'ตั้งรหัสผ่านของท่าน' : 'เปลี่ยนรหัสผ่าน') + '</h2><p class="muted" style="margin:8px 0 14px">' + (forced ? 'ท่านเข้าด้วยรหัสผ่านชั่วคราว กรุณาตั้งรหัสผ่านใหม่ก่อนใช้งาน' : '') + ' รหัสผ่านอย่างน้อย 8 ตัว มีทั้งตัวอักษรและตัวเลข</p>' +
    '<div class="stack"><label class="f"><span>รหัสผ่านปัจจุบัน' + (forced ? ' (ชั่วคราว)' : '') + '</span><input class="in" type="password" id="pc"></label><label class="f"><span>รหัสผ่านใหม่</span><input class="in" type="password" id="pn" autocomplete="new-password"></label><label class="f"><span>พิมพ์รหัสผ่านใหม่อีกครั้ง</span><input class="in" type="password" id="pn2" autocomplete="new-password"></label><div id="pe"></div></div>' +
    '<div class="act">' + (forced ? '<button class="btn" data-out>ออกจากระบบ</button>' : '<button class="btn" data-x>ยกเลิก</button>') + '<button class="btn primary" data-ok>บันทึกรหัสผ่าน</button></div>');
  if (forced) { $('#mscrim').onclick = null; m.querySelector('[data-out]').onclick = function () { closeModal(); logout(); }; } else m.querySelector('[data-x]').onclick = closeModal;
  m.querySelector('[data-ok]').onclick = function () {
    var b = this; if ($('#pn').value !== $('#pn2').value) { $('#pe').innerHTML = '<div class="alert err">รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน</div>'; return; }
    busy(b, true);
    apiW('changePassword', { current: $('#pc').value, next: $('#pn').value }).then(function (d) { S.token = d.token; if (lsGet('token', '')) lsSet('token', d.token); else ssSet('token', d.token); setBoot(d.boot); closeModal(); toast('ตั้งรหัสผ่านแล้ว'); route(); })
      .catch(function (e) { busy(b, false); $('#pe').innerHTML = '<div class="alert err">' + esc(e.message) + '</div>'; });
  };
}

/* ---------- โครงหน้า ---------- */
function navModel() {
  var m = me(), d = myDiv(), out = [];
  out.push(['sec', 'งานของฉัน']);
  out.push(['home', '#/home', 'หน้าแรก']);
  if (d) {
    var sd = S.div[d], ed = sd ? sd.rows.length : 0, nw = sd ? sd.newItems.length : 0, cf = locked(d);
    out.push(['n1', '#/sheet', 'ทบทวนรายการเดิม', ed ? '<span class="badge">' + ed + '</span>' : '']);
    out.push(['n2', '#/new', 'เสนอรายการใหม่', nw ? '<span class="badge">' + nw + '</span>' : '']);
    out.push(['n3', '#/confirm', canConfirm(d) ? 'ตรวจและยืนยันส่ง HR' : 'สถานะการยืนยัน', cf ? '<span class="done">' + ic('check') + '</span>' : '']);
  }
  if (m.viewAll) { out.push(['sec', 'ฝ่ายทรัพยากรบุคคล / ผู้บริหาร']); out.push(['chart', '#/overview', 'ภาพรวมทุกฝ่าย']); out.push(['download', '#/export', 'รายงาน Excel']); }
  if (m.isAdmin) out.push(['settings', '#/settings', 'ตั้งค่าระบบ']);
  out.push(['sec', 'ช่วยเหลือ']); out.push(['help', '#/help', 'วิธีใช้งาน']);
  return out;
}
function shell(content, crumb) {
  var m = me(), cur = '#/' + (S.route.split('/')[1] || 'home'), ph = B().phase, d = myDiv();
  var nav = navModel().map(function (n) {
    if (n[0] === 'sec') return '<div class="sec">' + esc(n[1]) + '</div>';
    var on = n[1] === cur, icn = /^n\d$/.test(n[0]) ? '<span class="num">' + n[0].slice(1) + '</span>' : ic(n[0]);
    return '<a href="' + n[1] + '"' + (on ? ' aria-current="page"' : '') + '>' + icn + '<span>' + esc(n[2]) + '</span>' + (n[3] || '') + '</a>';
  }).join('');
  var bn = [['home', '#/home', 'หน้าแรก']];
  if (d) { bn.push(['sheet', '#/sheet', 'รายการเดิม']); bn.push(['plus', '#/new', 'เสนอใหม่']); bn.push(['send', '#/confirm', 'ยืนยัน']); }
  if (m.viewAll) bn.push(['chart', '#/overview', 'ภาพรวม']);
  var soon = ph.phase === 'open' && msOf(ph.closeAt) - Date.now() < 3 * 86400000;
  document.title = (crumb ? crumb + ' · ' : '') + 'SOMDEJ CORE';
  $('#app').innerHTML = '<div class="app"><aside class="side" aria-label="เมนูหลัก"><a class="brand" href="#/home"><span class="mark"></span><span><b>SOMDEJ CORE</b><span>ทบทวนหัตถการและค่าตอบแทน</span></span></a>' +
    (d && canEdit(d) ? '<a class="addbtn" href="#/new?add=1">' + ic('plus') + 'เสนอรายการใหม่</a>' : '') +
    '<nav class="nav">' + nav + '</nav><div class="who"><span class="avatar">' + esc(initials(m.name)) + '</span><div class="grow"><b>' + esc(m.name) + '</b><div class="r">' + esc(divName(m.divId, true)) + ' · ' + esc(roleText()[0]) + '</div></div>' +
    '<div class="tools">' + (m.kind === 'local' ? '<button data-t="pw" title="เปลี่ยนรหัสผ่าน" aria-label="เปลี่ยนรหัสผ่าน">' + ic('key') + '</button>' : '') + '<button data-t="theme" title="โหมดสว่าง/มืด" aria-label="สลับโหมดสว่างหรือมืด">' + ic('moon') + '</button><button data-t="out" title="ออกจากระบบ" aria-label="ออกจากระบบ">' + ic('logout') + '</button></div></div>' +
    '<div class="ver">รุ่น ' + esc(B().app.build) + '</div></aside>' +
    '<div class="main"><header class="top"><a class="mtop" href="#/home"><span class="mark"></span>CORE</a><span class="crumb">' + esc(crumb || '') + '</span><span class="grow"></span>' +
    '<span class="due-chip ' + (soon ? 'soon' : ph.phase === 'open' ? '' : 'off') + '"><i></i>' + (ph.phase === 'open' ? 'ยืนยันภายใน ' + esc(thDT(ph.closeAt)) : esc(B().phaseTh)) + '</span>' +
    '<button class="helpbtn" id="hb">' + ic('help') + '<span>คำแนะนำการใช้งาน</span></button>' + '<button class="btn ghost sm mtools" id="mob-out" style="display:none" aria-label="ออกจากระบบ">' + ic('logout') + '</button></header>' +
    '<main class="page" id="page">' + content + '</main></div></div>' +
    '<nav class="bnav" aria-label="เมนูหลัก">' + bn.map(function (n) { return '<a href="' + n[1] + '"' + (n[1] === cur ? ' aria-current="page"' : '') + '>' + ic(n[0]) + '<span>' + n[2] + '</span></a>'; }).join('') + '</nav>';
  $$('.who [data-t]').forEach(function (b) { b.onclick = function () { var t = b.dataset.t; if (t === 'out') logout(); else if (t === 'theme') toggleTheme(); else renderChangePw(false); }; });
  $('#hb').onclick = function () { openHelp(S.route.split('/')[1] || 'home'); };
  if (matchMedia('(max-width:980px)').matches) { var mo = $('#mob-out'); mo.style.display = ''; mo.onclick = function () { confirmBox('ออกจากระบบ?', '', 'ออกจากระบบ').then(function (y) { if (y) logout(); }); }; }
}
function pageHead(eb, title, desc, act, helpKey) {
  return '<div class="ph"><div>' + (eb ? '<div class="eb">' + eb + '</div>' : '') + '<h1>' + esc(title) + (helpKey ? '<button class="q" data-help="' + helpKey + '" aria-label="คำแนะนำ" title="คำแนะนำ">?</button>' : '') + '</h1>' + (desc ? '<p>' + desc + '</p>' : '') + '</div>' + (act ? '<div class="act">' + act + '</div>' : '') + '</div>';
}
function bindHelpQ() { $$('[data-help]').forEach(function (b) { b.onclick = function () { openHelp(b.dataset.help); }; }); }
function loadingHtml() { return '<div class="loading"><span class="spin"></span><p>กำลังโหลด…</p></div>'; }
function errorHtml(m) { return '<div class="card"><div class="empty"><h3>โหลดข้อมูลไม่สำเร็จ</h3><p>' + esc(m) + '</p><button class="btn" onclick="route()">ลองอีกครั้ง</button></div></div>'; }

/* ---------- ข้อมูลฝ่าย ---------- */
function loadDiv(divId, force) {
  if (!divId) return Promise.resolve(null);
  if (S.div[divId] && !force) return Promise.resolve(S.div[divId]);
  return api('getDiv', { divId: divId }).then(function (d) { indexDiv(d); S.div[divId] = d; if (d.confirm) S.boot.confirms[divId] = { status: d.confirm.status, by: d.confirm.byName, at: d.confirm.at }; else delete S.boot.confirms[divId]; return d; });
}
function indexDiv(d) { d.map = {}; d.rows.forEach(function (r) { d.map[r.itemId] = r; }); d.ownSet = {}; d.owned.forEach(function (id) { d.ownSet[id] = 1; }); }
function refreshBoot() { return api('bootstrap').then(function (b) { setBoot(b); }); }

/* ---------- เส้นทาง ---------- */
function route() {
  if (!S.boot) return;
  if (S.boot.me.mustChange) { shell('<div class="empty"><h3>กรุณาตั้งรหัสผ่านใหม่</h3></div>'); renderChangePw(true); return; }
  var h = location.hash || '#/home', parts = h.slice(2).split('?')[0].split('/'), q = {};
  (h.split('?')[1] || '').split('&').forEach(function (kv) { if (kv) { var p = kv.split('='); q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); } });
  var prev = S.route; S.route = '/' + parts.join('/'); closeDrawer(); closeModal();
  var pg = { home: pageHome, sheet: pageSheet, new: pageNew, confirm: pageConfirm, overview: pageOverview, export: pageExport, settings: pageSettings, help: pageHelp }[parts[0]] || pageHome;
  pg(q, parts);
  if (prev !== S.route) window.scrollTo(0, 0);
}
window.addEventListener('hashchange', function (e) {
  if (S.dirty && !confirm('มีรายการที่ยังไม่ได้บันทึก ' + S.dirty + ' แถว ต้องการออกจากหน้านี้โดยไม่บันทึกใช่ไหม?')) { history.replaceState(null, '', e.oldURL.slice(e.oldURL.indexOf('#'))); return; }
  S.dirty = 0; route();
});
window.addEventListener('beforeunload', function (e) { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- หน้าแรก ---------- */
function stepsHtml(d, on) {
  var divId = d ? d.divId : '', cf = confirmOf(divId), ed = d ? d.rows.length : 0, nw = d ? d.newItems.length : 0;
  var cfState = cf && cf.status === 'confirmed' ? 'done' : (ed + nw ? 'flag' : '');
  return '<nav class="steps" aria-label="ขั้นตอน">' +
    '<a class="step' + (on === 1 ? ' on' : ed ? ' done' : '') + '" href="#/sheet' + (divId && divId !== myDiv() ? '/' + divId : '') + '"><span class="n">' + (ed && on !== 1 ? '✓' : '1') + '</span><span><b>ทบทวนรายการเดิม</b><small>' + (ed ? 'แก้ไข/ยกเลิกแล้ว ' + ed + ' รายการ' : 'ไม่แก้ = คงเดิม') + '</small></span></a>' +
    '<a class="step' + (on === 2 ? ' on' : nw ? ' done' : '') + '" href="#/new' + (divId && divId !== myDiv() ? '/' + divId : '') + '"><span class="n">' + (nw && on !== 2 ? '✓' : '2') + '</span><span><b>เสนอรายการใหม่</b><small>' + (nw ? 'เสนอแล้ว ' + nw + ' รายการ' : 'ถ้ามีหัตถการที่ยังไม่อยู่ในคำสั่ง') + '</small></span></a>' +
    '<a class="step' + (on === 3 ? ' on' : ' ' + cfState) + '" href="#/confirm' + (divId && divId !== myDiv() ? '/' + divId : '') + '"><span class="n">' + (cfState === 'done' ? '✓' : cfState === 'flag' ? '!' : '3') + '</span><span><b>หัวหน้าฝ่ายยืนยันส่ง HR</b><small>' + (cfState === 'done' ? 'ยืนยันแล้ว ' + esc(thDT(cf.at)) : 'หัวหน้าฝ่ายยังไม่ยืนยัน') + '</small></span></a></nav>';
}
function countdown(to) { var ms = msOf(to) - Date.now(); if (ms <= 0) return null; return { d: Math.floor(ms / 864e5), h: Math.floor(ms % 864e5 / 36e5), m: Math.floor(ms % 36e5 / 6e4) }; }
function pageHome() {
  var m = me(), d0 = myDiv();
  shell(loadingHtml(), 'หน้าแรก');
  loadDiv(d0).then(function (d) {
    var ph = B().phase, cd = ph.phase === 'open' ? countdown(ph.closeAt) : ph.phase === 'before' ? countdown(ph.openAt) : null, cf = confirmOf(d0);
    var chips = ['<span>' + esc(divName(m.divId)) + '</span>'].concat(roleText().map(function (r) { return '<span>' + esc(r) + '</span>'; }));
    if (d0) chips.push(cf && cf.status === 'confirmed' ? '<span class="warn">✓ หัวหน้าฝ่ายยืนยันแล้ว</span>' : '<span class="warn">⚑ หัวหน้าฝ่ายยังไม่ยืนยัน</span>');
    var html = '<section class="hero"><div><div class="hi">สวัสดีครับ/ค่ะ</div><h1>' + esc(m.name) + '</h1><p>' + esc(B().settings.welcome) + '</p><div class="chips">' + chips.join('') + '</div></div>' +
      (cd ? '<div class="cd"><div class="l">' + (ph.phase === 'before' ? 'เปิดให้กรอกในอีก' : 'เหลือเวลาก่อนปิดรับ') + '</div><div class="n"><div><b>' + cd.d + '</b><span>วัน</span></div><div><b>' + cd.h + '</b><span>ชั่วโมง</span></div><div><b>' + cd.m + '</b><span>นาที</span></div></div><div class="d">' + esc(thDT(ph.phase === 'before' ? ph.openAt : ph.closeAt, { long: true })) + '</div></div>'
        : '<div class="cd"><div class="l">สถานะ</div><div style="font:600 20px var(--font-d);margin-top:6px">' + esc(B().phaseTh) + '</div></div>') + '</section>';
    if (!d0 && !m.viewAll) html += '<div class="alert warn">' + ic('flag') + '<span><b>ระบบยังไม่พบฝ่ายของท่านจาก HRMi</b> ท่านจึงยังกรอกไม่ได้ กรุณาติดต่อ ' + esc(B().settings.contactText) + ' เพื่อระบุฝ่าย</span></div>';
    if (d) {
      var ed = d.rows.filter(function (r) { return r.status === 'edit'; }).length, ca = d.rows.filter(function (r) { return r.status === 'cancel'; }).length;
      html += stepsHtml(d, 0) +
        '<div class="kpis"><a class="kpi" href="#/sheet"><span class="ic brand">' + ic('sheet') + '</span><div><b>' + d.owned.length + '</b><span>รายการในหมวดของฝ่าย</span></div></a>' +
        '<a class="kpi" href="#/sheet?f=edit"><span class="ic edit">' + ic('pencil') + '</span><div><b>' + ed + '</b><span>เสนอแก้ไข</span></div></a>' +
        '<a class="kpi" href="#/sheet?f=cancel"><span class="ic cancel">' + ic('ban') + '</span><div><b>' + ca + '</b><span>เสนอยกเลิก</span></div></a>' +
        '<a class="kpi" href="#/new"><span class="ic new">' + ic('plus') + '</span><div><b>' + d.newItems.length + '</b><span>เสนอรายการใหม่</span></div></a></div>';
      html += '<div class="grid" style="margin-top:16px"><section class="card"><div class="ch"><div class="grow"><h2>เริ่มต้นใช้งานใน 3 ขั้น</h2><p>ใช้เวลาประมาณ 5–10 นาที</p></div></div><div class="cb"><ol class="hsteps">' +
        '<li><b>เปิด "ทบทวนรายการเดิม"</b><p>ระบบเปิดหมวดของ' + esc(divName(d.divId, true)) + 'ให้อัตโนมัติ รายการไหนยังเหมาะสม <b>ไม่ต้องทำอะไร</b> (ถือว่าคงเดิม)</p></li>' +
        '<li><b>กด "แก้ไข" หรือ "ยกเลิก" เฉพาะแถวที่ต้องการ</b><p>กรอกชื่อใหม่ อัตราใหม่ อ้างอิง หรือเหตุผล แล้วกด <b>บันทึก</b> ที่แถบด้านล่าง</p></li>' +
        '<li><b>หัตถการที่ยังไม่มีในคำสั่ง → "เสนอรายการใหม่"</b><p>จากนั้นหัวหน้าฝ่ายตรวจแล้วกด <b>ยืนยันส่ง HR</b></p></li></ol>' +
        '<div class="row wrap"><a class="btn primary" href="#/sheet">' + ic('sheet') + 'เริ่มทบทวนรายการ</a><button class="btn" onclick="startTour(true)">' + ic('bulb') + 'พาชมระบบ</button></div></div></section>' +
        '<section class="card"><div class="ch"><div class="grow"><h2>ความเคลื่อนไหวล่าสุดในฝ่าย</h2></div><a class="btn sm" href="#/confirm">' + ic('list') + 'ดูทั้งหมด</a></div><div class="cb" id="recent">' + loadingHtml() + '</div></section></div>';
    } else if (m.viewAll) html += '<div class="big3"><a href="#/overview"><span class="n">' + ic('chart') + '</span><h3>ภาพรวมทุกฝ่าย</h3><p>สถานะการกรอกและการยืนยันของหัวหน้าฝ่ายทุกฝ่าย</p><span class="go">เปิดภาพรวม</span></a><a href="#/export"><span class="n">' + ic('download') + '</span><h3>รายงาน Excel</h3><p>ดาวน์โหลดข้อเสนอทั้งหมดพร้อมชื่อผู้เสนอ</p><span class="go">ดาวน์โหลด</span></a><a href="#/help"><span class="n">' + ic('help') + '</span><h3>วิธีใช้งาน</h3><p>คู่มือทีละขั้นสำหรับแพทย์ หัวหน้าฝ่าย และ HR</p><span class="go">อ่านคู่มือ</span></a></div>';
    $('#page').innerHTML = html;
    if (d) recentInto($('#recent'), d.divId, 7);
    if (d && !lsGet('toured', false)) setTimeout(function () { startTour(false); }, 600);
  }).catch(function (e) { $('#page').innerHTML = errorHtml(e.message); });
}
var ACT_TH = { ROW: 'แก้แผ่นงาน', NEW_ADD: 'เสนอรายการใหม่', NEW_EDIT: 'แก้รายการเสนอ', NEW_DELETE: 'ลบรายการเสนอ', CONFIRM: 'หัวหน้าฝ่ายยืนยันส่ง HR', REOPEN: 'HR เปิดให้แก้ไข' };
function recentInto(el, divId, n) {
  api('history', { divId: divId }).then(function (h) {
    h = h.slice(0, n || 50);
    el.innerHTML = h.length ? h.map(function (x) {
      var it = itemById(x.ref), dt = x.detail || {}, what = it ? 'ข้อ ' + it.code + ' ' + it.name.slice(0, 60) : (dt.name ? (dt.name[1] || dt.name) : '');
      var st = dt.status ? ' → ' + (B().labels.status[dt.status[1]] || dt.status[1]) : '';
      return '<div class="row" style="align-items:flex-start;padding:9px 0;border-bottom:1px solid var(--line-2)"><span class="avatar" style="background:var(--surface-2);color:var(--ink-2);border:1px solid var(--line)">' + esc(initials(x.name)) + '</span><div class="grow small"><b>' + esc(x.name || x.emp) + '</b> ' + esc(ACT_TH[x.action] || x.action) + esc(st) + '<div class="muted">' + esc(String(what).slice(0, 90)) + '</div></div><span class="tiny muted nowrap">' + esc(ago(x.at)) + '</span></div>';
    }).join('') : '<p class="muted" style="margin:0">ยังไม่มีการกรอกในฝ่าย ท่านเริ่มเป็นคนแรกได้</p>';
  }).catch(function (e) { el.innerHTML = '<p class="muted">' + esc(e.message) + '</p>'; });
}

/* ---------- คำแนะนำ (ลิ้นชักตามหน้า) ---------- */
var HELP = {
  home: ['ภาพรวมของท่าน', ['ดูสถานะ 3 ขั้นของฝ่ายที่แถบด้านบน ขั้นที่มีเครื่องหมาย ✓ คือทำแล้ว', 'ตัวเลขสรุป: รายการในหมวดของฝ่าย / เสนอแก้ไข / เสนอยกเลิก / เสนอใหม่ แตะเพื่อเปิดดู', 'กด "พาชมระบบ" เพื่อดูจุดสำคัญอีกครั้ง']],
  sheet: ['ทบทวนรายการเดิม', ['ระบบเปิด <b>หมวดของฝ่ายท่าน</b> ให้ก่อน เปลี่ยนหมวดหรือดูทุกหมวดได้ที่ช่อง "หมวด"', 'รายการที่ยังเหมาะสม <b>ไม่ต้องทำอะไร</b> ระบบถือว่า "คงเดิม"', 'ต้องการแก้: กด <b>แก้ไข</b> ที่แถว แล้วกรอกชื่อใหม่/อัตราใหม่/อ้างอิง/เทียบเคียง (กรอกเฉพาะช่องที่เกี่ยวข้อง)', 'ไม่ได้ทำแล้ว: กด <b>ยกเลิก</b> แล้วใส่เหตุผลในช่องหมายเหตุ', 'กด <b>บันทึก</b> ที่แถบสีดำด้านล่าง (บันทึกได้หลายแถวพร้อมกัน)', 'ช่อง "แก้ล่าสุด" แสดงชื่อผู้กรอก กด <b>ประวัติ</b> เพื่อดูว่าใครแก้อะไร เมื่อไร', 'แพทย์ในฝ่ายเดียวกันเห็นและแก้ต่อกันได้ ถ้ามีคนแก้แถวเดียวกันพร้อมกัน ระบบจะเตือนก่อนบันทึกทับ']],
  new: ['เสนอรายการใหม่', ['กด <b>+ เพิ่มรายการใหม่</b> แล้วใส่ชื่อหัตถการและอัตราที่เสนอ', 'เลือก "เทียบกับข้อ" ระบบจะแสดงอัตราเดิมของข้อนั้นและส่วนต่างให้', 'ใส่ข้อมูลเทียบเคียง (โรงพยาบาล/อัตรา) และอ้างอิงถ้ามี แนบไฟล์หรือลิงก์ได้', 'กด <b>บันทึก</b> ที่การ์ด · แก้หรือลบได้จนกว่าหัวหน้าฝ่ายยืนยัน']],
  confirm: ['ตรวจและยืนยันส่ง HR', ['หน้านี้สรุปทุกรายการที่ฝ่ายเสนอแก้ไข ยกเลิก และเสนอใหม่ พร้อมชื่อผู้กรอก', '<b>หัวหน้าฝ่าย/ผู้รับมอบ</b>: ตรวจแล้วกด <b>ยืนยันส่ง HR</b> ข้อมูลของฝ่ายจะถูกล็อก', 'ถ้าฝ่ายไม่มีรายการที่ต้องแก้ ก็กดยืนยันได้เลย (หมายถึงคงเดิมทุกรายการ)', 'ต้องแก้หลังยืนยัน: ติดต่อฝ่ายทรัพยากรบุคคลเพื่อเปิดให้แก้']],
  overview: ['ภาพรวมทุกฝ่าย (HR)', ['ธงแดง <b>หัวหน้าฝ่ายยังไม่ยืนยัน</b> = ฝ่ายที่ต้องติดตาม', 'แตะชื่อฝ่ายเพื่อเปิดแผ่นงานของฝ่ายนั้น (HR แก้แทนได้)', 'เลือกฝ่ายแล้วกด "ส่งอีเมลเตือน" เพื่อเตือนหัวหน้าฝ่าย']],
  export: ['รายงาน', ['Excel มีทุกข้อเสนอพร้อมชื่อผู้กรอกและเวลา ใช้สรุปออกคำสั่งใหม่', 'หน้าพิมพ์ใช้นำเข้าที่ประชุม']],
  settings: ['ตั้งค่าระบบ', ['ทั่วไป: วันเปิด–ปิด ข้อความต้อนรับ', 'ฝ่าย: หัวหน้าฝ่าย ผู้รับมอบ อีเมล', 'ผู้ใช้: สร้างบัญชีระบบให้ผู้ที่ไม่มี HIS · กำหนดผู้ดูแล/ผู้บริหาร/ผู้ประสานงาน', 'อีเมล: เปิด-ปิดการเตือนอัตโนมัติ']],
  help: ['วิธีใช้งาน', ['อ่านคู่มือทีละขั้นในหน้านี้ หรือกด "พาชมระบบ"']]
};
function openHelp(key) {
  var h = HELP[key] || HELP.home;
  drawer(ic('help') + ' คำแนะนำ: ' + esc(h[0]), '<ol class="hsteps">' + h[1].map(function (t) { return '<li><p>' + t + '</p></li>'; }).join('') + '</ol>' +
    '<div class="row wrap" style="margin-top:6px"><a class="btn" href="#/help">' + ic('list') + 'คู่มือฉบับเต็ม</a>' + (myDiv() ? '<button class="btn" id="tourbtn">' + ic('bulb') + 'พาชมระบบ</button>' : '') + '</div>' +
    '<div class="alert info" style="margin-top:16px">' + ic('help') + '<span>สอบถาม ' + esc(B().settings.contactName) + ' ' + esc(B().settings.contactText) + '</span></div>');
  var t = $('#tourbtn'); if (t) t.onclick = function () { closeDrawer(); startTour(true); };
}

/* ---------- พาชมระบบ (ครั้งแรก) ---------- */
var TOUR = [
  ['.steps', 'งานมี 3 ขั้น', 'ทบทวนรายการเดิม → เสนอรายการใหม่ (ถ้ามี) → หัวหน้าฝ่ายยืนยันส่ง HR แตะแต่ละขั้นเพื่อไปที่หน้านั้น'],
  ['.kpis', 'สรุปของฝ่าย', 'จำนวนรายการในหมวดของฝ่าย และที่แพทย์ในฝ่ายเสนอแก้ไข ยกเลิก หรือเสนอใหม่'],
  ['.nav a[href="#/sheet"], .bnav a[href="#/sheet"]', 'เริ่มที่ "ทบทวนรายการเดิม"', 'รายการที่ยังเหมาะสมไม่ต้องกดอะไร กด "แก้ไข" หรือ "ยกเลิก" เฉพาะแถวที่ต้องการ แล้วกดบันทึก'],
  ['#hb', 'ติดตรงไหน กดที่นี่', 'ทุกหน้ามีคำแนะนำทีละขั้น หรือเปิดคู่มือฉบับเต็มได้']
];
var TI = 0;
function startTour(force) { if (!force && lsGet('toured', false)) return; if (S.route !== '/home') { location.hash = '#/home'; setTimeout(function () { startTour(true); }, 900); return; } TI = 0; showTour(); }
function showTour() {
  endTour(true);
  var st = TOUR[TI]; if (!st) { endTour(); return; }
  var el = $$(st[0]).filter(function (e) { return e.offsetParent !== null; })[0];
  if (!el) { TI++; showTour(); return; }
  el.scrollIntoView({ block: 'center' });
  setTimeout(function () {
    var r = el.getBoundingClientRect(), hole = document.createElement('div'), pop = document.createElement('div');
    hole.className = 'tour-hole'; hole.style.cssText = 'left:' + (r.left - 6) + 'px;top:' + (r.top - 6) + 'px;width:' + (r.width + 12) + 'px;height:' + (r.height + 12) + 'px';
    pop.className = 'tour-pop'; pop.setAttribute('role', 'dialog');
    pop.innerHTML = '<div class="tiny muted">' + (TI + 1) + ' / ' + TOUR.length + '</div><h3>' + esc(st[1]) + '</h3><p>' + esc(st[2]) + '</p><div class="row"><button class="btn ghost sm" data-e>ข้าม</button><button class="btn primary sm" data-n>' + (TI === TOUR.length - 1 ? 'เริ่มใช้งาน' : 'ถัดไป') + '</button></div>';
    document.body.appendChild(hole); document.body.appendChild(pop);
    var top = r.bottom + 16; if (top + 200 > innerHeight) top = Math.max(12, r.top - 200);
    pop.style.top = top + 'px'; pop.style.left = Math.max(12, Math.min(innerWidth - pop.offsetWidth - 12, r.left)) + 'px';
    pop.querySelector('[data-e]').onclick = function () { endTour(); };
    pop.querySelector('[data-n]').onclick = function () { TI++; showTour(); };
    pop.querySelector('[data-n]').focus();
  }, 250);
}
function endTour(keep) { $$('.tour-hole, .tour-pop').forEach(function (e) { e.remove(); }); if (!keep) lsSet('toured', true); }

/* ---------- คู่มือฉบับเต็ม ---------- */
function pageHelp() {
  var st = B().settings, tri = function (s) { return '<span class="tri demo-ui" style="width:220px"><button aria-pressed="' + (s === 'keep') + '" data-s="keep">คงเดิม</button><button aria-pressed="' + (s === 'edit') + '" data-s="edit">แก้ไข</button><button aria-pressed="' + (s === 'cancel') + '" data-s="cancel">ยกเลิก</button></span>'; };
  shell(pageHead('คู่มือ', 'วิธีใช้งาน SOMDEJ CORE', 'อ่านจบใน 3 นาที · ระบบนี้แทนการกรอก Google Sheet: ทุกคนในฝ่ายกรอกแผ่นงานเดียวกันได้ ระบบบันทึกชื่อและเวลาของทุกการแก้ไข', '<button class="btn" onclick="startTour(true)">' + ic('bulb') + 'พาชมระบบ</button>') +
    '<div class="grid"><section class="card"><div class="ch"><h2>สำหรับแพทย์</h2></div><div class="cb"><ol class="hsteps">' +
    '<li><b>เข้าสู่ระบบ</b><p>เลขประจำตัว 7 หลัก + รหัสผ่าน HIS (รหัสเดียวกับเปิดเวชระเบียน) ระบบรู้ฝ่ายของท่านจาก HRMi ให้อัตโนมัติ</p></li>' +
    '<li><b>เมนู "ทบทวนรายการเดิม"</b><p>ระบบแสดงหมวดของฝ่ายท่านก่อน ดูหมวดอื่นได้ที่ช่อง "หมวด" ค้นหาชื่อหรือเลขข้อได้</p></li>' +
    '<li><b>เลือกสถานะเฉพาะแถวที่ต้องการเปลี่ยน</b><p>' + tri('keep') + ' ไม่ต้องกด (ค่าเริ่มต้น)<br>' + tri('edit') + ' ใส่ชื่อใหม่ / อัตราใหม่ / อ้างอิง / เทียบเคียง<br>' + tri('cancel') + ' ใส่เหตุผลในช่องหมายเหตุ</p></li>' +
    '<li><b>กดบันทึก</b><p>แถบสีดำด้านล่างบอกจำนวนแถวที่ยังไม่บันทึก กด <b>บันทึก</b> ครั้งเดียวได้ทุกแถว</p></li>' +
    '<li><b>เสนอรายการใหม่ (ถ้ามี)</b><p>เมนู "เสนอรายการใหม่" → <b>+ เพิ่มรายการใหม่</b> → ชื่อ อัตรา เทียบกับข้อใด เทียบเคียงที่ไหน เท่าไร → บันทึก</p></li></ol></div></section>' +
    '<section class="card"><div class="ch"><h2>สำหรับหัวหน้าฝ่าย / ผู้รับมอบ</h2></div><div class="cb"><ol class="hsteps">' +
    '<li><b>เปิด "ตรวจและยืนยันส่ง HR"</b><p>เห็นทุกรายการที่ฝ่ายเสนอ พร้อมชื่อแพทย์ผู้กรอก แก้ไขเองได้ในแผ่นงาน</p></li>' +
    '<li><b>กด "ยืนยันส่ง HR"</b><p>ฝ่ายทรัพยากรบุคคลได้รับแจ้งทันที ข้อมูลของฝ่ายถูกล็อก · ถ้ายังไม่ยืนยัน HR จะเห็นธง <span class="pill flag">หัวหน้าฝ่ายยังไม่ยืนยัน</span></p></li>' +
    '<li><b>ต้องแก้หลังยืนยัน</b><p>ติดต่อฝ่ายทรัพยากรบุคคลให้เปิดแก้</p></li></ol>' +
    '<h2 style="font-size:17px;margin:8px 0 10px">สำหรับเลขาฝ่าย / ผู้ประสานงาน</h2><p class="small" style="margin:0">ขอบัญชีระบบที่ฝ่ายทรัพยากรบุคคล เข้าที่แท็บ "บัญชีระบบ (ไม่มี HIS)" กรอกแผ่นงานแทนแพทย์ได้ ระบบบันทึกชื่อผู้กรอก</p></div></section></div>' +
    '<section class="card"><div class="ch"><h2>คำถามที่พบบ่อย</h2></div><div class="cb faq">' +
    [['รายการที่ไม่ได้กดอะไร จะถือว่าอะไร?', 'ถือว่า "คงเดิม" ไม่ต้องกดทีละรายการ'], ['คนอื่นในฝ่ายแก้แถวเดียวกันได้ไหม?', 'ได้ เหมือน Google Sheet ระบบแสดงชื่อผู้แก้ล่าสุด และเก็บประวัติทุกครั้ง ถ้าแก้พร้อมกัน ระบบจะเตือนก่อนบันทึกทับ'], ['ลืมกดบันทึกแล้วปิดหน้า?', 'ระบบจะถามก่อนออกจากหน้าเสมอเมื่อมีแถวที่ยังไม่บันทึก'], ['เข้าระบบไม่ได้?', 'ตรวจว่าใช้รหัสผ่าน HIS ถ้าใส่ผิด 5 ครั้งระบบพัก 10 นาที ผู้ที่ไม่มีบัญชี HIS ขอบัญชีระบบที่ฝ่ายทรัพยากรบุคคล'], ['ฝ่ายของฉันไม่ถูกต้อง?', 'แจ้งฝ่ายทรัพยากรบุคคลเพื่อแก้ฝ่ายในระบบ']].map(function (q) { return '<details><summary>' + q[0] + '</summary><p>' + q[1] + '</p></details>'; }).join('') +
    '<p class="small muted" style="margin-top:14px">ติดต่อ ' + esc(st.contactName) + ' ' + esc(st.contactText) + '</p></div></section>', 'วิธีใช้งาน');
}

/* ---------- เริ่มต้น ---------- */
function boot() {
  window.PUBLIC_DATES = lsGet('dates', null);
  S.token = lsGet('token', '') || ssGet('token') || '';
  if (!S.token) {
    renderLogin();
    api('ping', {}, { retry: 0 }).then(function (p) { var had = window.PUBLIC_DATES && window.PUBLIC_DATES.closeAt === p.closeAt; window.PUBLIC_DATES = { openAt: p.openAt, closeAt: p.closeAt }; lsSet('dates', window.PUBLIC_DATES); if (!had && !S.token && $('.lcard')) { var em = $('#emp').value; renderLogin(); $('#emp').value = em; } }).catch(function () { });
    return;
  }
  $('#app').innerHTML = loadingHtml();
  api('bootstrap').then(function (b) { setBoot(b); route(); }).catch(function (e) { if (S.token) renderLogin(e.message); });
}
document.addEventListener('DOMContentLoaded', boot);
