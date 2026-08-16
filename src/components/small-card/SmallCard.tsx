import CardParent from "../card-parent/CardParent";
import "./SmallCard.css";

export default function SmallCard({ title, children, value }: { title: string; children: React.ReactNode; value?: string }) {
    return (
        <CardParent>
            <div className="small-card-header">
                {title}
            </div>
            <div className="small-card-content">{children}</div>
            <div className="small-card-footer">{value}</div>
        </CardParent>
    );
}