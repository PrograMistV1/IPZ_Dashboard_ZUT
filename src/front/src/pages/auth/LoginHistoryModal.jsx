import React from "react";
import "../../styles/auth.css";

export default function LoginHistoryModal({
                                              history,
                                              onClose,
                                          }) {
    return (
        <div className="modal-backdrop">
            <div className="modal">
                <h3>Login history</h3>

                {history.length === 0 ? (
                    <p>No login history</p>
                ) : (
                    <ul className="login-history-list">
                        {history.map((item, i) => (
                            <li key={i}>
                                <div>
                                    <strong>
                                        {new Date(
                                            item.login_time
                                        ).toLocaleString()}
                                    </strong>
                                </div>
                                {item.ip && (
                                    <div>IP: {item.ip}</div>
                                )}
                                {item.user_agent && (
                                    <div className="muted">
                                        {item.user_agent}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                <div className="panel-actions">
                    <button onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
