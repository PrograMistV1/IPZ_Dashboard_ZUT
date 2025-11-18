import React from "react";

const sampleNews = [
  { id: 1, title: "Economy grows in Q2", category: "Economy", date: "2025-11-01", link: "#" },
  { id: 2, title: "New transfers in the national league", category: "Sports", date: "2025-11-02", link: "#" },
  { id: 3, title: "Inflation slightly decreases", category: "Economy", date: "2025-11-03", link: "#" },
  { id: 4, title: "Team A wins the championship", category: "Sports", date: "2025-11-04", link: "#" },
  { id: 5, title: "Central bank announces new monetary policy", category: "Economy", date: "2025-11-05", link: "#" },
];

export default function DashboardNews() {
  const containerStyle = { fontFamily: "Inter, Arial, sans-serif", padding: 20, color: "#333" };
  const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center" };
  const footerStyle = { marginTop: 20, color: "#888", fontSize: 12 };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h2 style={{ margin: 0 }}>Latest News</h2>
        <div style={{ color: "#888", fontSize: 12 }}>Categories: Economy / Sports</div>
      </header>

      <section style={{ marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: "8px" }}>Title</th>
              <th style={{ padding: "8px", width: 120 }}>Category</th>
              <th style={{ padding: "8px", width: 120 }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {sampleNews.map((n) => (
              <tr key={n.id} style={{ borderBottom: "1px solid #f1f1f1" }}>
                <td style={{ padding: "8px" }}>
                  <a href={n.link} style={{ color: "#0074D9", textDecoration: "none" }}>
                    {n.title}
                  </a>
                </td>
                <td style={{ padding: "8px" }}>{n.category}</td>
                <td style={{ padding: "8px" }}>{n.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer style={footerStyle}>Sample table — news mockup.</footer>
    </div>
  );
}
