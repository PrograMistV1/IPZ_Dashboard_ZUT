import React from 'react';
import Widget from './Widget';

export default function CurrencyFeedWidget({id, mode = 'feed', data = []}) {
    return (
        <Widget id={id} mode={mode} data={data}>
            <ul style={{paddingLeft: 16, margin: 0}}>
                {Array.isArray(data) && data.length ? (
                    data.map((r, i) => (
                        <li key={r.code || i} style={{marginBottom: 6}}>
                            {r.code || '—'}: <strong>{r.value}</strong>
                        </li>
                    ))
                ) : (
                    <li>No currency feed</li>
                )}
            </ul>
        </Widget>
    );
}
