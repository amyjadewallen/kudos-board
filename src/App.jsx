import { supabase } from "./supabase.js";
import { useState, useEffect, useRef } from "react";

const CATS = [
  { id: "teamwork",        label: "Teamwork",        emoji: "🤝", color: "#C45E1A", bg: "#FEF0E6" },
  { id: "code-craft",      label: "Code Craft",       emoji: "💻", color: "#1D4ED8", bg: "#EFF6FF" },
  { id: "mentorship",      label: "Mentorship",       emoji: "🌱", color: "#15803D", bg: "#F0FDF4" },
  { id: "problem-solving", label: "Problem Solving",  emoji: "🧩", color: "#6D28D9", bg: "#F5F3FF" },
  { id: "above-beyond",    label: "Above & Beyond",   emoji: "⭐", color: "#B45309", bg: "#FFFBEB" },
];
const TEAMS  = ["Helios", "Nexus", "Basilisk", "Leo", "Luna", "Aries"];
const REACTS = ["👏", "❤️", "🔥", "🙌", "✨"];
const KEY    = "kudos-board-v2";
const CC     = ["#D4A853","#E8651A","#5B9A6A","#7C5CBF","#3B82F6","#F43F5E","#10B981"];
const gc     = id  => CATS.find(c => c.id === id);
const fmt    = iso => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function migrate(arr) {
  return arr.map(k => ({
    ...k,
    reactions: { ...Object.fromEntries(REACTS.map(r => [r, 0])), ...(k.reactions || {}) },
    comments: k.comments || [],
    team: k.team || null,
  }));
}

function Card({ k, onProfile, onTeamProfile, onComment, onReact, myR, onEdit, onDelete, isOwn }) {
  const c = gc(k.category);
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div className="kb-card" style={{ "--cc": c?.color, "--cb": c?.bg }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="kb-badge">{c?.emoji} {c?.label}</div>
        {isOwn && (
          <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
            {confirmDelete ? (
              <>
                <button className="kb-action-btn danger" onClick={() => onDelete(k.id)}>Delete</button>
                <button className="kb-action-btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
              </>
            ) : (
              <>
                <button className="kb-action-btn" onClick={() => onEdit(k)} title="Edit">✏️</button>
                <button className="kb-action-btn" onClick={() => setConfirmDelete(true)} title="Delete">🗑</button>
              </>
            )}
          </div>
        )}
      </div>
      <div className="kb-msg">"{k.message}"</div>
      <div className="kb-foot">
        <div>
          <div className="kb-for-lbl">For</div>
          <button className="kb-name-btn" onClick={() => onProfile(k.to)}>{k.to}</button>
          {k.team && (
            <button className="kb-team-chip" onClick={() => onTeamProfile(k.team)}>{k.team}</button>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="kb-from">{k.from ? `from ${k.from}` : "Anonymous"}</div>
          <div className="kb-date">{fmt(k.ts)}</div>
        </div>
      </div>
      <div className="kb-react-row">
        {REACTS.map(r => (
          <button key={r} className={`kb-rbtn${myR[`${k.id}_${r}`] ? " on" : ""}`} onClick={() => onReact(k.id, r)}>
            {r}{k.reactions[r] > 0 && <span className="kb-rc">{k.reactions[r]}</span>}
          </button>
        ))}
        <button className="kb-cbtn" onClick={() => onComment(k)}>
          💬{k.comments.length > 0 && <span className="kb-rc" style={{ background: "#7A5C2E", color: "#FDF8F0" }}>{k.comments.length}</span>}
        </button>
      </div>
    </div>
  );
}

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .kb { min-height: 100vh; background: #EDE9E3; font-family: 'Lora', Georgia, serif; color: #2C2A26; }
  .kb-header { padding: 32px 40px 26px; text-align: center; border-bottom: 1px solid rgba(44,42,38,0.12); }
  .kb-title { font-family: 'Playfair Display', serif; font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 900; color: #7A5C2E; letter-spacing: -0.02em; }
  .kb-sub { font-style: italic; font-size: 0.9rem; color: rgba(44,42,38,0.45); margin-top: 7px; }
  .kb-body { display: grid; grid-template-columns: 350px 1fr; max-width: 1180px; margin: 0 auto; padding: 40px 32px; align-items: start; gap: 0; }
  .kb-body.wide { grid-template-columns: 1fr; }
  .kb-body.wide .kb-wall { padding-left: 0 !important; }
  @media(max-width:820px) { .kb-body { grid-template-columns: 1fr; padding: 24px 16px; } .kb-wall { padding-left: 0 !important; padding-top: 28px; } .kb-header { padding: 22px 16px 18px; } }
  .kb-form-wrap { position: sticky; top: 20px; }
  .kb-form { position: relative; background: #F5F1EB; border: 1px solid rgba(44,42,38,0.13); border-radius: 16px; padding: 26px; }
  .kb-form-x { position: absolute; top: 14px; right: 14px; background: rgba(122,92,46,0.1); border: 1px solid rgba(122,92,46,0.2); border-radius: 50%; width: 26px; height: 26px; cursor: pointer; font-size: 0.65rem; color: rgba(122,92,46,0.7); display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .kb-form-x:hover { background: rgba(122,92,46,0.2); color: #7A5C2E; }
  .kb-form-title { font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 700; color: #7A5C2E; margin-bottom: 20px; padding-right: 30px; }
  .kb-field { margin-bottom: 15px; }
  .kb-lbl { display: block; font-size: 0.68rem; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(44,42,38,0.45); margin-bottom: 6px; }
  .kb-input { width: 100%; background: #FDFAF6; border: 1px solid rgba(44,42,38,0.18); border-radius: 8px; padding: 10px 13px; font-family: 'Lora', serif; font-size: 0.88rem; color: #2C2A26; outline: none; transition: border-color 0.2s; }
  .kb-input:focus { border-color: rgba(122,92,46,0.5); background: #fff; }
  .kb-input::placeholder { color: rgba(44,42,38,0.28); }
  .kb-select { width: 100%; background: #FDFAF6; border: 1px solid rgba(44,42,38,0.18); border-radius: 8px; padding: 10px 13px; font-family: 'Lora', serif; font-size: 0.88rem; color: #2C2A26; outline: none; cursor: pointer; appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237A5C2E' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 13px center; padding-right: 36px; transition: border-color 0.2s; }
  .kb-select:focus { border-color: rgba(122,92,46,0.5); background-color: #fff; }
  .kb-select option { background: #FDFAF6; color: #2C2A26; font-family: 'Lora', serif; }
  .kb-select option:first-child { color: rgba(44,42,38,0.4); }
  .kb-input.sm { background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.12); color: #1B2E1F; }
  .kb-input.sm::placeholder { color: rgba(27,46,31,0.35); }
  .kb-input.sm:focus { border-color: rgba(27,46,31,0.3); background: rgba(0,0,0,0.07); }
  .kb-textarea { width: 100%; background: #FDFAF6; border: 1px solid rgba(44,42,38,0.18); border-radius: 8px; padding: 10px 13px; font-family: 'Lora', serif; font-size: 0.88rem; color: #2C2A26; outline: none; min-height: 86px; resize: vertical; transition: border-color 0.2s; }
  .kb-textarea:focus { border-color: rgba(122,92,46,0.5); }
  .kb-textarea::placeholder { color: rgba(44,42,38,0.28); }
  .kb-err { font-size: 0.73rem; color: #B84040; margin-top: 5px; font-style: italic; }
  .kb-cats { display: flex; flex-wrap: wrap; gap: 6px; }
  .kb-pill { font-size: 0.72rem; padding: 5px 11px; border-radius: 100px; border: 1px solid rgba(44,42,38,0.2); background: transparent; color: rgba(44,42,38,0.6); cursor: pointer; font-family: 'Lora', serif; transition: all 0.15s; }
  .kb-pill:hover { border-color: rgba(122,92,46,0.45); color: #2C2A26; }
  .kb-pill.on { background: #7A5C2E; border-color: #7A5C2E; color: #FDF8F0; font-weight: 600; }
  .kb-btn { width: 100%; margin-top: 18px; padding: 13px; background: #7A5C2E; color: #FDF8F0; border: none; border-radius: 10px; font-family: 'Playfair Display', serif; font-size: 0.95rem; font-weight: 700; cursor: pointer; letter-spacing: 0.03em; transition: all 0.18s; }
  .kb-btn:hover { background: #8F6D38; transform: translateY(-1px); }
  .kb-btn.secondary { background: transparent; color: #7A5C2E; border: 1px solid rgba(122,92,46,0.4); margin-top: 10px; }
  .kb-btn.secondary:hover { background: rgba(122,92,46,0.07); transform: none; }
  .kb-ok { margin-top: 12px; padding: 11px; background: rgba(21,128,61,0.1); border: 1px solid rgba(21,128,61,0.28); border-radius: 8px; color: #276640; font-size: 0.83rem; text-align: center; font-style: italic; animation: fu 0.3s ease both; }
  .kb-fab { position: fixed; bottom: 28px; right: 28px; background: #7A5C2E; color: #FDF8F0; border: none; border-radius: 100px; padding: 13px 22px; font-family: 'Playfair Display', serif; font-size: 0.9rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 24px rgba(122,92,46,0.3); transition: all 0.2s; z-index: 100; letter-spacing: 0.02em; }
  .kb-fab:hover { background: #8F6D38; transform: translateY(-2px); }
  .kb-wall { padding-left: 36px; }
  .kb-whead { margin-bottom: 14px; }
  .kb-wtitle { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 700; color: #2C2A26; }
  .kb-wcount { font-size: 0.78rem; color: rgba(44,42,38,0.4); font-style: italic; margin-top: 4px; }
  .kb-filter-row { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; margin-bottom: 12px; }
  .kb-filter-lbl { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(44,42,38,0.38); font-family: 'Lora', serif; }
  .kb-nc { font-size: 0.75rem; padding: 4px 12px; border-radius: 100px; border: 1px solid rgba(44,42,38,0.2); background: transparent; color: rgba(44,42,38,0.55); cursor: pointer; font-family: 'Lora', serif; transition: all 0.15s; }
  .kb-nc:hover { color: #2C2A26; border-color: rgba(44,42,38,0.4); }
  .kb-nc.on { background: rgba(122,92,46,0.12); border-color: rgba(122,92,46,0.45); color: #7A5C2E; }
  .kb-filters { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px; }
  .kb-fbtn { font-size: 0.7rem; padding: 4px 11px; border-radius: 100px; border: 1px solid rgba(44,42,38,0.18); background: transparent; color: rgba(44,42,38,0.45); cursor: pointer; font-family: 'Lora', serif; transition: all 0.15s; }
  .kb-fbtn:hover { color: #2C2A26; border-color: rgba(44,42,38,0.35); }
  .kb-fbtn.on { background: rgba(122,92,46,0.1); border-color: rgba(122,92,46,0.4); color: #7A5C2E; }
  .kb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 15px; }
  .kb-card { background: #FDFAF6; border-radius: 14px; padding: 20px; color: #1B2E1F; position: relative; overflow: hidden; box-shadow: 0 2px 14px rgba(44,42,38,0.1); animation: fu 0.4s ease both; }
  .kb-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--cc); }
  .kb-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 0.67rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; padding: 4px 9px; border-radius: 100px; background: var(--cb); color: var(--cc); font-family: 'Lora', serif; }
  .kb-msg { font-family: 'Lora', serif; font-size: 0.88rem; line-height: 1.65; color: #2A3E2F; margin: 12px 0 16px; font-style: italic; }
  .kb-foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
  .kb-for-lbl { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.09em; color: #8A9E8F; margin-bottom: 2px; font-family: 'Lora', serif; }
  .kb-name-btn { background: none; border: none; cursor: pointer; padding: 0; font-family: 'Playfair Display', serif; font-size: 0.95rem; font-weight: 700; color: #1B2E1F; text-decoration: underline; text-decoration-style: dotted; text-decoration-color: #8A9E8F; transition: color 0.15s; display: block; }
  .kb-name-btn:hover { color: #7A5C2E; }
  .kb-team-chip { display: inline-block; margin-top: 5px; font-size: 0.65rem; padding: 2px 9px; border-radius: 100px; background: rgba(122,92,46,0.1); color: #7A5C2E; border: 1px solid rgba(122,92,46,0.25); font-family: 'Lora', serif; font-weight: 500; cursor: pointer; transition: all 0.15s; letter-spacing: 0.04em; }
  .kb-team-chip:hover { background: rgba(122,92,46,0.18); }
  .kb-from { font-size: 0.72rem; color: #8A9E8F; font-style: italic; font-family: 'Lora', serif; }
  .kb-date { font-size: 0.64rem; color: #B0BEB3; margin-top: 2px; font-family: 'Lora', serif; }
  .kb-react-row { display: flex; align-items: center; gap: 4px; margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(27,46,31,0.08); flex-wrap: wrap; }
  .kb-rbtn { font-size: 0.8rem; padding: 3px 7px; border-radius: 8px; border: 1px solid rgba(27,46,31,0.1); background: rgba(27,46,31,0.03); cursor: pointer; display: inline-flex; align-items: center; gap: 3px; transition: all 0.15s; color: #2A3E2F; }
  .kb-rbtn:hover { background: rgba(27,46,31,0.08); }
  .kb-rbtn.on { background: rgba(122,92,46,0.15); border-color: rgba(122,92,46,0.4); }
  .kb-cbtn { font-size: 0.8rem; padding: 3px 8px; border-radius: 8px; border: 1px solid rgba(27,46,31,0.1); background: rgba(27,46,31,0.03); cursor: pointer; display: inline-flex; align-items: center; gap: 3px; margin-left: auto; color: #2A3E2F; transition: all 0.15s; }
  .kb-cbtn:hover { background: rgba(27,46,31,0.08); }
  .kb-rc { font-size: 0.68rem; font-weight: 600; background: rgba(27,46,31,0.1); color: #2A3E2F; border-radius: 100px; padding: 0 5px; min-width: 16px; text-align: center; display: inline-block; font-family: 'Lora', serif; }
  .kb-action-btn { font-size: 0.72rem; padding: 3px 7px; border-radius: 6px; border: 1px solid rgba(44,42,38,0.15); background: rgba(44,42,38,0.05); color: #5A5650; cursor: pointer; font-family: 'Lora', serif; transition: all 0.15s; }
  .kb-action-btn:hover { background: rgba(44,42,38,0.1); }
  .kb-action-btn.danger { background: rgba(180,64,64,0.08); border-color: rgba(180,64,64,0.3); color: #B44040; }
  .kb-action-btn.danger:hover { background: rgba(180,64,64,0.15); }
  .kb-empty { text-align: center; padding: 64px 20px; color: rgba(44,42,38,0.3); font-style: italic; font-size: 0.88rem; grid-column: 1/-1; }
  .kb-empty-ico { font-size: 2.2rem; display: block; margin-bottom: 10px; }
  .kb-confetti { position: fixed; inset: 0; pointer-events: none; z-index: 9999; overflow: hidden; }
  .kb-cp { position: absolute; top: -14px; animation: fall linear forwards; }
  .kb-overlay { position: fixed; inset: 0; background: rgba(44,42,38,0.55); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .kb-modal { background: #FDFAF6; border-radius: 18px; width: 100%; max-width: 500px; max-height: 88vh; overflow-y: auto; position: relative; }
  .kb-modal-x { position: absolute; top: 14px; right: 14px; background: rgba(44,42,38,0.07); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-size: 0.75rem; color: #5A5650; display: flex; align-items: center; justify-content: center; transition: background 0.15s; z-index: 2; }
  .kb-modal-x:hover { background: rgba(44,42,38,0.13); }
  .kb-modal-kudo { padding: 24px 24px 16px; border-bottom: 1px solid rgba(44,42,38,0.1); }
  .kb-modal-msg { font-family: 'Lora', serif; font-size: 1rem; line-height: 1.7; color: #2A3E2F; font-style: italic; margin: 10px 0 0; }
  .kb-cmts { padding: 16px 24px 20px; }
  .kb-cmts-title { font-family: 'Playfair Display', serif; font-size: 0.9rem; font-weight: 700; color: #3A5040; margin-bottom: 12px; }
  .kb-no-cmt { font-size: 0.8rem; color: #8A9E8F; font-style: italic; padding: 6px 0 14px; }
  .kb-cmt { padding: 10px 0; border-bottom: 1px solid rgba(44,42,38,0.07); }
  .kb-cmt:last-of-type { border-bottom: none; }
  .kb-cmt-author { font-size: 0.75rem; font-weight: 600; color: #3A5040; font-family: 'Lora', serif; margin-bottom: 3px; }
  .kb-cmt-text { font-size: 0.85rem; color: #2A3E2F; line-height: 1.55; font-family: 'Lora', serif; }
  .kb-cmt-date { font-size: 0.63rem; color: #B0BEB3; margin-top: 4px; font-family: 'Lora', serif; }
  .kb-cmt-form { padding-top: 14px; border-top: 1px solid rgba(44,42,38,0.1); margin-top: 12px; }
  .kb-send-btn { padding: 10px 16px; background: #2C2A26; color: #FDF8F0; border: none; border-radius: 8px; font-family: 'Playfair Display', serif; font-size: 0.85rem; font-weight: 700; cursor: pointer; white-space: nowrap; transition: background 0.15s; }
  .kb-send-btn:hover { background: #3E3B35; }
  .kb-prof { max-width: 1180px; margin: 0 auto; padding: 36px 32px; }
  @media(max-width:820px) { .kb-prof { padding: 24px 16px; } }
  .kb-back { background: none; border: 1px solid rgba(122,92,46,0.3); border-radius: 8px; padding: 7px 14px; color: rgba(44,42,38,0.6); font-family: 'Lora', serif; font-size: 0.82rem; cursor: pointer; transition: all 0.15s; margin-bottom: 28px; display: inline-block; }
  .kb-back:hover { color: #7A5C2E; border-color: rgba(122,92,46,0.55); }
  .kb-prof-name { font-family: 'Playfair Display', serif; font-size: clamp(2rem, 5vw, 3.2rem); font-weight: 900; color: #7A5C2E; margin-bottom: 6px; }
  .kb-prof-sub { font-style: italic; color: rgba(44,42,38,0.4); font-size: 0.9rem; margin-bottom: 28px; }
  .kb-ai { background: #F5F1EB; border: 1px solid rgba(122,92,46,0.2); border-radius: 16px; padding: 24px 28px; margin-bottom: 32px; }
  .kb-ai-lbl { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: #7A5C2E; margin-bottom: 14px; font-family: 'Lora', serif; }
  .kb-ai-text { font-family: 'Lora', serif; font-size: 0.93rem; line-height: 1.85; color: rgba(44,42,38,0.85); }
  .kb-pulse { height: 13px; background: rgba(122,92,46,0.1); border-radius: 7px; margin-bottom: 10px; animation: pulse 1.4s ease-in-out infinite; }
  .kb-ai-err { font-size: 0.85rem; color: rgba(44,42,38,0.4); font-style: italic; }
  .kb-prof-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 15px; }
  .kb-team-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(122,92,46,0.1); border: 1px solid rgba(122,92,46,0.25); border-radius: 100px; padding: 5px 16px; margin-bottom: 28px; }
  .kb-team-badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #7A5C2E; }
  .kb-team-badge-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #7A5C2E; font-family: 'Lora', serif; }
  @keyframes fall { 0%{transform:translateY(0) rotate(0deg);opacity:1} 85%{opacity:1} 100%{transform:translateY(105vh) rotate(680deg);opacity:0} }
  @keyframes fu { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse { 0%,100%{opacity:0.35} 50%{opacity:0.75} }
`;

const EMPTY_FORM = { to: "", from: "", message: "", category: "", team: "" };

export default function App() {
const sessionId = useRef((() => {
    const stored = localStorage.getItem('kudos-session-id');
    if (stored) return stored;
    const newId = `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('kudos-session-id', newId);
    return newId;
  })());
  const [kudos,    setKudos]    = useState([]);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [errors,   setErrors]   = useState({});
  const [conf,     setConf]     = useState([]);
  const [ok,       setOk]       = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [catF,     setCatF]     = useState("all");
  const [nameF,    setNameF]    = useState(null);
  const [teamF,    setTeamF]    = useState(null);
  const [formOpen, setFormOpen] = useState(true);
  const [cm,       setCm]       = useState(null);
  const [ctxt,     setCtxt]     = useState("");
  const [cfrom,    setCfrom]    = useState("");
  const [prof,     setProf]     = useState(null);   // { type: "person"|"team", name: string }
  const [ai,       setAi]       = useState({ loading: false, text: null, err: null });
  const [myR,      setMyR]      = useState({});

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('kudos').select('*').order('ts', { ascending: false });
        if (data) setKudos(migrate(data));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const sv = async d => {
    // saving handled individually now
  };

  const startEdit = k => {
    setEditingId(k.id);
    setForm({ to: k.to, from: k.from || "", message: k.message, category: k.category, team: k.team || "" });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => { setEditingId(null); setForm(EMPTY_FORM); setErrors({}); };

  const submit = async () => {
    const e = {};
    if (!form.to.trim())      e.to       = "Who are you celebrating?";
    if (!form.message.trim()) e.message  = "Write them a message";
    if (!form.category)       e.category = "Pick a category";
    if (Object.keys(e).length) { setErrors(e); return; }

    let u;
    if (editingId) {
      u = kudos.map(k => k.id !== editingId ? k : {
        ...k, to: form.to.trim(), from: form.from.trim() || null,
        message: form.message.trim(), category: form.category, team: form.team || null,
      });
      setEditingId(null);
    } else {
      const entry = {
        session_id: sessionId.current,
        to: form.to.trim(), from: form.from.trim() || null,
        message: form.message.trim(), category: form.category, team: form.team || null,
        ts: new Date().toISOString(),
        reactions: Object.fromEntries(REACTS.map(r => [r, 0])), comments: [],
      };
      const { data: inserted } = await supabase.from('kudos').insert([entry]).select();
      if (inserted) u = [...inserted, ...kudos];
      else u = kudos;
      const p = Array.from({ length: 60 }, (_, i) => ({
        id: i, x: Math.random() * 100, color: CC[i % CC.length],
        dl: Math.floor(Math.random() * 450), sz: Math.floor(7 + Math.random() * 7),
        dr: Math.floor(1300 + Math.random() * 900), ci: Math.random() > 0.5,
      }));
      setConf(p); setTimeout(() => setConf([]), 2400);
      setOk(true); setTimeout(() => setOk(false), 3200);
    }
    setKudos(u); sv(u);
    setForm(EMPTY_FORM); setErrors({});
  };

  const deleteKudo = id => {
    const u = kudos.filter(k => k.id !== id);
    setKudos(u); sv(u);
  };

  const react = async (id, emoji) => {
    const k = `${id}_${emoji}`, was = myR[k];
    const kudo = kudos.find(kd => kd.id === id);
    const updatedReactions = { ...kudo.reactions, [emoji]: Math.max(0, (kudo.reactions[emoji] || 0) + (was ? -1 : 1)) };
    const { data } = await supabase.from('kudos').update({ reactions: updatedReactions }).eq('id', id).select();
    if (data) {
      const u = kudos.map(kd => kd.id !== id ? kd : { ...kd, reactions: updatedReactions });
      setKudos(u);
      if (cm?.id === id) setCm(u.find(kd => kd.id === id));
    }
    setMyR(p => ({ ...p, [k]: !was }));
  };

  const addCmt = async () => {
    if (!ctxt.trim()) return;
    const c = { id: Date.now(), text: ctxt.trim(), author: cfrom.trim() || null, ts: new Date().toISOString() };
    const kudo = kudos.find(k => k.id === cm.id);
    const updatedComments = [...kudo.comments, c];
    const { data } = await supabase.from('kudos').update({ comments: updatedComments }).eq('id', cm.id).select();
    if (data) {
      const u = kudos.map(k => k.id === cm.id ? { ...k, comments: updatedComments } : k);
      setKudos(u);
      setCm(u.find(k => k.id === cm.id));
    }
    setCtxt(""); setCfrom("");
  };

  const openProf = async (type, name) => {
    setProf({ type, name }); setAi({ loading: true, text: null, err: null });
    const pk = type === "person"
      ? kudos.filter(k => k.to.toLowerCase() === name.toLowerCase())
      : kudos.filter(k => k.team?.toLowerCase() === name.toLowerCase());
    if (!pk.length) { setAi({ loading: false, text: null, err: null }); return; }
    try {
      const lines = pk.map((k, i) =>
        `${i + 1}. [${gc(k.category)?.label}] For ${k.to}${k.team ? ` (${k.team})` : ""}: "${k.message}"${k.from ? ` — from ${k.from}` : ""}`
      ).join("\n");
      const prompt = type === "person"
        ? `Here are all the kudos received by ${name} from their software development team:\n\n${lines}\n\nWrite a warm, specific 2–3 paragraph summary of ${name}'s key strengths and what they are most valued for. Reference specific recurring themes. Tone: positive, professional, human. Prose only — no headers or bullet points.`
        : `Here are all the kudos received by members of the ${name} software development team:\n\n${lines}\n\nWrite a warm, specific 2–3 paragraph summary of the ${name} team's collective strengths, culture, and what they are most valued for. Reference specific recurring themes across team members. Tone: positive, professional, human. Prose only — no headers or bullet points.`;
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      setAi({ loading: false, text: data.content?.find(b => b.type === "text")?.text || null, err: null });
    } catch {
      setAi({ loading: false, text: null, err: "Couldn't generate summary right now." });
    }
  };

  const closeCm = () => { setCm(null); setCtxt(""); setCfrom(""); };
  const names    = [...new Set(kudos.map(k => k.to))].sort();
  const usedTeams = [...new Set(kudos.map(k => k.team).filter(Boolean))].sort();

  const filtered = kudos.filter(k =>
    (catF === "all" || k.category === catF) &&
    (!nameF || k.to.toLowerCase() === nameF.toLowerCase()) &&
    (!teamF || k.team?.toLowerCase() === teamF.toLowerCase())
  );

  const profK = prof
    ? prof.type === "person"
      ? kudos.filter(k => k.to.toLowerCase() === prof.name.toLowerCase())
      : kudos.filter(k => k.team?.toLowerCase() === prof.name.toLowerCase())
    : [];

  return (
    <>
      <style>{S}</style>
      <div className="kb">

        {conf.length > 0 && (
          <div className="kb-confetti">
            {conf.map(p => (
              <div key={p.id} className="kb-cp" style={{
                left: `${p.x}%`, width: p.ci ? p.sz : p.sz * 1.3, height: p.ci ? p.sz : p.sz * 0.6,
                borderRadius: p.ci ? "50%" : "2px", background: p.color,
                animationDuration: `${p.dr}ms`, animationDelay: `${p.dl}ms`,
              }} />
            ))}
          </div>
        )}

        <header className="kb-header">
          <div className="kb-title">✦ Kudos Board ✦</div>
          {!prof && <div className="kb-sub">Celebrate the people who make your team great</div>}
        </header>

        {/* Profile / Team view */}
        {prof ? (
          <div className="kb-prof">
            <button className="kb-back" onClick={() => setProf(null)}>← Back to wall</button>
            {prof.type === "team" && (
              <div className="kb-team-badge">
                <div className="kb-team-badge-dot" />
                <div className="kb-team-badge-label">Team</div>
              </div>
            )}
            <div className="kb-prof-name">{prof.name}</div>
            <div className="kb-prof-sub">
              {profK.length} shout-out{profK.length !== 1 ? "s" : ""}
              {prof.type === "team" ? " for this team" : " received from the team"}
            </div>
            {profK.length > 0 && (
              <div className="kb-ai">
                <div className="kb-ai-lbl">✦ AI {prof.type === "team" ? "Team" : "Strengths"} Summary</div>
                {ai.loading ? (
                  <> <div className="kb-pulse" /> <div className="kb-pulse" style={{ width: "88%" }} /> <div className="kb-pulse" style={{ width: "75%" }} /> <div className="kb-pulse" style={{ width: "92%" }} /> <div className="kb-pulse" style={{ width: "62%" }} /> </>
                ) : ai.err
                  ? <div className="kb-ai-err">{ai.err}</div>
                  : <div className="kb-ai-text">{ai.text}</div>
                }
              </div>
            )}
            <div className="kb-prof-grid">
              {profK.map(k => (
                <Card key={k.id} k={k}
                  onProfile={n => openProf("person", n)}
                  onTeamProfile={n => openProf("team", n)}
                  onComment={setCm} onReact={react} myR={myR}
                  isOwn={k.session_id === sessionId.current}
                  onEdit={startEdit} onDelete={deleteKudo}
                />
              ))}
            </div>
          </div>

        ) : (
          <div className={`kb-body${formOpen ? "" : " wide"}`}>

            {/* Send Kudos form */}
            {formOpen && (
              <div className="kb-form-wrap">
                <div className="kb-form">
                  <button className="kb-form-x" onClick={() => { cancelEdit(); setFormOpen(false); }} title="Close">✕</button>
                  <div className="kb-form-title">{editingId ? "Edit Kudos" : "Send Kudos"}</div>
                  <div className="kb-field">
                    <label className="kb-lbl">To *</label>
                    <input className="kb-input" placeholder="Who are you celebrating?"
                      value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} />
                    {errors.to && <div className="kb-err">{errors.to}</div>}
                  </div>
                  <div className="kb-field">
                    <label className="kb-lbl">Their Team</label>
                    <select className="kb-select" value={form.team} onChange={e => setForm(f => ({ ...f, team: e.target.value }))} style={{ color: form.team ? "#2C2A26" : "rgba(44,42,38,0.38)" }}>
                      <option value="">Select a team (optional)</option>
                      {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="kb-field">
                    <label className="kb-lbl">From</label>
                    <input className="kb-input" placeholder="Your name (optional)"
                      value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))} />
                  </div>
                  <div className="kb-field">
                    <label className="kb-lbl">Message *</label>
                    <textarea className="kb-textarea" placeholder="What did they do that deserves a shout-out?"
                      value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                    {errors.message && <div className="kb-err">{errors.message}</div>}
                  </div>
                  <div className="kb-field">
                    <label className="kb-lbl">Category *</label>
                    <div className="kb-cats">
                      {CATS.map(c => (
                        <button key={c.id} className={`kb-pill${form.category === c.id ? " on" : ""}`}
                          onClick={() => setForm(f => ({ ...f, category: c.id }))}>
                          {c.emoji} {c.label}
                        </button>
                      ))}
                    </div>
                    {errors.category && <div className="kb-err">{errors.category}</div>}
                  </div>
                  <button className="kb-btn" onClick={submit}>{editingId ? "Save Changes ✦" : "Send Kudos ✦"}</button>
                  {editingId && <button className="kb-btn secondary" onClick={cancelEdit}>Cancel edit</button>}
                  {ok && <div className="kb-ok">🎉 Kudos sent! Keep spreading the love.</div>}
                </div>
              </div>
            )}

            {/* Recognition Wall */}
            <main className="kb-wall">
              <div className="kb-whead">
                <div className="kb-wtitle">Recognition Wall</div>
                <div className="kb-wcount">
                  {loading ? "Loading…" : kudos.length === 0
                    ? "No kudos yet — be the first!"
                    : `${kudos.length} shout-out${kudos.length !== 1 ? "s" : ""}`}
                </div>
              </div>

              {names.length > 0 && (
                <div className="kb-filter-row" style={{ marginBottom: 8 }}>
                  <span className="kb-filter-lbl">Person:</span>
                  {names.map(n => (
                    <button key={n} className={`kb-nc${nameF === n ? " on" : ""}`}
                      onClick={() => { setNameF(nameF === n ? null : n); setTeamF(null); }}>{n}</button>
                  ))}
                </div>
              )}

              {usedTeams.length > 0 && (
                <div className="kb-filter-row" style={{ marginBottom: 16 }}>
                  <span className="kb-filter-lbl">Team:</span>
                  {usedTeams.map(t => (
                    <button key={t} className={`kb-nc${teamF === t ? " on" : ""}`}
                      onClick={() => { setTeamF(teamF === t ? null : t); setNameF(null); }}>{t}</button>
                  ))}
                </div>
              )}

              <div className="kb-filters">
                <button className={`kb-fbtn${catF === "all" ? " on" : ""}`} onClick={() => setCatF("all")}>All</button>
                {CATS.map(c => (
                  <button key={c.id} className={`kb-fbtn${catF === c.id ? " on" : ""}`}
                    onClick={() => setCatF(c.id)}>{c.emoji} {c.label}</button>
                ))}
              </div>

              <div className="kb-grid">
                {loading
                  ? <div className="kb-empty"><span className="kb-empty-ico">⏳</span>Loading…</div>
                  : filtered.length === 0
                  ? <div className="kb-empty">
                      <span className="kb-empty-ico">🌱</span>
                      {kudos.length === 0 ? "No kudos yet — send the first one!" : "No kudos match this filter."}
                    </div>
                  : filtered.map(k => (
                      <Card key={k.id} k={k}
                        onProfile={n => openProf("person", n)}
                        onTeamProfile={n => openProf("team", n)}
                        onComment={setCm} onReact={react} myR={myR}
                        isOwn={k.session_id === sessionId.current}
                        onEdit={startEdit} onDelete={deleteKudo}
                      />
                    ))
                }
              </div>
            </main>
          </div>
        )}

        {!formOpen && !prof && (
          <button className="kb-fab" onClick={() => setFormOpen(true)}>✦ Send Kudos</button>
        )}

        {/* Comment modal */}
        {cm && (
          <div className="kb-overlay" onClick={e => { if (e.target.classList.contains("kb-overlay")) closeCm(); }}>
            <div className="kb-modal">
              <button className="kb-modal-x" onClick={closeCm}>✕</button>
              <div className="kb-modal-kudo">
                <div className="kb-badge" style={{ "--cc": gc(cm.category)?.color, "--cb": gc(cm.category)?.bg }}>
                  {gc(cm.category)?.emoji} {gc(cm.category)?.label}
                </div>
                <div className="kb-modal-msg">"{cm.message}"</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 14 }}>
                  <div>
                    <div className="kb-for-lbl" style={{ color: "#8A9E8F" }}>For</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#1B2E1F", fontSize: "0.95rem" }}>{cm.to}</div>
                    {cm.team && <div style={{ fontSize: "0.7rem", color: "#7A5C2E", marginTop: 3, fontFamily: "'Lora', serif" }}>{cm.team}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontStyle: "italic", fontSize: "0.72rem", color: "#8A9E8F", fontFamily: "'Lora', serif" }}>
                      {cm.from ? `from ${cm.from}` : "Anonymous"}
                    </div>
                    <div style={{ fontSize: "0.63rem", color: "#B0BEB3", fontFamily: "'Lora', serif" }}>{fmt(cm.ts)}</div>
                  </div>
                </div>
                <div className="kb-react-row">
                  {REACTS.map(r => (
                    <button key={r} className={`kb-rbtn${myR[`${cm.id}_${r}`] ? " on" : ""}`} onClick={() => react(cm.id, r)}>
                      {r}{cm.reactions[r] > 0 && <span className="kb-rc">{cm.reactions[r]}</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="kb-cmts">
                <div className="kb-cmts-title">Comments{cm.comments.length > 0 ? ` (${cm.comments.length})` : ""}</div>
                {cm.comments.length === 0
                  ? <div className="kb-no-cmt">No comments yet — add one below!</div>
                  : cm.comments.map(c => (
                    <div key={c.id} className="kb-cmt">
                      <div className="kb-cmt-author">{c.author || "Anonymous"}</div>
                      <div className="kb-cmt-text">{c.text}</div>
                      <div className="kb-cmt-date">{fmt(c.ts)}</div>
                    </div>
                  ))
                }
                <div className="kb-cmt-form">
                  <input className="kb-input sm" placeholder="Your name (optional)"
                    value={cfrom} onChange={e => setCfrom(e.target.value)} style={{ marginBottom: 8 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <input className="kb-input sm" placeholder="Add a comment…" style={{ flex: 1 }}
                      value={ctxt} onChange={e => setCtxt(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addCmt()} />
                    <button className="kb-send-btn" onClick={addCmt}>Send</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}