import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  Mail,
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
  LockKeyhole,
} from "lucide-react";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;
const EMPTY_FORM = {
  pin: "",
  confirmPin: "",
};

const emptyOtp = () => Array(OTP_LENGTH).fill("");

const getResult = (response) => response?.data ?? response;

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

// Calls the handler passed in by the parent. Handlers should throw on failure.
const callApi = async (fn, args) => {
  if (typeof fn !== "function") {
    throw new Error("This action is not available.");
  }

  return getResult(await fn(args));
};

/**
 * Props
 *  mode                  "setup" | "disable"
 *  hasPin                true when a parent PIN already exists. In "setup"
 *                        mode this skips PIN creation + email OTP: the parent
 *                        just enters the PIN (onEnable) and Child Mode turns on.
 *  email                 account email, shown masked on OTP screens
 *  onClose               () => void
 *  onRequestOtp          ({ pin, confirmPin }) => Promise   first-time setup, sends OTP
 *  onVerifyOtp           ({ otp }) => Promise               first-time setup, verifies OTP + enables
 *  onEnable              (pin) => Promise                   PIN already exists, turns on
 *  onDisable             (pin) => Promise                   turns off
 *  onRequestRecoveryOtp  () => Promise                      forgot PIN, sends OTP
 *  onVerifyRecoveryOtp   ({ otp }) => Promise               forgot PIN, verifies OTP
 *  onResetPin            ({ pin, confirmPin }) => Promise   forgot PIN, saves new PIN
 */
export default function ChildModeModal({
  mode = "setup",
  hasPin = false,
  email = "",
  onClose,
  onRequestOtp,
  onVerifyOtp,
  onEnable,
  onDisable,
  onRequestRecoveryOtp,
  onVerifyRecoveryOtp,
  onResetPin,
}) {
  // Decided once when the modal opens. The parent updates hasPin after a
  // successful setup, which must not yank the user off the success screen.
  const [initialView] = useState(() =>
    mode === "setup" && hasPin ? "enable" : mode
  );

  const [view, setView] = useState(initialView);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [otp, setOtp] = useState(emptyOtp);
  const [visible, setVisible] = useState({});
  const [validationError, setValidationError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Where "Forgot PIN?" was opened from, so the top arrow returns there.
  const [forgotOrigin, setForgotOrigin] = useState(
    initialView === "enable" ? "enable" : "disable"
  );

  const [recoveryPin, setRecoveryPin] = useState("");
  const [confirmRecoveryPin, setConfirmRecoveryPin] = useState("");

  const otpRefs = useRef([]);

  const isBusy = busy;

  // Resend countdown.
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

  const primaryButton =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60";

  const maskedEmail = email
    ? email.replace(/^(.{2}).*(@.*)$/, "$1••••$2")
    : "your registered email address";

  const clearMessages = () => {
    setValidationError("");
    setNotice("");
  };

  const updateForm = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    clearMessages();
  };

  const toggleVisibility = (key) => {
    setVisible((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const resetOtp = () => {
    setOtp(emptyOtp());
  };

  const focusOtp = (index = 0) => {
    setTimeout(() => {
      otpRefs.current[index]?.focus();
    }, 0);
  };

  const goTo = (nextView) => {
    setView(nextView);
    setStep(1);
    setForm(EMPTY_FORM);
    setOtp(emptyOtp());
    setVisible({});
    setCooldown(0);
    setRecoveryPin("");
    setConfirmRecoveryPin("");
    clearMessages();
  };

  const openForgotPin = () => {
    setForgotOrigin(view === "enable" ? "enable" : "disable");
    goTo("forgot-pin");
  };

  // ---------------------------------------------------------------
  // BACK ARROW (header): one small arrow instead of Back buttons.
  // ---------------------------------------------------------------
  const canGoBack =
    (view === "setup" && step === 2) ||
    view === "forgot-pin" ||
    view === "verify-recovery-otp";

  const handleBack = () => {
    if (isBusy) return;

    if (view === "setup" && step === 2) {
      setStep(1);
      resetOtp();
      setCooldown(0);
      clearMessages();
      return;
    }

    if (view === "forgot-pin") {
      goTo(forgotOrigin);
      return;
    }

    if (view === "verify-recovery-otp") {
      goTo("forgot-pin");
    }
  };

  // ---------------------------------------------------------------
  // ENABLE (PIN already set): verify PIN, then show success.
  // ---------------------------------------------------------------
  const handleEnable = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!/^\d{4,6}$/.test(form.pin)) {
      setValidationError("Enter your 4 to 6 digit parent PIN.");
      return;
    }

    setBusy(true);

    try {
      const result = await callApi(onEnable, form.pin);

      if (!result || result.success !== true) {
        setValidationError(result?.message || "The PIN is incorrect.");
        return;
      }

      setNotice(result.message || "Child Mode has been turned on.");
      setView("enable-success");
    } catch (err) {
      setValidationError(
        getErrorMessage(err, "Unable to turn on Child Mode.")
      );
    } finally {
      setBusy(false);
    }
  };

  // ---------------------------------------------------------------
  // SETUP STEP 1: validate PIN, then send the OTP.
  // ---------------------------------------------------------------
  const handleStepOne = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!/^\d{4,6}$/.test(form.pin)) {
      setValidationError("Enter a PIN containing 4 to 6 digits.");
      return;
    }

    if (form.pin !== form.confirmPin) {
      setValidationError("The PINs do not match.");
      return;
    }

    setBusy(true);

    try {
      const result = await callApi(onRequestOtp, {
        pin: form.pin,
        confirmPin: form.confirmPin,
      });

      if (result?.success === false) {
        setValidationError(
          result.message || "Unable to send the verification code."
        );
        return;
      }

      setOtp(emptyOtp());
      setStep(2);
      setCooldown(RESEND_SECONDS);
      setNotice("A verification code has been sent to your email.");
      focusOtp(0);
    } catch (err) {
      setValidationError(
        getErrorMessage(
          err,
          "Unable to send the verification code. Please try again."
        )
      );
    } finally {
      setBusy(false);
    }
  };

  // Resend the setup OTP.
  const requestSetupOtp = async () => {
    if (cooldown > 0) return;

    clearMessages();
    setBusy(true);

    try {
      const result = await callApi(onRequestOtp, {
        pin: form.pin,
        confirmPin: form.confirmPin,
      });

      if (result?.success === false) {
        setValidationError(result.message || "Unable to resend the code.");
        return;
      }

      setOtp(emptyOtp());
      setCooldown(RESEND_SECONDS);
      setNotice("A new verification code has been sent.");
      focusOtp(0);
    } catch (err) {
      setValidationError(getErrorMessage(err, "Unable to resend the code."));
    } finally {
      setBusy(false);
    }
  };

  // ---------------------------------------------------------------
  // OTP INPUT: typing, auto-advance, backspace, arrows and paste.
  // ---------------------------------------------------------------
  const handleOtpChange = (index, rawValue) => {
    clearMessages();

    const digits = String(rawValue).replace(/\D/g, "");

    if (!digits) {
      setOtp((current) =>
        current.map((digit, i) => (i === index ? "" : digit))
      );
      return;
    }

    setOtp((current) => {
      const next = [...current];
      const available = OTP_LENGTH - index;

      digits
        .slice(0, available)
        .split("")
        .forEach((digit, offset) => {
          next[index + offset] = digit;
        });

      return next;
    });

    const available = OTP_LENGTH - index;
    const inserted = Math.min(digits.length, available);
    const nextIndex = Math.min(index + inserted, OTP_LENGTH - 1);

    focusOtp(nextIndex);
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace") {
      event.preventDefault();

      if (otp[index]) {
        setOtp((current) =>
          current.map((digit, i) => (i === index ? "" : digit))
        );
      } else if (index > 0) {
        setOtp((current) =>
          current.map((digit, i) => (i === index - 1 ? "" : digit))
        );

        otpRefs.current[index - 1]?.focus();
      }
    }

    if (event.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) return;

    event.preventDefault();

    const next = emptyOtp();

    pasted.split("").forEach((digit, index) => {
      next[index] = digit;
    });

    setOtp(next);
    clearMessages();

    focusOtp(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  // ---------------------------------------------------------------
  // SETUP STEP 2: verify OTP and enable Child Mode.
  // ---------------------------------------------------------------
  const handleConfirmSetup = async (event) => {
    event.preventDefault();
    clearMessages();

    const code = otp.join("");

    if (!/^\d{6}$/.test(code)) {
      setValidationError("Enter the complete 6-digit verification code.");

      const firstEmpty = otp.findIndex((digit) => !digit);
      focusOtp(firstEmpty === -1 ? 0 : firstEmpty);
      return;
    }

    setBusy(true);

    try {
      const result = await callApi(onVerifyOtp, { otp: code });

      if (!result || result.success !== true) {
        setValidationError(
          result?.message || "The code is invalid or has expired."
        );
        return;
      }

      setNotice(result.message || "Child Mode has been enabled.");
      setView("setup-success");
    } catch (err) {
      setValidationError(
        getErrorMessage(err, "Verification failed. Please try again.")
      );
    } finally {
      setBusy(false);
    }
  };

  // ---------------------------------------------------------------
  // DISABLE: parent PIN.
  // ---------------------------------------------------------------
  const handleDisable = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!/^\d{4,6}$/.test(form.pin)) {
      setValidationError("Enter your 4 to 6 digit parent PIN.");
      return;
    }

    setBusy(true);

    try {
      const result = await callApi(onDisable, form.pin);

      if (!result || result.success !== true) {
        setValidationError(result?.message || "The PIN is incorrect.");
        return;
      }

      setNotice(result.message || "Child Mode has been turned off.");
      setView("disable-success");
    } catch (err) {
      setValidationError(
        getErrorMessage(err, "Unable to turn off Child Mode.")
      );
    } finally {
      setBusy(false);
    }
  };

  // ---------------------------------------------------------------
  // FORGOT PIN: email OTP first, then set a new PIN.
  // ---------------------------------------------------------------
  const handleRecoveryRequest = async () => {
    if (cooldown > 0) return;

    clearMessages();
    setBusy(true);

    try {
      const result = await callApi(onRequestRecoveryOtp);

      if (result?.success === false) {
        setValidationError(
          result.message || "Unable to send the recovery code."
        );
        return;
      }

      setOtp(emptyOtp());
      setView("verify-recovery-otp");
      setCooldown(RESEND_SECONDS);
      setNotice("A recovery code has been sent to your email.");
      focusOtp(0);
    } catch (err) {
      setValidationError(
        getErrorMessage(err, "Unable to send the recovery code.")
      );
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyRecoveryOtp = async (event) => {
    event.preventDefault();
    clearMessages();

    const code = otp.join("");

    if (!/^\d{6}$/.test(code)) {
      setValidationError("Enter the complete 6-digit verification code.");
      return;
    }

    setBusy(true);

    try {
      const result = await callApi(onVerifyRecoveryOtp, { otp: code });

      if (!result || result.success !== true) {
        setValidationError(
          result?.message || "The recovery code is invalid or expired."
        );
        return;
      }

      setOtp(emptyOtp());
      setVisible({});
      setView("reset-pin");
      setNotice("Email verified. You can now set a new PIN.");
    } catch (err) {
      setValidationError(
        getErrorMessage(err, "Unable to verify the recovery code.")
      );
    } finally {
      setBusy(false);
    }
  };

  const handleResetPin = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!/^\d{4,6}$/.test(recoveryPin)) {
      setValidationError("Enter a PIN containing 4 to 6 digits.");
      return;
    }

    if (recoveryPin !== confirmRecoveryPin) {
      setValidationError("The PINs do not match.");
      return;
    }

    setBusy(true);

    try {
      const result = await callApi(onResetPin, {
        pin: recoveryPin,
        confirmPin: confirmRecoveryPin,
      });

      if (!result || result.success !== true) {
        setValidationError(result?.message || "Unable to update the PIN.");
        return;
      }

      setNotice(result.message || "PIN updated successfully.");
      setView("reset-success");
    } catch (err) {
      setValidationError(getErrorMessage(err, "Unable to update the PIN."));
    } finally {
      setBusy(false);
    }
  };

  // ---------------------------------------------------------------
  // SHARED PIECES
  // ---------------------------------------------------------------
  const renderOtpInputs = () => (
    <div
      className="flex justify-center gap-2 sm:gap-3"
      onPaste={handleOtpPaste}
    >
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            otpRefs.current[index] = element;
          }}
          aria-label={`Verification code digit ${index + 1}`}
          className="h-12 w-10 min-w-0 rounded-xl border border-slate-200 bg-white text-center text-lg font-bold text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 sm:h-14 sm:w-12"
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={index === 0 ? OTP_LENGTH : 1}
          value={digit}
          onChange={(event) => handleOtpChange(index, event.target.value)}
          onKeyDown={(event) => handleOtpKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  );

  const renderResend = (onResend) => (
    <div className="flex items-center justify-center gap-1.5 text-sm text-slate-500">
      <span>Didn’t receive the code?</span>
      <button
        type="button"
        disabled={isBusy || cooldown > 0}
        onClick={onResend}
        className="inline-flex items-center gap-1 font-semibold text-violet-700 hover:text-violet-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw size={13} />
        {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
      </button>
    </div>
  );

  // Numeric PIN input with show/hide toggle. `onValue` receives digits only.
  const renderPinInput = ({
    key,
    value,
    onValue,
    placeholder,
    autoFocus = false,
    ariaName = "PIN",
  }) => (
    <span className="relative block">
      <input
        className={`${inputClass} pr-11`}
        type={visible[key] ? "text" : "password"}
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        maxLength={6}
        value={value}
        onChange={(event) => {
          onValue(event.target.value.replace(/\D/g, "").slice(0, 6));
          clearMessages();
        }}
        placeholder={placeholder}
      />

      <button
        type="button"
        onClick={() => toggleVisibility(key)}
        aria-label={visible[key] ? `Hide ${ariaName}` : `Show ${ariaName}`}
        className="absolute inset-y-0 right-3 text-slate-400 hover:text-slate-700"
      >
        {visible[key] ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </span>
  );

  // Single parent-PIN field, shared by the "enable" and "disable" screens.
  const renderParentPinField = () => (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-slate-700">Parent PIN</span>

      {renderPinInput({
        key: "pin",
        value: form.pin,
        onValue: (value) => setForm((current) => ({ ...current, pin: value })),
        placeholder: "Enter parent PIN",
        autoFocus: true,
      })}
    </label>
  );

  const isOtpView =
    (view === "setup" && step === 2) || view === "verify-recovery-otp";

  const isSuccessView = [
    "setup-success",
    "enable-success",
    "disable-success",
    "reset-success",
  ].includes(view);

  const isPinView = view === "enable" || view === "disable";

  const title =
    view === "disable"
      ? "Turn off Child Mode"
      : view === "forgot-pin" || view === "verify-recovery-otp"
        ? "Recover access"
        : view === "reset-pin"
          ? "Set a new PIN"
          : view === "reset-success"
            ? "PIN updated"
            : view === "setup-success" || view === "enable-success"
              ? "Child Mode enabled"
              : view === "disable-success"
                ? "Child Mode disabled"
                : "Turn on Child Mode";

  const subtitle =
    view === "setup"
      ? `Step ${step} of 2 · ${step === 1 ? "Create parent PIN" : "Verify email"}`
      : isPinView
        ? "Parent verification required"
        : view === "forgot-pin"
          ? "Step 1 of 3 · Send email code"
          : view === "verify-recovery-otp"
            ? "Step 2 of 3 · Verify email"
            : view === "reset-pin"
              ? "Step 3 of 3 · New PIN"
              : "Secure account verification";

  const successHeading =
    view === "setup-success" || view === "enable-success"
      ? "Child Mode is enabled"
      : view === "disable-success"
        ? "Child Mode is turned off"
        : "PIN updated successfully";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-3 sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) {
          onClose?.();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="child-mode-title"
        className="my-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Small back arrow, only where there is a previous step. */}
            {canGoBack && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isBusy}
                aria-label="Go back"
                title="Go back"
                className="-ml-2 -mr-1 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft size={16} />
              </button>
            )}

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              {isPinView || view === "reset-pin" ? (
                <LockKeyhole size={22} />
              ) : isOtpView || view === "forgot-pin" ? (
                <Mail size={22} />
              ) : (
                <ShieldCheck size={22} />
              )}
            </div>

            <div>
              <h2
                id="child-mode-title"
                className="text-lg font-bold text-slate-900"
              >
                {title}
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </header>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          {/* Progress bars */}
          {view === "setup" && (
            <div className="mb-5 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-violet-600" />
              <div
                className={`h-1.5 flex-1 rounded-full ${
                  step === 2 ? "bg-violet-600" : "bg-slate-100"
                }`}
              />
            </div>
          )}

          {(view === "forgot-pin" ||
            view === "verify-recovery-otp" ||
            view === "reset-pin") && (
            <div className="mb-5 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-violet-600" />
              <div
                className={`h-1.5 flex-1 rounded-full ${
                  view !== "forgot-pin" ? "bg-violet-600" : "bg-slate-100"
                }`}
              />
              <div
                className={`h-1.5 flex-1 rounded-full ${
                  view === "reset-pin" ? "bg-violet-600" : "bg-slate-100"
                }`}
              />
            </div>
          )}

          {/* ENABLE (PIN already set): just enter the PIN. */}
          {view === "enable" && (
            <form onSubmit={handleEnable} className="space-y-4">
              <p className="text-sm leading-5 text-slate-600">
                Enter your parent PIN to turn on Child Mode.
              </p>

              {renderParentPinField()}

              <button
                type="button"
                onClick={openForgotPin}
                className="text-sm font-semibold text-violet-700 hover:text-violet-900"
              >
                Forgot PIN?
              </button>

              <button
                className={`${primaryButton} w-full`}
                type="submit"
                disabled={isBusy}
              >
                {isBusy ? (
                  <Loader2 className="animate-spin" size={17} />
                ) : (
                  <ShieldCheck size={17} />
                )}
                Turn on Child Mode
              </button>
            </form>
          )}

          {/* SETUP STEP 1: create and confirm the parent PIN. */}
          {view === "setup" && step === 1 && (
            <form onSubmit={handleStepOne} className="space-y-4">
              <p className="text-sm leading-5 text-slate-600">
                Create a parent PIN to protect Child Mode settings. We’ll
                email you a verification code before enabling it.
              </p>

              {[
                { key: "pin", label: "Create PIN" },
                { key: "confirmPin", label: "Confirm PIN" },
              ].map(({ key, label }) => (
                <label key={key} className="block space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">
                    {label}
                  </span>

                  {renderPinInput({
                    key,
                    value: form[key],
                    onValue: (value) => updateForm(key, value),
                    placeholder: "Enter 4–6 digit PIN",
                  })}
                </label>
              ))}

              <p className="text-xs text-slate-500">
                Your PIN must contain 4 to 6 digits.
              </p>

              <button
                className={`${primaryButton} w-full`}
                type="submit"
                disabled={isBusy}
              >
                {isBusy ? (
                  <Loader2 className="animate-spin" size={17} />
                ) : (
                  <Mail size={17} />
                )}
                Continue <span aria-hidden="true">→</span>
              </button>
            </form>
          )}

          {/* SETUP STEP 2: enter the email OTP. */}
          {view === "setup" && step === 2 && (
            <form onSubmit={handleConfirmSetup} className="space-y-5">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                  <Mail size={23} />
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  Confirm setup
                </h3>

                <p className="mt-1 text-sm leading-5 text-slateac-600">
                  Enter the 6-digit code we sent to{" "}
                  <span className="font-semibold text-slate-800">
                    {maskedEmail}
                  </span>
                  .
                </p>
              </div>

              {renderOtpInputs()}

              {renderResend(requestSetupOtp)}

              <button
                className={`${primaryButton} w-full`}
                type="submit"
                disabled={isBusy || otp.join("").length !== OTP_LENGTH}
              >
                {isBusy ? (
                  <Loader2 className="animate-spin" size={17} />
                ) : (
                  <CheckCircle2 size={17} />
                )}
                Confirm
              </button>
            </form>
          )}

          {/* DISABLE CHILD MODE */}
          {view === "disable" && (
            <form onSubmit={handleDisable} className="space-y-4">
              <p className="text-sm leading-5 text-slate-600">
                Enter the parent PIN to turn off Child Mode.
              </p>

              {renderParentPinField()}

              <button
                type="button"
                onClick={openForgotPin}
                className="text-sm font-semibold text-violet-700 hover:text-violet-900"
              >
                Forgot PIN?
              </button>

              <button
                className={`${primaryButton} w-full`}
                type="submit"
                disabled={isBusy}
              >
                {isBusy && <Loader2 className="animate-spin" size={17} />}
                Turn off Child Mode
              </button>
            </form>
          )}

          {/* FORGOT PIN, STEP 1: send the email code. */}
          {view === "forgot-pin" && (
            <div className="space-y-4">
              <p className="text-sm leading-5 text-slate-600">
                We’ll send a one-time verification code to {maskedEmail}.
                After you verify it, you can set a new PIN.
              </p>

              <button
                className={`${primaryButton} w-full`}
                type="button"
                onClick={handleRecoveryRequest}
                disabled={isBusy}
              >
                {isBusy ? (
                  <Loader2 className="animate-spin" size={17} />
                ) : (
                  <Mail size={17} />
                )}
                Send email code
              </button>
            </div>
          )}

          {/* FORGOT PIN, STEP 2: enter the email OTP. */}
          {view === "verify-recovery-otp" && (
            <form onSubmit={handleVerifyRecoveryOtp} className="space-y-5">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                  <Mail size={23} />
                </div>

                <p className="text-sm leading-5 text-slate-600">
                  Enter the 6-digit code sent to{" "}
                  <strong className="text-slate-800">{maskedEmail}</strong>.
                </p>
              </div>

              {renderOtpInputs()}

              {renderResend(handleRecoveryRequest)}

              <button
                className={`${primaryButton} w-full`}
                type="submit"
                disabled={isBusy || otp.join("").length !== OTP_LENGTH}
              >
                {isBusy && <Loader2 className="animate-spin" size={17} />}
                Verify code
              </button>
            </form>
          )}

          {/* FORGOT PIN, STEP 3: set a new PIN. */}
          {view === "reset-pin" && (
            <form onSubmit={handleResetPin} className="space-y-4">
              <p className="text-sm text-slate-600">
                Your email is verified. Choose a new 4 to 6 digit parent PIN.
              </p>

              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700">
                  New PIN
                </span>

                {renderPinInput({
                  key: "newPin",
                  value: recoveryPin,
                  onValue: setRecoveryPin,
                  placeholder: "Enter 4–6 digit PIN",
                  autoFocus: true,
                })}
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700">
                  Confirm new PIN
                </span>

                {renderPinInput({
                  key: "confirmNewPin",
                  value: confirmRecoveryPin,
                  onValue: setConfirmRecoveryPin,
                  placeholder: "Re-enter PIN",
                })}
              </label>

              <button
                className={`${primaryButton} w-full`}
                type="submit"
                disabled={isBusy}
              >
                {isBusy && <Loader2 className="animate-spin" size={17} />}
                Save new PIN
              </button>
            </form>
          )}

          {/* SUCCESS SCREENS */}
          {isSuccessView && (
            <div className="space-y-4 py-2 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
                <CheckCircle2 size={29} />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                {successHeading}
              </h3>

              <p className="text-sm text-slate-600">
                {notice || "Your changes have been saved."}
              </p>

              <button
                type="button"
                className={`${primaryButton} w-full`}
                onClick={onClose}
              >
                Done
              </button>
            </div>
          )}

          {validationError && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {notice && !isSuccessView && !validationError && (
            <p
              role="status"
              className="mt-3 text-center text-xs text-green-700"
            >
              {notice}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}