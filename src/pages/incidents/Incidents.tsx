import SmallCard from "../../components/small-card/SmallCard";
import SearchBar from "../../components/search-bar/SearchBar";
import "./Incidents.css";
import Dropdown from "../../components/dropdown/Dropdown";

export default function Incidents() {
    const statusOptions = [
        { count: "6", value:"open",  label: "Open", color: "#4338ca" },
        { count: "3", value:"investigating", label: "Investigating", color: "#b45309" },
        { count: "3", value:"identified", label: "Identified", color: "var(--ink-55)"},
        { count: "7", value:"monitoring", label: "Monitoring", color: "#059669" },
        { count: "8", value:"resolve", label: "Resolved", color: "var(--ink-30)" },
    ];
    const priorityOptions = [
        { value: "critical", label: "Critical", color: "var(--crit)", count: 4 },
        { value: "high", label: "High", color: "#b45309", count: 7 },
        { value: "medium", label: "Medium", color: "#4338ca", count: 7 },
        { value: "low", label: "Low", color: "var(--ink-30)", count: 6 },
    ];
    const environmentOptions = [
        { count: "6", value:"open",  label: "Open"},
        { count: "3", value:"investigating", label: "Investigating" },
        { count: "3", value:"identified", label: "Identified"},
        { count: "7", value:"monitoring", label: "Monitoring" },
        { count: "8", value:"resolve", label: "Resolved" },
    ];
    const handleSearch = (query: string) => {
        console.log(query);
    };

    return (
        <>
            <div className="incidents-group">
                <div>
                    <h1>Incidents</h1>
                    <div className="subtitle">16 active incidents across 10 services · last sync 10:44:12</div>
                </div>
                <div>
                    <button className="refresh-button">Refresh</button>
                    <button className="create-button">Create Incident</button>
                </div>
            </div>
            <div className="incident-status">
                <SmallCard title="Open" children="6" />
                <SmallCard title="Critical" children="3" />
                <SmallCard title="Investigating" children="6" />
                <SmallCard title="Resolved Today" children="8" />
            </div>
            <div className="incident-filters">
                <Dropdown label="Status" filler="Any Status" options={statusOptions} />
                <Dropdown label="Priority" filler="Any" options={priorityOptions} />
                <Dropdown label="Service" filler="All Services" options={statusOptions} />
                <Dropdown label="Env" filler="All" options={environmentOptions} />
                <Dropdown label="Assignee" filler="Anyone" options={statusOptions} />
                <SearchBar placeholder="Search incidents..." onSearch={handleSearch} width="300px" />
            </div>
        </>
    );
}