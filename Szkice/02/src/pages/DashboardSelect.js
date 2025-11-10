import React, {useState} from "react";
import DashboardChart from "./DashboardChart";
import DashboardNews from "./DashboardNews";

export default function DashboardSelect() {
  const [choice, setChoice] = useState("chart");

  return (
    <div style={{fontFamily: "Arial, sans-serif", padding: 20}}>
      <header style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <h2 style={{margin: 0}}>Wybierz widok</h2>
        <div style={{color: "#888", fontSize: 12}}>Wybierz gotowy wykres lub tabelę newsów</div>
      </header>

      <section style={{marginTop: 16}}>
        <div style={{display: "flex", gap: 12, marginBottom: 16}}>
          <button onClick={() => setChoice("chart")} style={{padding: "8px 12px", background: choice === "chart" ? "#0074D9" : "#f1f1f1", color: choice === "chart" ? "white" : "#333", border: "none", borderRadius: 4}}>Wykres (linia)</button>
          <button onClick={() => setChoice("news")} style={{padding: "8px 12px", background: choice === "news" ? "#0074D9" : "#f1f1f1", color: choice === "news" ? "white" : "#333", border: "none", borderRadius: 4}}>Tabela newsów</button>
        </div>

        <div style={{border: "1px solid #eee", padding: 12, borderRadius: 6, background: "#fff"}}>
          {choice === "chart" ? (
            <DashboardChart />
          ) : (
            <DashboardNews />
          )}
        </div>
      </section>

      <footer style={{marginTop: 20, color: "#888", fontSize: 12}}>Szkic wyboru komponentu w dashboardzie.</footer>
    </div>
  );
}

