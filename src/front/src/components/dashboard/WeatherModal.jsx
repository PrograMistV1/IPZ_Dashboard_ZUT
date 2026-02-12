import React, {useState} from "react";
import "./miniActionModal.css";

export default function WeatherModal({onSelect, onCancel}) {
  const options = Array.from({length:5}).map((_,i) => {
    const d = new Date();
    d.setDate(d.getDate()+i);
    return d.toISOString().slice(0,10);
  });

  const [city, setCity] = useState("");
  const [date, setDate] = useState(options[0]);

  const handleSave = () => {
    if (!city.trim()) {
      alert("Введите название города");
      return;
    }
    onSelect({city: city.trim(), date});
  };

  return (
    <div className="mini-modal">
      <h3>Create weather widget</h3>

      <div className="mini-modal-buttons">
        <label>
          City
          <input value={city} onChange={(e)=>setCity(e.target.value)} />
        </label>

        <label>
          Date
          <select value={date} onChange={(e)=>setDate(e.target.value)}>
            {options.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>

        <div style={{display:'flex', gap:8}}>
          <button onClick={handleSave}>Create</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
