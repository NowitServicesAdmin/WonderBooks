import { useState } from "react";
import { Check, Crown } from "lucide-react";
import BrandText from "./BrandText";

// 👉 Export these 3 illustrations from your design as transparent PNGs
// import freeIllustration from "../assets/wonder-books/pricing-free.png"; // open book + star
// import creatorIllustration from "../assets/wonder-books/pricing-creator.png"; // robot reading
// import familyIllustration from "../assets/wonder-books/pricing-family.png"; // book stack + crown

const PLANS = [
    {
        id: "free",
        name: "Free",
        tagline: "For exploring WonderBooks.",
        // image: freeIllustration,
        imageAlt: "Open storybook with a golden star",
        cta: "Start Free",
        variant: "outline",
        billing: {
            monthly: { price: "₹0", suffix: "", note: "No credit card required" },
            yearly: { price: "₹4,999", suffix: "/ year", note: "Save ₹1,000 with yearly plan", noteIsLink: true },
        },
        features: [
            "1 AI Storybook / month",
            "Basic Story Templates",
            "Standard Illustrations",
            "Read Online",
            "Share with Family",
        ],
    },
    {
        id: "creator",
        name: "Creator",
        tagline: "For parents and creators who want more magic.",
        // image: creatorIllustration,
        imageAlt: "Friendly robot reading a storybook",
        cta: "Get Started",
        variant: "primary",
        popular: true,
        billing: {
            monthly: { price: "₹999", suffix: "/ month", note: "" },
            // ⚠️ Placeholder yearly price — change to your real number
            yearly: { price: "₹9,999", suffix: "/ year", note: "Money saved with yearly plan", noteIsLink: true },
        },
        features: [
            "10 AI Storybooks / month",
            "Premium Story Templates",
            "High Quality AI Illustrations",
            "Voice Storytelling (Text-to-Speech)",
            "Multiple Languages",
            "Download & Share (PDF)",
            "Priority Support",
        ],
    },
    {
        id: "family",
        name: "Family Pro",
        tagline: "For families who love unlimited stories.",
        // image: familyIllustration,
        imageAlt: "Stack of colourful books with a golden crown",
        cta: "Choose Yearly",
        variant: "dark",
        billing: {
            monthly: { price: "₹1,999", suffix: "/ month", },
            yearly: { price: "₹11,999", suffix: "/ year", note: "Save more with yearly plan", noteIsLink: true },
        },
        features: [
            "Unlimited AI Storybooks",
            "All Premium Templates & Styles",
            "High Quality AI Illustrations",
            "Voice Storytelling",
            "All Languages",
            "Download, Print & Share (PDF)",
            "Priority Support",
            "Early Access to New Features",
        ],
    },
];

const buttonStyles = {
    outline:
        "border-2 border-[#5b2fe0] bg-white text-[#5b2fe0] hover:bg-[#f4f0ff] focus-visible:ring-[#5b2fe0]/30",
    primary:
        "bg-[#5b2fe0] text-white shadow-lg shadow-[#5b2fe0]/30 hover:bg-[#4a22c4] focus-visible:ring-[#5b2fe0]/40",
    dark: "bg-[#2e2a5e] text-white shadow-lg shadow-[#2e2a5e]/25 hover:bg-[#232050] focus-visible:ring-[#2e2a5e]/40",
};

/**
 * Props:
 *  - onSelectPlan(planId, billingCycle)  → called when a plan button is clicked
 *    (e.g. navigate to signup / checkout)
 */
export default function PricingSection({ onSelectPlan = () => {} }) {
    const [cycle, setCycle] = useState("monthly"); // "monthly" | "yearly"

    return (
        <section id="pricing" className="relative overflow-hidden bg-white px-4  sm:px-6 lg:px-8 mb-8">
            {/* Soft background glow */}
            {/* <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(91,47,224,0.07),transparent)]"
            /> */}

            <div className="relative mx-auto max-w-250">
                {/* Heading */}
                <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6335d8]">Pricing</p>
                    <h2 className="mt-2 text-2xl font-extrabold text-[#1a1560] sm:text-3xl">
                        Choose Your <span className="text-[#5b2fe0]">Storytelling Plan</span>
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-xs leading-5 text-[#4d4a80]">
                        Create magical, personalized storybooks for your loved ones.
                    </p>

                    {/* Billing toggle */}
                    <div
                        role="group"
                        aria-label="Billing period"
                        className="mx-auto mt-5 inline-flex rounded-full border border-[#ebe8f5] bg-[#f6f5fb] p-1"
                    >
                        {["monthly", "yearly"].map((c) => {
                            const active = cycle === c;
                            return (
                                <button
                                    key={c}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => setCycle(c)}
                                    className={`rounded-full px-5 py-1.5 text-xs font-bold capitalize transition sm:px-6 ${
                                        active
                                            ? "bg-[#5b2fe0] text-white shadow-md shadow-[#5b2fe0]/30"
                                            : "text-[#6b6890] hover:text-[#5b2fe0]"
                                    }`}
                                >
                                    {c}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Cards */}
                <div className="mx-auto mt-10 grid max-w-sm grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-[465fr_518fr_465fr] lg:items-stretch lg:gap-4">
                    {PLANS.map((plan) => {
                        const info = plan.billing[cycle];
                        return (
                            <article
                                key={plan.id}
                                className={`relative flex flex-col rounded-[22px]  p-5 sm:p-6 ${
                                    plan.popular
                                        ? "border-2 border-[#5b2fe0] shadow-[0_20px_60px_-20px_rgba(91,47,224,0.35)]"
                                        : "border border-[#ece9f7] shadow-[0_10px_40px_-20px_rgba(60,40,140,0.2)]"
                                }`}
                            >
                                {plan.popular && (
                                    <span className="absolute left-1/2 top-0 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#5b2fe0] px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-[#5b2fe0]/30">
                                        <Crown className="h-3.5 w-3.5" fill="currentColor" strokeWidth={1.5} />
                                        Most Popular
                                    </span>
                                )}

                                {/* Top: name, tagline, price + illustration */}
                                <div className="relative">
                                    {/* <img
                                        src={plan.image}
                                        alt={plan.imageAlt}
                                        loading="lazy"
                                        className="pointer-events-none absolute -right-2 top-0 w-[38%] max-w-[130px] select-none object-contain"
                                    /> */}

                                    <h3 className="text-xl font-extrabold text-[#1a1560] sm:text-2xl">{plan.name}</h3>
                                    <p className="mt-1 max-w-[60%] text-xs leading-5 text-[#4d4a80]">
                                        <BrandText>{plan.tagline}</BrandText>
                                    </p>

                                    <div className="mt-4 flex items-baseline  gap-1.5">
                                        <span key={`price-${cycle}`} className="text-3xl notranslate font-extrabold leading-none text-[#5b2fe0] sm:text-4xl">
                                            {info.price}
                                        </span>
                                        {info.suffix && (
                                            <span key={`suffix-${cycle}`} className="text-xs text-[#6b6890] sm:text-sm">{info.suffix}</span>
                                        )}
                                    </div>

                                    {/* Reserve the note row so buttons line up across cards */}
                                    <p
                                        key={`note-${cycle}`}
                                        className={`mt-1.5 min-h-5 text-xs ${
                                            info.noteIsLink ? "text-[#5b2fe0]" : "text-[#4d4a80]"
                                        }`}
                                    >
                                        {info.note}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onSelectPlan(plan.id, plan.id === "family" ? "yearly" : cycle)}
                                    className={`mt-4 h-11 w-full rounded-xl text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 ${
                                        buttonStyles[plan.variant]
                                    }`}
                                >
                                    {plan.cta}
                                </button>

                                <hr className="my-5 border-[#ece9f5]" />

                                <ul className="space-y-2.5">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-3">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ece7fb] text-[#5b2fe0]">
                                                <Check className="h-3 w-3" strokeWidth={3} />
                                            </span>
                                            <span className="text-xs text-[#403b72]">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}