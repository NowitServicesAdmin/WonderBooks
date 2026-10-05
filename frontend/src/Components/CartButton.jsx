import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

// Header cart icon with the number of printed copies in the cart
export const CartButton = () => {
    const navigate = useNavigate();
    const { count } = useCart();

    return (
        <button
            type="button"
            onClick={() => navigate("/cart")}
            aria-label={count > 0 ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"}
            title="Your cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#5426c7] transition-all duration-200 hover:scale-105 hover:bg-white/70 md:h-11.5 md:w-11.5"
        >
            <ShoppingCart size={28} strokeWidth={1.8} className="h-6 w-6 md:h-7 md:w-7" />

            {count > 0 && (
                <span className="absolute -right-0.75 -top-1 flex h-4.75 min-w-4.75 items-center justify-center rounded-full bg-[#e94b4b] px-1 text-[10px] font-bold text-white shadow-sm">
                    {count > 99 ? "99+" : count}
                </span>
            )}
        </button>
    );
};