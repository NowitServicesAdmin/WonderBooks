import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { templates, buildPages } from "../Data/Templatesdata";
import { getSampleById } from "../services/bookService";
import { isDatabaseSampleId, sampleAgeLabel } from "../utils/samples";
import { BookViewer } from "./BookViewer";
import { BookInfoPage } from "./BookInfoPage";
import { BookActions } from "./BookActions";

const Message = ({ title, text, onBack, children }) => (
    <section className="flex min-h-125 w-full items-center justify-center rounded-2xl border border-[#e6e3f2] bg-white p-8 text-center">
        <div>
            {children}
            <p className="text-lg font-bold text-(--text-heading)">{title}</p>
            {text && <p className="mt-2 text-sm text-(--text-muted)">{text}</p>}
            {onBack && (
                <button
                    type="button"
                    onClick={onBack}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-(--accent) px-5 py-2.5 text-sm font-bold text-white transition hover:bg-(--accent-hover)"
                >
                    <ArrowLeft size={16} />
                    Back to Templates
                </button>
            )}
        </div>
    </section>
);

const SampleReader = ({ book, pages, badge, font, info, onBack }) => {
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    return (
        <div className="flex h-full w-full flex-col gap-3">
            <div className="flex shrink-0 items-center gap-2">
                <button
                    type="button"
                    onClick={onBack}
                    aria-label="Back to Templates"
                    title="Back to Templates"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--border) bg-(--surface) text-(--accent) outline-none transition hover:bg-(--tint) focus-visible:ring-2 focus-visible:ring-[#a98aff]/50"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="min-w-0 flex-1">
                    <BookActions book={book} pages={pages} currentPageIndex={currentPageIndex} />
                </div>
            </div>
            <div className="min-h-0 flex-1">
                <BookViewer
                    pages={pages}
                    badge={badge}
                    font={font}
                    onExit={onBack}
                    onPageChange={setCurrentPageIndex}
                    renderInfoPage={(page) => (
                        <BookInfoPage
                            title={page.heading}
                            ageLabel={info.ageLabel}
                            description={info.description}
                            readingTime={info.readingTime}
                            theme={info.theme}
                            bestFor={info.bestFor}
                            inputText={info.inputText}
                        />
                    )}
                />
            </div>
        </div>
    );
};

const BuiltInTemplate = ({ id }) => {
    const navigate = useNavigate();

    const selectedTemplate = useMemo(
        () => templates.find((t) => String(t.id) === String(id)),
        [id]
    );

    const pages = useMemo(
        () => (selectedTemplate ? buildPages(selectedTemplate) : []),
        [selectedTemplate]
    );

    const goBackToList = () => navigate("/templates");

    if (!selectedTemplate) {
        return (
            <Message
                title="Template not found"
                text="It may have been removed, or the link is incorrect."
                onBack={goBackToList}
            />
        );
    }

    const bestForAge = selectedTemplate.age.replace(/^Ages\s*/i, "");

    // Templates aren't saved books, so there's no real Mongo _id behind them.
    // A stable synthetic id lets Read Aloud generate/cache audio for template previews too.
    const templateAsBook = {
        _id: `template-${selectedTemplate.id}`,
        title: selectedTemplate.title,
        storyData: { language: "English" },
        status: "completed",
    };

    return (
        <SampleReader
            book={templateAsBook}
            pages={pages}
            badge={selectedTemplate.category}
            onBack={goBackToList}
            info={{
                ageLabel: selectedTemplate.age,
                description: selectedTemplate.description,
                readingTime: "5–10 min",
                theme: selectedTemplate.category,
                bestFor: `Kids ${bestForAge}`,
                inputText: selectedTemplate.description,
            }}
        />
    );
};

const DatabaseSample = ({ id }) => {
    const navigate = useNavigate();
    const [sample, setSample] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await getSampleById(id);
                if (!cancelled) setSample(data);
            } catch (err) {
                if (cancelled) return;
                setError(
                    err?.response?.status === 404
                        ? "It may have been removed, or the link is incorrect."
                        : "We couldn't load this book. Please try again."
                );
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const pages = useMemo(() => {
        if (!sample) return [];
        return [
            { kind: "cover", imageKey: "cover", image: sample.coverImageUrl, heading: sample.title, sub: sample.category },
            ...sample.pages.map((p, i) => ({
                kind: "story",
                imageKey: String(i),
                pageId: p._id,
                image: p.imageUrl,
                text: p.content,
            })),
            { kind: "end", image: sample.coverImageUrl, heading: "The End", sub: "Thanks for reading!" },
        ];
    }, [sample]);

    const goBackToList = () => navigate("/templates");

    if (loading) {
        return (
            <Message title="Loading book...">
                <Loader2 size={28} className="mx-auto mb-3 animate-spin text-[#7f6ad0]" />
            </Message>
        );
    }

    if (error || !sample) {
        return <Message title="Template not found" text={error} onBack={goBackToList} />;
    }

    const sd = sample.storyData || {};
    const ageLabel = sampleAgeLabel(sd.age);
    const ageOnly = ageLabel.replace(/^ages?\s*/i, "");
    const words = sample.pages.reduce(
        (sum, p) => sum + (p.content || "").split(/\s+/).filter(Boolean).length,
        0
    );

    const sampleAsBook = {
        _id: `template-${sample._id}`,
        title: sample.title,
        storyData: { language: sd.language || "English", font: sd.font },
        status: "completed",
    };

    return (
        <SampleReader
            book={sampleAsBook}
            pages={pages}
            badge={sample.category}
            font={sd.font}
            onBack={goBackToList}
            info={{
                ageLabel,
                description: sd.subject || sd.centralMessage || "A story to enjoy together.",
                readingTime: `${Math.max(1, Math.round(words / 120))} min`,
                theme: sample.category,
                bestFor: ageOnly ? `Kids ${ageOnly}` : "All kids",
                // The original story idea was typed by another user; don't show it.
                inputText: "",
            }}
        />
    );
};

export const TemplateDetail = () => {
    const { id } = useParams();

    return isDatabaseSampleId(id) ? (
        <DatabaseSample key={id} id={id} />
    ) : (
        <BuiltInTemplate key={id} id={id} />
    );
};

export default TemplateDetail;
