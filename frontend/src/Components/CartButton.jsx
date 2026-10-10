import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

// Cart icon with the number of printed copies in the cart.
// `bordered` gives it the boxed look of the orders-page toolbar buttons;
// the default (used by the header) is exactly as before.
export const CartButton = ({ bordered = false }) => {
    const navigate = useNavigate();
    const { count } = useCart();

    return (
        <button
            type="button"
            onClick={() => navigate("/orders/cart")}
            aria-label={count > 0 ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"}
            title="Your cart"
            className={
                bordered
                    ? "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-(--accent-border) bg-(--surface) text-(--accent) transition hover:border-(--accent) hover:bg-(--tint) hover:text-(--accent-hover)"
                    : "relative flex h-10 w-10 items-center justify-center rounded-xl text-[#5426c7] transition-all duration-200 hover:scale-105 hover:bg-white/70 md:h-11.5 md:w-11.5"
            }
        >
            <ShoppingCart
                size={28}
                strokeWidth={1.8}
                className={bordered ? "h-5 w-5" : "h-6 w-6 md:h-7 md:w-7"}
            />

            {count > 0 && (
                <span className="absolute -right-0.75 -top-1 flex h-4.75 min-w-4.75 items-center justify-center rounded-full bg-[#e94b4b] px-1 text-[10px] font-bold text-white shadow-sm">
                    {count > 99 ? "99+" : count}
                </span>
            )}
        </button>
    );
};