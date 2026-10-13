import { useMemo, useState } from "react";
import { displayPhone } from "../../utils/phone";
import {
    Briefcase,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Home,
    MapPin,
    Pencil,
    Phone,
    Plus,
    Trash2,
} from "lucide-react";

const TYPE_ICONS = { Home, Work: Briefcase, Other: MapPin };
const VISIBLE_COUNT = 3;

export const AddressSection = ({
    loading,
    addresses,
    selectedId,
    onSelect,
    onAdd,
    onEdit,
    onDelete,
}) => {
    const [confirmingId, setConfirmingId] = useState(null);
    const [expanded, setExpanded] = useState(false);

    // selected address always first, the rest keep their original order
    const ordered = useMemo(() => {
        const selected = addresses.find((a) => a._id === selectedId);
        if (!selected) return addresses;
        return [selected, ...addresses.filter((a) => a._id !== selectedId)];
    }, [addresses, selectedId]);

    const hiddenCount = Math.max(0, ordered.length - VISIBLE_COUNT);
    const visible = expanded ? ordered : ordered.slice(0, VISIBLE_COUNT);

    const handleSelect = (id) => {
        onSelect(id);
        setExpanded(false); // close the list; the chosen address jumps to the top
        setConfirmingId(null);
    };

    return (
        <section className="rounded-2xl border border-(--border) bg-(--surface) p-3 sm:p-4">
            <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--tint) text-(--accent)">
                        <MapPin size={17} />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold text-(--text-heading)">Delivery address</h2>
                        <p className="text-xs text-(--text-muted)">Choose where we should send your book.</p>
                    </div>
                </div>

                {addresses.length > 0 && (
                    <button
                        type="button"
                        onClick={onAdd}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-(--accent) px-3 text-xs font-bold text-(--accent) transition hover:bg-(--tint)"
                    >
                        <Plus size={13} />
                        Add new address
                    </button>
                )}
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[1, 2].map((item) => (
                        <div key={item} className="h-20 animate-pulse rounded-xl bg-(--tint)" />
                    ))}
                </div>
            ) : addresses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-(--accent-border) p-6 text-center">
                    <MapPin size={28} className="mx-auto mb-2 text-(--accent)" />
                    <h3 className="text-sm font-extrabold text-(--text-heading)">No address added yet</h3>
                    <p className="mt-1 text-xs text-(--text-muted)">Add a delivery address to continue.</p>
                    <button
                        type="button"
                        onClick={onAdd}
                        className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-(--accent) px-5 text-sm font-bold text-white transition hover:bg-(--accent-hover)"
                    >
                        <Plus size={15} />
                        Add address
                    </button>
                </div>
            ) : (
                <>
                    <div className="space-y-2" role="radiogroup" aria-label="Delivery address">
                        {visible.map((address) => {
                            const selected = selectedId === address._id;
                            const TypeIcon = TYPE_ICONS[address.addressType] || MapPin;
                            const confirming = confirmingId === address._id;

                            return (
                                <div
                                    key={address._id}
                                    role="radio"
                                    aria-checked={selected}
                                    tabIndex={0}
                                    onClick={() => handleSelect(address._id)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            handleSelect(address._id);
                                        }
                                    }}
                                    className={`cursor-pointer rounded-xl border p-3 transition ${selected
                                            ? "border-(--accent) bg-(--tint)"
                                            : "border-(--border) hover:border-(--accent-border)"
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 space-y-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <h3 className="text-sm font-extrabold text-(--text-heading)">
                                                    {address.fullName}
                                                </h3>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-(--accent-bg) px-2 py-0.5 text-[10px] font-bold text-(--accent)">
                                                    <TypeIcon size={10} />
                                                    {address.addressType}
                                                </span>
                                                {address.isDefault && (
                                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs leading-snug text-(--text-muted)">
                                                {address.doorNo}, {address.formattedAddress}
                                                {address.landmark ? ` (Near ${address.landmark})` : ""}
                                            </p>
                                            <p className="flex items-center gap-1.5 text-xs text-(--text-muted)">
                                                <Phone size={10} />
                                                {displayPhone(address)}
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-1.5">
                                            {selected && <CheckCircle2 size={20} className="text-(--accent)" />}
                                        </div>
                                    </div>

                                    <div
                                        className="mt-2 flex items-center gap-2"
                                        onClick={(event) => event.stopPropagation()}
                                        onKeyDown={(event) => event.stopPropagation()}
                                    >
                                        {confirming ? (
                                            <>
                                                <span className="text-xs font-semibold text-(--text-muted)">
                                                    Delete this address?
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setConfirmingId(null);
                                                        onDelete(address);
                                                    }}
                                                    className="h-7 rounded-md bg-[#c0392b] px-2.5 text-xs font-bold text-white transition hover:opacity-90"
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setConfirmingId(null)}
                                                    className="h-7 rounded-md border border-(--border) px-2.5 text-xs font-bold text-(--text-muted) transition hover:bg-(--tint)"
                                                >
                                                    Keep
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => onEdit(address)}
                                                    className="inline-flex h-7 items-center gap-1 rounded-md border border-(--border) px-2.5 text-xs font-bold text-(--accent) transition hover:bg-(--tint)"
                                                >
                                                    <Pencil size={11} />
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setConfirmingId(address._id)}
                                                    aria-label="Delete address"
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-(--border) text-(--text-muted) transition hover:bg-(--tint) hover:text-[#c0392b]"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {hiddenCount > 0 && (
                        <button
                            type="button"
                            onClick={() => setExpanded((open) => !open)}
                            aria-expanded={expanded}
                            className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-(--border) text-xs font-bold text-(--accent) transition hover:bg-(--tint)"
                        >
                            {expanded ? (
                                <>
                                    <ChevronUp size={14} />
                                    Show less
                                </>
                            ) : (
                                <>
                                    <ChevronDown size={14} />
                                    Show {hiddenCount} more {hiddenCount === 1 ? "address" : "addresses"}
                                </>
                            )}
                        </button>
                    )}
                </>
            )}
        </section>
    );
};

export default AddressSection;