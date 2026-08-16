import { useState, useEffect, useRef } from "react";
import "./Dropdown.css";

export default function Dropdown({ label, filler, options }: { label?: string; filler?: string; options: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [selectedOption, setSelectedOption] = useState<any>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const [isSelected, setIsSelected] = useState(false);
    useEffect(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({ top: rect.bottom, left: rect.left });
        }
    }, [isOpen]);

    function handleSelection(options: any, index: number) {
        setSelectedOption(options);
        setSelectedIndex(index);
        setIsSelected(true);
        setIsOpen(false);
    }

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                ref={buttonRef}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                className="dropdown-button"
                onClick={() => setIsOpen(!isOpen)}
            >
                {label} {selectedOption ? <span className="selected-option-color">{selectedOption.label}</span> : <span className="dropdown-filler">{filler}</span>}
            </button>

            {isOpen && (
                <ul
                    className="dropdown-menu"
                    role="listbox"
                    style={{
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                    }}
                >
                    {options.map((option, index) => (
                        <li key={option.value ?? index}
                            className="dropdown-item"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleSelection(option, index)}
                        >
                            {option.label ?? option}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}