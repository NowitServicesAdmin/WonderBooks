import {useState} from "react";
import {Sparkles, Mic, Send} from "lucide-react";
export const HeaderAnimationSearch = () => {
    const [story, setStory] = useState("");

    return (
        <div
                        className="
        mt-4 flex h-[62px] w-full max-w-[760px] items-center gap-3
        rounded-full border border-[#ece5ff] bg-white pl-5 pr-2
        animate-input-glow
    "
                    >
                        {/* Sparkles */}
                        <Sparkles
                            size={20}
                            className="
            shrink-0 text-[#5426c7]
            animate-sparkle
        "
                        />

                        {/* Input area */}
                        <div className="relative flex-1 h-full flex items-center">

                            {/* Animated placeholder */}
                            {!story && (
                                <span
                                    className="
                    pointer-events-none absolute left-0
                    text-[15px] text-[#aaa3bb]
                    animate-wipe-text
                "
                                >
                                    Let's narrate your story ideas
                                </span>
                            )}

                            <input
                                type="text"
                                value={story}
                                onChange={(e) => setStory(e.target.value)}
                                className="
                relative z-10
                w-full bg-transparent
                text-[15px] text-[#30215c]
                outline-none
            "
                            />

                        </div>

                        {/* Mic */}
                        <button
                            type="button"
                            className="
            flex h-10 w-10 shrink-0
            items-center justify-center
            rounded-full text-[#6b52c8]
            transition-all duration-200
            hover:bg-[#f2edff]
            hover:scale-105
        "
                        >
                            <Mic size={20} />
                        </button>

                        {/* Send */}
                        <button
                            type="button"
                            className="
        group
        relative
        flex h-11 w-11 shrink-0
        items-center justify-center
        overflow-hidden
        rounded-full
        bg-[#5426c7]
        text-white
        shadow-md
        transition-all duration-300
        hover:bg-[#4520a7]
        hover:shadow-[0_8px_25px_rgba(84,38,199,0.35)]
    "
                        >
                            <Send
                                size={18}
                                className="
            send-rocket
            transition-transform
            duration-200
            group-hover:scale-110
        "
                            />
                        </button>
                    </div>
    );
}