/* eslint-disable react-refresh/only-export-components */
import { useNavigate } from "react-router-dom";
import WonderAlertModal from "./WonderAlertModal";

// BOOK_IN_PROGRESS isn't a plan limit, but it's shown through the same alert
// so both create flows handle it without extra code.
export const PLAN_LIMIT_CODES = ["LIMIT_REACHED", "SUBSCRIPTION_REQUIRED", "FEATURE_NOT_INCLUDED", "BOOK_IN_PROGRESS"];

export const getPlanLimitError = (error) => {
    const data = error?.response?.data;
    return PLAN_LIMIT_CODES.includes(data?.code) ? data : null;
};

const TITLES = {
    LIMIT_REACHED: "Book limit reached",
    SUBSCRIPTION_REQUIRED: "Choose a plan to begin",
    FEATURE_NOT_INCLUDED: "Not included in your plan",
};

export const PlanLimitAlert = ({ info, onClose }) => {
    const navigate = useNavigate();

    const goToPlans = () => {
        onClose?.();
        navigate("/settings?tab=subscription");
    };

    if (info?.code === "BOOK_IN_PROGRESS") {
        const goToBooks = () => {
            onClose?.();
            navigate("/books");
        };

        return (
            <WonderAlertModal
                isOpen
                onClose={onClose}
                type="info"
                title="One book in progress"
                message={info.message || "One book is already being created. Please wait until it finishes before starting another."}
                primaryText="View My Books"
                secondaryText="Okay"
                onPrimary={goToBooks}
                onSecondary={onClose}
            />
        );
    }

    return (
        <WonderAlertModal
            isOpen={Boolean(info)}
            onClose={onClose}
            type="upgrade"
            title={TITLES[info?.code] || "Upgrade your plan"}
            message={info?.message || "Upgrade your plan to keep creating stories."}
            primaryText="Upgrade Now"
            secondaryText="Not now"
            onPrimary={goToPlans}
            onSecondary={onClose}
        />
    );
};

export default PlanLimitAlert;