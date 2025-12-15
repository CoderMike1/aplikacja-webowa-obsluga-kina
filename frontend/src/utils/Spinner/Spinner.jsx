import "./Spinner.css";

export default function Spinner({ size = 48, label = "Ładowanie..." }) {
    return (
        <div className="spinnerWrap" role="status" aria-live="polite">
            <div className="spinner" style={{ width: size, height: size }} />
            <span className="spinnerLabel">{label}</span>
        </div>
    );
}