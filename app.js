/* 레퍼런스 보드 — PureRef 스타일 무한 캔버스.
   data.json 구조:
     boards:     { id: { name, order } }
     posts:      { shortcode: { link, author, caption, created, images: [{ f, w, h }] } }
     placements: { "보드id~게시글id": { board, post, x, y, h, z } }
   이미지 파일: img/<f> (원본, 긴 변 1600px), thumb/<f> (긴 변 600px) */
(() => {
"use strict";
const RB = window.RB;

/* ================= style + shell ================= */
const CSS = `
:root{color-scheme:dark;--bg:#1f2022;--dot:#34363a;--panel:#2a2c2f;--panel-2:#323438;--line:#3d4045;--fg:#e3e4e6;--mute:#8e9298;--sel:#5b9cf5;--danger:#ef6b5e;--ok:#5fbf8a;--warn:#e0b04f;
--ui:"IBM Plex Sans KR",system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;--mono:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace}
html,body{height:100%}
body{margin:0;background:var(--bg);color:var(--fg);font:13px/1.45 var(--ui);overflow:hidden;overscroll-behavior:none;-webkit-tap-highlight-color:transparent}
[hidden]{display:none!important}
button,input{font:inherit;color:inherit}
button{cursor:pointer}
:focus-visible{outline:2px solid var(--sel);outline-offset:2px}
#stage{position:fixed;inset:0;overflow:hidden;touch-action:none;background-color:var(--bg);background-image:radial-gradient(circle,var(--dot) 1px,transparent 1.3px)}
#stage.panning{cursor:grabbing}#stage.space{cursor:grab}
#world{position:absolute;left:0;top:0;transform-origin:0 0}
.grp{position:absolute;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;background:var(--panel);border-radius:5px;box-shadow:0 0 0 1px var(--line)}
.grp .hd{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:.6em;padding:.45em .7em;font:500 min(calc(12px / var(--s,1)), var(--fh,12px))/1.2 var(--mono);color:#fff;white-space:nowrap;overflow:hidden;
  background:linear-gradient(rgba(10,10,12,.78),rgba(10,10,12,0));border-radius:5px 5px 0 0;opacity:0;transition:opacity .15s;pointer-events:none;z-index:2}
.grp:hover .hd,.grp.sel .hd,body.labels .grp .hd,.grp.card .hd{opacity:1}
.grp .hd .au{overflow:hidden;text-overflow:ellipsis}
.grp .hd .n{margin-left:auto;flex:none;opacity:.75}
.grp .hd .lk{width:.55em;height:.55em;border-radius:50%;background:var(--sel);flex:none}
.grp .more{position:absolute;display:grid;place-items:center;background:var(--panel-2);color:var(--fg);font-family:var(--mono);border-radius:2px;cursor:pointer}
.grp .more:hover{background:var(--line)}
.grp .vb{position:absolute;width:0;height:0;border-left:calc(9px / var(--s,1)) solid rgba(255,255,255,.85);border-top:calc(6px / var(--s,1)) solid transparent;border-bottom:calc(6px / var(--s,1)) solid transparent;transform:translateY(-100%);pointer-events:none;z-index:1;filter:drop-shadow(0 0 2px rgba(0,0,0,.6))}
.grp .im{position:absolute;display:block;object-fit:cover;pointer-events:none;-webkit-user-drag:none;background:var(--bg);border-radius:2px}
.grp .im.err{opacity:.2}
.grp .cap{position:absolute;left:12px;right:12px;top:40px;bottom:30px;font-size:15px;line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:9;-webkit-box-orient:vertical;word-break:keep-all;overflow-wrap:anywhere}
.grp .hint{position:absolute;left:10px;bottom:8px;font-size:11px;color:var(--mute)}
.grp.card{background:repeating-linear-gradient(135deg,var(--panel) 0 14px,#2d2f33 14px 15px)}
.grp.sel{box-shadow:0 0 0 calc(2px / var(--s,1)) var(--sel)}
.grp .h{position:absolute;right:calc(-7px / var(--s,1));bottom:calc(-7px / var(--s,1));width:calc(14px / var(--s,1));height:calc(14px / var(--s,1));background:var(--sel);border:calc(2px / var(--s,1)) solid var(--bg);border-radius:50%;cursor:nwse-resize;display:none}
.grp.sel .h{display:block}
@media (hover:none){.grp .h{width:calc(26px / var(--s,1));height:calc(26px / var(--s,1));right:calc(-13px / var(--s,1));bottom:calc(-13px / var(--s,1))}}
#marquee{position:fixed;border:1px solid var(--sel);background:rgba(91,156,245,.14);pointer-events:none;display:none;z-index:5}
.ui{position:fixed;z-index:10}
.bar{display:flex;gap:4px;align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:4px;box-shadow:0 6px 24px rgba(0,0,0,.35)}
.btn{background:transparent;border:0;border-radius:7px;padding:7px 10px;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;min-height:34px;text-decoration:none;color:inherit}
.btn:hover{background:var(--panel-2)}
.btn svg{width:16px;height:16px;flex:none;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.btn.primary{background:var(--fg);color:var(--bg);font-weight:600}
.btn.danger{color:var(--danger)}
a.btn.link{color:var(--sel)}
.btn:disabled{opacity:.35;cursor:default}
.sep{width:1px;align-self:stretch;background:var(--line);margin:4px 2px}
#tl{left:calc(12px + env(safe-area-inset-left,0px));top:calc(12px + env(safe-area-inset-top,0px))}
#tr{right:calc(12px + env(safe-area-inset-right,0px));top:calc(12px + env(safe-area-inset-top,0px))}
#bl{left:calc(12px + env(safe-area-inset-left,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px))}
#boardBtn{font-weight:600;max-width:52vw}
#boardBtn .nm{overflow:hidden;text-overflow:ellipsis}
#boardBtn .ct,#zoom{font:500 11px var(--mono);color:var(--mute);font-variant-numeric:tabular-nums}
#zoom{font-size:12px;min-width:56px;justify-content:center}
#sync{font-size:12px;color:var(--mute)}
#sync i{width:7px;height:7px;border-radius:50%;background:var(--mute);display:inline-block}
#sync.ok i{background:var(--ok)}#sync.busy i{background:var(--sel)}#sync.warn i{background:var(--warn)}#sync.err i{background:var(--danger)}
.pop{position:fixed;z-index:20;background:var(--panel);border:1px solid var(--line);border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.5);padding:8px}
#boards{left:calc(12px + env(safe-area-inset-left,0px));top:calc(60px + env(safe-area-inset-top,0px));width:min(300px,calc(100vw - 24px));max-height:calc(100% - 90px);display:flex;flex-direction:column}
.lbl{font-size:11px;letter-spacing:.06em;color:var(--mute);padding:6px 8px 4px}
#blist{overflow:auto;display:flex;flex-direction:column;gap:2px;min-height:0}
.brow{display:flex;align-items:center;gap:2px;border-radius:8px}
.brow:hover,.brow.cur{background:var(--panel-2)}
.brow .go{flex:1;min-width:0;text-align:left;background:none;border:0;padding:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex;gap:8px}
.brow .go .c{margin-left:auto;font:500 11px var(--mono);color:var(--mute)}
.brow.cur .go{font-weight:600}
.mini{background:none;border:0;padding:6px;border-radius:6px;color:var(--mute)}
.mini:hover{color:var(--fg);background:var(--line)}
.mini.arm{color:var(--danger);font-size:12px}
.mini svg{width:14px;height:14px;display:block;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.field{background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:8px 10px;outline:none;min-width:0}
.field:focus{border-color:var(--sel)}
.row{display:flex;gap:6px}
.row .field{flex:1}
.newb{padding:8px 2px 2px;border-top:1px solid var(--line);margin-top:6px}
#selbar{left:50%;transform:translateX(-50%);bottom:calc(14px + env(safe-area-inset-bottom,0px));max-width:calc(100vw - 24px);overflow-x:auto}
#cappop{left:50%;transform:translateX(-50%);bottom:calc(70px + env(safe-area-inset-bottom,0px));width:min(460px,calc(100vw - 24px));max-height:45vh;overflow:auto;padding:14px 16px}
#cappop .au{font:500 12px var(--mono);color:var(--sel);margin-bottom:6px}
#cappop .tx{white-space:pre-wrap;line-height:1.6;word-break:keep-all;overflow-wrap:anywhere}
#selbar .count{font:500 12px var(--mono);color:var(--mute);padding:0 8px}
#linkpop{left:50%;transform:translateX(-50%);bottom:calc(70px + env(safe-area-inset-bottom,0px));width:min(420px,calc(100vw - 24px))}
#tokpop{left:calc(12px + env(safe-area-inset-left,0px));bottom:calc(62px + env(safe-area-inset-bottom,0px));width:min(340px,calc(100vw - 24px));padding:14px}
#tokpop p,#help p{margin:0 0 10px;color:var(--mute);font-size:12px}
#help{right:calc(12px + env(safe-area-inset-right,0px));top:calc(60px + env(safe-area-inset-top,0px));width:min(330px,calc(100vw - 24px));padding:14px 16px;max-height:calc(100% - 90px);overflow:auto}
#help h2{font-size:13px;margin:0 0 8px}
#help dl{display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin:0 0 12px}
#help dt{font:500 11px var(--mono);background:var(--panel-2);border:1px solid var(--line);border-radius:5px;padding:1px 6px;justify-self:start;white-space:nowrap}
#help dd{margin:0;color:var(--mute)}
#empty{position:fixed;inset:0;display:grid;place-items:center;pointer-events:none;z-index:1;padding:0 24px;text-align:center}
#empty h1{font-size:16px;margin:0 0 6px}#empty p{margin:0;color:var(--mute)}
#drop{position:fixed;inset:10px;border:2px dashed var(--sel);border-radius:16px;z-index:30;pointer-events:none;display:none;place-items:center;background:rgba(91,156,245,.06)}
#drop span{background:var(--panel);padding:10px 16px;border-radius:10px;font-weight:600}
body.dragging #drop{display:grid}
#toast{left:50%;transform:translateX(-50%);top:calc(14px + env(safe-area-inset-top,0px));display:flex;flex-direction:column;gap:6px;align-items:center;pointer-events:none}
.t{pointer-events:auto;background:var(--fg);color:var(--bg);border-radius:9px;padding:8px 12px;font-weight:500;display:flex;gap:10px;align-items:center;box-shadow:0 6px 20px rgba(0,0,0,.4);max-width:calc(100vw - 24px)}
.t button{background:none;border:0;color:#1d5fc2;font-weight:600;padding:0}
@media (max-width:640px){.hide-sm{display:none!important}#tr .tx{display:none}}
`;
const ICON = {
  plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  minus:'<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
  down:'<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  grid:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/></svg>',
  fit:'<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  help:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.7-.9 1.3v.5M12 16.8v.2"/></svg>',
  undo:'<svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
  redo:'<svg viewBox="0 0 24 24"><path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/></svg>',
  ext:'<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  chain:'<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  front:'<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/></svg>',
  zoom:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2M11 8v6M8 11h6"/></svg>',
  del:'<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
  text:'<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
  edit:'<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/></svg>'
};
const HTML = `
<div id="stage" aria-label="레퍼런스 캔버스"><div id="world"></div></div>
<div id="marquee"></div>
<div id="empty" hidden><div><h1 id="emptyTitle"></h1><p id="emptyText"></p></div></div>
<div class="ui bar" id="tl"><button class="btn" id="boardBtn" type="button" aria-expanded="false"><span class="nm">보드</span><span class="ct">0</span>${ICON.down}</button></div>
<div class="ui bar" id="tr">
  <button class="btn" id="undoBtn" type="button" title="뒤로가기 (Ctrl+Z)" aria-label="뒤로가기">${ICON.undo}</button>
  <button class="btn" id="redoBtn" type="button" title="되돌리기 (Ctrl+Shift+Z)" aria-label="되돌리기">${ICON.redo}</button>
  <div class="sep"></div>
  <button class="btn" id="addBtn" type="button" title="이미지 추가">${ICON.plus}<span class="tx">이미지</span></button>
  <button class="btn" id="arrangeBtn" type="button" title="정렬 (A)">${ICON.grid}<span class="tx">정렬</span></button>
  <button class="btn" id="fitBtn" type="button" title="모두 보기 (F)">${ICON.fit}<span class="tx">모두 보기</span></button>
  <div class="sep"></div>
  <button class="btn" id="helpBtn" type="button" title="조작법" aria-label="조작법">${ICON.help}</button>
</div>
<div class="ui bar" id="bl">
  <button class="btn" id="zoomOut" type="button" aria-label="축소">${ICON.minus}</button>
  <button class="btn" id="zoom" type="button" title="100%로">100%</button>
  <button class="btn" id="zoomIn" type="button" aria-label="확대">${ICON.plus}</button>
  <div class="sep"></div>
  <button class="btn" id="sync" type="button"><i></i><span>저장됨</span></button>
</div>
<div class="ui bar" id="selbar" hidden>
  <span class="count" id="selCount"></span>
  <a class="btn link" id="openLink" href="#" target="_blank" rel="noopener">${ICON.ext}원본 보기</a>
  <button class="btn" id="capBtn" type="button">${ICON.text}<span class="hide-sm">캡션</span></button>
  <button class="btn" id="foldBtn" type="button">${ICON.grid}<span>펼치기</span></button>
  <button class="btn" id="editLink" type="button">${ICON.chain}<span>링크</span></button>
  <button class="btn" id="frontBtn" type="button" title="맨 앞으로">${ICON.front}<span class="hide-sm">맨 앞</span></button>
  <button class="btn" id="zoomSel" type="button" title="크게 보기">${ICON.zoom}<span class="hide-sm">크게</span></button>
  <div class="sep"></div>
  <button class="btn danger" id="delBtn" type="button" title="보드에서 빼기 (Delete)">${ICON.del}<span class="hide-sm">빼기</span></button>
</div>
<div class="pop" id="cappop" hidden><div class="au"></div><div class="tx"></div></div>
<form class="pop row" id="linkpop" hidden><input class="field" id="linkInput" type="url" placeholder="인스타 게시글 링크" autocomplete="off"><button class="btn primary" type="submit">저장</button></form>
<div class="pop" id="boards" hidden>
  <div class="lbl">컬렉션 보드</div><div id="blist"></div>
  <form class="newb row" id="newBoard"><input class="field" id="newBoardName" placeholder="새 보드 이름" maxlength="60" autocomplete="off"><button class="btn primary" type="submit">추가</button></form>
</div>
<form class="pop" id="tokpop" hidden>
  <p id="tokText"></p>
  <div class="row"><input class="field" id="tokInput" type="password" placeholder="GitHub 토큰 (github_pat_…)" autocomplete="off"><button class="btn primary" type="submit">저장</button></div>
</form>
<div class="pop" id="help" hidden>
  <h2>조작법</h2>
  <dl>
    <dt>휠</dt><dd>커서 위치로 확대/축소 (트랙패드 두 손가락은 이동)</dd>
    <dt>우클릭·휠클릭 드래그</dt><dd>화면 이동</dd>
    <dt>Space + 드래그</dt><dd>화면 이동</dd>
    <dt>빈 곳 드래그</dt><dd>여러 게시글 선택</dd>
    <dt>Shift + 클릭</dt><dd>선택 추가/해제</dd>
    <dt>모서리 점</dt><dd>크기 조절</dd>
    <dt>더블클릭</dt><dd>그 이미지 크게 · 빈 곳은 모두 보기</dd>
    <dt>Ctrl + Z</dt><dd>뒤로가기</dd>
    <dt>Ctrl + Shift + Z</dt><dd>되돌리기</dd>
    <dt>Ctrl + V</dt><dd>이미지 붙여넣기 · 게시글 선택 후 링크를 붙이면 원본 링크로 연결</dd>
    <dt>F / A</dt><dd>모두 보기 / 자동 정렬</dd>
    <dt>L</dt><dd>작성자 이름 항상 보이기 켜기/끄기</dd>
    <dt>[ / ]</dt><dd>이전 / 다음 보드</dd>
    <dt>Delete</dt><dd>선택한 게시글을 이 보드에서 빼기</dd>
  </dl>
  <p>한 게시글의 이미지와 영상은 하나의 틀 안에 나란히 붙어 있어요. 마우스를 올리면 작성자 계정이 보이고, 여러 장인 게시글은 6장씩 줄을 바꿔 모든 이미지가 한눈에 보여요. 휴대폰에서는 두 손가락으로 확대하고 한 손가락으로 빈 곳을 끌어 이동해요.</p>
</div>
<div id="drop"><span>여기에 놓으면 보드에 추가돼요</span></div>
<div class="ui" id="toast" aria-live="polite"></div>
<input type="file" id="fileIn" accept="image/*" multiple hidden>`;

document.getElementById("boot")?.remove();
const st = document.createElement("style"); st.textContent = CSS; document.head.append(st);
document.body.insertAdjacentHTML("beforeend", HTML);

const $ = s => document.querySelector(s);
const stage = $("#stage"), world = $("#world"), marquee = $("#marquee");
const LS = {
  get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k){ try { localStorage.removeItem(k); } catch {} }
};
const clone = o => JSON.parse(JSON.stringify(o));

/* ================= data + pending edits ================= */
const KINDS = ["boards", "posts", "placements"];
let remote = normalize(RB.data);
let pend = LS.get("rb.pend") || { boards: {}, posts: {}, placements: {} };
for (const k of KINDS) pend[k] = pend[k] || {};
let data = overlay(remote, pend);

function normalize(d){ d = d || {}; for (const k of KINDS) d[k] = d[k] || {}; return d; }
function overlay(base, p){
  const d = clone(base);
  for (const k of KINDS) for (const [id, v] of Object.entries(p[k])) { if (v === null) delete d[k][id]; else d[k][id] = v; }
  return d;
}
function hasPend(){ return KINDS.some(k => Object.keys(pend[k]).length); }
function edit(kind, id, value){ // value null = delete
  if (value === null) delete data[kind][id]; else data[kind][id] = value;
  pend[kind][id] = value === null ? null : clone(value);
  LS.set("rb.pend", pend);
  scheduleSave();
}

let boardId = null;
let view = { x: 0, y: 0, s: 1 };
const sel = new Set();
const els = new Map();
let spaceDown = false;

/* ================= toasts ================= */
function toast(msg, opts = {}){
  const t = document.createElement("div"); t.className = "t";
  const s = document.createElement("span"); s.textContent = msg; t.append(s);
  if (opts.action){ const b = document.createElement("button"); b.type = "button"; b.textContent = opts.action; b.onclick = () => { opts.onAction(); t.remove(); }; t.append(b); }
  $("#toast").append(t);
  if (!opts.sticky) setTimeout(() => t.remove(), opts.ms || 3200);
  return t;
}

/* ================= geometry ================= */
/* 게시글 틀: 이미지들을 같은 높이로 가로로 붙이고, 6장마다 줄을 바꿔 전부 보여줘요. 머리줄(작성자)은 공간을 차지하지 않고 마우스를 올릴 때만 위에 겹쳐 떠요. */
const GAP = 4, PAD = 4, FOLD = Infinity, ROW = 6;   // 접지 않고 전부 보여줘요. 6장마다 줄을 바꿔요.
function geom(pl){
  const p = data.posts[pl.post] || {};
  const H = pl.h || 300;
  const imgs = p.images || [];
  if (!imgs.length) return { w: Math.round(H * 0.8), h: H, card: true, parts: [], H };
  // 줄 수 = ceil(n/6), 장수를 고르게 나누고(8장 → 4+4), 줄마다 높이를 맞춰 모든 줄의 폭을 같게 해요 (빈틈 없는 직사각형)
  const nRows = Math.ceil(imgs.length / ROW), base = Math.floor(imgs.length / nRows), extra = imgs.length % nRows;
  const rows = []; let k = 0;
  for (let r = 0; r < nRows; r++){ const c = base + (r < extra ? 1 : 0); rows.push(imgs.slice(k, k + c).map((im, j) => ({ im, i: k + j }))); k += c; }
  const asp = row => row.reduce((s, o) => s + o.im.w / o.im.h, 0);
  const innerW = rows.reduce((s, row) => s + asp(row) * H + GAP * (row.length - 1), 0) / nRows;
  const parts = []; let y = PAD;
  for (const row of rows){
    const rh = (innerW - GAP * (row.length - 1)) / asp(row);
    let x = PAD;
    for (const o of row){ const w = o.im.w / o.im.h * rh; parts.push({ x, y, w, h: rh, im: o.im, i: o.i }); x += w + GAP; }
    y += rh + GAP;
  }
  return { w: innerW + PAD * 2, h: y - GAP + PAD, parts, more: null, H, total: imgs.length, folded: false };
}
const boardPls = () => Object.entries(data.placements).filter(([, p]) => p.board === boardId).map(([id, p]) => ({ id, ...p, g: geom(p) }));
const plRect = id => { const p = data.placements[id]; if (!p) return null; const g = geom(p); return { x: p.x, y: p.y, w: g.w, h: g.h }; };

/* ================= view ================= */
let viewSaveT = 0, resT = 0;
function applyView(){
  world.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.s})`;
  world.style.setProperty("--s", view.s);
  let step = 48 * view.s; while (step < 18) step *= 4; while (step > 160) step /= 4;
  stage.style.backgroundSize = `${step}px ${step}px`;
  stage.style.backgroundPosition = `${view.x}px ${view.y}px`;
  $("#zoom").textContent = Math.round(view.s * 100) + "%";
  clearTimeout(viewSaveT); viewSaveT = setTimeout(() => { if (boardId) LS.set("rb.view." + boardId, view); }, 400);
  clearTimeout(resT); resT = setTimeout(updateResolution, 160);
}
const toWorld = (cx, cy) => ({ x: (cx - view.x) / view.s, y: (cy - view.y) / view.s });
function zoomAt(cx, cy, f){
  const s2 = Math.min(16, Math.max(0.02, view.s * f)); const w = toWorld(cx, cy);
  view.s = s2; view.x = cx - w.x * s2; view.y = cy - w.y * s2; applyView();
}
function fitRects(rects, maxScale = 1.5){
  if (!rects.length){ view = { x: innerWidth / 2, y: innerHeight / 2, s: 1 }; applyView(); return; }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const r of rects){ x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); }
  const padT = 70, padB = sel.size ? 80 : 60, padX = 24;
  const W = innerWidth - padX * 2, H = innerHeight - padT - padB;
  const s = Math.min(maxScale, W / (x1 - x0), H / (y1 - y0));
  view.s = s; view.x = padX + (W - (x1 - x0) * s) / 2 - x0 * s; view.y = padT + (H - (y1 - y0) * s) / 2 - y0 * s;
  applyView();
}
const fitAll = () => fitRects(boardPls().map(p => ({ x: p.x, y: p.y, w: p.g.w, h: p.g.h })));
const fitSel = () => fitRects([...sel].map(plRect).filter(Boolean), 8);

/* ================= images ================= */
const imgURL = (f, full) => (full ? "img/" : "thumb/") + f;
const rawURL = (f, full) => RB.local ? imgURL(f, full) : `https://raw.githubusercontent.com/${RB.owner}/${RB.repo}/${RB.branch}/${imgURL(f, full)}`;
function setImg(img, f, full){
  const want = imgURL(f, full);
  if (img.dataset.want === want) return;
  img.dataset.want = want; img.dataset.f = f; img.dataset.full = full ? 1 : "";
  img.dataset.tries = "0"; img.classList.remove("err");
  img.src = want;
}
function onImgError(e){
  const img = e.target, tries = +img.dataset.tries || 0, f = img.dataset.f, full = !!img.dataset.full;
  if (tries === 0){ img.dataset.tries = "1"; img.src = rawURL(f, full); }          // 방금 올라가서 아직 배포 전인 경우
  else if (tries === 1 && !full){ img.dataset.tries = "2"; img.src = imgURL(f, true); } // 썸네일이 없으면 원본
  else img.classList.add("err");
}
function updateResolution(){
  for (const [id, el] of els){
    const p = data.placements[id]; if (!p) continue;
    const big = (p.h || 300) * view.s > 520;
    const sx = p.x * view.s + view.x, sy = p.y * view.s + view.y, g = geom(p);
    const visible = sx < innerWidth && sy < innerHeight && sx + g.w * view.s > 0 && sy + g.h * view.s > 0;
    for (const img of el.querySelectorAll("img.im")) setImg(img, img.dataset.f, big && visible);
  }
  updateVideos();
}

/* ================= render ================= */
function maxZ(){ let m = 0; for (const p of Object.values(data.placements)) if (p.board === boardId) m = Math.max(m, p.z || 0); return m; }
const vidURL = f => "vid/" + f;
const vidRaw = f => RB.local ? vidURL(f) : `https://raw.githubusercontent.com/${RB.owner}/${RB.repo}/${RB.branch}/vid/${f}`;
const playIO = "IntersectionObserver" in window ? new IntersectionObserver(es => { for (const e of es) e.target._vis = e.isIntersecting; updateVideos(); }) : null;
function updateVideos(){
  for (const v of world.querySelectorAll("video.im")){
    const big = v._vis !== false && v.getBoundingClientRect().width > 90;
    if (big){ if (!v.src) v.src = vidURL(v.dataset.v); if (v.paused) v.play().catch(() => {}); }
    else if (!v.paused) v.pause();
  }
}
function renderPl(id){
  const p = data.placements[id]; if (!p) return;
  const post = data.posts[p.post] || {};
  const g = geom(p);
  const sig = JSON.stringify([post.images, post.author, post.caption, post.link, g.card, g.folded]);
  let el = els.get(id);
  if (el && el.dataset.sig !== sig){ el.remove(); els.delete(id); el = null; }
  if (!el){
    el = document.createElement("div"); el.className = "grp" + (g.card ? " card" : ""); el.dataset.id = id; el.dataset.sig = sig;
    if (g.card){
      const cap = document.createElement("div"); cap.className = "cap"; cap.textContent = post.caption || ""; el.append(cap);
      const hint = document.createElement("div"); hint.className = "hint"; hint.textContent = "이미지를 아직 못 받았어요"; el.append(hint);
    } else g.parts.forEach(pt => {
      let m;
      if (pt.im.v){
        m = document.createElement("video"); m.className = "im"; m.muted = true; m.loop = true; m.playsInline = true; m.preload = "none";
        m.setAttribute("muted", ""); m.setAttribute("playsinline", "");
        m.dataset.v = pt.im.v; m.poster = imgURL(pt.im.f, false);
        m.addEventListener("error", () => { if (!m.dataset.retried){ m.dataset.retried = 1; m.src = vidRaw(m.dataset.v); } });
        const badge = document.createElement("i"); badge.className = "vb"; badge.dataset.i = pt.i; el.append(badge);
        playIO && playIO.observe(m);
      } else {
        m = new Image(); m.alt = ""; m.draggable = false; m.decoding = "async"; m.className = "im";
        m.addEventListener("error", onImgError); setImg(m, pt.im.f, false);
      }
      m.dataset.i = pt.i; el.append(m);
    });
    if (g.more){ const mo = document.createElement("div"); mo.className = "more"; mo.textContent = "+" + g.more.n; el.append(mo); }
    const hd = document.createElement("div"); hd.className = "hd";
    if (post.link){ const lk = document.createElement("i"); lk.className = "lk"; hd.append(lk); }
    const au = document.createElement("span"); au.className = "au"; au.textContent = post.author ? "@" + post.author : (post.link ? "인스타 게시글" : "내 이미지");
    const n = document.createElement("span"); n.className = "n"; n.textContent = g.card ? "이미지 없음" : (g.total > 1 ? g.total + "장" : "");
    hd.append(au, n); el.append(hd);
    const h = document.createElement("i"); h.className = "h"; el.append(h);
    world.append(el); els.set(id, el);
  }
  el.style.left = p.x + "px"; el.style.top = p.y + "px";
  el.style.width = g.w + "px"; el.style.height = g.h + "px"; el.style.zIndex = p.z || 0;
  el.style.setProperty("--fh", Math.max(8, g.H * 0.09) + "px");
  const media = el.querySelectorAll(".im");
  g.parts.forEach((pt, i) => { const m = media[i]; if (!m) return; Object.assign(m.style, { left: pt.x + "px", top: pt.y + "px", width: pt.w + "px", height: pt.h + "px" }); });
  for (const b of el.querySelectorAll(".vb")){ const pt = g.parts[+b.dataset.i]; if (pt) Object.assign(b.style, { left: (pt.x + 6) + "px", top: (pt.y + pt.h - 6) + "px" }); }
  const mo = el.querySelector(".more"); if (mo && g.more) Object.assign(mo.style, { left: g.more.x + "px", top: g.more.y + "px", width: g.more.w + "px", height: g.more.h + "px", fontSize: g.H * 0.16 + "px" });
  el.classList.toggle("sel", sel.has(id));
}
function renderAll(){
  for (const [id, el] of els){ const p = data.placements[id]; if (!p || p.board !== boardId){ el.remove(); els.delete(id); sel.delete(id); } }
  for (const [id, p] of Object.entries(data.placements)) if (p.board === boardId) renderPl(id);
  renderChrome(); updateResolution();
}
function renderSel(){ for (const [id, el] of els) el.classList.toggle("sel", sel.has(id)); renderChrome(); }
const boardsSorted = () => Object.entries(data.boards).map(([id, b]) => ({ id, ...b })).sort((a, b) => (a.order || 0) - (b.order || 0));
const countIn = bid => Object.values(data.placements).filter(p => p.board === bid).length;

function renderChrome(){
  const b = data.boards[boardId];
  $("#boardBtn .nm").textContent = b ? b.name : "보드 없음";
  $("#boardBtn .ct").textContent = b ? countIn(boardId) : "";
  $("#undoBtn").disabled = !undoStack.length; $("#redoBtn").disabled = !redoStack.length;
  const sb = $("#selbar"); sb.hidden = !sel.size;
  if (sel.size){
    $("#selCount").textContent = sel.size + "개";
    const one = sel.size === 1 ? data.placements[[...sel][0]] : null;
    const post = one ? data.posts[one.post] : null;
    const a = $("#openLink"); a.hidden = !(post && post.link); if (post && post.link) a.href = post.link;
    $("#editLink").hidden = !one;
    $("#capBtn").hidden = !(post && post.caption);
    const og = one ? geom(one) : null;
    $("#foldBtn").hidden = !(og && og.total > FOLD);
    if (og) $("#foldBtn span").textContent = one.open ? "접기" : "펼치기";
    $("#editLink span").textContent = post && post.link ? "링크 수정" : "링크 달기";
  } else { $("#linkpop").hidden = true; $("#cappop").hidden = true; }
  const empty = $("#empty");
  const n = b ? countIn(boardId) : 0;
  empty.hidden = !!n;
  if (!n){
    $("#emptyTitle").textContent = b ? "이 보드는 비어 있어요" : "보드가 없어요";
    $("#emptyText").textContent = b ? "이미지를 끌어다 놓거나 Ctrl+V로 붙여넣으세요." : "왼쪽 위 메뉴에서 새 보드를 만들어 주세요.";
  }
}

function openBoard(id){
  boardId = id; LS.set("rb.board", id);
  sel.clear();
  for (const el of els.values()) el.remove(); els.clear();
  const saved = LS.get("rb.view." + id);
  renderAll();
  if (saved && isFinite(saved.s)){ view = saved; applyView(); } else fitAll();
  renderBoards();
}

/* ================= undo / redo ================= */
const undoStack = [], redoStack = [];
const snap = ids => ids.map(id => ({ id, v: data.placements[id] ? clone(data.placements[id]) : null }));
function record(before){
  const after = snap(before.map(s => s.id));
  if (JSON.stringify(before) === JSON.stringify(after)) return;
  undoStack.push({ before, after, board: boardId }); if (undoStack.length > 300) undoStack.shift();
  redoStack.length = 0; renderChrome();
}
function applySnap(list){ for (const s of list) edit("placements", s.id, s.v ? clone(s.v) : null); renderAll(); }
function undo(){ const e = undoStack.pop(); if (!e) return; if (e.board !== boardId && data.boards[e.board]) openBoard(e.board); applySnap(e.before); redoStack.push(e); renderChrome(); }
function redo(){ const e = redoStack.pop(); if (!e) return; if (e.board !== boardId && data.boards[e.board]) openBoard(e.board); applySnap(e.after); undoStack.push(e); renderChrome(); }

/* ================= GitHub sync ================= */
let saveT = 0, saving = false, syncState = "ok";
function setSync(state, text){
  syncState = state; const b = $("#sync"); b.className = "btn " + state; b.querySelector("span").textContent = text;
}
function refreshSyncLabel(){
  if (RB.local) return setSync(hasPend() ? "warn" : "ok", hasPend() ? "미리보기(저장 안 됨)" : "미리보기");
  if (!hasPend()) return setSync("ok", "저장됨");
  if (!RB.token()) return setSync("warn", "이 기기에만 저장");
}
function scheduleSave(){ refreshSyncLabel(); clearTimeout(saveT); if (!RB.local && RB.token()) saveT = setTimeout(save, 1200); }
const b64 = str => { const bytes = new TextEncoder().encode(str); let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\n/g, "")), c => c.charCodeAt(0)));
async function gh(path, opts = {}){
  const r = await fetch(RB.api(path), { ...opts, cache: "no-store", headers: RB.headers(opts.body ? { "Content-Type": "application/json" } : {}) });
  if (!r.ok){ const e = new Error("GitHub " + r.status); e.status = r.status; throw e; }
  return r.status === 204 ? null : r.json();
}
async function save(){
  if (saving){ saveT = setTimeout(save, 800); return; }
  if (!hasPend()) return refreshSyncLabel();
  saving = true; setSync("busy", "저장 중…");
  const sent = clone(pend);
  try {
    for (let attempt = 0; attempt < 4; attempt++){
      const cur = await gh(`contents/data.json?ref=${RB.branch}`);
      const base = normalize(JSON.parse(unb64(cur.content)));
      const merged = overlay(base, sent);
      try {
        await gh("contents/data.json", { method: "PUT", body: JSON.stringify({ message: "보드 배치 저장", content: b64(JSON.stringify(merged, null, 1)), sha: cur.sha, branch: RB.branch }) });
        remote = merged;
        try {   // 다른 기기들이 알아채도록 version.json의 data 값을 바꿔요
          const vf = await gh(`contents/version.json?ref=${RB.branch}`);
          const v = JSON.parse(unb64(vf.content)); v.data = "web-" + Date.now().toString(36);
          await gh("contents/version.json", { method: "PUT", body: JSON.stringify({ message: "배치 버전 갱신", content: b64(JSON.stringify(v)), sha: vf.sha, branch: RB.branch }) });
        } catch (e){ console.warn("version bump", e); }
        break;
      } catch (e){ if (e.status !== 409 && e.status !== 422) throw e; if (attempt === 3) throw e; await new Promise(r => setTimeout(r, 400 + Math.random() * 600)); }
    }
    for (const k of KINDS) for (const id of Object.keys(sent[k])) if (JSON.stringify(pend[k][id]) === JSON.stringify(sent[k][id])) delete pend[k][id];
    LS.set("rb.pend", pend);
    refreshSyncLabel();
  } catch (e){
    console.warn("save failed", e);
    if (e.status === 401 || e.status === 403 || e.status === 404) setSync("err", "토큰 확인 필요");
    else { setSync("err", "저장 실패 · 다시 시도"); saveT = setTimeout(save, 8000); }
  } finally { saving = false; if (hasPend() && syncState !== "err") scheduleSave(); }
}
let gesturing = false, queuedRemote = null;
RB.onRemote = (d) => {
  if (gesturing){ queuedRemote = d; return; }
  remote = normalize(d);
  data = overlay(remote, pend);
  if (!data.boards[boardId]){ const first = boardsSorted()[0]; if (first) openBoard(first.id); else { boardId = null; renderAll(); } }
  else { renderAll(); renderBoards(); }
};
RB.beforeReload = () => { LS.set("rb.pend", pend); };

/* ================= boards panel ================= */
let armDelete = null, editing = null;
function renderBoards(){
  const list = $("#blist"); list.textContent = "";
  for (const b of boardsSorted()){
    const row = document.createElement("div"); row.className = "brow" + (b.id === boardId ? " cur" : "");
    if (editing === b.id){
      const f = document.createElement("form"); f.className = "row"; f.style.cssText = "flex:1;padding:2px";
      const inp = document.createElement("input"); inp.className = "field"; inp.value = b.name; inp.maxLength = 60; inp.id = "rename-" + b.id;
      const ok = document.createElement("button"); ok.className = "btn primary"; ok.type = "submit"; ok.textContent = "저장";
      f.append(inp, ok);
      f.onsubmit = e => { e.preventDefault(); const v = inp.value.trim(); editing = null; if (v && v !== b.name){ edit("boards", b.id, { ...data.boards[b.id], name: v }); renderChrome(); } renderBoards(); };
      row.append(f); list.append(row); setTimeout(() => { inp.focus(); inp.select(); });
      continue;
    }
    const go = document.createElement("button"); go.type = "button"; go.className = "go";
    const nm = document.createElement("span"); nm.textContent = b.name;
    const c = document.createElement("span"); c.className = "c"; c.textContent = countIn(b.id);
    go.append(nm, c); go.onclick = () => { openBoard(b.id); closePops(); };
    const ed = document.createElement("button"); ed.type = "button"; ed.className = "mini"; ed.innerHTML = ICON.edit; ed.setAttribute("aria-label", "이름 바꾸기");
    ed.onclick = () => { editing = b.id; armDelete = null; renderBoards(); };
    const del = document.createElement("button"); del.type = "button"; del.className = "mini" + (armDelete === b.id ? " arm" : "");
    if (armDelete === b.id) del.textContent = "정말 삭제"; else { del.innerHTML = ICON.del; del.setAttribute("aria-label", "보드 삭제"); }
    del.onclick = () => { if (armDelete === b.id){ armDelete = null; deleteBoard(b.id); } else { armDelete = b.id; renderBoards(); } };
    row.append(go, ed, del); list.append(row);
  }
}
function deleteBoard(id){
  const name = data.boards[id]?.name || "";
  for (const [pid, p] of Object.entries(data.placements)) if (p.board === id) edit("placements", pid, null);
  edit("boards", id, null);
  if (boardId === id){ const f = boardsSorted()[0]; if (f) openBoard(f.id); else { boardId = null; renderAll(); } }
  renderBoards(); toast(`'${name}' 보드를 삭제했어요`);
}
function createBoard(name){
  const id = "b" + Date.now().toString(36);
  const order = boardsSorted().reduce((m, b) => Math.max(m, b.order || 0), 0) + 1;
  edit("boards", id, { name, order });
  openBoard(id); return id;
}

/* ================= actions ================= */
function bringFront(ids){
  const before = snap(ids); let z = maxZ();
  for (const id of ids){ const p = data.placements[id]; if (p) edit("placements", id, { ...p, z: ++z }); }
  renderAll(); record(before);
}
function removeSel(){
  if (!sel.size) return;
  const ids = [...sel]; const before = snap(ids);
  for (const id of ids) edit("placements", id, null);
  sel.clear(); renderAll(); record(before);
  toast(ids.length + "개를 보드에서 뺐어요 · Ctrl+Z로 되돌릴 수 있어요");
}
function skyline(rects, W, gap){   // 빈틈이 적게: 각 틀을 지금 가장 낮은 자리에 차례로 놓아요
  let sky = [[0, 0, W]]; const out = [];
  for (const [w, h] of rects){
    const w2 = w + gap; let best = null;
    for (let i = 0; i < sky.length; i++){
      const x = sky[i][0]; if (x + w > W + 0.5) break;
      let y = 0, j = i, cov = 0;
      while (cov < w2 && j < sky.length){ y = Math.max(y, sky[j][1]); cov = sky[j][0] + sky[j][2] - x; j++; }
      if (cov < w && x + w > W) continue;
      if (!best || y < best[1] - 0.5 || (Math.abs(y - best[1]) <= 0.5 && x < best[0])) best = [x, y];
    }
    const [x, y] = best; out.push(best);
    const nx0 = x, nx1 = x + w2; let nw = [];
    for (const [sx, sy, sw] of sky){ const a = sx, b = sx + sw;
      if (b <= nx0 || a >= nx1){ nw.push([sx, sy, sw]); continue; }
      if (a < nx0) nw.push([a, sy, nx0 - a]); if (b > nx1) nw.push([nx1, sy, b - nx1]); }
    nw.push([nx0, y + h + gap, w2]); nw.sort((p, q) => p[0] - q[0]);
    sky = []; for (const sg of nw){ const L = sky[sky.length - 1];
      if (L && Math.abs(L[1] - sg[1]) < 0.5 && Math.abs(L[0] + L[2] - sg[0]) < 0.5) L[2] += sg[2]; else sky.push(sg); }
  }
  return out;
}
function arrange(){
  const ids = sel.size > 1 ? [...sel] : boardPls().map(p => p.id);
  if (ids.length < 2) return;
  const before = snap(ids);
  const arr = ids.map(id => ({ id, p: data.placements[id], g: geom(data.placements[id]) }));
  const x0 = Math.min(...arr.map(a => a.p.x)), y0 = Math.min(...arr.map(a => a.p.y));
  const area = arr.reduce((s, a) => s + a.g.w * a.g.h, 0), maxW = Math.max(...arr.map(a => a.g.w));
  arr.sort((a, b) => b.g.h - a.g.h || b.g.w - a.g.w);
  let best = null;
  for (const m of [1.1, 1.25, 1.45, 1.7, 2.0]){
    const W = Math.max(Math.sqrt(area) * m, maxW);
    const pos = skyline(arr.map(a => [a.g.w, a.g.h]), W, 28);
    const Wt = Math.max(...pos.map((p, i) => p[0] + arr[i].g.w)), Ht = Math.max(...pos.map((p, i) => p[1] + arr[i].g.h));
    const score = area / (Wt * Ht) - 0.15 * Math.abs(Math.log((Wt / Ht) / 1.6));
    if (!best || score > best.score) best = { score, pos };
  }
  arr.forEach((a, i) => edit("placements", a.id, { ...a.p, x: Math.round(x0 + best.pos[i][0]), y: Math.round(y0 + best.pos[i][1]) }));
  renderAll(); record(before);
  fitRects(ids.map(plRect));
}
function toggleFold(id){
  const p = data.placements[id]; if (!p) return;
  const before = snap([id]);
  edit("placements", id, { ...p, open: !p.open, z: maxZ() + 1 });
  renderAll(); record(before);
}
function showCaption(){
  const cp = $("#cappop"); if (!cp.hidden){ cp.hidden = true; return; }
  const pl = data.placements[[...sel][0]]; const post = pl && data.posts[pl.post]; if (!post) return;
  cp.querySelector(".au").textContent = post.author ? "@" + post.author : "";
  cp.querySelector(".tx").textContent = post.caption || "";
  $("#linkpop").hidden = true; cp.hidden = false;
}
function stepBoard(d){
  const bs = boardsSorted(); if (!bs.length) return;
  const i = Math.max(0, bs.findIndex(b => b.id === boardId));
  openBoard(bs[(i + d + bs.length) % bs.length].id);
  toast(data.boards[boardId].name, { ms: 1200 });
}
function setLink(id, url){
  const pl = data.placements[id]; if (!pl) return;
  const post = data.posts[pl.post] || {};
  edit("posts", pl.post, { ...post, link: url });
  renderAll();
}

/* ================= adding images (needs token) ================= */
async function shrink(file, max){
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  const w = bmp.width, h = bmp.height; bmp.close && bmp.close();
  const blob = await new Promise(r => c.toBlob(r, "image/jpeg", 0.86));
  return { blob, w, h };
}
const blobB64 = blob => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(",")[1]); fr.onerror = rej; fr.readAsDataURL(blob); });
let busy = false;
async function addFiles(files, at){
  files = files.filter(f => f.type.startsWith("image/"));
  if (!files.length) return;
  if (RB.local || !RB.token()){ toast("이미지를 올리려면 왼쪽 아래 저장 버튼에서 GitHub 토큰을 넣어 주세요.", { ms: 5000 }); openTokPop(); return; }
  if (busy){ toast("이전 업로드가 끝난 뒤 다시 시도해 주세요."); return; }
  if (!boardId) createBoard("새 보드");
  busy = true;
  const t = toast(`이미지 올리는 중 0/${files.length}`, { sticky: true });
  const postId = "u" + Date.now().toString(36);
  const images = [];
  try {
    for (const [i, f] of files.entries()){
      const full = await shrink(f, 1600), th = await shrink(f, 600);
      const name = `${postId}/${i + 1}.jpg`;
      await gh(`contents/img/${name}`, { method: "PUT", body: JSON.stringify({ message: "이미지 추가", content: await blobB64(full.blob), branch: RB.branch }) });
      await gh(`contents/thumb/${name}`, { method: "PUT", body: JSON.stringify({ message: "썸네일 추가", content: await blobB64(th.blob), branch: RB.branch }) });
      images.push({ f: name, w: full.w, h: full.h });
      t.firstChild.textContent = `이미지 올리는 중 ${i + 1}/${files.length}`;
    }
  } catch (e){ console.warn(e); toast("일부 이미지를 올리지 못했어요."); }
  t.remove(); busy = false;
  if (!images.length) return;
  edit("posts", postId, { link: "", author: "", caption: "", created: Date.now(), images });
  const id = boardId + "~" + postId;
  const g = geom({ post: postId, h: 300 });
  edit("placements", id, { board: boardId, post: postId, x: Math.round(at.x - g.w / 2), y: Math.round(at.y - g.h / 2), h: 300, z: maxZ() + 1 });
  record([{ id, v: null }]);
  sel.clear(); sel.add(id); renderAll();
  toast("올렸어요. 인스타 링크를 복사해서 Ctrl+V 하면 이 게시글에 연결돼요.", { ms: 4500 });
}

/* ================= pointer gestures ================= */
const ptrs = new Map(); let g = null;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
stage.addEventListener("contextmenu", e => e.preventDefault());
stage.addEventListener("pointerdown", e => {
  closePops();
  try { stage.setPointerCapture(e.pointerId); } catch {}
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2){ endGesture(true); const [a, b] = [...ptrs.values()]; g = { type: "pinch", d0: dist(a, b), m0: mid(a, b), v0: { ...view } }; return; }
  if (ptrs.size > 2) return;
  const grp = e.target.closest(".grp");
  const base = { sx: e.clientX, sy: e.clientY, moved: false, button: e.button };
  if (e.button === 1 || e.button === 2 || spaceDown){ g = { type: "pan", ...base, vx: view.x, vy: view.y, id: grp && grp.dataset.id }; stage.classList.add("panning"); return; }
  if (grp && e.target.classList.contains("h")){
    const id = grp.dataset.id; g = { type: "resize", ...base, id, before: snap([id]), h0: data.placements[id].h || 300, w0: geom(data.placements[id]).w }; gesturing = true; return;
  }
  if (grp){
    const id = grp.dataset.id, add = e.shiftKey || e.ctrlKey || e.metaKey;
    if (add){ if (sel.has(id)){ sel.delete(id); renderSel(); g = { type: "none" }; return; } sel.add(id); }
    else if (!sel.has(id)){ sel.clear(); sel.add(id); }
    renderSel();
    const ids = [...sel];
    g = { type: "move", ...base, clickId: id, add, more: e.target.classList.contains("more"), before: snap(ids), starts: ids.map(i => ({ id: i, x: data.placements[i].x, y: data.placements[i].y })) };
    gesturing = true; return;
  }
  if (e.pointerType === "touch"){ g = { type: "pan", ...base, vx: view.x, vy: view.y, tapClear: true }; return; }
  g = { type: "marquee", ...base, base: e.shiftKey ? new Set(sel) : new Set() };
  if (!e.shiftKey && sel.size){ sel.clear(); renderSel(); }
});
stage.addEventListener("pointermove", e => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (!g) return;
  if (g.type === "pinch"){
    if (ptrs.size < 2) return;
    const [a, b] = [...ptrs.values()];
    const s = Math.min(16, Math.max(0.02, g.v0.s * dist(a, b) / g.d0)), m = mid(a, b);
    const wx = (g.m0.x - g.v0.x) / g.v0.s, wy = (g.m0.y - g.v0.y) / g.v0.s;
    view.s = s; view.x = m.x - wx * s; view.y = m.y - wy * s; applyView(); return;
  }
  const dx = e.clientX - g.sx, dy = e.clientY - g.sy;
  if (!g.moved && Math.hypot(dx, dy) < 4) return;
  const first = !g.moved; g.moved = true;
  if (g.type === "pan"){ view.x = g.vx + dx; view.y = g.vy + dy; applyView(); }
  else if (g.type === "move"){
    if (first){ let z = maxZ(); const top = g.starts.length === 1 && (data.placements[g.starts[0].id].z || 0) === z; if (!top) for (const s of g.starts) data.placements[s.id].z = ++z; }
    for (const s of g.starts){ const p = data.placements[s.id]; if (!p) continue; p.x = s.x + dx / view.s; p.y = s.y + dy / view.s; renderPl(s.id); }
  } else if (g.type === "resize"){
    const p = data.placements[g.id]; if (!p) return;
    const geo = geom(p); const ratio = (geo.w) / (p.h || 300);
    const grow = Math.max(dx / ratio, dy) / view.s;
    p.h = Math.max(40, g.h0 + grow); renderPl(g.id);
  } else if (g.type === "marquee"){
    const x = Math.min(e.clientX, g.sx), y = Math.min(e.clientY, g.sy), w = Math.abs(dx), h = Math.abs(dy);
    Object.assign(marquee.style, { display: "block", left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
    const a = toWorld(x, y), b = toWorld(x + w, y + h);
    sel.clear(); g.base.forEach(i => sel.add(i));
    for (const p of boardPls()) if (p.x < b.x && p.x + p.g.w > a.x && p.y < b.y && p.y + p.g.h > a.y) sel.add(p.id);
    renderSel();
  }
});
function endGesture(cancelled){
  if (!g) return;
  const t = g; g = null; gesturing = false;
  stage.classList.remove("panning"); marquee.style.display = "none";
  if (t.type === "move"){
    if (t.moved){
      for (const s of t.starts){ const p = data.placements[s.id]; if (p) edit("placements", s.id, { ...p, x: Math.round(p.x), y: Math.round(p.y) }); }
      record(t.before);
    } else if (!cancelled && t.more){ toggleFold(t.clickId); }
    else if (!cancelled && !t.add && sel.size > 1){ sel.clear(); sel.add(t.clickId); renderSel(); }
  } else if (t.type === "resize"){
    const p = data.placements[t.id];
    if (t.moved && p){ edit("placements", t.id, { ...p, h: Math.round(p.h) }); record(t.before); updateResolution(); }
  } else if (t.type === "pan" && !t.moved && !cancelled){
    if (t.tapClear && sel.size){ sel.clear(); renderSel(); }
    if (t.button === 2 && t.id && !sel.has(t.id)){ sel.clear(); sel.add(t.id); renderSel(); }
  }
  if (queuedRemote){ const d = queuedRemote; queuedRemote = null; RB.onRemote(d); }
}
function onUp(e){
  if (!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  if (g && g.type === "pinch"){
    if (ptrs.size === 1){ const [p] = [...ptrs.values()]; g = { type: "pan", sx: p.x, sy: p.y, vx: view.x, vy: view.y, moved: true }; } else if (!ptrs.size) g = null;
    return;
  }
  if (!ptrs.size) endGesture(e.type === "pointercancel");
}
stage.addEventListener("pointerup", onUp);
stage.addEventListener("pointercancel", onUp);

let lastTap = { t: 0, key: null, x: 0, y: 0 };
stage.addEventListener("pointerup", e => {
  if (e.button !== 0) return;
  const grp = e.target.closest && e.target.closest(".grp");
  let key = null, rect = null;
  if (grp){
    const id = grp.dataset.id, p = data.placements[id]; const geo = geom(p);
    const w = toWorld(e.clientX, e.clientY);
    const part = geo.parts.find(pt => w.x >= p.x + pt.x && w.x <= p.x + pt.x + pt.w);
    key = id + ":" + (part ? geo.parts.indexOf(part) : "all");
    rect = part ? { x: p.x + part.x, y: p.y + part.y, w: part.w, h: part.h } : { x: p.x, y: p.y, w: geo.w, h: geo.h };
  }
  const now = performance.now();
  if (now - lastTap.t < 320 && lastTap.key === key && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 20){
    lastTap.t = 0; if (rect) fitRects([rect], 10); else fitAll(); return;
  }
  lastTap = { t: now, key, x: e.clientX, y: e.clientY };
});
stage.addEventListener("wheel", e => {
  e.preventDefault();
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
  const dx = e.deltaX * unit, dy = e.deltaY * unit;
  if (!e.ctrlKey && !e.metaKey && Math.abs(dx) > 0.5 && e.deltaMode === 0){ view.x -= dx; view.y -= dy; applyView(); return; }
  zoomAt(e.clientX, e.clientY, Math.exp(-Math.max(-300, Math.min(300, dy)) * (e.ctrlKey ? 0.01 : 0.0018)));
}, { passive: false });

/* ================= keyboard / paste / drop ================= */
const typing = e => { const t = e.target; return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable); };
addEventListener("keydown", e => {
  if (typing(e)){ if (e.key === "Escape") closePops(); return; }
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (mod && k === "z"){ e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
  if (mod && k === "y"){ e.preventDefault(); redo(); return; }
  if (mod && k === "a"){ e.preventDefault(); boardPls().forEach(p => sel.add(p.id)); renderSel(); return; }
  if (e.code === "Space"){ e.preventDefault(); if (!spaceDown){ spaceDown = true; stage.classList.add("space"); } return; }
  if (mod) return;
  switch (e.key){
    case "Delete": case "Backspace": e.preventDefault(); removeSel(); break;
    case "Escape": closePops(); if (sel.size){ sel.clear(); renderSel(); } break;
    case "f": case "F": sel.size ? fitSel() : fitAll(); break;
    case "a": case "A": arrange(); break;
    case "l": case "L": document.body.classList.toggle("labels"); LS.set("rb.labels", document.body.classList.contains("labels")); break;
    case "[": stepBoard(-1); break;
    case "]": stepBoard(1); break;
    case "+": case "=": zoomAt(innerWidth / 2, innerHeight / 2, 1.25); break;
    case "-": zoomAt(innerWidth / 2, innerHeight / 2, 0.8); break;
    case "0": zoomAt(innerWidth / 2, innerHeight / 2, 1 / view.s); break;
  }
});
addEventListener("keyup", e => { if (e.code === "Space"){ spaceDown = false; stage.classList.remove("space"); } });
addEventListener("blur", () => { spaceDown = false; stage.classList.remove("space"); });
document.addEventListener("paste", e => {
  if (typing(e)) return;
  const cd = e.clipboardData; if (!cd) return;
  const files = [...cd.files].filter(f => f.type.startsWith("image/"));
  if (files.length){ e.preventDefault(); addFiles(files, toWorld(innerWidth / 2, innerHeight / 2)); return; }
  const text = (cd.getData("text") || "").trim();
  if (/^https?:\/\/\S+$/.test(text)){
    e.preventDefault();
    if (sel.size === 1){ setLink([...sel][0], text); toast("원본 링크를 연결했어요"); }
    else toast("게시글을 하나만 선택한 뒤 붙여넣으면 링크로 연결돼요");
  }
});
let dragDepth = 0;
const hasFiles = e => e.dataTransfer && [...e.dataTransfer.types].includes("Files");
addEventListener("dragenter", e => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth++; document.body.classList.add("dragging"); });
addEventListener("dragover", e => e.preventDefault());
addEventListener("dragleave", e => { if (!hasFiles(e)) return; if (--dragDepth <= 0){ dragDepth = 0; document.body.classList.remove("dragging"); } });
addEventListener("drop", e => {
  e.preventDefault(); dragDepth = 0; document.body.classList.remove("dragging");
  const files = [...(e.dataTransfer ? e.dataTransfer.files : [])];
  if (files.length) addFiles(files, toWorld(e.clientX, e.clientY));
});
$("#fileIn").addEventListener("change", e => { const f = [...e.target.files]; e.target.value = ""; addFiles(f, toWorld(innerWidth / 2, innerHeight / 2)); });

/* ================= chrome wiring ================= */
function closePops(){
  for (const id of ["boards", "help", "linkpop", "tokpop", "cappop"]) $("#" + id).hidden = true;
  $("#boardBtn").setAttribute("aria-expanded", "false");
  armDelete = null; editing = null;
}
function openTokPop(){
  closePops();
  $("#tokText").textContent = RB.local
    ? "로컬 미리보기에서는 저장되지 않아요."
    : RB.token()
      ? "이 기기에 토큰이 저장되어 있어요. 바꾸려면 새 토큰을 넣고, 지우려면 비운 채 저장하세요."
      : "화면에서 옮긴 배치를 다른 기기와 맞추려면, 이 기기에 GitHub 토큰을 한 번 넣어 주세요. 토큰은 이 브라우저에만 저장돼요.";
  $("#tokInput").value = ""; $("#tokpop").hidden = false; $("#tokInput").focus();
}
$("#boardBtn").onclick = () => { const open = $("#boards").hidden; closePops(); if (open){ renderBoards(); $("#boards").hidden = false; $("#boardBtn").setAttribute("aria-expanded", "true"); } };
$("#helpBtn").onclick = () => { const open = $("#help").hidden; closePops(); if (open) $("#help").hidden = false; };
$("#sync").onclick = () => { if (syncState === "err" && RB.token()) { save(); return; } openTokPop(); };
$("#tokpop").onsubmit = e => {
  e.preventDefault(); const v = $("#tokInput").value.trim();
  try { if (v) localStorage.setItem("rb.token", v); else localStorage.removeItem("rb.token"); } catch {}
  closePops(); toast(v ? "토큰을 저장했어요" : "토큰을 지웠어요"); scheduleSave(); refreshSyncLabel();
};
$("#newBoard").onsubmit = e => { e.preventDefault(); const v = $("#newBoardName").value.trim(); if (!v) return; $("#newBoardName").value = ""; createBoard(v); closePops(); toast(`'${v}' 보드를 만들었어요`); };
$("#addBtn").onclick = () => $("#fileIn").click();
$("#fitBtn").onclick = fitAll;
$("#arrangeBtn").onclick = arrange;
$("#undoBtn").onclick = undo;
$("#redoBtn").onclick = redo;
$("#zoomIn").onclick = () => zoomAt(innerWidth / 2, innerHeight / 2, 1.25);
$("#zoomOut").onclick = () => zoomAt(innerWidth / 2, innerHeight / 2, 0.8);
$("#zoom").onclick = () => zoomAt(innerWidth / 2, innerHeight / 2, 1 / view.s);
$("#frontBtn").onclick = () => bringFront([...sel]);
$("#zoomSel").onclick = fitSel;
$("#delBtn").onclick = removeSel;
$("#capBtn").onclick = showCaption;
$("#foldBtn").onclick = () => { if (sel.size === 1) toggleFold([...sel][0]); };
$("#editLink").onclick = () => {
  const lp = $("#linkpop"); if (!lp.hidden){ lp.hidden = true; return; }
  const pl = data.placements[[...sel][0]]; if (!pl) return;
  $("#linkInput").value = data.posts[pl.post]?.link || ""; lp.hidden = false; $("#linkInput").focus();
};
$("#linkpop").onsubmit = e => {
  e.preventDefault(); const v = $("#linkInput").value.trim();
  if (v && !/^https?:\/\//i.test(v)){ toast("https://로 시작하는 링크를 넣어 주세요"); return; }
  setLink([...sel][0], v); $("#linkpop").hidden = true; toast(v ? "링크를 저장했어요" : "링크를 지웠어요");
};
addEventListener("resize", applyView);

/* ================= boot ================= */
if (LS.get("rb.labels")) document.body.classList.add("labels");
const last = LS.get("rb.board");
const firstBoard = data.boards[last] ? last : boardsSorted()[0]?.id;
if (firstBoard) openBoard(firstBoard); else { renderAll(); applyView(); }
refreshSyncLabel();
if (hasPend() && RB.token() && !RB.local) scheduleSave();
})();
