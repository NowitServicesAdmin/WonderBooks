import { useState } from "react";
import { Sparkles, Mic, Send, Lightbulb } from "lucide-react";
import { createBook, TestImage } from "../services/bookService";
const AI_ROBOT_IMAGE =
    "https://res.cloudinary.com/djdct0pxu/image/upload/v1788501579/Screenshot_2026-09-04_112746-removebg-preview_etj2un.png";

const storyIdeas = [
    {
        emoji: "🐘",
        text: "A brave little elephant",
    },
    {
        emoji: "🚀",
        text: "An exciting space adventure",
    },
    // {
    //   emoji: "🐶",
    //   text: "A dog who finds a new friend",
    // },
    {
        emoji: "🏰",
        text: "A magical princess story",
    },
    {
        emoji: "🌲",
        text: "An adventure in the forest",
    },
];

export const AiBookCreation = () => {
    const [storyIdea, setStoryIdea] = useState("");
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState("")

    const handleIdeaClick = (idea) => {
        setStoryIdea(idea);
    };

    const handleSubmit = async () => {
        const message = storyIdea.trim();

        if (!message || isLoading) return;

        setMessages((prev) => [...prev, { role: "user", content: message }]);
        setStoryIdea("");
        setIsLoading(true);

        try {
            // const data = await createBook(message);
            const data = await TestImage()
            console.log(data, "@@")

            // setMessages((prev) => [
            //     ...prev,
            //     {
            //         role: "assistant",
            //         content: data.message,
            //     },
            // ]);
            setImageUrl(data)
        } catch (error) {
            console.error("Create book error:", error);

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Something went wrong. Please try again.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        }
    };


    return (
        <div className="relative w-full overflow-hidden pb-8">
            {/* Background Glow */}
            <div className="pointer-events-none absolute left-1/2 top-25 h-105 w-225 -translate-x-1/2 rounded-full bg-[#eee8ff]/30 blur-[120px]" />

            <div className="relative z-10 mx-auto flex w-full max-w-315 flex-col">
                {/* ================= ROBOT + MESSAGE ================= */}
                <div className="mt-12 flex items-center justify-center gap-8">
                    {/* Robot */}
                    <div className="relative flex h-57.5 w-75 shrink-0 items-center justify-center sm:h-75 sm:w-97.5">
                        {/* Decorative sparkles */}
                        <Sparkles size={22} className="absolute left-1.25 top-15 text-[#c29aff]" fill="currentColor" />

                        <Sparkles size={28} className="absolute right-3.75 top-13.75 text-[#ffc34e]" fill="currentColor" />

                        <Sparkles size={18} className="absolute bottom-13.75 left-6.25 text-[#f3b13b]" fill="currentColor" />

                        {/* Robot Image */}
                        <img src={AI_ROBOT_IMAGE} alt="AI Story Assistant" className="h-full w-full object-contain" />
                    </div>
                </div>

                {/* Story Ideas */}
                <div className="mt-4 flex w-full justify-center">
                    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
                        {storyIdeas.map((idea, index) => {
                            const isSelected = storyIdea === idea.text;

                            const themes = [
                                {
                                    iconBg: "bg-gradient-to-br from-[#eee8ff] to-[#ddd2ff]",
                                    border: "hover:border-[#cbbcf3]",
                                    glow: "hover:shadow-[0_12px_28px_rgba(112,84,214,0.14)]",
                                },
                                {
                                    iconBg: "bg-gradient-to-br from-[#fff0eb] to-[#ffe0d5]",
                                    border: "hover:border-[#f0c4b5]",
                                    glow: "hover:shadow-[0_12px_28px_rgba(230,80,40,0.12)]",
                                },
                                {
                                    iconBg: "bg-gradient-to-br from-[#f5ebff] to-[#ead7ff]",
                                    border: "hover:border-[#d8b9f2]",
                                    glow: "hover:shadow-[0_12px_28px_rgba(142,84,210,0.12)]",
                                },
                                {
                                    iconBg: "bg-gradient-to-br from-[#e8f8ee] to-[#d6f0df]",
                                    border: "hover:border-[#b9dec9]",
                                    glow: "hover:shadow-[0_12px_28px_rgba(62,156,114,0.12)]",
                                },
                            ];

                            const theme = themes[index];

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleIdeaClick(idea.text)}
                                    className={`group relative flex h-24 w-full items-center gap-3 overflow-hidden rounded-[20px] border px-4 text-left transition-all duration-300 ease-out ${isSelected ? "border-[#7654d8] bg-linear-to-br from-[#faf8ff] to-[#f1edff] shadow-[0_10px_28px_rgba(99,66,190,0.16)]" : `border-[#e5e1ed] bg-white/75 ${theme.border} ${theme.glow}`} hover:-translate-y-0.75 active:translate-y-0`}
                                >
                                    {/* Background Glow */}
                                    <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/50 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />

                                    {/* Emoji */}
                                    <div
                                        className={`relative z-10 flex h-13.5 w-13.5 shrink-0 items-center justify-center rounded-[17px] ${theme.iconBg} shadow-[0_6px_14px_rgba(80,60,150,0.08)] transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]`}
                                    >
                                        <span className="text-[32px] leading-none">{idea.emoji}</span>

                                        <Sparkles
                                            size={10}
                                            className="absolute -right-1 -top-1 text-[#f3b126] opacity-0 transition-all duration-300 group-hover:opacity-100"
                                            fill="currentColor"
                                        />
                                    </div>

                                    {/* Text */}
                                    <div className="relative z-10 flex flex-1 flex-col">
                                        <span
                                            className={`text-[15px] font-semibold leading-[1.45] transition-colors duration-300 ${isSelected ? "text-[#4d36a5]" : "text-[#53577d] group-hover:text-[#40328f]"
                                                }`}
                                        >
                                            {idea.text}
                                        </span>
                                    </div>

                                    {/* Selected Dot */}
                                    {isSelected && (
                                        <div className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-[#6845d2] shadow-[0_0_0_4px_rgba(104,69,210,0.12)]" />
                                    )}
                                </button>
                            );
                        })}

                        {/* Surprise Me */}
                        <button
                            onClick={() => {
                                const randomIdea = storyIdeas[Math.floor(Math.random() * storyIdeas.length)];
                                setStoryIdea(randomIdea.text);
                            }}
                            className="group relative flex h-24 w-full items-center gap-3 overflow-hidden rounded-[20px] border border-[#eadfbd] bg-linear-to-br from-[#fffdf7] to-[#fff3cf] px-4 text-left shadow-[0_5px_18px_rgba(180,130,30,0.06)] transition-all duration-300 ease-out hover:-translate-y-0.75 hover:border-[#f0c75f] hover:shadow-[0_12px_28px_rgba(180,130,30,0.14)] active:translate-y-0"
                        >
                            {/* Background Glow */}
                            <div className="absolute -right-5 -top-5 h-21.25 w-21.25 rounded-full bg-[#ffe9a9]/50 blur-xl" />

                            {/* Icon */}
                            <div className="relative z-10 flex h-13.5 w-13.5 shrink-0 items-center justify-center rounded-[17px] bg-linear-to-br from-[#fff0b3] to-[#ffd66f] shadow-[0_6px_16px_rgba(214,160,35,0.15)] transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                                <Lightbulb size={27} className="text-[#d99614]" fill="currentColor" />

                                <Sparkles size={10} className="absolute -right-1 -top-1 text-[#f0a71b]" fill="currentColor" />
                            </div>

                            {/* Text */}
                            <div className="relative z-10">
                                <span className="block text-[15px] font-bold text-[#76602c]">Surprise me!</span>
                            </div>

                            <Sparkles size={13} className="absolute bottom-3 right-4 text-[#e5a91d]/60" fill="currentColor" />
                        </button>
                    </div>
                </div>
                {messages.length > 0 && (
                    <div className="mx-auto mt-8 flex w-full max-w-275 flex-col gap-4">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"
                                    }`}
                            >
                                <div
                                    className={`max-w-[75%] rounded-[20px] px-5 py-3.5 text-[15px] leading-6 ${message.role === "user"
                                        ? "rounded-br-md bg-[#5A39C7] text-white"
                                        : "rounded-bl-md border border-[#E5E1ED] bg-white text-[#53577D]"
                                        }`}
                                >
                                    {message.content}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="rounded-[20px] rounded-bl-md border border-[#E5E1ED] bg-white px-5 py-3.5 text-[14px] text-[#777A9B]">
                                    Creating your story...
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {/* testing ..... */}
                {imageUrl && (
                    <div>
                        <img
                            src={imageUrl}
                            alt="Generated story illustration"
                            style={{
                                width: "500px",
                                height: "500px",
                                objectFit: "cover",
                                borderRadius: "16px"
                            }}
                        />
                    </div>
                )}

                {/* ================= PROMPT INPUT ================= */}
                <div className="mx-auto mt-10 w-full max-w-275">
                    <div className="flex items-center rounded-[22px] border border-[#DED9EE] bg-white px-5 py-2 shadow-[0_12px_35px_rgba(120,100,180,0.08)] transition-all duration-300 focus-within:border-[#B9A7E8] focus-within:shadow-[0_16px_40px_rgba(74,50,145,0.12)]">
                        {/* Left AI Icon */}
                        <div className="mr-4 flex h-11.5 w-11.5 shrink-0 items-center justify-center rounded-[14px] bg-linear-to-br from-[#F0EAFF] to-[#E3D7FF] text-[#5A39C7]">
                            <Sparkles size={23} />
                        </div>

                        {/* Textarea */}
                        <textarea
                            value={storyIdea}
                            onChange={(event) => setStoryIdea(event.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your story idea here..."
                            rows={1}
                            className="min-h-12.5 max-h-30 flex-1 resize-none bg-transparent py-3 text-[17px] text-[#38345F] outline-none placeholder:text-[#9693A8]"
                        />

                        {/* Divider */}
                        <div className="mx-3 h-9 w-px bg-[#E7E3EF]" />

                        {/* Microphone */}
                        <button
                            type="button"
                            className="mr-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#5B3BC4] transition-all duration-200 hover:bg-[#F3EFFF] hover:text-[#4323B2]"
                            aria-label="Voice input"
                        >
                            <Mic size={24} />
                        </button>

                        {/* ================= SEND BUTTON ================= */}
                        <button
                            onClick={handleSubmit}
                            disabled={!storyIdea.trim()}
                            className="flex h-13 w-14.5 shrink-0 items-center justify-center rounded-[10px] bg-linear-to-r from-[#6539D5] to-[#4822B8] text-white shadow-[0_8px_20px_rgba(74,39,180,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(74,39,180,0.32)] active:translate-y-0 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Create book"
                        >
                            <Send size={22} strokeWidth={2.3} />
                        </button>
                    </div>

                    {/* Helper Text */}
                    <p className="mt-4 text-center text-[13px] text-[#777A9B]">
                        You can tell me anything — characters, theme, age group or even a simple idea.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AiBookCreation;