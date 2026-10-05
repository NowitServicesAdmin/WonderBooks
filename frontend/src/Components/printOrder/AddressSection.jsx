import { useState } from "react";
import { Briefcase, CheckCircle2, Home, MapPin, Pencil, Phone, Plus, Trash2 } from "lucide-react";

const TYPE_ICONS = { Home, Work: Briefcase, Other: MapPin };

// Saved delivery addresses with pick / add / edit / delete
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

    return (
        <section className="rounded-3xl border border-(--border) bg-(--surface) p-4 sm:p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--tint) text-(--accent)">
                        <MapPin size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-extrabold text-(--text-heading)">Delivery address</h2>
                        <p className="text-xs text-(--text-muted)">Choose where we should send your book.</p>
                    </div>
                </div>

                {addresses.length > 0 && (
                    <button
                        type="button"
                        onClick={onAdd}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-(--accent) px-4 text-sm font-bold text-(--accent) transition hover:bg-(--tint)"
                    >
                        <Plus size={15} />
                        Add new address
                    </button>
                )}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2].map((item) => (
                        <div key={item} className="h-28 animate-pulse rounded-2xl bg-(--tint)" />
                    ))}
                </div>
            ) : addresses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-(--accent-border) p-8 text-center">
                    <MapPin size={34} className="mx-auto mb-3 text-(--accent)" />
                    <h3 className="text-base font-extrabold text-(--text-heading)">No address added yet</h3>
                    <p className="mt-1 text-sm text-(--text-muted)">Add a delivery address to continue.</p>
                    <button
                        type="button"
                        onClick={onAdd}
                        className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-(--accent) px-6 text-sm font-bold text-white transition hover:bg-(--accent-hover)"
                    >
                        <Plus size={16} />
                        Add address
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {addresses.map((address) => {
                        const selected = selectedId === address._id;
                        const TypeIcon = TYPE_ICONS[address.addressType] || MapPin;
                        const confirming = confirmingId === address._id;

                        return (
                            <div
                                key={address._id}
                                role="radio"
                                aria-checked={selected}
                                tabIndex={0}
                                onClick={() => onSelect(address._id)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        onSelect(address._id);
                                    }
                                }}
                                className={`cursor-pointer rounded-2xl border p-4 transition ${selected
                                        ? "border-(--accent) bg-(--tint)"
                                        : "border-(--border) hover:border-(--accent-border)"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 space-y-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-sm font-extrabold text-(--text-heading)">{address.fullName}</h3>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-(--accent-bg) px-2 py-0.5 text-[11px] font-bold text-(--accent)">
                                                <TypeIcon size={11} />
                                                {address.addressType}
                                            </span>
                                            {address.isDefault && (
                                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs leading-relaxed text-(--text-muted)">
                                            {address.doorNo}, {address.formattedAddress}
                                            {address.landmark ? ` (Near ${address.landmark})` : ""}
                                        </p>
                                        <p className="flex items-center gap-1.5 text-xs text-(--text-muted)">
                                            <Phone size={11} />
                                            +91 {address.phone}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 flex-col items-end gap-2">
                                        {selected && <CheckCircle2 size={22} className="text-(--accent)" />}
                                    </div>
                                </div>

                                <div
                                    className="mt-3 flex items-center gap-2"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    {confirming ? (
                                        <>
                                            <span className="text-xs font-semibold text-(--text-muted)">Delete this address?</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setConfirmingId(null);
                                                    onDelete(address);
                                                }}
                                                className="h-8 rounded-lg bg-[#c0392b] px-3 text-xs font-bold text-white transition hover:opacity-90"
                                            >
                                                Delete
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setConfirmingId(null)}
                                                className="h-8 rounded-lg border border-(--border) px-3 text-xs font-bold text-(--text-muted) transition hover:bg-(--tint)"
                                            >
                                                Keep
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => onEdit(address)}
                                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-(--border) px-3 text-xs font-bold text-(--accent) transition hover:bg-(--tint)"
                                            >
                                                <Pencil size={12} />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setConfirmingId(address._id)}
                                                aria-label="Delete address"
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-(--border) text-(--text-muted) transition hover:bg-(--tint) hover:text-[#c0392b]"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default AddressSection;