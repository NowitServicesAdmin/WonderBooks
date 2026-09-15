import { useState } from "react";
import {
    Wand2,
    BookOpen,
    Palette,
    ShoppingCart,
    ChevronDown,
    ChevronsRight,
    MessageCircle,
    Pencil,
    ShoppingBag,
    LayoutGrid,
    Download,
    ShieldCheck,
    Star,
    Headphones,
    Mail,
    Sparkles,
} from "lucide-react";

/* =====================================================
   IMAGE URLS — drop your uploaded image links in here.
   Quick Help + Getting Started cards fall back to a
   lucide icon automatically if a url isn't provided yet.
====================================================== */
const quickHelpImages = {
    creatingBooks: "https://res.cloudinary.com/djdct0pxu/image/upload/c_auto,h_200,w_218/ChatGPT_Image_Sep_2_2026_04_14_01_PM_vmbaj4.png",
    myBooks: "https://res.cloudinary.com/djdct0pxu/image/upload/ChatGPT_Image_Sep_2_2026_04_14_01_PM_vmbaj4.png",
    templates: "https://res.cloudinary.com/djdct0pxu/image/upload/c_crop,g_north_west,h_148,w_198,x_494,y_851/ChatGPT_Image_Sep_2_2026_04_14_01_PM_vmbaj4.png",
    orders: "https://res.cloudinary.com/djdct0pxu/image/upload/c_crop,g_north_west,h_150,w_165,x_324,y_850/ChatGPT_Image_Sep_2_2026_04_14_01_PM_vmbaj4.png",
};

const gettingStartedImages = {
    step1: "",
    step2: "",
    step3: "",
    step4: "",
    step5: "",
};

const envelopeImageUrl = "https://res.cloudinary.com/djdct0pxu/image/upload/c_crop,g_north_west,h_140,w_160,x_987,y_858/ChatGPT_Image_Sep_2_2026_04_14_01_PM_vmbaj4.png";
const mugImageUrl = "https://res.cloudinary.com/djdct0pxu/image/upload/c_crop,g_north_west,h_145,w_155,x_1172,y_860/ChatGPT_Image_Sep_2_2026_04_14_01_PM_vmbaj4.png";

/* =====================================================
   DATA
====================================================== */
const quickHelpCards = [
    {
        key: "creatingBooks",
        icon: Wand2,
        title: "Creating Books",
        description: "Learn how to create magical stories with AI or manually.",
        bg: "bg-[#f3efff]",
        iconBg: "bg-[#e6dcff]",
        iconColor: "text-[#7c3aed]",
        arrowColor: "text-[#e94b4b]",
    },
    {
        key: "myBooks",
        icon: BookOpen,
        title: "My Books",
        description: "Manage, edit, read and download your books.",
        bg: "bg-[#e9f9ef]",
        iconBg: "bg-[#d6f3e1]",
        iconColor: "text-[#2f9e5c]",
        arrowColor: "text-[#2f9e5c]",
    },
    {
        key: "templates",
        icon: Palette,
        title: "Templates",
        description: "Explore and use beautiful templates for your stories.",
        bg: "bg-[#fff3e3]",
        iconBg: "bg-[#ffe7c4]",
        iconColor: "text-[#e08a1f]",
        arrowColor: "text-[#e08a1f]",
    },
    {
        key: "orders",
        icon: ShoppingCart,
        title: "Orders & Printing",
        description: "Order printed copies and track your orders.",
        bg: "bg-[#eaf1ff]",
        iconBg: "bg-[#d9e6ff]",
        iconColor: "text-[#3468d6]",
        arrowColor: "text-[#3468d6]",
    },
];

const faqs = [
    {
        icon: Star,
        question: "How do I create my first book?",
        answer:
            "Head to \"Create Book\" from the sidebar, choose AI-assisted or manual mode, and follow the guided steps to write and illustrate your story.",
    },
    {
        icon: Pencil,
        question: "Can I edit a book after creating it?",
        answer:
            "Yes — open any book from \"My Books\" and use the edit option to change text, images, or layout at any time.",
    },
    {
        icon: ShoppingBag,
        question: "How do I order a printed copy of my book?",
        answer:
            "Go to \"Orders\", select the book you'd like printed, choose a cover and paper option, and complete checkout.",
    },
    {
        icon: BookOpen,
        question: "Where can I find my completed books?",
        answer:
            "All finished stories live under \"My Books\", sorted by the date they were last edited.",
    },
    {
        icon: LayoutGrid,
        question: "Can I create books using a template?",
        answer:
            "Absolutely — browse the \"Templates\" section for ready-made themes and story structures you can customize.",
    },
    {
        icon: Download,
        question: "How do I download or share my book?",
        answer:
            "Open a book and use the download icon to save it as a PDF, or the share icon to send a link to family and friends.",
    },
    {
        icon: ShieldCheck,
        question: "Is my data safe and private?",
        answer:
            "Yes — your stories and account details are encrypted and never shared with third parties without your consent.",
    },
];

const gettingStartedSteps = [
    {
        number: 1,
        key: "step1",
        icon: Wand2,
        title: "Create Your Story",
        description: "Use AI or write your own idea to create a unique story.",
    },
    {
        number: 2,
        key: "step2",
        icon: Sparkles,
        title: "Add Magic",
        description: "AI will add characters, structure and magic to your story.",
    },
    {
        number: 3,
        key: "step3",
        icon: Palette,
        title: "Illustrate Beautifully",
        description: "AI creates stunning illustrations that bring your story to life.",
    },
    {
        number: 4,
        key: "step4",
        icon: BookOpen,
        title: "Preview & Personalize",
        description: "Preview your book, make edits and personalize it your way.",
    },
    {
        number: 5,
        key: "step5",
        icon: Star,
        title: "Your Book is Ready!",
        description: "Read, share or order a printed copy of your magical story.",
    },
];

/* =====================================================
   SMALL HELPERS
====================================================== */
const CardImageOrIcon = ({ src, Icon, iconColor = "text-[#5426c7]", boxClassName = "" }) => (
    <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_2px_8px_rgba(84,38,199,0.08)] ${boxClassName}`}
    >
        {src ? (
            <img src={src} alt="" className="h-full w-full rounded-2xl object-cover" />
        ) : (
            <Icon size={22} className={iconColor} strokeWidth={2} />
        )}
    </div>
);

/* =====================================================
   MAIN COMPONENT
====================================================== */
export const Help = () => {
    const [openFaqIndex, setOpenFaqIndex] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaqIndex((prev) => (prev === index ? null : index));
    };

    return (
        <div className="flex flex-col gap-6">

            {/* =====================================================
                QUICK HELP
            ====================================================== */}
            <section>
                <h3 className="mb-3 text-[17px] font-extrabold text-[#241748]">
                    Quick Help
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {quickHelpCards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <button
                                key={card.key}
                                type="button"
                                className={`group flex flex-col gap-3 rounded-2xl ${card.bg} p-5 text-left transition hover:shadow-[0_6px_20px_rgba(84,38,199,0.10)]`}
                            >
                                <CardImageOrIcon
                                    src={quickHelpImages[card.key]}
                                    Icon={Icon}
                                    iconColor={card.iconColor}
                                    boxClassName={card.iconBg}
                                />

                                <div>
                                    <h4 className="text-[15px] font-bold text-[#241748]">
                                        {card.title}
                                    </h4>
                                    <p className="mt-1 text-[13px] leading-snug text-[#71698c]">
                                        {card.description}
                                    </p>
                                </div>

                                <span
                                    className={`mt-1 ${card.arrowColor} transition group-hover:translate-x-0.5`}
                                >
                                    <ChevronsRight size={17} strokeWidth={2.5} />
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* =====================================================
                FAQ + GETTING STARTED
            ====================================================== */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">

                {/* ---------------- FAQ ---------------- */}
                <section className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(84,38,199,0.05)]">
                    <div className="mb-4 flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0eaff]">
                            <MessageCircle size={18} className="text-[#5426c7]" />
                        </div>
                        <h3 className="text-[17px] font-extrabold text-[#241748]">
                            Frequently Asked Questions
                        </h3>
                    </div>

                    <div className="flex flex-col divide-y divide-[#f0edf9]">
                        {faqs.map((faq, index) => {
                            const FaqIcon = faq.icon;
                            const isOpen = openFaqIndex === index;

                            return (
                                <div key={faq.question} className="py-1">
                                    <button
                                        type="button"
                                        onClick={() => toggleFaq(index)}
                                        className="flex w-full items-center gap-3 rounded-xl px-2 py-3.5 text-left transition hover:bg-[#faf8ff]"
                                    >
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f3efff]">
                                            <FaqIcon size={15} className="text-[#5426c7]" />
                                        </div>

                                        <span className="flex-1 text-[14.5px] font-semibold text-[#30215c]">
                                            {faq.question}
                                        </span>

                                        <ChevronDown
                                            size={18}
                                            className={`shrink-0 text-[#918aa5] transition-transform duration-200 ${
                                                isOpen ? "rotate-180" : ""
                                            }`}
                                        />
                                    </button>

                                    {isOpen && (
                                        <p className="px-2 pb-4 pl-[52px] pr-4 text-[13.5px] leading-relaxed text-[#71698c]">
                                            {faq.answer}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-2 pt-2 text-center text-[13.5px] text-[#71698c]">
                        Can't find the answer you're looking for?{" "}
                        <a href="#contact-support" className="font-bold text-[#5426c7] hover:underline">
                            Contact Support →
                        </a>
                    </div>
                </section>

                {/* ---------------- GETTING STARTED ---------------- */}
                <section className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(84,38,199,0.05)]">
                    <div className="mb-5 flex items-center gap-1.5">
                        <h3 className="text-[17px] font-extrabold text-[#241748]">
                            Getting Started
                        </h3>
                        <Sparkles size={16} className="text-[#f5b442]" />
                    </div>

                    <div className="flex flex-col">
                        {gettingStartedSteps.map((step, index) => {
                            const isLast = index === gettingStartedSteps.length - 1;

                            return (
                                <div key={step.number} className="flex gap-4">
                                    {/* Number + connecting line */}
                                    <div className="flex flex-col items-center">
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5426c7] text-[13px] font-bold text-white">
                                            {step.number}
                                        </div>
                                        {!isLast && (
                                            <div className="my-1 w-px flex-1 bg-[#e7e0ff]" />
                                        )}
                                    </div>

                                    {/* Card */}
                                    <div className={`flex flex-1 gap-3 rounded-xl bg-[#faf8ff] p-3.5 ${isLast ? "mb-0" : "mb-3"}`}>
                                        <CardImageOrIcon
                                            src={gettingStartedImages[step.key]}
                                            Icon={step.icon}
                                            boxClassName="bg-white"
                                        />

                                        <div>
                                            <h4 className="text-[14px] font-bold text-[#5426c7]">
                                                {step.title}
                                            </h4>
                                            <p className="mt-0.5 text-[13px] leading-snug text-[#71698c]">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>

            {/* =====================================================
                STILL NEED HELP — CONTACT SUPPORT BANNER
            ====================================================== */}
            <section
                id="contact-support"
                className="flex flex-col items-center gap-5 rounded-2xl bg-[#efe9ff] p-6 sm:flex-row sm:justify-between"
            >
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_2px_8px_rgba(84,38,199,0.08)]">
                        {envelopeImageUrl ? (
                            <img src={envelopeImageUrl} alt="" className="h-full w-full rounded-2xl object-cover" />
                        ) : (
                            <Mail size={24} className="text-[#5426c7]" />
                        )}
                    </div>

                    <div>
                        <h4 className="text-[16px] font-extrabold text-[#241748]">
                            Still need help?
                        </h4>
                        <p className="mt-0.5 text-[13.5px] text-[#71698c]">
                            Our support team is ready to assist you with anything you need.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2 sm:items-end">
                    <button
                        type="button"
                        className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[14px] font-bold text-[#5426c7] shadow-[0_2px_8px_rgba(84,38,199,0.10)] transition hover:bg-[#faf8ff]"
                    >
                        <Headphones size={17} />
                        Contact Support
                    </button>
                    <span className="text-[12px] text-[#918aa5]">
                        We usually reply within 24 hours
                    </span>
                </div>

                {mugImageUrl && (
                    <img
                        src={mugImageUrl}
                        alt=""
                        className="hidden h-16 w-16 object-contain lg:block"
                    />
                )}
            </section>
        </div>
    );
};