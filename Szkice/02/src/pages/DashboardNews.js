import React from "react";

const sampleNews = [
  {id: 1, title: "Gospodarka rośnie w drugim kwartale", category: "Ekonomia", date: "2025-11-01", link: "#"},
  {id: 2, title: "Nowe transfery w lidze krajowej", category: "Sport", date: "2025-11-02", link: "#"},
  {id: 3, title: "Inflacja spada nieznacznie", category: "Ekonomia", date: "2025-11-03", link: "#"},
  {id: 4, title: "Drużyna A wygrywa mistrzostwo", category: "Sport", date: "2025-11-04", link: "#"},
  {id: 5, title: "Nowa polityka monetarna banku centralnego", category: "Ekonomia", date: "2025-11-05", link: "#"},
];

export default function DashboardNews() {
  return (
    <div style={{fontFamily: "Arial, sans-serif", padding: 20}}>
      <header style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <h2 style={{margin: 0}}>Najnowsze newsy</h2>
        <div style={{color: "#888", fontSize: 12}}>Kategoria: Ekonomia / Sport</div>
      </header>

      <section style={{marginTop: 16}}>
        <table style={{width: "100%", borderCollapse: "collapse"}}>
          <thead>
            <tr style={{textAlign: "left", borderBottom: "1px solid #ddd"}}>
              <th style={{padding: "8px"}}>Tytuł</th>
              <th style={{padding: "8px", width: 120}}>Kategoria</th>
              <th style={{padding: "8px", width: 120}}>Data</th>
            </tr>
          </thead>
          <tbody>
            {sampleNews.map((n) => (
              <tr key={n.id} style={{borderBottom: "1px solid #f1f1f1"}}>
                <td style={{padding: "8px"}}>
                  <a href={n.link} style={{color: "#0074D9", textDecoration: "none"}}>{n.title}</a>
                </td>
                <td style={{padding: "8px"}}>{n.category}</td>
                <td style={{padding: "8px"}}>{n.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer style={{marginTop: 20, color: "#888", fontSize: 12}}>Przykładowa tabela nagłówków — szkic.</footer>
    </div>
  );
}

