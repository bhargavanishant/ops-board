import "./MediumCard.css";
import CardParent from "../card-parent/CardParent";

export default function MediumCard({ title, children }: { title: string; children: React.ReactNode; }) {
    return (
        <CardParent>
            <div className="medium-card-container">
                <div className="medium-card-header">
                    {title}
                </div>
                <div className="medium-card-content">{children}</div>
            </div>
        </CardParent>

    );
}