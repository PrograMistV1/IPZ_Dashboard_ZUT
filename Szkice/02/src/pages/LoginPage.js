import React from "react";

export default function LoginPage() {
  const containerStyle = { fontFamily: "Inter, Arial, sans-serif", textAlign: "center", marginTop: 100 };
  const inputStyle = { padding: 8, width: 240, borderRadius: 4, border: "1px solid #ccc" };
  const buttonStyle = { padding: "8px 16px", borderRadius: 4, border: "none", background: "#0074D9", color: "#fff" };

  return (
    <div style={containerStyle}>
      <h1>Log in</h1>
      <input placeholder="Email" style={inputStyle} /><br />
      <div style={{ height: 12 }} />
      <input type="password" placeholder="Password" style={inputStyle} /><br />
      <div style={{ height: 16 }} />
      <button style={buttonStyle}>Log in</button>
    </div>
  );
}
