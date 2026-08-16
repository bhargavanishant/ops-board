import SmallCard from "../../components/small-card/SmallCard";
import SearchBar from "../../components/search-bar/SearchBar";
import "./Incidents.css";
import Dropdown from "../../components/dropdown/Dropdown";

export default function Incidents() {
    const options1 = [
        { value: "6", label: "Open" },
        { value: "3", label: "Investigating" },
        { value: "3", label: "Identified" },
        { value: "7", label: "Monitoring" },
        { value: "8", label: "Resolved" },
    ]
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
                <Dropdown label="Status" filler="Any Status" options={options1} />
                <Dropdown label="Priority" filler="Any" options={options1} />
                <Dropdown label="Service" filler="All Services" options={options1} />
                <Dropdown label="Service" filler="All Services" options={options1} />
                <Dropdown label="Service" filler="All Services" options={options1} />
                <SearchBar placeholder="Search incidents..." onSearch={handleSearch} width="300px" />
            </div>
        </>
    );
}