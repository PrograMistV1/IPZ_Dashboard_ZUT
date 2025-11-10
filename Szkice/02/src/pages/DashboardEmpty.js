export default function DashboardEmpty() {
  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      {}
      <header
        style={{
          backgroundColor: "#282c34",
          color: "white",
          padding: "15px 30px",
        }}
      >
        <h1 style={{ margin: 0 }}>Dashboard</h1>
      </header>

      {}
      <main
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
          flexDirection: "column",
          color: "#555",
        }}
      >
        <h2>Brak danych</h2>
        <p>Dodaj wykres lub tabelę, aby rozpocząć.</p>
      </main>
    </div>
  );
}
