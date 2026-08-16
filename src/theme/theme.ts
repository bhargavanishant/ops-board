export type ThemeId = "blue" | "green" | "violet" | "amber";

export const THEMES: { id: ThemeId; name: string; swatch: string }[] = [
    { id: "blue", name: "Blue", swatch: "#2f5bff" },
    { id: "green", name: "Green", swatch: "#059669" },
    { id: "violet", name: "Violet", swatch: "#7c3aed" },
    { id: "amber", name: "Amber", swatch: "#b45309" },
];

const STORAGE_KEY = "ops-board-theme";
const DEFAULT_THEME: ThemeId = "blue";

function isThemeId(value: string | null): value is ThemeId {
    return THEMES.some((theme) => theme.id === value);
}

export function getStoredTheme(): ThemeId {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isThemeId(stored) ? stored : DEFAULT_THEME;
}

export function applyTheme(theme: ThemeId) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
}
