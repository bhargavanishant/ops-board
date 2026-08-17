import { useState, useEffect, useRef } from "react";
import { Check } from "lucide-react";
import "./Dropdown.css";

export default function Dropdown({ label, filler, options, isFilter, filterPlaceholder }: { label?: string; filler?: string; options: any[], isFilter?: boolean, filterPlaceholder?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [selectedOption, setSelectedOption] = useState<any>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({ top: rect.bottom, left: rect.left });
        }
    }, [isOpen]);

    function handleSelection(option: any, index: number | null) {
        if(option.label !== filler) {
            setSelectedOption(option);
        }else{
            setSelectedOption(null);
        }
        setSelectedIndex(index);
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
                    style={{ top: coords.top, left: coords.left, width: isFilter ? 280 : undefined }}
                >
                    {isFilter && <div className="dropdown-filtering">
                            <input type="text" placeholder={filterPlaceholder} className="dropdown-filter-input" />
                        </div>}
                    {filler && (
                        <li
                            className="dropdown-item dropdown-item-reset"
                            role="option"
                            aria-selected={selectedIndex === null}
                            onClick={() => handleSelection({ label: filler }, null)}
                        >
                            <span>{filler}</span>
                            {selectedIndex === null && (
                                <Check className="dropdown-item-tick" size={15} strokeWidth={2.5} aria-hidden="true" />
                            )}
                        </li>
                    )}
                    {options.map((option, index) => (
                        <li
                            key={option.value ?? index}
                            className="dropdown-item"
                            role="option"
                            aria-selected={index === selectedIndex}
                            onClick={() => handleSelection(option, index)}
                        >
                            <span className="dropdown-item-left">
                                {option.color && (
                                    <span className="dropdown-item-swatch" style={{ background: option.color }} />
                                )}
                                <span>{option.label ?? option}</span>
                            </span>
                            <span className="dropdown-item-right">
                                {option.count !== undefined && (
                                    <span className="dropdown-item-count">{option.count}</span>
                                )}
                                {index === selectedIndex && (
                                    <Check className="dropdown-item-tick" size={15} strokeWidth={2.5} aria-hidden="true" />
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}