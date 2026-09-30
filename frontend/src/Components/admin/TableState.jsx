export const TableState = ({ loading, error, empty, colSpan, onRetry }) => {
    if (loading) {
        return (
            <tr>
                <td colSpan={colSpan} className="px-4 py-10 text-center text-(--text-muted)">
                    Loading…
                </td>
            </tr>
        );
    }
    if (error) {
        return (
            <tr>
                <td colSpan={colSpan} className="px-4 py-10 text-center">
                    <div className="text-red-600">{error}</div>
                    {onRetry && (
                        <button onClick={onRetry} className="mt-2 text-sm font-semibold text-(--accent)">
                            Try again
                        </button>
                    )}
                </td>
            </tr>
        );
    }
    if (empty) {
        return (
            <tr>
                <td colSpan={colSpan} className="px-4 py-10 text-center text-(--text-muted)">
                    Nothing to show.
                </td>
            </tr>
        );
    }
    return null;
};
