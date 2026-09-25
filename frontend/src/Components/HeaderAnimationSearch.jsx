// import { Sparkles, Mic, Search } from "lucide-react";

// export const HeaderAnimationSearch = ({
//     story,
//     setStory,
//     userName = "Arav",
// }) => {
//     return (
//         <div
//             className="
//                 mt-2.5 flex h-[46px] w-full
//                 items-center gap-2.5
//                 rounded-full border border-[var(--tint)]
//                 bg-white pl-4 pr-1.5
//                 animate-input-glow
//             "
//         >
//             {/* Sparkles */}
//             <Sparkles
//                 size={18}
//                 className="
//                     shrink-0
//                     text-[var(--accent)]
//                     animate-sparkle
//                 "
//             />

//             {/* Input */}
//             <div className="relative flex h-full min-w-0 flex-1 items-center">
//                 {!story && (
//                     <span
//                         className="
//                             pointer-events-none
//                             absolute left-0
//                             whitespace-nowrap
//                             text-[14px]
//                             text-[#aaa3bb]
//                         "
//                     >
//                         {userName}! Let's create your story
//                     </span>
//                 )}

//                 <input
//                     type="text"
//                     value={story || ""}
//                     onChange={(e) => setStory(e.target.value)}
//                     className="
//                         relative z-10
//                         w-full
//                         bg-transparent
//                         text-[14px]
//                         text-[var(--ink)]
//                         outline-none
//                     "
//                 />
//             </div>

//             {/* Mic */}
//             <button
//                 type="button"
//                 className="
//                     flex h-9 w-9 shrink-0
//                     items-center justify-center
//                     rounded-full
//                     text-[#6b52c8]
//                     transition-all duration-200
//                     hover:bg-[var(--tint)]
//                     hover:scale-105
//                 "
//             >
//                 <Mic size={19} />
//             </button>

//             {/* Search */}
//             <button
//                 type="button"
//                 className="
//                     group
//                     flex h-8 w-8 shrink-0
//                     items-center justify-center
//                     rounded-full
//                     bg-[var(--accent)]
//                     text-white
//                     shadow-md
//                     transition-all duration-300
//                     hover:bg-[var(--accent-hover)]
//                     hover:shadow-[0_8px_25px_rgba(84,38,199,0.35)]
//                 "
//             >
//                 <Search
//                     size={16}
//                     className="
//                         transition-transform
//                         duration-200
//                         group-hover:scale-110
//                     "
//                 />
//             </button>
//         </div>
//     );
// };
import { useEffect, useState } from "react";
import {
    Sparkles,
    Mic,
    ArrowRight,
    RefreshCw,
} from "lucide-react";


const animatedPrompts = (userName) => [
    `${userName}! What story shall we create today?`,
    "Tell me a magical story about a brave little hero...",
    "Create a bedtime adventure with a friendly dragon...",
    "Imagine a journey to a mysterious new world...",
    "What's your next wonderful story idea?",
];


const suggestionIdeas = [
    "A magical adventure with a flying dragon",
    "A bedtime story about a brave friend",
    "A story about a curious little robot",
];


export const HeaderAnimationSearch = ({
    story,
    setStory,
    userName = "Arav",
}) => {

    const [promptIndex, setPromptIndex] = useState(0);

    const [visiblePrompt, setVisiblePrompt] = useState(
        animatedPrompts(userName)[0]
    );

    const [isChanging, setIsChanging] = useState(false);

    const [suggestionIndex, setSuggestionIndex] = useState(0);


    // =========================================================
    // ANIMATED MAIN PROMPT
    // =========================================================

    useEffect(() => {
        const prompts = animatedPrompts(userName);

        const interval = setInterval(() => {

            setIsChanging(true);

            setTimeout(() => {

                setPromptIndex((prev) => {
                    const next =
                        (prev + 1) % prompts.length;

                    setVisiblePrompt(prompts[next]);

                    return next;
                });

                setIsChanging(false);

            }, 250);

        }, 3800);

        return () => clearInterval(interval);

    }, [userName]);


    // =========================================================
    // ANIMATED SUGGESTIONS
    // =========================================================

    useEffect(() => {

        const interval = setInterval(() => {

            setSuggestionIndex((prev) =>
                (prev + 1) % suggestionIdeas.length
            );

        }, 4500);

        return () => clearInterval(interval);

    }, []);


    // =========================================================
    // SUBMIT
    // =========================================================

    const handleCreate = () => {

        if (!story.trim()) {
            return;
        }

        console.log("Create WonderBook story:", story);

        // Put your navigation/API call here.
    };


    // =========================================================
    // SELECT SUGGESTION
    // =========================================================

    const handleSuggestion = (text) => {
        setStory(text);
    };


    return (
        <div className="w-full">


            <div className="group flex h-11 w-full items-center gap-2 rounded-full md:h-[52px] md:gap-2.5 border border-[#ddd1ff] bg-white/95 px-3 pr-1.5 sm:px-4 shadow-[0_5px_24px_rgba(84,38,199,0.10)] backdrop-blur-md transition-all duration-300 hover:border-[#c8b5ff] hover:shadow-[0_8px_30px_rgba(84,38,199,0.16)] focus-within:border-[#a98aff] focus-within:shadow-[0_8px_32px_rgba(84,38,199,0.18)] animate-input-glow">

    

                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center md:h-8 md:w-8">
                    <Sparkles
                        size={20}
                        strokeWidth={1.8}
                        className="text-[var(--accent)] animate-sparkle"
                    />

                    <span className="pointer-events-none absolute right-0 top-0 text-[8px] text-[#b894ff]">
                        ✦
                    </span>
                </div>


    

                <div className="relative flex h-full min-w-0 flex-1 items-center">


                    {!story && (
                        <div className={`pointer-events-none absolute left-0 right-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium text-[#8f86a6] sm:text-[15px] transition-all duration-300 ${isChanging ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"}`}>
                            <span className="font-bold text-[var(--accent)]">
                                {visiblePrompt.split("!")[0]}!
                            </span>

                            {visiblePrompt.includes("!") && (
                                <span>
                                    {visiblePrompt.substring(
                                        visiblePrompt.indexOf("!") + 1
                                    )}
                                </span>
                            )}
                        </div>
                    )}

                    <input
                        type="text"
                        value={story}
                        onChange={(e) => setStory(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleCreate();
                            }
                        }}
                        className="relative z-10 h-full w-full bg-transparent text-[14px] font-medium text-[var(--ink)] sm:text-[15px] outline-none placeholder:text-[#aaa3bb]"
                        aria-label="Create a WonderBook story"
                    />
                </div>


                <button
                    type="button"
                    aria-label="Voice input"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6b52c8] sm:h-9 sm:w-9 transition-all duration-200 hover:bg-[var(--tint)] hover:scale-105 active:scale-95"
                >
                    <Mic
                        size={19}
                        strokeWidth={1.8}
                    />
                </button>


                <button
                    type="button"
                    onClick={handleCreate}
                    aria-label="Create story"
                    className="group/send flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] sm:h-10 sm:w-10 text-white shadow-[0_5px_14px_rgba(84,38,199,0.28)] transition-all duration-300 hover:bg-[var(--accent-hover)] hover:scale-105 hover:shadow-[0_8px_22px_rgba(84,38,199,0.35)] active:scale-95"
                >
                    <ArrowRight
                        size={19}
                        strokeWidth={2.2}
                        className="transition-transform duration-300 group-hover/send:translate-x-0.5"
                    />
                </button>

            </div>


       

            <div className="mt-2 flex min-w-0 items-center gap-2">


                <Sparkles
                    size={14}
                    strokeWidth={1.8}
                    className="shrink-0 text-[#b06cff]"
                />

                <span className="shrink-0 text-[12px] font-semibold text-[#5c4b86]">
                    Try:
                </span>



                <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scrollbar-hide xl:overflow-hidden">

                    {suggestionIdeas.map((idea, index) => (
                        <button
                            key={idea}
                            type="button"
                            onClick={() => handleSuggestion(idea)}
                            className="group/chip shrink-0 max-w-45 truncate sm:max-w-55 rounded-full border border-[#e8defd] bg-white/70 px-3 py-1 text-[11px] font-medium text-[#66568b] transition-all duration-200 hover:border-[#cbb7ff] hover:bg-[#f5f0ff] hover:text-[var(--accent)] hover:-translate-y-px"
                        >
                            {idea}
                        </button>
                    ))}

                </div>


            
                <button
                    type="button"
                    aria-label="Refresh story ideas"
                    onClick={() =>
                        setSuggestionIndex(
                            (prev) =>
                                (prev + 1) %
                                suggestionIdeas.length
                        )
                    }
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#a68ad9] transition-all duration-200 hover:bg-white hover:text-[var(--accent)] hover:rotate-180"
                >
                    <RefreshCw size={14} />
                </button>

            </div>
        </div>
    );
}; 