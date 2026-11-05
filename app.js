/* app.js — แกนหน้าเว็บ SOMDEJ CORE: เรียกหลังบ้าน · เข้าสู่ระบบ · โครงหน้า · เส้นทาง (#/…) · หน้าแรก · ตัวช่วย
 * หน้าอื่น: items.js (ทะเบียนรายการ + ความเห็น + เสนอเพิ่ม) · lead.js (ฝ่ายของฉัน/รับรองส่ง/รอบ 2) · hr.js (ภาพรวม/ผลพิจารณา/ส่งออก) · admin.js (ตั้งค่า) */
'use strict';
var FRONT = window.FRONT_BUILD || 'dev';
var S = { token: '', boot: null, div: {}, route: '', admin: null };
var $ = function (s, el) { return (el || document).querySelector(s); };
var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
function lsGet(k, d) { try { var v = localStorage.getItem('core:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem('core:' + k, JSON.stringify(v)); } catch (e) { } }
function lsDel(k) { try { localStorage.removeItem('core:' + k); } catch (e) { } }
function ssGet(k) { try { return sessionStorage.getItem('core:' + k); } catch (e) { return null; } }
function ssSet(k, v) { try { sessionStorage.setItem('core:' + k, v); } catch (e) { } }

/* ---------- เรียกหลังบ้าน ---------- */
var RID = 0;
function rid() { return Date.now().toString(36) + '-' + (++RID) + '-' + Math.random().toString(36).slice(2, 7); }
function api(action, payload, opt) {
  opt = opt || {};
  payload = payload || {};
  var body = { action: action, token: S.token, payload: payload };
  var run = function () {
    if (window.DEMO_RPC) return new Promise(function (res) { setTimeout(function () { res(window.DEMO_RPC(action, S.token, JSON.parse(JSON.stringify(payload)))); }, 140); });
    if (!window.API_URL) return Promise.reject(new Error('ยังไม่ได้ใส่ลิงก์ระบบหลังบ้านใน config.js'));
    return fetch(window.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  };
  var tries = 0;
  var go = function () {
    return run().catch(function (e) {
      if (++tries < (opt.retry == null ? 2 : opt.retry + 1)) return new Promise(function (res) { setTimeout(res, 900 * tries); }).then(go);
      throw new Error(/Failed to fetch|NetworkError|Load failed/i.test(e.message) ? 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง' : e.message);
    });
  };
  return go().then(function (r) {
    if (!r || !r.ok) {
      var err = r && r.error || 'เกิดข้อผิดพลาด';
      if (err === 'SESSION_EXPIRED') { logout(true); throw new Error('หมดเวลาการเข้าใช้ กรุณาเข้าสู่ระบบใหม่'); }
      throw new Error(err);
    }
    return r.data;
  });
}
/** คำสั่งเขียน: แนบเลขคำขอกันบันทึกซ้ำเมื่อส่งซ้ำ */
function apiW(action, payload) { payload = payload || {}; payload._rid = rid(); return api(action, payload); }

/* ---------- ตัวช่วย ---------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function fmt(n) { if (n === '' || n == null || isNaN(+n)) return '–'; return (+n).toLocaleString('th-TH', { maximumFractionDigits: 2 }); }
function baht(n) { return n === '' || n == null ? '–' : fmt(n) + ' บาท'; }
var TH_M = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
var TH_MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
/** วันเวลาไทย: รับ 'yyyy-MM-dd HH:mm:ss' หรือ 'yyyy-MM-ddTHH:mm' */
function thDT(s, o) {
  if (!s) return ''; o = o || {};
  var p = String(s).split(/[-T: ]/).map(Number), d = p[2] + ' ' + (o.long ? TH_M : TH_MS)[p[1] - 1] + ' ' + (o.long ? p[0] + 543 : String(p[0] + 543).slice(-2));
  if (o.date || p.length < 5) return d;
  return d + ' ' + ('0' + p[3]).slice(-2) + '.' + ('0' + p[4]).slice(-2) + ' น.';
}
function ago(s) {
  if (!s) return ''; var p = String(s).split(/[-T: ]/).map(Number), t = Date.UTC(p[0], p[1] - 1, p[2], p[3] - 7, p[4], p[5] || 0), m = (Date.now() - t) / 60000;
  if (m < 1) return 'เมื่อสักครู่'; if (m < 60) return Math.floor(m) + ' นาทีที่แล้ว'; if (m < 1440) return Math.floor(m / 60) + ' ชั่วโมงที่แล้ว'; if (m < 10080) return Math.floor(m / 1440) + ' วันที่แล้ว';
  return thDT(s, { date: true });
}
function isoMs(iso) { if (!iso) return 0; var p = iso.split(/[-T: ]/).map(Number); return Date.UTC(p[0], p[1] - 1, p[2], (p[3] || 0) - 7, p[4] || 0); }
function initials(n) { n = String(n || '').replace(/^(ผศ\.\(พิเศษ\) นพ\.|ศ\.|รศ\.|ผศ\.|นพ\.|พญ\.|ทพญ\.|ทพ\.|นาย|นางสาว|นาง|พว\.)\s*/, '').trim(); return n.charAt(0) || '?'; }
function debounce(fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; }
function B() { return S.boot; }
function me() { return S.boot.me; }
function divById(id) { return (S.boot.divisions || []).filter(function (d) { return d.id === id; })[0] || null; }
function divName(id, short) { var d = divById(id); return d ? (short ? d.short : d.name) : (id || 'ยังไม่ระบุฝ่าย'); }
function itemById(id) { if (!S._ii) { S._ii = {}; S.boot.items.forEach(function (i) { S._ii[i.id] = i; }); } return S._ii[id] || null; }
function catByNo(no) { return S.boot.categories.filter(function (c) { return c.no === +no; })[0] || null; }
function catLabel(no) { return +no === 20 ? 'ศด.' : String(no); }
function ownsCat(divId, no) { var c = catByNo(no); return !!c && c.owners.indexOf(divId) >= 0; }
function isLead(divId) { var m = me(); return m.isAdmin || m.leadDivs.indexOf(divId) >= 0; }
function canCertify(divId) { var m = me(); return m.certDivs.indexOf(divId) >= 0 || m.isAdmin; }
function locked(divId) { var s = S.boot.subs[divId + '|1']; return !!s && s.status === 'submitted'; }
function phase() { return S.boot.phase.phase; }
function writable(divId) { return !locked(divId) && (phase() === 'survey' || me().isAdmin) && !!divId; }
function roleNames() { var m = me(), L = S.boot.labels.roles, out = [];
  if (m.isAdmin) out.push(L.admin); if (m.isExec) out.push(L.exec);
  if (m.headOf.length) out.push('หัวหน้า' + m.headOf.map(function (d) { return divName(d, true); }).join(', '));
  if (m.delegOf.length) out.push('ผู้รับมอบ ' + m.delegOf.map(function (d) { return divName(d, true); }).join(', '));
  if (m.coordDivs.length) out.push('ผู้ประสานงาน ' + m.coordDivs.map(function (d) { return divName(d, true); }).join(', '));
  return out;
}
function stChip(st, label) { var L = S.boot.labels; return '<span class="st ' + esc(st || 'none') + '">' + esc(label || L.status[st] || L.pdec[st] || L.final[st] || 'ยังไม่ให้ความเห็น') + '</span>'; }
function pct(a, b) { return b ? Math.round(a * 100 / b) : 0; }

/* ---------- ไอคอน ---------- */
var IC = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', propose: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  team: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>', gavel: '<path d="m14 13-7.5 7.5a2.1 2.1 0 0 1-3-3L11 10"/><path d="m16 16 6-6M8 8l6-6M9 7l8 8M21 11l-8-8"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>', settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', check: '<path d="M20 6 9 17l-5-5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>', eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>', eyeoff: '<path d="M17.9 17.9A10.1 10.1 0 0 1 12 19c-7 0-11-7-11-7a18.4 18.4 0 0 1 5.1-5.9M9.9 4.2A9.1 9.1 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.2 3.2M1 1l22 22"/><path d="M14.1 14.1a3 3 0 1 1-4.2-4.2"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>', moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>', key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  clip: '<path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>', link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>', trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>', clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>', lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', unlock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  seal: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>', left: '<path d="m15 18-6-6 6-6"/>', print: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  hist: '<path d="M3 3v5h5"/><path d="M3.1 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 14 0v1"/>'
};
function ic(n, cls) { return '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || '') + '</svg>'; }

/* ---------- Toast / Modal / ลิ้นชัก ---------- */
function toast(msg, err) {
  var box = $('.toasts') || document.body.appendChild(Object.assign(document.createElement('div'), { className: 'toasts' }));
  box.setAttribute('role', 'status');
  var t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.innerHTML = ic(err ? 'x' : 'check') + '<span>' + esc(msg) + '</span>';
  box.appendChild(t); setTimeout(function () { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 320); }, err ? 5200 : 2600);
}
function modal(html, onMount) {
  closeModal();
  var sc = document.createElement('div'); sc.className = 'scrim top'; sc.id = 'mscrim';
  var m = document.createElement('div'); m.className = 'modal'; m.id = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.innerHTML = html;
  document.body.appendChild(sc); document.body.appendChild(m);
  sc.onclick = closeModal;
  var f = m.querySelector('[autofocus], input, textarea, button.primary, button'); if (f) setTimeout(function () { f.focus(); }, 30);
  if (onMount) onMount(m);
  return m;
}
function closeModal() { var a = $('#modal'), b = $('#mscrim'); if (a) a.remove(); if (b) b.remove(); }
function confirmBox(title, text, okLabel, danger) {
  return new Promise(function (res) {
    var m = modal('<h2>' + esc(title) + '</h2><p class="muted" style="margin:10px 0 0">' + text + '</p><div class="act"><button class="btn" data-x>ยกเลิก</button><button class="btn ' + (danger ? 'danger' : 'primary') + '" data-ok>' + esc(okLabel || 'ยืนยัน') + '</button></div>');
    m.querySelector('[data-x]').onclick = function () { closeModal(); res(false); };
    m.querySelector('[data-ok]').onclick = function () { closeModal(); res(true); };
  });
}
function openDrawer(html) {
  closeDrawer(true);
  var sc = document.createElement('div'); sc.className = 'scrim'; sc.id = 'dscrim';
  var d = document.createElement('aside'); d.className = 'drawer'; d.id = 'drawer'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.innerHTML = html;
  document.body.appendChild(sc); document.body.appendChild(d); document.body.style.overflow = 'hidden';
  sc.onclick = function () { closeDrawer(); };
  setTimeout(function () { var b = d.querySelector('[data-close]'); if (b) b.focus(); }, 40);
  return d;
}
function closeDrawer(silent) {
  var a = $('#drawer'), b = $('#dscrim'); if (a) a.remove(); if (b) b.remove(); document.body.style.overflow = '';
  if (!silent && /^#\/item\//.test(location.hash)) history.back();
}
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  if ($('#modal')) { closeModal(); return; }
  if ($('#drawer')) closeDrawer();
  var mn = $('.menu'); if (mn) mn.remove();
});
function busy(btn, on) { if (!btn) return; if (on) { btn.dataset.html = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span>' + esc(btn.dataset.busy || 'กำลังบันทึก…'); } else { btn.disabled = false; if (btn.dataset.html) btn.innerHTML = btn.dataset.html; } }

/* ---------- ธีม ---------- */
function applyTheme() { var t = lsGet('theme', ''); if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
function toggleTheme() { var cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); lsSet('theme', cur === 'dark' ? 'light' : 'dark'); applyTheme(); }
applyTheme();

/* ---------- เข้าสู่ระบบ ---------- */
var LEDGER_SAMPLE = [['2', 'การตรวจรักษาผู้ป่วยทั่วไป'], ['2.1', 'ตรวจรักษาผู้ป่วยในด้วยตนเอง กรณีขอคำปรึกษา', 50], ['2.4', 'การปรึกษาข้ามฝ่ายการแพทย์', 200], ['3', 'การตรวจรักษาผู้ป่วยภาวะวิกฤต'], ['3.1', 'การช่วยฟื้นชีพ (CPR)', 400], ['3.12', 'ภาวะติดเชื้อรุนแรง (septicemia)', 400], ['4', 'หัตถการทั่วไป'], ['4.3', 'Chest drain', 400], ['4.6', 'Endoscopic sclerotherapy', 800], ['7', 'หัตถการทางรังสีวิทยา'], ['7.2', 'Ultrasonography', 300], ['7.9', 'Diagnostic angiography', 1200], ['7.10', 'Embolization', 2400], ['8', 'หัตถการทางวิสัญญีวิทยา'], ['8.2', 'General anesthesia', 600], ['8.5', 'GA ราย open heart / aortic aneurysm', 2000], ['9', 'หัตถการทางศัลยกรรมทั่วไป'], ['9.6', 'Appendectomy', 800], ['9.18', 'Cholecystectomy', 1200], ['9.40', 'Whipple operation', 2400], ['13', 'หัตถการทางศัลยกรรมประสาท'], ['13.7', 'Craniotomy with clipping aneurysm', 3600], ['15', 'หัตถการทางศัลยกรรมกระดูกและข้อ'], ['15.30', 'Replantation of limb', 3600], ['16', 'หัตถการทางสูติ-นรีเวชกรรม'], ['16.7', 'Cesarean section', 800], ['16.13', 'Cesarean hysterectomy (severe PPH)', 1600], ['17', 'หัตถการทางจักษุวิทยา'], ['17.14', 'Optic nerve decompression', 2000], ['19', 'พยาธิกายวิภาคและนิติเวชศาสตร์'], ['19.1', 'การตรวจศพ (autopsy) ทางพยาธิ', 2000]];
function ledgerHtml() {
  var rows = LEDGER_SAMPLE.map(function (r) { return r.length === 2 ? '<div class="ledger-row cat">หมวด ' + r[0] + ' ' + esc(r[1]) + '</div>' : '<div class="ledger-row"><span class="c">' + r[0] + '</span><span class="n">' + esc(r[1]) + '</span><span class="r">' + fmt(r[2]) + '</span></div>'; }).join('');
  return '<div class="ledger" aria-hidden="true"><div class="ledger-track">' + rows + rows + '</div></div>';
}
function renderLogin(msg) {
  document.title = 'เข้าสู่ระบบ · SOMDEJ CORE';
  var mode = lsGet('mode', 'his'), last = lsGet('emp', '');
  var dl = window.PUBLIC_DATES || {};
  $('#app').innerHTML =
    '<main class="login">' +
    '<section class="login-hero">' + ledgerHtml() +
    '<div class="brand"><img src="logo-hospital.png" alt="" width="52" height="52"><div><b>ฝ่ายทรัพยากรบุคคล</b>โรงพยาบาลสมเด็จพระบรมราชเทวี ณ ศรีราชา สภากาชาดไทย</div></div>' +
    '<div class="hero-title"><div class="word"><span class="cross"></span>SOMDEJ CORE</div>' +
    '<div class="expand">Consultant On-call Remuneration Evaluation</div>' +
    '<h1>ระบบทบทวนอัตราค่าตอบแทนตามคุณภาพและปริมาณงานแพทย์เวรที่ปรึกษาประจำฝ่ายหรือหน่วยการแพทย์</h1>' +
    '<p>ทบทวนรายการตามคำสั่งที่ 359/2553 · 961/2565 · 182/2565 และเสนอรายการที่ปฏิบัติจริงนอกเวลาราชการ เพื่อปรับปรุงคำสั่งโรงพยาบาลฉบับใหม่</p></div>' +
    (dl.closeAt ? '<div class="hero-deadline"><div>เปิดรับความเห็น<b>' + esc(thDT(dl.openAt, { long: true })) + '</b></div><div class="due">หัวหน้าฝ่ายรับรองส่งภายใน<b>' + esc(thDT(dl.closeAt, { long: true })) + '</b></div></div>' : '') +
    '</section>' +
    '<section class="login-side"><div class="login-card">' +
    '<h2>เข้าสู่ระบบ</h2><p class="sub">ใช้บัญชีเดียวกับระบบ HIS ของโรงพยาบาล</p>' +
    '<div class="tabs" role="tablist"><button role="tab" data-mode="his" aria-selected="' + (mode === 'his') + '">แพทย์และบุคลากร (HIS)</button><button role="tab" data-mode="local" aria-selected="' + (mode === 'local') + '">บัญชีผู้ประสานงาน</button></div>' +
    '<form id="lf" novalidate>' +
    (msg ? '<div class="alert err" role="alert">' + ic('x') + '<span>' + esc(msg) + '</span></div>' : '') +
    '<label class="f"><span>เลขประจำตัวบุคลากร 7 หลัก</span><input class="in" id="emp" inputmode="numeric" autocomplete="username" maxlength="7" placeholder="5XXXXXX" value="' + esc(last) + '"></label>' +
    '<label class="f"><span id="pwl">' + (mode === 'his' ? 'รหัสผ่าน HIS' : 'รหัสผ่าน') + '</span><div class="pw-wrap"><input class="in" id="pw" type="password" autocomplete="current-password"><button type="button" id="pwt" aria-label="แสดงรหัสผ่าน">' + ic('eye') + '</button></div>' +
    '<small id="pwh">' + (mode === 'his' ? 'ระบบตรวจรหัสผ่านกับ HIS โดยตรง และไม่เก็บรหัสผ่านของท่าน' : 'สำหรับเลขาฝ่าย/ผู้ประสานงานที่ไม่มีบัญชี HIS · ขอบัญชีได้ที่ฝ่ายทรัพยากรบุคคล') + '</small></label>' +
    '<label class="check"><input type="checkbox" id="rem"' + (lsGet('rem', true) ? ' checked' : '') + '> จดจำการเข้าสู่ระบบในเครื่องนี้ 7 วัน</label>' +
    '<button class="btn primary lg block" id="lb" data-busy="กำลังตรวจสอบ…">เข้าสู่ระบบ</button>' +
    '</form>' +
    (window.DEMO_ACCOUNTS ? '<div class="demo-pick"><div class="f-label">หน้าทดลองใช้ · เลือกบทบาทเพื่อเข้าทันที</div><div class="row">' + window.DEMO_ACCOUNTS.map(function (a, i) { return '<button class="btn sm" data-demo="' + i + '">' + esc(a.label) + '</button>'; }).join('') + '</div></div>' : '') +
    '<div class="login-foot">สอบถามการใช้งาน ' + esc(window.APP_CONTACT || 'ฝ่ายทรัพยากรบุคคล โทรภายใน 23411') + '</div>' +
    '</div></section></main>';
  $$('[data-mode]').forEach(function (b) { b.onclick = function () { lsSet('mode', b.dataset.mode); renderLogin(); }; });
  $('#pwt').onclick = function () { var p = $('#pw'), sh = p.type === 'password'; p.type = sh ? 'text' : 'password'; this.innerHTML = ic(sh ? 'eyeoff' : 'eye'); this.setAttribute('aria-label', sh ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'); };
  $('#emp').oninput = function () { this.value = this.value.replace(/\D/g, '').slice(0, 7); };
  (last ? $('#pw') : $('#emp')).focus();
  $('#lf').onsubmit = function (e) {
    e.preventDefault();
    var emp = $('#emp').value.trim(), pw = $('#pw').value, btn = $('#lb');
    if (!/^\d{7}$/.test(emp)) { $('#emp').classList.add('err'); $('#emp').focus(); return; }
    if (!pw) { $('#pw').classList.add('err'); $('#pw').focus(); return; }
    doLogin(emp, pw, lsGet('mode', 'his'), $('#rem').checked, btn);
  };
  $$('[data-demo]').forEach(function (b) { b.onclick = function () { var a = window.DEMO_ACCOUNTS[+b.dataset.demo]; doLogin(a.emp, a.pass, a.mode, true, b); }; });
}
function doLogin(emp, pw, mode, rem, btn) {
  busy(btn, true);
  api('login', { emp: emp, pass: pw, mode: mode, remember: rem, ua: navigator.userAgent }, { retry: 0 }).then(function (d) {
    lsSet('emp', emp); lsSet('rem', rem);
    S.token = d.token; if (rem) lsSet('token', d.token); else { lsDel('token'); ssSet('token', d.token); }
    setBoot(d.boot); route();
  }).catch(function (e) { renderLogin(e.message); });
}
function setBoot(b) { S.boot = b; S._ii = null; S.div = {}; if (b.phase) window.PUBLIC_DATES = { openAt: b.phase.openAt, closeAt: b.phase.closeAt }; lsSet('dates', window.PUBLIC_DATES); }
function logout(expired) {
  S.token = ''; S.boot = null; S.div = {}; lsDel('token'); try { sessionStorage.removeItem('core:token'); } catch (e) { }
  closeDrawer(true); closeModal();
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  renderLogin(expired ? 'หมดเวลาการเข้าใช้ กรุณาเข้าสู่ระบบใหม่' : '');
}
function renderChangePw(forced) {
  var m = modal('<h2>' + (forced ? 'ตั้งรหัสผ่านใหม่ก่อนใช้งาน' : 'เปลี่ยนรหัสผ่าน') + '</h2>' +
    '<p class="muted" style="margin:8px 0 16px">' + (forced ? 'ท่านเข้าสู่ระบบด้วยรหัสผ่านชั่วคราวจากฝ่ายทรัพยากรบุคคล กรุณาตั้งรหัสผ่านของท่านเอง' : 'รหัสผ่านอย่างน้อย 8 ตัวอักษร มีทั้งตัวอักษรและตัวเลข') + '</p>' +
    '<div class="stack"><label class="f"><span>รหัสผ่านปัจจุบัน' + (forced ? ' (รหัสชั่วคราว)' : '') + '</span><input class="in" type="password" id="pc" autocomplete="current-password"></label>' +
    '<label class="f"><span>รหัสผ่านใหม่</span><input class="in" type="password" id="pn" autocomplete="new-password"><small>อย่างน้อย 8 ตัวอักษร มีทั้งตัวอักษรและตัวเลข และไม่มีเลขประจำตัวบุคลากร</small></label>' +
    '<label class="f"><span>ยืนยันรหัสผ่านใหม่</span><input class="in" type="password" id="pn2" autocomplete="new-password"></label><div id="pe"></div></div>' +
    '<div class="act">' + (forced ? '<button class="btn" data-out>ออกจากระบบ</button>' : '<button class="btn" data-x>ยกเลิก</button>') + '<button class="btn primary" data-ok>บันทึกรหัสผ่านใหม่</button></div>');
  if (forced) { $('#mscrim').onclick = null; m.querySelector('[data-out]').onclick = function () { closeModal(); logout(); }; } else m.querySelector('[data-x]').onclick = closeModal;
  m.querySelector('[data-ok]').onclick = function () {
    var b = this, pn = $('#pn').value;
    if (pn !== $('#pn2').value) { $('#pe').innerHTML = '<div class="alert err">รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน</div>'; return; }
    busy(b, true);
    apiW('changePassword', { current: $('#pc').value, next: pn }).then(function (d) {
      S.token = d.token; if (lsGet('token', '')) lsSet('token', d.token); else ssSet('token', d.token);
      setBoot(d.boot); closeModal(); toast('เปลี่ยนรหัสผ่านแล้ว'); route();
    }).catch(function (e) { busy(b, false); $('#pe').innerHTML = '<div class="alert err">' + esc(e.message) + '</div>'; });
  };
}

/* ---------- โครงหน้า ---------- */
function navItems() {
  var m = me(), out = [['home', '#/home', 'หน้าแรก'], ['list', '#/items', 'รายการหัตถการ'], ['propose', '#/propose', 'เสนอรายการใหม่']];
  if (m.leadDivs.length || m.isAdmin) out.push(['team', '#/division' + (m.leadDivs[0] ? '/' + m.leadDivs[0] : ''), m.certDivs.length ? 'สรุปและรับรองส่ง' : 'ฝ่ายที่ดูแล']);
  else if (m.divId) out.push(['team', '#/division/' + m.divId, 'ความเห็นในฝ่าย']);
  if (m.viewAll) { out.push(['grp', '', 'ฝ่ายทรัพยากรบุคคล / ผู้บริหาร']); out.push(['chart', '#/overview', 'ภาพรวมทุกฝ่าย']); out.push(['gavel', '#/decisions', 'ผลพิจารณา']); out.push(['download', '#/export', 'ส่งออกรายงาน']); }
  if (m.isAdmin) out.push(['settings', '#/settings', 'ตั้งค่าระบบ']);
  out.push(['help', '#/help', 'วิธีใช้งาน']);
  return out;
}
function shell(content, title) {
  var m = me(), cur = '#/' + (S.route.split('/')[1] || 'home'), ph = B().phase, closing = ph.phase === 'survey' && ph.closeAt && (isoMs(ph.closeAt) - Date.now()) < 3 * 86400000;
  var pendingCert = m.certDivs.filter(function (d) { return !locked(d); }).length;
  var nav = navItems().map(function (n) {
    if (n[0] === 'grp') return '<div class="grp">' + esc(n[2]) + '</div>';
    var on = n[1].split('/').slice(0, 2).join('/') === cur;
    return '<a href="' + n[1] + '"' + (on ? ' aria-current="page"' : '') + '>' + ic(n[0]) + '<span>' + esc(n[2]) + '</span>' + (n[0] === 'team' && pendingCert && ph.phase === 'survey' && m.certDivs.length ? '<span class="badge">' + pendingCert + '</span>' : '') + '</a>';
  }).join('');
  var bottom = navItems().filter(function (n) { return n[0] !== 'grp' && n[0] !== 'help' && n[0] !== 'download' && n[0] !== 'settings'; }).slice(0, 5).map(function (n) {
    var on = n[1].split('/').slice(0, 2).join('/') === cur;
    return '<a href="' + n[1] + '"' + (on ? ' aria-current="page"' : '') + '>' + ic(n[0]) + '<span>' + esc(n[2].replace('รายการหัตถการ', 'รายการ').replace('เสนอรายการใหม่', 'เสนอใหม่').replace('สรุปและรับรองส่ง', 'ฝ่าย').replace('ความเห็นในฝ่าย', 'ฝ่าย').replace('ภาพรวมทุกฝ่าย', 'ภาพรวม').replace('ฝ่ายที่ดูแล', 'ฝ่าย')) + '</span></a>';
  }).join('');
  document.title = (title ? title + ' · ' : '') + 'SOMDEJ CORE';
  $('#app').innerHTML =
    '<div class="shell"><nav class="rail" aria-label="เมนูหลัก"><a class="rail-brand" href="#/home"><span class="mark"></span><span><b>SOMDEJ CORE</b><small>ทบทวนอัตราค่าตอบแทนแพทย์เวรที่ปรึกษา</small></span></a>' +
    '<div class="nav">' + nav + '</div><div class="rail-foot">' + esc(B().settings.roundName || '') + '<br>รุ่น ' + esc(B().app.build) + (FRONT !== B().app.build ? ' / ' + esc(FRONT) : '') + '</div></nav>' +
    '<div class="main"><header class="topbar"><a class="mobile-brand" href="#/home"><span class="mark"></span>CORE</a>' +
    '<span class="phase ' + (closing ? 'closing' : ph.phase === 'survey' ? '' : 'idle') + '"><i></i>' + esc(B().phaseTh) + (ph.phase === 'survey' && ph.closeAt ? '<span class="ph-to"> · ถึง ' + esc(thDT(ph.closeAt)) + '</span>' : '') + '</span>' +
    '<span class="grow"></span><button class="me-btn" id="meb" aria-haspopup="menu"><span class="avatar">' + esc(initials(m.name)) + '</span><span class="t"><b>' + esc(m.name) + '</b><small>' + esc(divName(m.divId, true)) + '</small></span></button></header>' +
    '<main class="page" id="page">' + content + '</main></div></div>' +
    '<nav class="bottom-nav" aria-label="เมนูหลัก">' + bottom + '</nav>';
  $('#meb').onclick = function (e) {
    e.stopPropagation(); var old = $('.menu'); if (old) { old.remove(); return; }
    var mn = document.createElement('div'); mn.className = 'menu'; mn.setAttribute('role', 'menu');
    mn.innerHTML = '<div class="who"><b>' + esc(m.name) + '</b>' + esc(m.position || '') + '<br>' + esc(divName(m.divId)) + '<br>' + esc(roleNames().join(' · ') || 'แพทย์') + '</div>' +
      (m.kind === 'local' ? '<button data-a="pw">' + ic('key') + 'เปลี่ยนรหัสผ่าน</button>' : '') +
      '<button data-a="theme">' + ic('moon') + 'สลับโหมดสว่าง/มืด</button><a href="#/help">' + ic('help') + 'วิธีใช้งาน</a><button data-a="out">' + ic('logout') + 'ออกจากระบบ</button>';
    document.body.appendChild(mn);
    mn.onclick = function (ev) { var a = ev.target.closest('[data-a]'); if (!a) return; mn.remove(); if (a.dataset.a === 'out') logout(); if (a.dataset.a === 'theme') toggleTheme(); if (a.dataset.a === 'pw') renderChangePw(false); };
    setTimeout(function () { document.addEventListener('click', function h() { mn.remove(); document.removeEventListener('click', h); }); }, 0);
  };
}
function loadingHtml() { return '<div class="loading"><span class="spin"></span><p>กำลังโหลด…</p></div>'; }
function errorHtml(msg, retry) { return '<div class="empty"><h3>โหลดข้อมูลไม่สำเร็จ</h3><p>' + esc(msg) + '</p><button class="btn" onclick="route()">ลองอีกครั้ง</button></div>'; }

/* ---------- ข้อมูลฝ่าย (แคชในหน้า) ---------- */
function loadDiv(divId, force) {
  divId = divId || me().divId;
  if (!divId) return Promise.resolve({ divId: '', opinions: [], proposals: [], consensus: [], files: [], members: [], owned: [] });
  if (S.div[divId] && !force) return Promise.resolve(S.div[divId]);
  return api('getDiv', { divId: divId }).then(function (d) { S.div[divId] = d; if (d.sub1) S.boot.subs[divId + '|1'] = d.sub1; else delete S.boot.subs[divId + '|1']; if (d.sub2) S.boot.subs[divId + '|2'] = d.sub2; return d; });
}
function refreshBoot() { return api('bootstrap').then(function (b) { var dv = S.div; setBoot(b); S.div = dv; }); }

/* ---------- เส้นทาง ---------- */
function route() {
  if (!S.boot) return;
  if (S.boot.me.mustChange) { shell('<div class="empty"><h3>กรุณาตั้งรหัสผ่านใหม่</h3></div>'); renderChangePw(true); return; }
  var h = location.hash || '#/home', parts = h.slice(2).split('?')[0].split('/'), q = {};
  (h.split('?')[1] || '').split('&').forEach(function (kv) { if (kv) { var p = kv.split('='); q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); } });
  var prev = S.route; S.route = '/' + parts.join('/');
  var mn = $('.menu'); if (mn) mn.remove();
  if (parts[0] === 'item') {   // ลิ้นชักซ้อนบนหน้าเดิม
    if (!$('#page')) { S.route = '/items'; pageItems(q); }
    openItem(parts[1], q.div); return;
  }
  closeDrawer(true);
  var pg = { home: pageHome, items: pageItems, propose: pagePropose, division: pageDivision, overview: pageOverview, decisions: pageDecisions, export: pageExport, settings: pageSettings, help: pageHelp }[parts[0]] || pageHome;
  pg(q, parts);
  if (prev !== S.route) window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);

/* ---------- หน้าแรก ---------- */
function countdown(to) {
  var ms = isoMs(to) - Date.now(); if (ms <= 0) return null;
  return { d: Math.floor(ms / 86400000), h: Math.floor(ms % 86400000 / 3600000), m: Math.floor(ms % 3600000 / 60000) };
}
function pageHome() {
  var m = me(), ph = B().phase, st = B().settings;
  shell(loadingHtml(), 'หน้าแรก');
  loadDiv(m.divId).then(function (d) {
    var mineOps = d.opinions.filter(function (o) { return o.emp === m.user; }), mineProps = d.proposals.filter(function (p) { return p.emp === m.user; });
    var owned = d.owned.length, cd = ph.phase === 'survey' ? countdown(ph.closeAt) : ph.phase === 'before' ? countdown(ph.openAt) : null;
    var sub = S.boot.subs[m.divId + '|1'];
    var right = cd ? '<div class="lbl">' + (ph.phase === 'before' ? 'เปิดรับความเห็นในอีก' : 'เหลือเวลารับรองส่ง') + '</div><div class="count' + (ph.phase === 'survey' && cd.d < 3 ? ' due' : '') + '"><div><b>' + cd.d + '</b><span>วัน</span></div><div><b>' + cd.h + '</b><span>ชั่วโมง</span></div><div><b>' + cd.m + '</b><span>นาที</span></div></div><div class="date">' + (ph.phase === 'before' ? 'เปิด ' + esc(thDT(ph.openAt, { long: true })) : 'กำหนด ' + esc(thDT(ph.closeAt, { long: true }))) + '</div>'
      : '<div class="lbl">สถานะการทบทวน</div><div style="font:600 22px/1.4 var(--f-ui);color:#fff;margin-top:6px">' + esc(B().phaseTh) + '</div>' + (ph.closeAt ? '<div class="date" style="margin-top:6px">ปิดรับรอบ 1 เมื่อ ' + esc(thDT(ph.closeAt, { long: true })) + '</div>' : '');
    var chips = ['<span class="tag">' + esc(divName(m.divId)) + '</span>'].concat(roleNames().map(function (r) { return '<span class="st own">' + esc(r) + '</span>'; }));
    if (sub && sub.status === 'submitted') chips.push('<span class="st ok">ฝ่ายรับรองส่งแล้ว ' + esc(thDT(sub.at)) + '</span>');
    var noDiv = !m.divId && !m.viewAll && !m.leadDivs.length;
    var html = '<section class="welcome"><div class="welcome-l"><h1>สวัสดี ' + esc(m.name) + '</h1><p class="lead">' + esc(st.welcome) + '</p><div class="who">' + chips.join('') + '</div></div><div class="welcome-r">' + right + '</div></section>';
    if (noDiv) html += '<div class="alert warn" style="margin-top:18px">' + ic('help') + '<span>ระบบยังไม่พบฝ่ายการแพทย์ของท่านจากข้อมูล HRMi ท่านดูรายการได้ แต่ยังให้ความเห็นไม่ได้ กรุณาติดต่อ ' + esc(st.contactText) + ' เพื่อระบุฝ่าย</span></div>';
    html += '<div class="steps">' +
      '<a class="step' + (mineOps.length ? ' done' : '') + '" href="#/items' + (owned ? '?f=own' : '') + '"><div class="n"><i>' + (mineOps.length ? '✓' : '1') + '</i>ทบทวนรายการเดิม</div><h3>' + (mineOps.length ? 'ให้ความเห็นแล้ว ' + mineOps.length + ' รายการ' : 'คงเดิม เปลี่ยนแปลง หรือยกเลิก') + '</h3><p>' + (owned ? 'หมวดของ' + esc(divName(m.divId, true)) + 'มี ' + owned + ' รายการ ' : '') + 'ตรวจชื่อ ขอบเขตงาน และอัตราให้ตรงกับการปฏิบัติจริง</p><span class="go">เปิดรายการหัตถการ</span></a>' +
      '<a class="step' + (mineProps.length ? ' done' : '') + '" href="#/propose"><div class="n"><i>' + (mineProps.length ? '✓' : '2') + '</i>เสนอรายการใหม่</div><h3>' + (mineProps.length ? 'เสนอแล้ว ' + mineProps.length + ' รายการ' : 'หัตถการที่ทำจริงแต่ยังไม่มีในคำสั่ง') + '</h3><p>ระบุรายการเดิมที่ใช้เทียบเคียง อัตราที่เสนอ และแหล่งอ้างอิง</p><span class="go">เสนอรายการใหม่</span></a>' +
      '<a class="step' + (sub && sub.status === 'submitted' ? ' done' : '') + '" href="#/division/' + esc(m.leadDivs[0] || m.divId) + '"><div class="n"><i>' + (sub && sub.status === 'submitted' ? '✓' : '3') + '</i>หัวหน้าฝ่ายสรุปและรับรองส่ง</div><h3>' + (sub && sub.status === 'submitted' ? 'รับรองส่งแล้ว' : m.certDivs.length ? 'สรุปความเห็นของฝ่ายแล้วรับรองส่ง' : 'หัวหน้าฝ่ายสรุปความเห็นของฝ่าย') + '</h3><p>' + (sub && sub.status === 'submitted' ? 'โดย ' + esc(sub.by || sub.byName || '') : 'ความเห็นของแพทย์ทุกท่านถูกบันทึกพร้อมชื่อ ส่งถึงฝ่ายทรัพยากรบุคคลเมื่อรับรองส่ง') + '</p><span class="go">' + (m.certDivs.length ? 'ไปที่หน้าสรุปของฝ่าย' : 'ดูความเห็นในฝ่าย') + '</span></a></div>';
    var recent = d.opinions.concat(d.proposals.map(function (p) { p._p = 1; return p; })).sort(function (a, b) { return (b.updatedAt || '').localeCompare(a.updatedAt || ''); }).slice(0, 7);
    html += '<div class="grid-home"><section class="panel"><div class="panel-h"><div class="grow"><h2>ความเคลื่อนไหวล่าสุดในฝ่าย</h2><p>' + esc(divName(m.divId)) + '</p></div><a class="btn sm" href="#/division/' + esc(m.divId) + '">ดูทั้งหมด</a></div><div class="panel-b">' +
      (recent.length ? recent.map(function (o) {
        var it = o._p ? null : itemById(o.itemId);
        return '<div class="op"><span class="avatar">' + esc(initials(o.empName)) + '</span><div><div class="h"><b>' + esc(o.empName) + '</b>' + (o._p ? '<span class="st ok">เสนอเพิ่ม</span>' : stChip(o.status)) + '<span class="faint small">' + esc(ago(o.updatedAt)) + '</span></div><div class="b">' +
          (o._p ? esc(o.nameEn || o.nameTh) + ' · <b>' + baht(o.rate) + '</b>' : '<a href="#/item/' + esc(o.itemId) + '">ข้อ ' + esc(it ? it.code : '') + '</a> ' + esc(it ? it.name.slice(0, 90) : '')) + '</div></div></div>';
      }).join('') : '<div class="empty" style="padding:24px 0"><p>ยังไม่มีความเห็นในฝ่าย ท่านเริ่มเป็นคนแรกได้</p><a class="btn primary" href="#/items' + (owned ? '?f=own' : '') + '">เริ่มทบทวนรายการ</a></div>') + '</div></section>' +
      '<section class="panel"><div class="panel-h"><h2>ข้อมูลการทบทวน</h2></div><div class="panel-b"><dl class="kv">' +
      '<dt>ทบทวน</dt><dd>รายการหัตถการ ' + S.boot.items.filter(function (i) { return i.cat !== 1; }).length + ' รายการ ใน ' + (S.boot.categories.length - 1) + ' หมวด</dd>' +
      '<dt>อ้างอิง</dt><dd>คำสั่ง 359/2553 · 961/2565 · 182/2565</dd>' +
      '<dt>เปิดรับ</dt><dd>' + esc(thDT(ph.openAt, { long: true })) + '</dd><dt>รับรองส่ง</dt><dd>ภายใน ' + esc(thDT(ph.closeAt, { long: true })) + '</dd>' +
      '<dt>สอบถาม</dt><dd>' + esc(st.contactName) + '<br>' + esc(st.contactText) + '</dd></dl></div></section></div>';
    $('#page').innerHTML = html;
  }).catch(function (e) { $('#page').innerHTML = errorHtml(e.message); });
}

/* ---------- วิธีใช้ ---------- */
function pageHelp() {
  var st = B().settings;
  shell('<div class="page-head"><div><h1>วิธีใช้งาน</h1><p>ทุกความเห็นบันทึกพร้อมชื่อผู้เสนอและเวลา ไม่มีใครแก้ไขความเห็นของผู้อื่นได้ ยกเว้นผู้ประสานงานที่บันทึกแทนตามที่ได้รับมอบ</p></div></div>' +
    '<div class="panel"><div class="panel-b stack" style="max-width:76ch">' +
    '<h2>สำหรับแพทย์</h2><ol style="margin:0;padding-left:22px"><li>เปิด <a href="#/items">รายการหัตถการ</a> เลือกหมวด (หมวดที่มีจุดสีทองคือหมวดของฝ่ายท่าน) แล้วแตะรายการที่ต้องการ</li><li>เลือก <b>คงเดิม</b> / <b>เปลี่ยนแปลง</b> / <b>ยกเลิก</b> หากเปลี่ยนแปลงให้เลือกว่าแก้ชื่อ แก้ขอบเขต หรือปรับอัตรา พร้อมเหตุผลและแหล่งอ้างอิง (ระเบียบ โรงพยาบาลที่เทียบเคียง อัตรา ลิงก์ หรือไฟล์แนบ)</li><li>หัตถการที่ทำจริงนอกเวลาราชการแต่ยังไม่มีในคำสั่ง ให้ <a href="#/propose">เสนอรายการใหม่</a> โดยเลือกรายการเดิมที่ใช้เทียบเคียง (ความซับซ้อน ระยะเวลา ความเสี่ยงใกล้เคียงกัน) และเสนออัตรา</li><li>แก้ไขความเห็นของตนเองได้จนกว่าหัวหน้าฝ่ายจะรับรองส่ง</li></ol>' +
    '<h2>สำหรับหัวหน้าฝ่าย / ผู้รับมอบ</h2><ol style="margin:0;padding-left:22px"><li>เปิด <b>สรุปและรับรองส่ง</b> ดูรายชื่อแพทย์ในฝ่าย ใครเข้าระบบแล้ว และความเห็นแต่ละรายการ</li><li>สรุปข้อสรุปของฝ่ายทุกรายการในหมวดของฝ่าย และทุกรายการเสนอเพิ่ม รายการที่ไม่มีใครเสนอเปลี่ยนกด <b>"คงเดิมทั้งหมดที่ไม่มีข้อเสนอ"</b> ได้ในครั้งเดียว</li><li>กด <b>รับรองส่ง</b> ข้อมูลของฝ่ายจะถูกล็อก หากต้องแก้ไขติดต่อฝ่ายทรัพยากรบุคคลเพื่อเปิดให้แก้</li></ol>' +
    '<h2>สำหรับผู้ประสานงานฝ่าย</h2><p style="margin:0">เข้าด้วยแท็บ <b>บัญชีผู้ประสานงาน</b> (ขอบัญชีที่ฝ่ายทรัพยากรบุคคล) บันทึกความเห็นแทนแพทย์ได้ โดยเลือกชื่อแพทย์ในช่อง "บันทึกในนามของ" ระบบจะแสดงว่ากรอกแทนโดยใคร ผู้ประสานงานเตรียมข้อสรุปได้ แต่การรับรองส่งเป็นของหัวหน้าฝ่าย</p>' +
    '<h2>ความปลอดภัยของข้อมูล</h2><p style="margin:0">ระบบตรวจรหัสผ่านกับ HIS โดยตรงและไม่เก็บรหัสผ่าน HIS แพทย์เห็นเฉพาะความเห็นในฝ่ายของตน ฝ่ายทรัพยากรบุคคลและผู้บริหารเห็นภาพรวมทุกฝ่าย ไฟล์แนบเปิดได้เฉพาะผู้มีสิทธิ์</p>' +
    '<h2>ติดต่อ</h2><p style="margin:0">' + esc(st.contactName) + ' ' + esc(st.contactText) + '</p></div></div>', 'วิธีใช้งาน');
}

/* ---------- เริ่มต้น ---------- */
function boot() {
  window.PUBLIC_DATES = lsGet('dates', null);
  S.token = lsGet('token', '') || ssGet('token') || '';
  if (!S.token) { renderLogin(); api('ping', {}, { retry: 0 }).then(function (p) { var had = !!(window.PUBLIC_DATES && window.PUBLIC_DATES.closeAt); window.PUBLIC_DATES = { openAt: p.openAt, closeAt: p.closeAt }; lsSet('dates', window.PUBLIC_DATES); if (!had && !S.token && $('.login-hero') && !$('.hero-deadline')) { var em = $('#emp') ? $('#emp').value : ''; renderLogin(); if ($('#emp')) $('#emp').value = em; } }).catch(function () { }); return; }
  $('#app').innerHTML = loadingHtml();
  api('bootstrap').then(function (b) { setBoot(b); route(); }).catch(function (e) { if (S.token) renderLogin(e.message); });
}
document.addEventListener('DOMContentLoaded', boot);
