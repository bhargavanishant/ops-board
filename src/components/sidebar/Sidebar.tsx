import { NavLink } from "react-router";
import { navItems } from "./nav-items";
import { CollapseIcon } from "./icons";
import "./Sidebar.css";

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
    return (
        <nav className={`sidebar${collapsed ? " collapsed" : ""}`} aria-label="Primary">
            <ul className="sidebar-nav">
                {navItems.map((item) => (
                    <li key={item.to}>
                        <NavLink
                            to={item.to}
                            className={({ isActive }) =>
                                `nav-item${isActive ? " active" : ""}`
                            }
                            title={collapsed ? item.label : undefined}
                        >
                            <item.icon className="nav-item-icon" />
                            <span className="nav-item-label">{item.label}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>
            <button
                type="button"
                className="sidebar-toggle"
                onClick={onToggle}
                aria-expanded={!collapsed}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                <CollapseIcon />
            </button>
        </nav>
    );
}
