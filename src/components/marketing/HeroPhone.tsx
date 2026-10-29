"use client";

import { useEffect, useState } from "react";

const SALES = [
  { name: "Alphonsine K.", amount: "12 500 CDF", time: "14:32", color: "#22c55e" },
  { name: "Marcel T.", amount: "38 000 CDF", time: "14:18", color: "#22c55e" },
  { name: "Divine M.", amount: "7 200 CDF", time: "13:54", color: "#22c55e" },
];

const BARS = [
  { h: 52, label: "L" },
  { h: 68, label: "M" },
  { h: 45, label: "M" },
  { h: 82, label: "J" },
  { h: 61, label: "V" },
  { h: 90, label: "S" },
  { h: 74, label: "D" },
];

export default function HeroPhone() {
  const [visible, setVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 300);
    const t2 = setTimeout(() => setNotifVisible(true), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      className="et-phone relative mx-auto"
      style={{ maxWidth: 280, userSelect: "none" }}
    >
      {/* Phone frame */}
      <div
        style={{
          background: "#0E0E12",
          borderRadius: 36,
          border: "2px solid rgba(255,255,255,0.12)",
          padding: "12px 6px 18px",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), inset 0 0 0 2px rgba(0,0,0,0.4)",
          position: "relative",
        }}
      >
        {/* Notch */}
        <div
          style={{
            width: 80,
            height: 10,
            background: "#0E0E12",
            borderRadius: 6,
            margin: "0 auto 10px",
            border: "1.5px solid rgba(255,255,255,0.08)",
          }}
        />

        {/* Screen */}
        <div
          style={{
            background: "#0B0D1A",
            borderRadius: 24,
            overflow: "hidden",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
        >
          {/* Status bar */}
          <div
            style={{
              background: "#090B17",
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>9:41</span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <div style={{ width: 14, height: 6, border: "1px solid rgba(255,255,255,0.35)", borderRadius: 2, position: "relative", overflow: "hidden" }}>
                <div style={{ width: "75%", height: "100%", background: "#22c55e", borderRadius: 1 }} />
              </div>
            </div>
          </div>

          {/* App header */}
          <div
            style={{
              background: "#0B0D1A",
              padding: "8px 14px 10px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>Boutique</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>Mama Rita</span>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                    <path d="M2 3l2 2 2-2" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 3,
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  borderRadius: 20,
                  padding: "2px 6px",
                }}
              >
                <div className="et-live-dot" />
                <span style={{ fontSize: 7, fontWeight: 700, color: "#22c55e", letterSpacing: 0.3, textTransform: "uppercase" }}>En direct</span>
              </div>
            </div>
          </div>

          {/* KPI row */}
          <div style={{ padding: "10px 14px 0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
              <div
                style={{
                  background: "rgba(70,95,255,0.1)",
                  border: "1px solid rgba(70,95,255,0.2)",
                  borderRadius: 10,
                  padding: "8px 10px",
                }}
              >
                <div style={{ fontSize: 7.5, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Ventes du jour</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "white", lineHeight: 1 }}>145 000</div>
                <div style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>CDF</div>
                <div style={{ fontSize: 7.5, color: "#22c55e", fontWeight: 600, marginTop: 3 }}>+12% vs hier</div>
              </div>
              <div
                style={{
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.18)",
                  borderRadius: 10,
                  padding: "8px 10px",
                }}
              >
                <div style={{ fontSize: 7.5, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Transactions</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "white", lineHeight: 1 }}>23</div>
                <div style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>ventes</div>
                <div style={{ fontSize: 7.5, color: "#22c55e", fontWeight: 600, marginTop: 3 }}>4 clients fidèles</div>
              </div>
            </div>

            {/* Mini chart */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: "8px 10px",
                marginBottom: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 7.5, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>7 derniers jours</span>
                <span style={{ fontSize: 7, color: "#22c55e", fontWeight: 600 }}>+18 %</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 3,
                  height: 40,
                }}
              >
                {BARS.map(({ h, label }, i) => (
                  <div
                    key={label + i}
                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, height: "100%", justifyContent: "flex-end" }}
                  >
                    <div
                      className="et-bar"
                      style={{
                        width: "100%",
                        height: `${h}%`,
                        background: i === 5 ? "#465FFF" : "rgba(70,95,255,0.4)",
                        borderRadius: "2px 2px 0 0",
                        "--bd": `${0.3 + i * 0.06}s`,
                      } as React.CSSProperties}
                    />
                    <span style={{ fontSize: 5.5, color: "rgba(255,255,255,0.2)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent sales */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 7.5, color: "rgba(255,255,255,0.3)", fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Ventes récentes
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {SALES.map((s, i) => (
                  <div
                    key={s.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "4px 6px",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: 6,
                      opacity: visible ? 1 : 0,
                      transition: `opacity 0.4s ease ${0.6 + i * 0.15}s`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "rgba(70,95,255,0.2)",
                          border: "1px solid rgba(70,95,255,0.35)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 6.5,
                          fontWeight: 700,
                          color: "#8B9FFF",
                        }}
                      >
                        {s.name[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: 7.5, fontWeight: 600, color: "rgba(255,255,255,0.8)", lineHeight: 1.2 }}>{s.name}</div>
                        <div style={{ fontSize: 6.5, color: "rgba(255,255,255,0.3)" }}>{s.time}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 8, fontWeight: 700, color: s.color }}>{s.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sale notification floating */}
      {notifVisible && (
        <div
          className="et-notif"
          style={{
            position: "absolute",
            top: -20,
            right: -24,
            background: "rgba(10,15,30,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(34,197,94,0.35)",
            borderRadius: 12,
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            zIndex: 10,
            "--nd": "0s",
          } as React.CSSProperties}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
              <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "white", lineHeight: 1.3 }}>Vente confirmée</div>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", lineHeight: 1.3 }}>Fatou · 18 500 CDF · Boutique Gombe</div>
          </div>
        </div>
      )}

      {/* Subtle glow behind phone */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "-30px",
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(70,95,255,0.12) 0%, transparent 70%)",
          zIndex: -1,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
