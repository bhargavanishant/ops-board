import MediumCard from "../../components/medium-card/MediumCard";
import SmallCard from "../../components/small-card/SmallCard";
import "./Overview.css";

export default function Overview() {
    return (
        <>
        <div className="header-group">
            <h1>Overview</h1>
            <div className="subtitle">Production reliability, last 14 days · all teams</div>
        </div>
        <div className="overview-status">
            <SmallCard title="Active Incidents" children="16" value="+3 vs yesterday"/>
            <SmallCard title="Critical Open" children="3" value="all paged"/>
            <SmallCard title="MTTR" children="41" value="−6m vs last week"/>
            <SmallCard title="Resolved Today" children="41" value="on pace"/>
            <SmallCard title="Services Degraded" children="41" value="Payments, Checkout, Search"/>
            <SmallCard title="SLO Breaches" children="41" value="Checkout error budget"/>
        </div>
        <div className="overview-status">
            <MediumCard title="System Health" children={<div>Chart Placeholder</div>}/>
        </div>
        </>
        
    );
}