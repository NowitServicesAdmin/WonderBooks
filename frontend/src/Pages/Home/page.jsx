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
    FaPinterestP as Pinterest,
    FaYoutube as Youtube,
} from "react-icons/fa";
import heroImage from "../../assets/wonder-books/hero.png";
import templatesBg from "../../assets/wonder-books/templates-bg.png";
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
import girlBook from "../../assets/wonder-books/girl-book-clean.png";
import ctaLeft from "../../assets/wonder-books/cta-left-clean.png";
import ctaRight from "../../assets/wonder-books/cta-right-clean.png";

const templates = [
    { image: braveExplorer, lines: ["The Brave", "Little Explorer"], category: "Adventure", icon: Tent, text: "text-[#2d3a8c]", pill: "bg-[#e8ebff] text-[#3a3fb5]" },
    { image: magicForest, lines: ["Mia and the", "Magic Forest"], category: "Fantasy", icon: Leaf, text: "text-[#1f7a4d]", pill: "bg-[#dff6ea] text-[#1f7a4d]" },
    { image: specialFamily, lines: ["My Special", "Family"], category: "Family", icon: Home, text: "text-[#d9532b]", pill: "bg-[#ffeadb] text-[#d9532b]" },
    { image: superhero, lines: ["The Kindness", "Superhero"], category: "Education", icon: Cap, text: "text-[#2d3a8c]", pill: "bg-[#e0ecff] text-[#2d4fa8]" },
    { image: dino, lines: ["Dino", "Adventures"], category: "Animals", icon: Paw, text: "text-[#2d3a8c]", pill: "bg-[#fff0d6] text-[#b8741a]" },
];

const steps = [
    { number: "1", image: shareIdeas, title: "Share Your Ideas", description: "Tell us the age, theme, characters and special details." },
    { number: "2", image: aiCreates, title: "AI Creates the Story", description: "Our AI writes a unique story with beautiful illustrations." },
    { number: "3", image: getBook, title: "Get Your Book", description: "Order a high-quality printed book and treasure it forever." },
];

const features = [
    { title: "Personalized Stories", description: "Your child's name, interests and values", icon: BookOpen, bg: "bg-[#e8e0ff]", color: "text-[#6335d8]" },
    { title: "Beautiful Illustrations", description: "Multiple art styles to choose from", icon: ImageIcon, bg: "bg-[#d9f4ea]", color: "text-[#1f9a72]" },
    { title: "Printed & Delivered", description: "High-quality book, shipped to your doorstep", icon: Gift, bg: "bg-[#ffe0f0]", color: "text-[#e0449a]" },
    { title: "Create Lasting Memories", description: "Stories they'll treasure forever", icon: Heart, bg: "bg-[#ffe0f0]", color: "text-[#e0449a]" },
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
            <img src={templatesStarLeft} alt="" className={`pointer-events-none absolute hidden w-[110px] select-none lg:block xl:w-[130px] ${leftClass}`} />
            <img src={templatesStarRight} alt="" className={`pointer-events-none absolute hidden w-[90px] select-none lg:block xl:w-[110px] ${rightClass}`} />
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
        <a href="#home" className={`flex items-center gap-2 ${stacked ? "flex-col" : ""}`}>
            <div className="relative flex h-9 w-9 items-center justify-center">
                <BookOpen className={`h-6 w-6 ${light ? "text-[#f6bd3d]" : "text-[#6335d8]"}`} />
                <Magic className="absolute -right-0.5 -top-0.5 h-3 w-3 text-[#f6bd3d]" />
            </div>
            <span className={`text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-[#3a1fb5]"}`}>WonderBooks</span>
        </a>
    );
}

export default function HomePage() {
    const [reviewIndex, setReviewIndex] = useState(0);
    const [isReviewPaused, setIsReviewPaused] = useState(false);
    const [reviewTransition, setReviewTransition] = useState(true);

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

    const navLink = "transition hover:text-[#4a1fe0]";

    return (
        <div className="min-h-screen overflow-x-hidden bg-white text-[#171653]">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-[#ece6fb] bg-white/95 backdrop-blur">
                <div className="mx-auto flex h-[52px] w-full max-w-[1200px] items-center justify-between px-4 sm:px-6">
                    <Logo />
                    <nav className="hidden items-center gap-8 text-[11px] font-semibold text-[#2f2a6b] lg:flex">
                        <a href="#home" className="relative py-1 text-[#4a1fe0] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-[#4a1fe0]">Home</a>
                        <a href="#how-it-works" className={navLink}>How It Works</a>
                        <a href="#templates" className={navLink}>Book Templates</a>
                        <a href="#our-story" className={navLink}>Our Story</a>
                        <a href="#pricing" className={navLink}>Pricing</a>
                        <a href="#faqs" className={navLink}>FAQs</a>
                    </nav>
                    <div className="flex items-center gap-2">
                        <button className="hidden rounded-full border border-[#cdbff5] px-5 py-1.5 text-[11px] font-bold text-[#4a1fe0] transition hover:bg-[#f3ecff] sm:block">Login</button>
                        <button className="rounded-full bg-[#5b2df0] px-5 py-1.5 text-[11px] font-bold text-white shadow-[0_6px_16px_rgba(74,31,224,.3)] transition hover:-translate-y-0.5">Get Started</button>
                    </div>
                </div>
            </header>

            <main id="home">
                {/* Hero */}
                <section
                    className="relative isolate overflow-hidden bg-[#2a1270] bg-cover bg-[70%_center] bg-no-repeat sm:bg-center"
                    style={{ backgroundImage: `url(${heroImage})` }}
                >
                    <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#24105f]/70 via-[#24105f]/30 to-transparent lg:hidden" />
                    <div className="mx-auto flex min-h-[620px] w-full max-w-[1200px] items-center px-5 pb-16 pt-12 sm:px-8 lg:min-h-0 lg:aspect-[2/1] lg:px-6 lg:pb-12 lg:pt-8">
                        <div className="max-w-[460px]">
                            <p className="mb-4 text-[9px] font-bold uppercase tracking-[0.25em] text-[#cbb8ff]">Personalized Storybooks with AI</p>
                            <h1 className="text-[44px] font-black leading-[1.05] tracking-[-0.02em] text-white sm:text-[52px] lg:text-[clamp(40px,3.6vw,56px)]">
                                Turn Their
                                <br />
                                Imagination
                                <br />
                                into a <span className="text-[#ffd447]">Real Book</span>
                            </h1>
                            <p className="mt-5 max-w-[360px] text-sm leading-6 text-[#efe8ff]">
                                Create personalised stories with AI, beautiful illustrations, and lasting memories for the little ones you love.
                            </p>
                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                <button type="button" className="group flex items-center gap-2 rounded-full bg-[#ffd447] px-6 py-2.5 text-xs font-extrabold text-[#2b1a6b] shadow-[0_10px_28px_rgba(255,212,71,0.3)] transition hover:-translate-y-0.5 hover:bg-[#ffdc62]">
                                    Create Your Storybook
                                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                                </button>
                                <button type="button" className="flex items-center gap-2 rounded-full border border-white/60 bg-white/5 px-6 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/15">
                                    <Play className="h-3 w-3" />
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
                        <div className="mx-auto grid max-w-[900px] grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
                            {features.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.title} className="text-center">
                                        <div className={`mx-auto flex h-[50px] w-[50px] items-center justify-center rounded-full ${item.bg}`}>
                                            <Icon className={`h-5 w-5 ${item.color}`} />
                                        </div>
                                        <h3 className="mt-3 text-[12px] font-extrabold text-[#1a1560]">{item.title}</h3>
                                        <p className="mx-auto mt-1 max-w-[150px] text-[11px] leading-4 text-[#6b6796]">{item.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    Templates
                    <section id="templates" className="relative px-5 pb-16 pt-10">
                        <div className="relative z-10 mx-auto max-w-[1100px]">
                            <SectionHeading eyebrow="Explore Endless Possibilities" sub="Choose from a wide range of magical themes or create your own unique story.">
                                Story Templates for Every Imagination
                            </SectionHeading>

                            <div className="relative mt-8">
                                <button aria-label="Previous templates" className="absolute -left-4 top-[38%] z-20 hidden h-9 w-9 items-center justify-center rounded-full bg-white text-[#5b2df0] shadow-[0_6px_20px_rgba(99,53,216,0.18)] transition hover:scale-105 lg:flex">
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </button>

                                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                                    {templates.map((book) => {
                                        const Icon = book.icon;
                                        return (
                                            <article key={book.category} className="group flex flex-col items-center text-center">
                                                <img
                                                    src={book.image}
                                                    alt={book.lines.join(" ")}
                                                    className="h-[190px] w-auto max-w-full object-contain mix-blend-multiply drop-shadow-[0_14px_14px_rgba(54,25,105,0.25)] transition duration-500 group-hover:-translate-y-1 group-hover:scale-[1.03]"
                                                />
                                                <h3 className={`mt-4 text-[12px] font-bold leading-4 ${book.text}`}>
                                                    {book.lines[0]}
                                                    <br />
                                                    {book.lines[1]}
                                                </h3>
                                                <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-bold ${book.pill}`}>
                                                    <Icon className="h-3 w-3" />
                                                    {book.category}
                                                </span>
                                            </article>
                                        );
                                    })}
                                </div>

                                <button aria-label="Next templates" className="absolute -right-4 top-[38%] z-20 hidden h-9 w-9 items-center justify-center rounded-full bg-white text-[#5b2df0] shadow-[0_6px_20px_rgba(99,53,216,0.18)] transition hover:scale-105 lg:flex">
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className="mt-8 text-center">
                                <button className="inline-flex items-center gap-2 rounded-full bg-[#5b2df0] px-7 py-2.5 text-xs font-bold text-white shadow-[0_10px_26px_rgba(91,45,240,0.35)] transition hover:-translate-y-0.5">
                                    Browse All Templates <ArrowRight className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* How it works */}
                    <section id="how-it-works" className="relative px-5 pb-16 pt-6">
                        <div className="relative z-10 mx-auto max-w-[1000px]">
                            <SectionHeading eyebrow="How It Works" sub="From idea to a beautifully printed book, it's quick and easy.">
                                Create a Personalized Book in 3 Simple Steps
                            </SectionHeading>

                            <div className="mt-8 flex flex-col items-stretch gap-4 lg:flex-row lg:items-center lg:gap-3">
                                {steps.map((step, i) => (
                                    <React.Fragment key={step.number}>
                                        <article className="relative flex-1 rounded-xl border border-[#eee8fb] bg-white p-4 shadow-[0_8px_26px_rgba(72,39,138,.08)]">
                                            <span className="absolute -left-2 -top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#6335d8] text-xs font-black text-white shadow-md">
                                                {step.number}
                                            </span>
                                            <div className="flex h-[130px] items-center justify-center">
                                                <img src={step.image} alt={step.title} className="h-full w-auto max-w-full object-contain" />
                                            </div>
                                            <div className="pt-3 text-center">
                                                <h3 className="text-[13px] font-extrabold text-[#1a1560]">{step.title}</h3>
                                                <p className="mx-auto mt-1 max-w-[220px] text-[11px] leading-4 text-[#6b6796]">{step.description}</p>
                                            </div>
                                        </article>
                                        {i < steps.length - 1 && <ArrowRight className="mx-auto hidden h-3.5 w-3.5 shrink-0 text-[#8552e8] lg:block" />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Story value */}
                    <section id="our-story" className="relative">
                        <div className="relative z-10 mx-auto grid max-w-[1000px] items-center lg:min-h-[300px] lg:grid-cols-2">
                            <div className="relative flex h-[320px] items-end justify-center overflow-hidden lg:h-[300px]">
                                <img
                                    src={girlBook}
                                    alt="Happy child holding a personalized WonderBooks story"
                                    className="relative z-10 h-full w-full max-w-[420px] object-contain object-bottom mix-blend-multiply"
                                />
                            </div>

                            <div className="px-6 py-12 lg:px-8">
                                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6335d8]">More Than Just a Story</p>
                                <h2 className="mt-2 text-2xl font-extrabold text-[#1a1560] sm:text-3xl">A Book That&rsquo;s Truly Theirs</h2>
                                <p className="mt-3 max-w-md text-xs leading-5 text-[#4d4a80]">
                                    WonderBooks creates personalized storybooks that celebrate every child's unique world &mdash; their name, interests, family, values and dreams. It's more than a story; it's a memory they'll cherish forever.
                                </p>
                                <div className="mt-6 grid max-w-[420px] grid-cols-2 gap-x-6 gap-y-4">
                                    {values.map(([label, Icon, cls]) => (
                                        <div key={label} className="flex items-center gap-3 text-xs font-bold text-[#403b72]">
                                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cls}`}>
                                                <Icon className="h-4 w-4" />
                                            </span>
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Testimonials */}
                    <section
                        className="relative px-5 py-12"
                        onMouseEnter={() => setIsReviewPaused(true)}
                        onMouseLeave={() => setIsReviewPaused(false)}
                    >
                        <div className="relative z-10 mx-auto max-w-[1000px]">
                            <SectionHeading eyebrow="Loved By Families" sub="See what parents and kids are saying about WonderBooks.">
                                Stories That Create Smiles
                            </SectionHeading>

                            <div className="relative mt-8 overflow-hidden px-1 pb-3">
                                <div
                                    className={`flex gap-4 [--review-card-width:100%] md:[--review-card-width:calc((100%_-_2rem)_/_3)] ${reviewTransition ? "transition-transform duration-700 ease-in-out" : ""}`}
                                    style={{
                                        transform: "translateX(calc(-1 * var(--review-index) * (var(--review-card-width) + 1rem)))",
                                        "--review-index": reviewIndex,
                                    }}
                                >
                                    {reviewSlides.map((review, index) => (
                                        <article
                                            key={`${review.name}-${index}`}
                                            className="flex w-full shrink-0 gap-3 rounded-xl border border-[#eee8fb] bg-white p-4 shadow-[0_6px_22px_rgba(120,80,220,0.08)] md:w-[calc((100%_-_2rem)_/_3)]"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e8dcff] to-[#f8eaff] text-[#6335d8]">
                                                <Users className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="min-h-[64px] text-[11px] leading-4 text-[#5d5a8c]">&ldquo;{review.text}&rdquo;</p>
                                                <p className="mt-2 text-xs font-extrabold text-[#292468]">{review.name}</p>
                                                <div className="mt-1 flex gap-0.5 text-[#ffbd25]">
                                                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3 w-3" />)}
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>

                                <button onClick={previousReview} aria-label="Previous reviews" className="absolute left-0 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#6335d8] shadow-[0_4px_14px_rgba(99,53,216,0.2)] transition hover:scale-105">
                                    <ChevronLeft className="h-3 w-3" />
                                </button>
                                <button onClick={nextReview} aria-label="Next reviews" className="absolute right-0 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#6335d8] shadow-[0_4px_14px_rgba(99,53,216,0.2)] transition hover:scale-105">
                                    <ChevronRight className="h-3 w-3" />
                                </button>
                            </div>

                            <div className="mt-4 flex justify-center gap-1.5">
                                {testimonials.slice(0, 3).map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => { setReviewTransition(true); setReviewIndex(index); }}
                                        aria-label={`Go to review ${index + 1}`}
                                        className={`h-1.5 w-1.5 rounded-full transition-all ${visibleReviewIndex === index ? "bg-[#6335d8]" : "bg-[#d8d1ed]"}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </section>

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
            <footer className="bg-[#211457] px-5 pb-6 pt-10 text-white">
                <div className="mx-auto grid max-w-[1000px] gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
                    <div className="flex flex-col items-center md:items-start md:pl-4">
                        <Logo stacked light />
                        <p className="mt-2 text-[10px] text-[#bdb5dd]">Stories for a brighter tomorrow.</p>
                    </div>
                    <div>
                        <h3 className="text-[11px] font-extrabold">Quick Links</h3>
                        <div className="mt-3 space-y-1.5 text-[10px] text-[#bdb5dd]">
                            <a href="#home" className="block hover:text-white">Home</a>
                            <a href="#templates" className="block hover:text-white">Templates</a>
                            <a href="#pricing" className="block hover:text-white">Pricing</a>
                            <a href="#faqs" className="block hover:text-white">FAQs</a>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-[11px] font-extrabold">Company</h3>
                        <div className="mt-3 space-y-1.5 text-[10px] text-[#bdb5dd]">
                            <a href="#our-story" className="block hover:text-white">About Us</a>
                            <a href="#contact" className="block hover:text-white">Contact</a>
                            <a href="#privacy" className="block hover:text-white">Privacy Policy</a>
                            <a href="#terms" className="block hover:text-white">Terms of Service</a>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-[11px] font-extrabold">Follow Us</h3>
                        <div className="mt-3 flex gap-2">
                            {[Instagram, Facebook, Youtube, Pinterest].map((Icon, i) => (
                                <a key={i} href="#" className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
                                    <Icon className="h-3 w-3" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mx-auto mt-8 max-w-[1000px] border-t border-white/10 pt-4 text-center text-[9px] text-[#aaa2cb]">
                    &copy; 2026 WonderBooks. All rights reserved.
                </div>
            </footer>
        </div>
    );
}