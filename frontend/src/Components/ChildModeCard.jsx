"use client";

import { ShieldCheck, LockKeyhole, Check, Info } from "lucide-react";

export default function ChildModeCard({
    enabled,
    passwordConfigured,
    loading,
    onSetup,
    onDisable,
}) {
    // Child Mode only counts as ON when a parent PIN really exists. If the
    // data says "enabled" but there is no PIN (old or half-saved record),
    // show OFF so the parent can set it up instead of hitting "not set up".
    const isOn = Boolean(enabled) && Boolean(passwordConfigured);

    const handleToggle = () => {
        if (isOn) onDisable();
        else onSetup();
    };

    return (
        <section className="overflow-hidden rounded-2xl border border-[#eee3ff] bg-[#f6efff] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eadbff] text-[#5426c7]">
                        <ShieldCheck size={25} />
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-[#5426c7]">
                                Child Mode
                            </h3>
                            <Info size={15} className="text-[#7c68a8]" />
                        </div>
                        <p className="text-sm text-[#62577d]">
                            Create a safe, focused space for your child.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    role="switch"
                    aria-checked={isOn}
                    aria-label="Child Mode"
                    disabled={loading}
                    onClick={handleToggle}
                    className={`relative h-8 w-[68px] rounded-full p-1 transition ${isOn ? "bg-[#5426c7]" : "bg-[#a2a0b3]"
                        } disabled:opacity-50`}
                >
                    <span
                        className={`absolute top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow transition-all ${isOn ? "left-[38px]" : "left-1"
                            }`}
                    />
                    <span
                        className={`absolute top-2 text-[10px] font-bold text-white ${isOn ? "left-2" : "right-2"
                            }`}
                    >
                        {loading ? "..." : isOn ? "ON" : "OFF"}
                    </span>
                </button>
            </div>

            <div className="mt-4 flex flex-col gap-4 rounded-xl border border-white bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 flex-col gap-3">
                    {[
                        "A simple, distraction-free experience",
                        "Age-appropriate content",
                        "Safe and easy navigation for kids",
                    ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                            <Check
                                size={17}
                                className="shrink-0 text-[#5426c7]"
                            />
                            <span className="text-xs text-[#62577d] sm:text-sm">
                                {item}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-2 sm:w-[240px]">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={handleToggle}
                        className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5426c7] px-4 py-3 text-sm font-bold text-white shadow-[0_5px_15px_rgba(84,38,199,0.22)] transition hover:bg-[#4520a8] disabled:opacity-50"
                    >
                        <LockKeyhole size={16} />
                        {isOn
                            ? "Turn off Child Mode"
                            : passwordConfigured
                                ? "Turn on Child Mode"
                                : "Set up Child Mode"}
                    </button>

                    <p className="flex items-center justify-center gap-1 text-[10px] text-[#7c7196]">
                        <LockKeyhole size={11} />
                        {passwordConfigured
                            ? "Protected by your parent PIN"
                            : "A parent PIN is required"}
                    </p>
                </div>
            </div>
        </section>
    );
}