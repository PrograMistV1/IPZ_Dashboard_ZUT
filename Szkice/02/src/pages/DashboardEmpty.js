import React from "react";

export default function DashboardEmpty() {
  const containerStyle = { fontFamily: "Inter, Arial, sans-serif" };
  const headerStyle = {
    backgroundColor: "#f5f7fb",
    color: "#111",
    padding: "15px 30px",
  };
  const mainStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "80vh",
    flexDirection: "column",
    color: "#555",
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
      </header>

      <main style={mainStyle}>
        <h2>No data</h2>
        <p>Add a chart or a table to get started.</p>
      </main>
    </div>
  );
}
