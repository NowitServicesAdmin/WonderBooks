import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { templates, buildPages } from "../Data/Templatesdata";
import { BookViewer } from "./BookViewer";
import { BookInfoPage } from "./BookInfoPage";

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
                    <p className="text-lg font-bold text-[#332f54]">
                        Template not found
                    </p>

                    <p className="mt-2 text-sm text-[#9995aa]">
                        It may have been removed, or the link is incorrect.
                    </p>

                    <button
                        type="button"
                        onClick={goBackToList}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#5d2bc5] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#5122b4]"
                    >
                        <ArrowLeft size={16} />
                        Back to Templates
                    </button>
                </div>
            </section>
        );
    }

    const bestForAge = selectedTemplate.age.replace(/^Ages\s*/i, "");

    return (
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
    );
};

export default TemplateDetail;
