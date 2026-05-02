/**
 * Illustrations SVG du Hi-Fi Stratly Direction A.
 *
 * Six illustrations flat-color portant l'ADN visuel de la landing :
 * pastilles de couleur accent, flottement subtil, tons doux.
 * Chacune fait 160×140 (ou 180×148 pour Dashboard / Strategy).
 *
 * Couleurs : références aux variables CSS Hi-Fi (--accent-*).
 * Animations : classes utilitaires .hi-fi-float / .hi-fi-float-2 / .hi-fi-pulse
 * définies dans app/globals.css. Respect `prefers-reduced-motion`.
 */

const C = {
  teal:    "#00b4c8",
  tealL:   "#e0f7fa",
  tealM:   "#b2ebf2",
  violet:  "#7c5cbf",
  violetL: "#f0ebff",
  violetM: "#d8ccf0",
  orange:  "#f05a28",
  orangeL: "#fff0eb",
  orangeM: "#ffd4c2",
  green:   "#2db87a",
  greenL:  "#e8f9f1",
  greenM:  "#a8e6cc",
  amber:   "#f0b429",
  amberL:  "#fffbeb",
  amberM:  "#fde68a",
  blue:    "#3b82f6",
  blueL:   "#eff6ff",
  blueM:   "#bfdbfe",
  navy:    "#0d1b36",
  navy2:   "#1a2f52",
  border:  "#e2ddd4",
  border2: "#ece8e0",
  border3: "#f0ede6",
} as const;

export function IlluBrief() {
  return (
    <svg width="160" height="140" viewBox="0 0 200 175" fill="none" aria-hidden="true">
      <ellipse cx="100" cy="152" rx="78" ry="14" fill={C.tealL} opacity={0.6} />
      <rect x="58" y="38" width="88" height="112" rx="8" fill="#f0ebe2" transform="rotate(-4 58 38)" />
      <rect x="52" y="32" width="90" height="116" rx="8" fill="#fff" stroke={C.border} strokeWidth="1" />
      <rect x="52" y="32" width="90" height="18" rx="8" fill={C.teal} opacity={0.12} />
      <rect x="52" y="44" width="90" height="6" fill={C.teal} opacity={0.08} />
      <circle cx="97" cy="41" r="4.5" fill={C.orange} />
      <rect x="64" y="56" width="50" height="5" rx="2.5" fill={C.tealM} />
      <rect x="64" y="66" width="64" height="4" rx="2" fill={C.border2} />
      <rect x="64" y="74" width="56" height="4" rx="2" fill={C.border2} />
      <rect x="64" y="82" width="60" height="4" rx="2" fill={C.border2} />
      <rect x="64" y="90" width="44" height="4" rx="2" fill={C.border2} />
      <rect x="64" y="100" width="52" height="4" rx="2" fill={C.border3} />
      <rect x="116" y="22" width="52" height="30" rx="7" fill={C.violet} className="hi-fi-float" style={{ transformOrigin: "142px 37px" }} />
      <rect x="124" y="30" width="24" height="4" rx="2" fill="white" opacity={0.7} />
      <rect x="124" y="37" width="16" height="3" rx="1.5" fill="white" opacity={0.45} />
      <circle cx="42" cy="58" r="7" fill={C.amber} opacity={0.85} className="hi-fi-float-2" />
      <rect x="140" y="94" width="8" height="52" rx="3" fill="#3b5b8c" transform="rotate(18 140 94)" />
      <polygon points="139,142 148,142 143.5,155" fill="#ffcc44" />
    </svg>
  );
}

export function IlluNetwork() {
  return (
    <svg width="160" height="140" viewBox="0 0 200 175" fill="none" aria-hidden="true">
      <ellipse cx="100" cy="152" rx="72" ry="13" fill={C.violetL} opacity={0.6} />
      <line x1="100" y1="88" x2="52" y2="56" stroke={C.violet} strokeWidth="1.5" strokeDasharray="5 3" opacity={0.5} />
      <line x1="100" y1="88" x2="148" y2="56" stroke={C.teal} strokeWidth="1.5" strokeDasharray="5 3" opacity={0.5} />
      <line x1="100" y1="88" x2="58" y2="125" stroke={C.orange} strokeWidth="1.5" strokeDasharray="5 3" opacity={0.5} />
      <line x1="100" y1="88" x2="142" y2="125" stroke={C.green} strokeWidth="1.5" strokeDasharray="5 3" opacity={0.5} />
      <circle cx="100" cy="88" r="20" fill={C.navy} opacity={0.95} />
      <circle cx="100" cy="88" r="14" fill={C.navy2} />
      <rect x="93" y="83" width="14" height="10" rx="2" fill="white" opacity={0.7} />
      <circle cx="52" cy="56" r="16" fill={C.violet} className="hi-fi-float" style={{ transformOrigin: "52px 56px" }} />
      <circle cx="52" cy="56" r="9" fill={C.violetM} />
      <circle cx="148" cy="56" r="16" fill={C.teal} className="hi-fi-float-2" />
      <circle cx="148" cy="56" r="9" fill={C.tealM} />
      <circle cx="58" cy="125" r="13" fill={C.orange} />
      <circle cx="58" cy="125" r="7.5" fill={C.orangeM} />
      <circle cx="142" cy="125" r="13" fill={C.green} />
      <circle cx="142" cy="125" r="7.5" fill={C.greenM} />
      <rect x="82" y="22" width="36" height="22" rx="6" fill={C.amber} className="hi-fi-float" />
      <text x="100" y="37" textAnchor="middle" fontSize="10" fill="white" fontWeight="800" fontFamily="Inter">IA</text>
    </svg>
  );
}

export function IlluCollab() {
  return (
    <svg width="160" height="140" viewBox="0 0 200 175" fill="none" aria-hidden="true">
      <ellipse cx="100" cy="152" rx="72" ry="13" fill={C.greenL} opacity={0.6} />
      <ellipse cx="100" cy="118" rx="64" ry="17" fill="#e8d5c0" opacity={0.7} />
      <rect x="37" y="112" width="126" height="10" rx="5" fill="#d4b896" />
      <circle cx="60" cy="80" r="15" fill={C.blueM} />
      <circle cx="60" cy="68" r="11" fill="#f5cba0" />
      <rect x="49" y="80" width="22" height="20" rx="7" fill={C.blue} />
      <circle cx="122" cy="75" r="15" fill={C.violetM} />
      <circle cx="122" cy="63" r="11" fill="#f5cba0" />
      <rect x="111" y="75" width="22" height="20" rx="7" fill={C.violet} />
      <rect x="70" y="38" width="46" height="24" rx="9" fill={C.teal} className="hi-fi-float" />
      <polygon points="78,62 88,62 83,71" fill={C.teal} />
      <rect x="77" y="45" width="20" height="4" rx="2" fill="white" opacity={0.75} />
      <rect x="77" y="52" width="14" height="3" rx="1.5" fill="white" opacity={0.5} />
      <rect x="80" y="100" width="40" height="30" rx="5" fill="white" stroke={C.border} strokeWidth="1" />
      <rect x="86" y="107" width="22" height="3.5" rx="1.75" fill={C.tealM} />
      <rect x="86" y="113" width="30" height="3" rx="1.5" fill={C.border2} />
      <rect x="86" y="118" width="24" height="3" rx="1.5" fill={C.border2} />
      <circle cx="150" cy="44" r="13" fill={C.green} className="hi-fi-float-2" />
      <path d="M145 44 L149 48 L155 39" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IlluPresentation() {
  return (
    <svg width="160" height="140" viewBox="0 0 200 175" fill="none" aria-hidden="true">
      <ellipse cx="105" cy="152" rx="68" ry="13" fill={C.blueL} opacity={0.6} />
      <rect x="44" y="28" width="116" height="82" rx="7" fill={C.navy} opacity={0.97} />
      <rect x="50" y="34" width="104" height="70" rx="5" fill={C.navy2} />
      <rect x="57" y="41" width="54" height="7" rx="3.5" fill="white" opacity={0.6} />
      <rect x="57" y="52" width="92" height="4.5" rx="2.25" fill={C.teal} opacity={0.75} />
      <rect x="57" y="60" width="74" height="4" rx="2" fill="white" opacity={0.22} />
      <rect x="57" y="68" width="13" height="24" rx="2.5" fill={C.orange} opacity={0.9} />
      <rect x="73" y="75" width="13" height="17" rx="2.5" fill={C.teal} opacity={0.9} />
      <rect x="89" y="70" width="13" height="22" rx="2.5" fill={C.violet} opacity={0.9} />
      <rect x="105" y="78" width="13" height="14" rx="2.5" fill={C.green} opacity={0.9} />
      <rect x="121" y="66" width="13" height="26" rx="2.5" fill={C.amber} opacity={0.9} />
      <rect x="98" y="110" width="8" height="22" rx="2" fill="#d4b896" />
      <rect x="80" y="130" width="44" height="7" rx="3.5" fill="#c4a882" />
      <circle cx="154" cy="76" r="11" fill="#f5cba0" />
      <rect x="144" y="87" width="19" height="26" rx="7" fill={C.blue} />
      <line x1="144" y1="96" x2="128" y2="79" stroke="#f5cba0" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="127" cy="78" r="4" fill={C.orange} className="hi-fi-pulse" />
      <rect x="20" y="48" width="40" height="22" rx="6" fill={C.violet} opacity={0.92} className="hi-fi-float" />
      <rect x="26" y="54" width="18" height="4" rx="2" fill="white" opacity={0.7} />
      <rect x="26" y="61" width="12" height="3" rx="1.5" fill="white" opacity={0.45} />
    </svg>
  );
}

export function IlluDashboard() {
  return (
    <svg width="180" height="148" viewBox="0 0 220 185" fill="none" aria-hidden="true">
      <ellipse cx="110" cy="164" rx="86" ry="14" fill={C.tealL} opacity={0.45} />
      <rect x="18" y="18" width="184" height="128" rx="13" fill="white" stroke={C.border} strokeWidth="1.5" />
      <rect x="18" y="18" width="184" height="13" rx="13" fill={C.navy} opacity={0.95} />
      <rect x="18" y="25" width="184" height="6" fill={C.navy} opacity={0.95} />
      {[28, 38, 48].map((x, i) => (
        <circle key={i} cx={x} cy="24" r="3.5" fill={[C.orange, C.amber, C.green][i]} opacity={0.7} />
      ))}
      <rect x="28" y="42" width="40" height="30" rx="7" fill={C.tealL} />
      <rect x="28" y="44" width="15" height="4" rx="2" fill={C.teal} opacity={0.55} />
      <text x="48" y="66" fontSize="15" fontWeight="800" fill={C.teal} textAnchor="middle" fontFamily="Inter">74%</text>
      <rect x="76" y="42" width="40" height="30" rx="7" fill={C.violetL} />
      <rect x="76" y="44" width="15" height="4" rx="2" fill={C.violet} opacity={0.55} />
      <text x="96" y="66" fontSize="15" fontWeight="800" fill={C.violet} textAnchor="middle" fontFamily="Inter">12</text>
      <rect x="124" y="42" width="40" height="30" rx="7" fill={C.greenL} />
      <rect x="124" y="44" width="15" height="4" rx="2" fill={C.green} opacity={0.55} />
      <text x="144" y="66" fontSize="15" fontWeight="800" fill={C.green} textAnchor="middle" fontFamily="Inter">3/5</text>
      <rect x="172" y="42" width="22" height="30" rx="7" fill={C.amberL} />
      <text x="183" y="66" fontSize="12" fontWeight="800" fill={C.amber} textAnchor="middle" fontFamily="Inter">2↑</text>
      {[
        { x: 30, h: 30, c: C.teal },
        { x: 46, h: 19, c: C.violet },
        { x: 62, h: 38, c: C.orange },
        { x: 78, h: 23, c: C.green },
        { x: 94, h: 32, c: C.teal },
        { x: 110, h: 16, c: C.amber },
        { x: 126, h: 28, c: C.violet },
      ].map((b, i) => (
        <rect key={i} x={b.x} y={134 - b.h} width="11" height={b.h} rx="3.5" fill={b.c} opacity={0.78} />
      ))}
      <line x1="26" y1="134" x2="152" y2="134" stroke={C.border} strokeWidth="1" />
      <rect x="152" y="92" width="58" height="44" rx="9" fill={C.navy} className="hi-fi-float-2" />
      <rect x="159" y="99" width="24" height="4.5" rx="2.25" fill="white" opacity={0.5} />
      <rect x="159" y="107" width="34" height="7" rx="3.5" fill={C.teal} opacity={0.8} />
      <rect x="159" y="117" width="20" height="4" rx="2" fill="white" opacity={0.3} />
    </svg>
  );
}

export function IlluStrategy() {
  return (
    <svg width="180" height="148" viewBox="0 0 220 185" fill="none" aria-hidden="true">
      <ellipse cx="110" cy="164" rx="78" ry="13" fill={C.orangeL} opacity={0.55} />
      <rect x="24" y="24" width="172" height="120" rx="11" fill="white" stroke={C.border} strokeWidth="1.5" />
      {[58, 90, 122, 154].map((x) => (
        <line key={x} x1={x} y1="24" x2={x} y2="144" stroke={C.border3} strokeWidth="0.75" />
      ))}
      {[63, 95, 127].map((y) => (
        <line key={y} x1="24" y1={y} x2="196" y2={y} stroke={C.border3} strokeWidth="0.75" />
      ))}
      <path d="M44 130 Q72 104 98 112 Q124 120 146 88 Q162 66 180 50" stroke={C.teal} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="44" cy="130" r="8" fill={C.orange} /><circle cx="44" cy="130" r="4.5" fill="white" />
      <circle cx="98" cy="112" r="8" fill={C.violet} /><circle cx="98" cy="112" r="4.5" fill="white" />
      <circle cx="146" cy="88" r="8" fill={C.teal} /><circle cx="146" cy="88" r="4.5" fill="white" />
      <circle cx="180" cy="50" r="10" fill={C.green} className="hi-fi-pulse" /><circle cx="180" cy="50" r="5.5" fill="white" />
      <path d="M180 37 C180 31 186.5 27 180 27 C173.5 27 173.5 31 180 37Z" fill={C.green} />
      <rect x="24" y="27" width="108" height="15" rx="5.5" fill={C.navy} opacity={0.92} />
      <rect x="31" y="31" width="42" height="4.5" rx="2.25" fill="white" opacity={0.6} />
      <rect x="78" y="32" width="22" height="3.5" rx="1.75" fill={C.teal} opacity={0.7} />
    </svg>
  );
}

/* Couleurs accent partagées avec les sections de page (modules / personas / workflow). */
export const HI_FI_ACCENTS = {
  teal:   { color: C.teal,   bg: C.tealL,   ring: C.tealM },
  violet: { color: C.violet, bg: C.violetL, ring: C.violetM },
  orange: { color: C.orange, bg: C.orangeL, ring: C.orangeM },
  green:  { color: C.green,  bg: C.greenL,  ring: C.greenM },
  amber:  { color: C.amber,  bg: C.amberL,  ring: C.amberM },
  blue:   { color: C.blue,   bg: C.blueL,   ring: C.blueM },
  navy:   { color: C.navy,   bg: "#eef1f7", ring: "#cbd2e0" },
} as const;
