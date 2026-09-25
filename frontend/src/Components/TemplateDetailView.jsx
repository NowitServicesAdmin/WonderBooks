import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { templates, buildPages } from "../Data/Templatesdata";
import { BookViewer } from "./BookViewer";
import { BookInfoPage } from "./BookInfoPage";
import { BookActions } from "./BookActions";

export const TemplateDetail = () => {
    const { id } = useParams();
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

    // not found
    if (!selectedTemplate) {
        return (
            <section className="flex min-h-125 w-full items-center justify-center rounded-2xl border border-[#e6e3f2] bg-white p-8 text-center">
                <div>
                    <p className="text-lg font-bold text-(--text-heading)">
                        Template not found
                    </p>

                    <p className="mt-2 text-sm text-(--text-muted)">
                        It may have been removed, or the link is incorrect.
                    </p>

                    <button
                        type="button"
                        onClick={goBackToList}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-(--accent) px-5 py-2.5 text-sm font-bold text-white transition hover:bg-(--accent-hover)"
                    >
                        <ArrowLeft size={16} />
                        Back to Templates
                    </button>
                </div>
            </section>
        );
    }

    const bestForAge = selectedTemplate.age.replace(/^Ages\s*/i, "");

    // Templates aren't saved books, so there's no _id / imageKey behind them -
    // BookActions and bookExport fall back to the template's own image URLs.
    const templateAsBook = { title: selectedTemplate.title, storyData: { language: "English" } };

    return (
        <div className="flex h-full w-full flex-col gap-3">
            <div className="flex shrink-0 items-center gap-2">
                <button
                    type="button"
                    onClick={goBackToList}
                    aria-label="Back to Templates"
                    title="Back to Templates"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--border) bg-(--surface) text-(--accent) outline-none transition hover:bg-(--tint) focus-visible:ring-2 focus-visible:ring-[#a98aff]/50"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="min-w-0 flex-1">
                    <BookActions book={templateAsBook} pages={pages} />
                </div>
            </div>
            <div className="min-h-0 flex-1">
                <BookViewer
                    pages={pages}
                    badge={selectedTemplate.category}
                    onExit={goBackToList}
                    renderInfoPage={(page) => (
                        <BookInfoPage
                            title={page.heading}
                            ageLabel={selectedTemplate.age}
                            description={selectedTemplate.description}
                            readingTime="5–10 min"
                            theme={selectedTemplate.category}
                            bestFor={`Kids ${bestForAge}`}
                            inputText={selectedTemplate.description}
                        />
                    )}
                />
            </div>
        </div>
    );
};

export default TemplateDetail;