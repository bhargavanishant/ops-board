import SearchBar from "../search-bar/SearchBar";
import "./Header.css";

export default function Header() {
  return (
    <header className="header">
        <div className="brand-header">
          <span className="brand-mark">
            <i />
          </span>
          <span className="brand-name">OpsBoard</span>
          <div className="brand-header-sre">SRE</div>
        </div>
        <SearchBar width='400px' placeholder="Search incidents, services, runbooks…" onSearch={() => {}} />
    </header>
  );
}