import React, {useState} from "react";
import "./miniActionModal.css";

export default function WeatherModal({onSelect, onCancel}) {
  const [city, setCity] = useState("");

  const handleSave = () => {
    if (!city.trim()) {
      alert("Please enter a city name");
      return;
    }
    onSelect({city: city.trim()});
  };

  return (
    <div className="mini-modal">
      <h3>Create weather widget</h3>

      <div className="mini-modal-buttons">
        <label>
          City
          <input value={city} onChange={(e)=>setCity(e.target.value)} />
        </label>

        <div style={{display:'flex', gap:8}}>
          <button onClick={handleSave}>Create</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
