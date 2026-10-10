import WonderAlertModal from "../WonderAlertModal";

// One confirmation alert for every SuperAdmin action, using the same Wonder
// alert the user side shows. While `busy`, the alert can't be dismissed.
export const ConfirmAlert = ({
    open,
    type = "danger",
    title,
    message,
    error = "",
    confirmText,
    cancelText = "No, Keep It",
    busyText = "Please wait...",
    busy = false,
    onConfirm,
    onCancel,
}) => (
    <WonderAlertModal
        isOpen={Boolean(open)}
        onClose={() => !busy && onCancel()}
        type={type}
        title={title}
        message={error || message}
        primaryText={busy ? busyText : confirmText}
        onPrimary={() => !busy && onConfirm()}
        secondaryText={cancelText}
        onSecondary={() => !busy && onCancel()}
    />
);
