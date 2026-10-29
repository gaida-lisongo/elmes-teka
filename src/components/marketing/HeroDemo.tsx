"use client";

import { useState, useEffect } from "react";

type Scene = 0 | 1 | 2;

const BARS: { h: string; m: string; d: string }[] = [
  { h: "52%", m: "Avr", d: "0.3s" },
  { h: "68%", m: "Mai", d: "0.45s" },
  { h: "44%", m: "Jun", d: "0.6s" },
  { h: "82%", m: "Jul", d: "0.75s" },
  { h: "60%", m: "Aoû", d: "0.9s" },
  { h: "91%", m: "Sep", d: "1.05s" },
  { h: "74%", m: "Oct", d: "1.2s" },
];

export default function HeroDemo() {
  const [scene, setScene] = useState<Scene>(0);
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setScene((prev) => {
        const next = (((prev as number) + 1) % 3) as Scene;
        return next;
      });
      setCycleKey((k) => k + 1);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="et-demo">
      <div className="et-demo-browser">
        {/* Browser chrome */}
        <div className="et-demo-topbar">
          <div className="et-dot" style={{ background: "#FF5F57" }} />
          <div className="et-dot" style={{ background: "#FEBC2E" }} />
          <div className="et-dot" style={{ background: "#28C840" }} />
          <div className="et-demo-url">app.elmes-teka.com/dashboard</div>
        </div>

        {/* Screen */}
        <div className="et-demo-body">
          {/* Sidebar */}
          <div className="et-demo-sidebar">
            <div className="et-demo-logomark">ET</div>
            {[true, false, false, false, false].map((active, i) => (
              <div
                key={i}
                className={`et-demo-nav-pip${active ? " active" : ""}`}
              >
                <div className="et-demo-pip-rect" />
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="et-demo-content">
            <div className="et-demo-row">
              <span className="et-demo-h">Tableau de bord</span>
              <div className="et-live-badge">
                <div className="et-live-dot" />
                LIVE
              </div>
            </div>

            {/* KPIs */}
            <div className="et-kpi-grid">
              <div className="et-kpi-card">
                <span className="et-kpi-lbl">Ventes auj.</span>
                <span className="et-kpi-val">$2 840</span>
                <span className="et-kpi-chg">+12 %</span>
              </div>
              <div className="et-kpi-card">
                <span className="et-kpi-lbl">Transactions</span>
                <span className="et-kpi-val">47</span>
                <span className="et-kpi-chg">+8 %</span>
              </div>
              <div className="et-kpi-card">
                <span className="et-kpi-lbl">Boutiques</span>
                <span className="et-kpi-val">3/3</span>
                <span className="et-kpi-chg">Actives</span>
              </div>
            </div>

            {/* Chart */}
            <div className="et-chart-box">
              <span className="et-chart-title">CA mensuel — 2025</span>
              <div className="et-bars" key={cycleKey}>
                {BARS.map((b, i) => (
                  <div key={i} className="et-bar-col">
                    <div
                      className="et-bar"
                      style={
                        {
                          height: b.h,
                          "--bd": b.d,
                        } as React.CSSProperties
                      }
                    />
                    <span className="et-bar-m">{b.m}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scene 1 — vente confirmée */}
            {scene === 1 && (
              <div
                key={`sale-${cycleKey}`}
                className="et-notif et-notif-sale"
              >
                <div className="et-notif-icon et-notif-icon-sale">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="et-notif-title">
                    Vente confirmée — Boutique Lemba
                  </div>
                  <div className="et-notif-body">
                    Jean-Pierre · 3 articles · $185,00
                  </div>
                </div>
              </div>
            )}

            {/* Scene 2 — alerte stock */}
            {scene === 2 && (
              <div
                key={`stock-${cycleKey}`}
                className="et-notif et-notif-stock"
              >
                <div className="et-notif-icon et-notif-icon-stock">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="et-notif-title">
                    Stock bas — Huile Palme 5L
                  </div>
                  <div className="et-notif-body">
                    Gombe · 4 unités restantes · Réappro. conseillé
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scene indicator */}
      <div className="et-scene-dots" role="tablist" aria-label="Scènes démo">
        {([0, 1, 2] as Scene[]).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={scene === s}
            aria-label={`Scène ${s + 1}`}
            onClick={() => {
              setScene(s);
              setCycleKey((k) => k + 1);
            }}
            className={`et-scene-dot${scene === s ? " et-active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
