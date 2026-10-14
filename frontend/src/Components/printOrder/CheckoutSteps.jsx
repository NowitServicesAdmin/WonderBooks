import { Check } from "lucide-react";

const CHECKOUT_STEPS = ["Cart", "Delivery", "Personalize & Add Extras", "Payment"];

// Cart -> Delivery -> Personalize & Add Extras -> Payment progress strip
export const CheckoutSteps = ({ current }) => (
    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-bold">
        {CHECKOUT_STEPS.map((label, index) => {
            const done = index < current;
            const active = index === current;
            return (
                <li key={label} className="flex items-center gap-1.5">
                    <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${done || active
                                ? "bg-(--accent) text-white"
                                : "border border-(--border) text-(--text-muted)"
                            }`}
                    >
                        {done ? <Check size={11} /> : index + 1}
                    </span>
                    <span
                        className={`${active || done ? "text-(--text-heading)" : "text-(--text-muted)"} ${active ? "" : "hidden sm:inline"
                            }`}
                    >
                        {label}
                    </span>
                    {index < CHECKOUT_STEPS.length - 1 && <span className="mx-0.5 h-px w-3 bg-(--border) sm:w-5" />}
                </li>
            );
        })}
    </ol>
);

export default CheckoutSteps;