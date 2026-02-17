import React from 'react';
import Widget from './Widget';

export default function WeatherWidget({ id, mode = 'standard', data = {} }) {
  // data: { location: 'City', forecast: [{day:'Mon', temp:20}, ...] }
  const forecast = data && data.forecast ? data.forecast : [];
  return (
    <Widget id={id} mode={mode} data={data}>
      <div>
        <div style={{fontSize:12,color:'#666'}}>Location: {data.location || '—'}</div>
        <ul style={{paddingLeft:16, margin:0}}>
          {forecast.length ? (
            forecast.map((f, i) => (
              <li key={f.day || i} style={{marginBottom:6}}>
                {f.day}: <strong>{f.temp}°C</strong>
              </li>
            ))
          ) : (
            <li>No forecast</li>
          )}
        </ul>
      </div>
    </Widget>
  );
}
