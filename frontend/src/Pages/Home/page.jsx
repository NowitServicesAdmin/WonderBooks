import React, { useEffect, useMemo, useState } from "react";
import {
    FaArrowRight as ArrowRight,
    FaBookOpen as BookOpen,
    FaCampground as Tent,
    FaChevronLeft as ChevronLeft,
    FaChevronRight as ChevronRight,
    FaGift as Gift,
    FaGraduationCap as Cap,
    FaHeart as Heart,
    FaHome as Home,
    FaImage as ImageIcon,
    FaInstagram as Instagram,
    FaLeaf as Leaf,
    FaMagic as Magic,
    FaPaw as Paw,
    FaPlay as Play,
    FaStar as Star,
    FaUsers as Users,
    FaFacebookF as Facebook,
    FaLinkedinIn as LinkedIn,
    FaYoutube as Youtube,
} from "react-icons/fa";
import heroImage from "../../assets/wonder-books/hero.png";
import templatesStarLeft from "../../assets/wonder-books/star-left.png";
import templatesStarRight from "../../assets/wonder-books/star-right.png";
import braveExplorer from "../../assets/wonder-books/template-brave-explorer.png";
import magicForest from "../../assets/wonder-books/template-magic-forest.png";
import specialFamily from "../../assets/wonder-books/template-special-family.png";
import superhero from "../../assets/wonder-books/template-superhero.png";
import dino from "../../assets/wonder-books/template-dino.png";
import shareIdeas from "../../assets/wonder-books/step-share-ideas.png";
import aiCreates from "../../assets/wonder-books/step-ai-creates.png";
import getBook from "../../assets/wonder-books/step-get-book.png";
// import girlBook from "../../assets/wonder-books/girl-book-clean.png";
import logo from "../../assets/wonder-books/wonderbook-logo.png";
import { Menu, User, X } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import ContactForm from "../../Components/ContactForm";
import PricingSection from "../../Components/PricingSection";

const templates = [
    {
        image: braveExplorer,
        lines: ["The Brave", "Little Explorer"],
        category: "Adventure",
        icon: Tent,
        text: "text-[#2d3a8c]",
        card: "bg-[#eef0ff]",
        pill: "bg-[#dfe3ff] text-[#3a3fb5]",
    },

    {
        image: magicForest,
        lines: ["Mia and the", "Magic Forest"],
        category: "Fantasy",
        icon: Leaf,
        text: "text-[#1f7a4d]",
        card: "bg-[#e6f8ef]",
        pill: "bg-[#d3f0df] text-[#1f7a4d]",
    },

    {
        image: specialFamily,
        lines: ["My Special", "Family"],
        category: "Family",
        icon: Home,
        text: "text-[#d9532b]",
        card: "bg-[#fff0e5]",
        pill: "bg-[#ffe1d0] text-[#d9532b]",
    },

    {
        image: superhero,
        lines: ["The Kindness", "Superhero"],
        category: "Education",
        icon: Cap,
        text: "text-[#2d3a8c]",
        card: "bg-[#e7f0ff]",
        pill: "bg-[#d8e7ff] text-[#2d4fa8]",
    },

    {
        image: dino,
        lines: ["Dino", "Adventures"],
        category: "Animals",
        icon: Paw,
        text: "text-[#b8741a]",
        card: "bg-[#fff3dc]",
        pill: "bg-[#ffe8bd] text-[#b8741a]",
    },
];

const steps = [
    { number: "1", image: shareIdeas, title: "Share Your Ideas", description: "Tell us the age, theme, characters and special details." },
    { number: "2", image: aiCreates, title: "AI Creates the Story", description: "Our AI writes a unique story with beautiful illustrations." },
    { number: "3", image: getBook, title: "Get Your Book", description: "Order a high-quality printed book and treasure it forever." },
];


const features = [
    {
        title: "Personalized Stories",
        description: "Your child's name, interests and unique characters",
        icon: User,
        card: "bg-gradient-to-b from-[#fff1f7] to-[#fff7fb] border-[#ffe3ef]",
        bg: "bg-[#ffe0ee]",
        color: "text-[#ec1c8c] fill-[#ec1c8c]",
    },
    {
        title: "Beautiful Illustrations",
        description: "Multiple art styles to choose from",
        icon: ImageIcon,
        card: "bg-gradient-to-b from-[#eefafd] to-[#f6fcff] border-[#dcf3f8]",
        bg: "bg-[#d3f5ee]",
        color: "text-[#0f6b5c]",
    },
    {
        title: "Printed & Delivered",
        description: "High-quality book, shipped to your doorstep",
        icon: Gift,
        card: "bg-gradient-to-b from-[#f6f0ff] to-[#faf7ff] border-[#e9ddff]",
        bg: "bg-[#eadcff]",
        color: "text-[#8b2be2]",
    },
    {
        title: "Create Lasting Memories",
        description: "Stories they'll treasure forever",
        icon: Heart,
        card: "bg-gradient-to-b from-[#fff1f7] to-[#fff7fb] border-[#ffe3ef]",
        bg: "bg-[#ffdce8]",
        color: "text-[#f0245f] fill-[#f0245f]",
    },
];

const values = [
    ["Builds Confidence", Star, "bg-[#fff0c2] text-[#d9962b]"],
    ["Encourages Reading", BookOpen, "bg-[#d9f4ea] text-[#1f9a72]"],
    ["Teaches Life Values", Heart, "bg-[#ffe0f0] text-[#e0449a]"],
    ["A Unique Gift", Gift, "bg-[#eadcff] text-[#8a4fe0]"],
];

const testimonials = [
    { text: "My daughter was so excited to see her name in the story! The illustrations are beautiful and the quality is amazing.", name: "Priya S." },
    { text: "Such a unique and thoughtful gift. My son keeps reading it every night.", name: "Rahul K." },
    { text: "The whole process was easy and the book turned out perfect. Highly recommend WonderBooks!", name: "Sneha M." },
    { text: "The personalized details made the story feel truly special. It became our favorite bedtime book.", name: "Ananya R." },
    { text: "The illustrations are magical and the story feels like it was made just for our family.", name: "Vikram P." },
];

function Sparkles({ leftClass = "left-[3%] top-10", rightClass = "right-[3%] top-24" }) {
    return (
        <>
            <img src={templatesStarLeft} alt="" className={`pointer-events-none absolute hidden w-27.5 select-none lg:block xl:w-32.5 ${leftClass}`} />
            <img src={templatesStarRight} alt="" className={`pointer-events-none absolute hidden w-22.5 select-none lg:block xl:w-27.5 ${rightClass}`} />
        </>
    );
}

function SectionHeading({ eyebrow, children, sub }) {
    return (
        <div className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6335d8]">{eyebrow}</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#1a1560] sm:text-3xl lg:text-[34px] lg:leading-[1.15]">{children}</h2>
            {sub && <p className="mt-2 text-sm text-[#4d4a80]">{sub}</p>}
        </div>
    );
}

function Logo({ stacked = false, light = false }) {
    return (
        <a href="#home" className={`group flex items-center gap-2 ${stacked ? "flex-col" : ""}`}>
            <img
                src={logo}
                alt="WonderBooks Logo"
                className={`shrink-0 object-contain transition duration-300 group-hover:-rotate-6 group-hover:scale-110 ${stacked ? "h-15 w-15" : "h-9 w-9"}`}
            />
            <span className={`text-2xl font-extrabold tracking-tight ${light ? "text-white" : "text-[#3a1fb5]"}`}>WonderBooks</span>
        </a>
    );
}

// Header links, in the same order the sections appear on the page.
// (Our Story is left out because its section is commented out below.)
const NAV_ITEMS = [
    { id: "home", label: "Home" },
    { id: "templates", label: "Book Templates" },
    { id: "how-it-works", label: "How It Works" },
    { id: "pricing", label: "Pricing" },
    { id: "contact", label: "Contact" },
];

export default function HomePage() {
    const [reviewIndex, setReviewIndex] = useState(0);
    const [isReviewPaused, setIsReviewPaused] = useState(false);
    const [reviewTransition, setReviewTransition] = useState(true);
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState("home");
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 10);

            const line = 120; // just under the sticky header
            let current = "home";
            for (const { id } of NAV_ITEMS) {
                if (id === "home") continue;
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= line) current = id;
            }
            setActiveSection(current);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, []);

    // Close the mobile/tablet menu when the screen grows to desktop
    useEffect(() => {
        const onResize = () => { if (window.innerWidth >= 1024) setMenuOpen(false); };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const goToSection = (e, id) => {
        e.preventDefault();
        setMenuOpen(false);
        setActiveSection(id);
        if (id === "home") {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // Pricing buttons (Start Free / Get Started / Choose Yearly) -> Contact section
    const handleSelectPlan = () => {
        setActiveSection("contact");
        document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const reviewSlides = useMemo(() => [...testimonials, ...testimonials, ...testimonials], []);

    useEffect(() => {
        if (isReviewPaused) return undefined;
        const timer = window.setInterval(() => {
            setReviewIndex((current) => {
                if (current >= testimonials.length - 1) {
                    setReviewTransition(false);
                    window.setTimeout(() => setReviewTransition(true), 80);
                    return 0;
                }
                return current + 1;
            });
        }, 4000);
        return () => window.clearInterval(timer);
    }, [isReviewPaused]);

    const visibleReviewIndex = reviewIndex % testimonials.length;
    const nextReview = () => { setReviewTransition(true); setReviewIndex((c) => (c + 1) % testimonials.length); };
    const previousReview = () => { setReviewTransition(true); setReviewIndex((c) => (c - 1 + testimonials.length) % testimonials.length); };

    const navLink = (id) =>
        `relative py-1 font-semibold transition-colors duration-300 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:rounded-full after:bg-linear-to-r after:from-[#4a1fe0]/20 after:to-[#4a1fe0] after:transition-all after:duration-300 hover:text-[#4a1fe0] ${activeSection === id
            ? "text-[#4a1fe0] after:w-full"
            : "after:w-0 hover:after:w-full"
        }`;

    // footer link: slides right slightly and turns white on hover
    const footerLink = "block transition duration-200 hover:translate-x-1 hover:text-white";

    return (
        <div className="lg:min-h-screen overflow-x-clip bg-white text-[#171653]">
            {/* Header: white with rounded bottom corners + soft shadow. On mobile/tablet it expands into a dropdown menu. */}
            <header
                className={`sticky top-0 z-50 rounded-b-3xl shadow-[0_8px_28px_rgba(74,31,224,0.14)] transition-all duration-300 ease-out ${scrolled && !menuOpen
                    ? "bg-white/95 backdrop-blur-md"
                    : "bg-white"
                    }`}
            >
                <div className="mx-auto flex h-20 w-full items-center justify-between px-4 sm:px-6">
                    <Logo />

                    {/* Desktop nav */}
                    <nav className="hidden items-center gap-8 text-[15px] font-semibold text-[#2f2a6b] lg:flex">
                        {NAV_ITEMS.map(({ id, label }) => (
                            <a
                                key={id}
                                href={`#${id}`}
                                onClick={(e) => goToSection(e, id)}
                                aria-current={activeSection === id ? "page" : undefined}
                                className={navLink(id)}
                            >
                                {label}
                            </a>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        {/* <button onClick={() => navigate("/auth")} className="hidden rounded-full border border-[#cdbff5] px-5 py-1.5 text-[11px] font-bold text-[#4a1fe0] transition hover:bg-[#f3ecff] sm:block">Login</button> */}

                        {/* Desktop CTA */}
                        <button
                            onClick={() => navigate("/auth")}
                            className="hidden rounded-full bg-[#5b2df0] px-5 py-1.5 text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(74,31,224,.3)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#4a1fe0] hover:shadow-[0_10px_22px_rgba(74,31,224,.45)] active:translate-y-0 active:scale-95 lg:block"
                        >
                            Get Started
                        </button>

                        {/* Mobile / tablet toggle */}
                        <button
                            type="button"
                            onClick={() => setMenuOpen((o) => !o)}
                            aria-label={menuOpen ? "Close menu" : "Open menu"}
                            aria-expanded={menuOpen}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-[#2f2a6b] transition hover:bg-[#f3ecff] active:scale-95 lg:hidden"
                        >
                            {menuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile / tablet dropdown */}
                <div
                    aria-hidden={!menuOpen}
                    className={`grid transition-all duration-300 ease-out lg:hidden ${menuOpen ? "visible grid-rows-[1fr] opacity-100" : "invisible grid-rows-[0fr] opacity-0"
                        }`}
                >
                    <div className="overflow-hidden">
                        <nav className="space-y-1 px-4 pb-5 pt-1 sm:px-6">
                            {NAV_ITEMS.map(({ id, label }) => {
                                const active = activeSection === id;
                                return (
                                    <a
                                        key={id}
                                        href={`#${id}`}
                                        onClick={(e) => goToSection(e, id)}
                                        aria-current={active ? "page" : undefined}
                                        className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-200 ${active
                                            ? "bg-[#f1ebff] text-[#4a1fe0]"
                                            : "text-[#2f2a6b] hover:bg-[#f7f3ff]"
                                            }`}
                                    >
                                        {label}
                                        {active && <span className="h-1.5 w-1.5 rounded-full bg-[#4a1fe0]" />}
                                    </a>
                                );
                            })}

                            <button
                                onClick={() => { setMenuOpen(false); navigate("/auth"); }}
                                className="mt-3 w-full rounded-xl bg-[#5b2df0] py-3 text-sm font-bold text-white shadow-[0_6px_16px_rgba(74,31,224,.3)] transition duration-300 hover:bg-[#4a1fe0] active:scale-[0.98]"
                            >
                                Get Started
                            </button>
                        </nav>
                    </div>
                </div>
            </header>

            {/* -mt-20 pulls the hero up behind the header (h-20) so the rounded corners show the hero, not white */}
            <main id="home" className="relative isolate -mt-20 overflow-hidden bg-violet-100">
                {/* Hero (box-content + pt-20 keeps the hero's own height/content position exactly as before) */}
                <section
                    className=" relative isolate box-content overflow-hidden pt-20 min-h-162.5 sm:min-h-175 md:min-h-187.5 lg:min-h-200 xl:min-h-212.5 2xl:min-h-screen bg-[#2a1270] bg-cover bg-position-[65%_center] sm:bg-position-[60%_center] md:bg-position-[55%_center] lg:bg-position-[60%_center] xl:bg-position-[65%_center] 2xl:bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${heroImage})` }}
                >
                    <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-r from-[#24105f]/70 via-[#24105f]/30 to-transparent lg:hidden" />
                    <div className="mx-auto flex min-h-155 w-full max-w-300 items-center px-5 pb-16 pt-12 sm:px-8 lg:min-h-0 lg:aspect-2/1 lg:px-6 lg:pb-12 lg:pt-8">
                        <div className="max-w-115">
                            <p className="mb-4 text-[9px] font-bold uppercase tracking-[0.25em] text-[#cbb8ff]">Personalized Storybooks with AI</p>
                            <h1 className="text-[44px] font-black leading-[1.05] tracking-[-0.02em] text-white sm:text-[52px] lg:text-[clamp(40px,3.6vw,56px)]">
                                Turn Their
                                <br />
                                Imagination
                                <br />
                                into a <span className="text-[#ffd447]">Real Book</span>
                            </h1>
                            <p className="mt-5 max-w-90 text-sm leading-6 text-[#efe8ff]">
                                Create personalized stories with AI, beautiful illustrations, and lasting memories for the little ones you love.
                            </p>
                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                <a
                                    type="button"
                                    href="#contact"
                                    className="group flex items-center gap-2 rounded-full bg-[#ffd447] px-6 py-2.5 text-xs font-extrabold text-[#2b1a6b] shadow-[0_10px_28px_rgba(255,212,71,0.3)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ffdc62] hover:shadow-[0_14px_32px_rgba(255,212,71,0.5)] active:translate-y-0 active:scale-95"
                                >
                                    Create Your Storybook
                                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                                </a>
                                <button
                                    type="button"
                                    className="group flex items-center gap-2 rounded-full border border-white/60 bg-white/5 px-6 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-white hover:bg-white/20 active:scale-95"
                                >
                                    <Play className="h-3 w-3 transition-transform duration-300 group-hover:scale-125" />
                                    Watch Video
                                </button>
                            </div>
                            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-semibold text-white">
                                <span className="flex items-center gap-2"><Magic className="h-3.5 w-3.5" />AI-Powered Stories</span>
                                <span className="flex items-center gap-2"><ImageIcon className="h-3.5 w-3.5" />Beautiful Illustrations</span>
                                <span className="flex items-center gap-2"><Gift className="h-3.5 w-3.5" />Printed &amp; Delivered</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* One shared background (templatesBg) for every section below the hero */}
                <div
                    className="relative overflow-hidden bg-cover bg-top bg-no-repeat lg:bg-fixed"
                // style={{ backgroundImage: `url(${templatesBg})` }}
                >
                    {/* <Sparkles /> */}

                    {/* Features */}
                    <section className="relative px-5 pb-10 pt-12">
                        <div className="mx-auto grid max-w-225 grid-cols-2 gap-4 lg:grid-cols-4">
                            {features.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.title}
                                        className={`group flex cursor-pointer flex-col items-center rounded-2xl border px-4 py-6 text-center shadow-[0_2px_12px_rgba(120,100,200,0.06)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_30px_rgba(120,100,200,0.18)] ${item.card}`}
                                    >
                                        <div className={`flex h-15 w-15 items-center justify-center rounded-full transition duration-300 group-hover:rotate-6 group-hover:scale-110 ${item.bg}`}>
                                            <Icon className={`h-6 w-6 ${item.color}`} strokeWidth={2} />
                                        </div>
                                        <h3 className="mt-4 text-[14px] font-extrabold leading-tight text-[#1a1560]">
                                            {item.title}
                                        </h3>
                                        <p className="mx-auto mt-1.5 max-w-40 text-[12px] leading-4.5 text-[#6b6796]">
                                            {item.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>


                    <section id="templates" className="relative px-5 pb-16 pt-10">
                        <div className="relative z-10 mx-auto max-w-275">
                            <SectionHeading eyebrow="Explore Endless Possibilities" sub="Choose from a wide range of magical themes or create your own unique story.">
                                Story Templates for Every Imagination
                            </SectionHeading>

                            <div className="relative mt-8">

                                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                                    {templates.map((book) => {
                                        const Icon = book.icon;
                                        return (
                                            <article key={book.category} className={`group ${book.card} flex cursor-pointer flex-col items-center rounded-2xl px-4 pb-4 pt-3 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
                                            >
                                                <img
                                                    src={book.image}
                                                    alt={book.lines.join(" ")}
                                                    className="h-47.5 w-auto max-w-full object-contain mix-blend-multiply drop-shadow-[0_14px_14px_rgba(54,25,105,0.25)] transition duration-500 group-hover:-translate-y-1 group-hover:scale-[1.03]"
                                                />
                                                <h3 className={`mt-4 text-[12px] font-bold leading-4 ${book.text}`}>
                                                    {book.lines[0]}
                                                    <br />
                                                    {book.lines[1]}
                                                </h3>
                                                <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-bold transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md ${book.pill}`}>
                                                    <Icon className="h-3 w-3" />
                                                    {book.category}
                                                </span>
                                            </article>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-8 text-center">
                                <a
                                    href="#contact"
                                    className="group inline-flex items-center gap-2 rounded-full bg-[#5b2df0] px-7 py-2.5 text-xs font-bold text-white shadow-[0_10px_26px_rgba(91,45,240,0.35)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#4a1fe0] hover:shadow-[0_14px_32px_rgba(91,45,240,0.5)] active:translate-y-0 active:scale-95"
                                >
                                    Browse All Templates <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                                </a>
                            </div>
                        </div>
                    </section>

                    {/* How it works */}
                    <section id="how-it-works" className="relative px-5 pb-16 pt-6">
                        <div className="relative z-10 mx-auto max-w-250">
                            <SectionHeading eyebrow="How It Works" sub="From idea to a beautifully printed book, it's quick and easy.">
                                Create a Personalized Book in 3 Simple Steps
                            </SectionHeading>

                            <div className="mt-8 flex flex-col items-stretch gap-4 lg:flex-row lg:items-center lg:gap-3">
                                {steps.map((step, i) => (
                                    <React.Fragment key={step.number}>
                                        <article className="group relative flex-1 rounded-xl border border-[#eee8fb] bg-white p-4 shadow-[0_8px_26px_rgba(72,39,138,.08)] transition duration-300 hover:-translate-y-1.5 hover:border-[#d9c9fb] hover:shadow-[0_16px_34px_rgba(72,39,138,.16)]">
                                            <span className="absolute -left-2 -top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#6335d8] text-xs font-black text-white shadow-md transition duration-300 group-hover:rotate-12 group-hover:scale-110">
                                                {step.number}
                                            </span>
                                            <div className="flex h-44 items-center justify-center">
                                                <img src={step.image} alt={step.title} className="h-full w-auto max-w-full object-contain transition duration-500 group-hover:scale-105" />
                                            </div>
                                            <div className="pt-3 text-center">
                                                <h3 className="text-[14px] bg-violet-50 rounded-2xl p-2 font-extrabold text-[#1a1560]">{step.title}</h3>
                                                <p className="mx-auto mt-1 max-w-55 text-[13px] leading-4 text-[#6b6796]">{step.description}</p>
                                            </div>
                                        </article>
                                        {i < steps.length - 1 && <ArrowRight className="mx-auto hidden h-3.5 w-3.5 shrink-0 text-[#8552e8] lg:block" />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Story value */}
                    {/* <section id="our-story" className="relative">
                        <div className="relative z-10 mx-auto grid max-w-250 items-center lg:min-h-75 lg:grid-cols-2">
                            <div className="relative flex h-80 items-end justify-center overflow-hidden lg:h-75">
                                <img
                                    src={girlBook}
                                    alt="Happy child holding a personalized WonderBooks story"
                                    className="relative z-10 h-full w-full max-w-105 object-contain object-bottom mix-blend-multiply"
                                />
                            </div>

                            <div className="px-6 py-12 lg:px-8">
                                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6335d8]">More Than Just a Story</p>
                                <h2 className="mt-2 text-2xl font-extrabold text-[#1a1560] sm:text-3xl">A Book That&rsquo;s Truly Theirs</h2>
                                <p className="mt-3 max-w-md text-xs leading-5 text-[#4d4a80]">
                                    WonderBooks creates personalized storybooks that celebrate every child's unique world &mdash; their name, interests, family, values and dreams. It's more than a story; it's a memory they'll cherish forever.
                                </p>
                                <div className="mt-6 grid max-w-105 grid-cols-2 gap-x-6 gap-y-4">
                                    {values.map(([label, Icon, cls]) => (
                                        <div key={label} className="group flex cursor-default items-center gap-3 text-xs font-bold text-[#403b72] transition-colors hover:text-[#6335d8]">
                                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:shadow-md ${cls}`}>
                                                <Icon className="h-4 w-4" />
                                            </span>
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section> */}

                    {/* Testimonials */}
                    <section
                        className="relative px-5 py-12"
                        onMouseEnter={() => setIsReviewPaused(true)}
                        onMouseLeave={() => setIsReviewPaused(false)}
                    >
                        <div className="relative z-10 mx-auto max-w-250">
                            <SectionHeading eyebrow="Loved By Families" sub="See what parents and kids are saying about WonderBooks.">
                                Stories That Create Smiles
                            </SectionHeading>

                            <div className="relative mt-8 overflow-hidden px-1 pb-3">
                                <div
                                    className={`flex gap-4 [--review-card-width:100%] md:[--review-card-width:calc((100%-2rem)/3)] ${reviewTransition ? "transition-transform duration-700 ease-in-out" : ""}`}
                                    style={{
                                        transform: "translateX(calc(-1 * var(--review-index) * (var(--review-card-width) + 1rem)))",
                                        "--review-index": reviewIndex,
                                    }}
                                >
                                    {reviewSlides.map((review, index) => (
                                        <article
                                            key={`${review.name}-${index}`}
                                            className="flex w-full shrink-0 gap-3 rounded-xl border border-[#eee8fb] bg-white p-4 shadow-[0_6px_22px_rgba(120,80,220,0.08)] transition-shadow duration-300 hover:shadow-[0_12px_28px_rgba(120,80,220,0.18)] md:w-[calc((100%-2rem)/3)]"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#e8dcff] to-[#f8eaff] text-[#6335d8]">
                                                <Users className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="min-h-16 text-[11px] leading-4 text-[#5d5a8c]">&ldquo;{review.text}&rdquo;</p>
                                                <p className="mt-2 text-xs font-extrabold text-[#292468]">{review.name}</p>
                                                <div className="mt-1 flex gap-0.5 text-[#ffbd25]">
                                                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3 w-3" />)}
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>

                                <button
                                    onClick={previousReview}
                                    aria-label="Previous reviews"
                                    className="absolute left-0 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#6335d8] shadow-[0_4px_14px_rgba(99,53,216,0.2)] transition duration-300 hover:scale-110 hover:bg-[#6335d8] hover:text-white active:scale-95"
                                >
                                    <ChevronLeft className="h-3 w-3" />
                                </button>
                                <button
                                    onClick={nextReview}
                                    aria-label="Next reviews"
                                    className="absolute right-0 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#6335d8] shadow-[0_4px_14px_rgba(99,53,216,0.2)] transition duration-300 hover:scale-110 hover:bg-[#6335d8] hover:text-white active:scale-95"
                                >
                                    <ChevronRight className="h-3 w-3" />
                                </button>
                            </div>

                            <div className="mt-4 flex justify-center gap-1.5">
                                {testimonials.slice(0, 3).map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => { setReviewTransition(true); setReviewIndex(index); }}
                                        aria-label={`Go to review ${index + 1}`}
                                        className={`h-1.5 w-1.5 rounded-full transition-all hover:scale-150 hover:bg-[#8552e8] ${visibleReviewIndex === index ? "bg-[#6335d8]" : "bg-[#d8d1ed]"}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </section>

                    <PricingSection onSelectPlan={handleSelectPlan} />
                    <ContactForm />

                    {/* CTA */}
                    {/* <section className="relative overflow-hidden">
                        <div className="relative mx-auto min-h-[280px] max-w-[1000px] overflow-hidden">
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between">
                                <div className="w-[30%] max-w-[260px] overflow-hidden">
                                    <img src={ctaLeft} alt="" className="w-[120%] max-w-none object-contain object-left-bottom" />
                                </div>
                                <div className="w-[38%] max-w-[330px] overflow-hidden">
                                    <img src={ctaRight} alt="" className="ml-auto w-[120%] max-w-none object-contain object-right-bottom" />
                                </div>
                            </div>
                            <div className="relative z-10 flex min-h-[280px] items-start justify-center px-5 pt-10 text-center">
                                <div className="max-w-[460px]">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6335d8]">Ready To Create Magic?</p>
                                    <h2 className="mt-2 text-2xl font-extrabold leading-tight text-[#1a1560] sm:text-3xl">
                                        Start Your Personalized
                                        <br />
                                        <span className="text-[#6335d8]">Storybook Today</span>
                                    </h2>
                                    <p className="mx-auto mt-2 max-w-[360px] text-xs leading-5 text-[#4d4a80]">
                                        Turn their imagination into a beautifully printed book that will be treasured forever.
                                    </p>
                                    <button className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#ffd451] px-6 py-2.5 text-xs font-extrabold text-[#33216c] shadow-[0_10px_22px_rgba(255,193,57,.3)] transition hover:-translate-y-0.5">
                                        Create Your Storybook <ArrowRight className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section> */}
                </div>
            </main>

            {/* Footer */}
            <footer
                className="relative bg-[#211457] px-5 pb-6 pt-10 text-white sm:px-8 lg:px-10"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(135deg, rgba(255,255,255,0.09) 0 1px, transparent 1px 90px)",
                }}
            >
                <div className="mx-auto grid max-w-350 grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-8">
                    {/* Brand */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <Logo light />
                        <p className="mt-5 max-w-sm text-[15px] leading-7 text-[#e4defa] sm:max-w-lg lg:max-w-sm">
                            WonderBooks turns your child's imagination into personalized, beautifully
                            illustrated storybooks that families treasure forever.
                        </p>
                        <div className="mt-6 flex gap-3">
                            {[
                                [Instagram, "Instagram", "https://www.instagram.com/_nowitservices_/"],
                                [LinkedIn, "LinkedIn", "https://www.linkedin.com/company/nowitservices/posts/?feedView=all"],
                                [Youtube, "YouTube", "https://www.youtube.com/@nowitservicesltd"],
                                [Facebook, "Facebook", "https://www.facebook.com/p/NOWIT-Services-61559601166623/"],
                            ].map(([Icon, label, url]) => (
                                <a
                                    key={label}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-white transition duration-300 hover:-translate-y-1 hover:border-[#ffd447] hover:bg-[#ffd447] hover:text-[#2b1a6b]"
                                >
                                    <Icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Site Map + Resources (side by side on every breakpoint) */}
                    <div className="grid grid-cols-2 gap-6 sm:col-span-2 sm:gap-10 lg:col-span-2 lg:gap-8">
                        {/* Site Map */}
                        <div>
                            <h3 className="text-lg font-extrabold">Site Map</h3>
                            <span className="mt-2 block h-0.75 w-10 rounded-full bg-[#ffd447]" />
                            <div className="mt-6 space-y-3.5 text-[15px] text-[#d6cff1]">
                                <a href="#home" onClick={(e) => goToSection(e, "home")} className={footerLink}>Homepage</a>
                                <a href="#templates" onClick={(e) => goToSection(e, "templates")} className={footerLink}>Templates</a>
                                <a href="#how-it-works" onClick={(e) => goToSection(e, "how-it-works")} className={footerLink}>How It Works</a>
                                <a href="#pricing" onClick={(e) => goToSection(e, "pricing")} className={footerLink}>Pricing</a>
                                <a href="#contact" onClick={(e) => goToSection(e, "contact")} className={footerLink}>Contact Us</a>
                            </div>
                        </div>

                        {/* Resources */}
                        <div>
                            <h3 className="text-lg font-extrabold">Resources</h3>
                            <span className="mt-2 block h-0.75 w-10 rounded-full bg-[#ffd447]" />
                            <div className="mt-6 space-y-3.5 text-[15px] text-[#d6cff1]">
                                <a href="https://nowitservices.com/" target="_blank" rel="noopener noreferrer" className={footerLink}>About Us</a>
                                <Link to="/terms" className={footerLink}>Terms &amp; Conditions</Link>
                                <Link to="/privacy" className={footerLink}>Privacy Policy</Link>
                            </div>
                        </div>
                    </div>

                    {/* Badge / certification slot (optional, desktop only while empty) */}
                    <div className="hidden items-start justify-start lg:flex lg:justify-center">
                        {/* <img src={certBadge} alt="Certified" className="h-36 w-36 object-contain" /> */}
                    </div>
                </div>

                {/* Divider + copyright */}
                <div className="mx-auto mt-10 max-w-350 border-t border-white/10 pt-6 text-center text-[14px] text-[#aaa2cb]">
                    &copy; 2026 <span className="font-bold text-white">NOWIT SERVICES Pvt Ltd</span> . All rights reserved.
                </div>
            </footer>
        </div>
    );
}