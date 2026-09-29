/* eslint-disable react-refresh/only-export-components */
import { useNavigate } from "react-router-dom";
import WonderAlertModal from "./WonderAlertModal";

export const PLAN_LIMIT_CODES = ["LIMIT_REACHED", "SUBSCRIPTION_REQUIRED", "FEATURE_NOT_INCLUDED"];

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
        navigate("/settings");
    };

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