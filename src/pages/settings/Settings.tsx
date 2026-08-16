import { useState } from "react";
import "./Settings.css";
import { THEMES, applyTheme, getStoredTheme } from "../../theme/theme";
import type { ThemeId } from "../../theme/theme";

export default function Settings() {
    const [theme, setTheme] = useState<ThemeId>(getStoredTheme());

    function handleSelect(id: ThemeId) {
        applyTheme(id);
        setTheme(id);
    }

    return (
        <>
            <div className="header-group">
                <h1>Settings</h1>
                <div className="subtitle">Appearance and workspace preferences.</div>
            </div>

            <div className="settings-card">
                <div className="settings-card-header">Accent theme</div>
                <div className="settings-card-subtext">
                    Choose the accent color used across buttons, links, and active states.
                </div>
                <div className="theme-picker">
                    {THEMES.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            className="theme-option"
                            aria-pressed={theme === t.id}
                            onClick={() => handleSelect(t.id)}
                        >
                            <span className="theme-swatch" style={{ background: t.swatch }} />
                            <span className="theme-name">{t.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
