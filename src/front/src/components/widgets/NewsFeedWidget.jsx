import React from 'react';
import Widget from './Widget';

export default function NewsFeedWidget({ id, mode = 'feed', data = [] }) {
  return (
    <Widget id={id} mode={mode} data={data}>
      <ul style={{paddingLeft:16, margin:0}}>
        {Array.isArray(data) && data.length ? (
          data.map((item, i) => (
            <li key={item.id || i} style={{marginBottom:8}}>
              <strong>{item.title || item.headline}</strong>
              <div style={{fontSize:12,color:'#555'}}>{item.source || item.summary}</div>
            </li>
          ))
        ) : (
          <li>No news</li>
        )}
      </ul>
    </Widget>
  );
}
