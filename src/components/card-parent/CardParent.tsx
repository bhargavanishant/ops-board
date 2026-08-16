import "./CardParent.css";

export default function CardParent({ children }: { children: React.ReactNode }) {
    return (
        <div className="card-parent-container">
            {children}
        </div>
    );
}