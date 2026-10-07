export default function BrandText({ children }) {
    const parts = String(children ?? "").split(/(WonderBooks)/g);
    return (
        <>
            {parts.map((part, i) =>
                part === "WonderBooks" ? (
                    <span key={i} translate="no" className="notranslate">WonderBooks</span>
                ) : (
                    part
                )
            )}
        </>
    );
}