import { useState } from "react";
import "./SearchBar.css";

export default function SearchBar({
    width,
    placeholder,
    onSearch,
}: {
    width?: string;
    placeholder?: string;
    onSearch: (query: string) => void;
}) {
    const [query, setQuery] = useState("");

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setQuery(value);
        onSearch(value);
    };

    return (
        <div className="search-bar" style={{ width: width || "100%" }}>
            <svg
                className="search-bar-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
            </svg>
            <input
                type="text"
                className="search-bar-input"
                placeholder={placeholder}
                value={query}
                onChange={handleChange}
            />
        </div>
    );
}
