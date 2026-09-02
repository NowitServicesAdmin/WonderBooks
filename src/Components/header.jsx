import { useState } from "react";
import {
    Bell,
    ChevronDown,
    Compass,
    Heart,
    Mic,
    Moon,
    Send,
    Sparkles,
} from "lucide-react";
import {
    HeaderAnimationSearch 
} from "./headerAnimationSearch";

const suggestions = [
    { icon: "https://res.cloudinary.com/djdct0pxu/image/upload/c_crop,g_north_west,h_101,w_94,x_19,y_25/Screenshot_2026-09-02_110349_wi6qma.png", label: "A brave little explorer" },
    { icon: "https://res.cloudinary.com/djdct0pxu/image/upload/c_crop,g_north_west,h_85,w_101,x_158,y_32/Screenshot_2026-09-02_110349_wi6qma.png", label: "A magical animal" },
    { icon: "https://res.cloudinary.com/djdct0pxu/image/upload/c_crop,g_north_west,h_92,w_99,x_293,y_30/Screenshot_2026-09-02_110349_wi6qma.png", label: "A bedtime adventure" },
];
const robotImageUrl = "https://res.cloudinary.com/djdct0pxu/image/upload/c_crop,g_north_west,h_878,w_724,y_49/ChatGPT_Image_Sep_2_2026_10_25_46_AM_qusdfk.png";
const bookImageUrl = "https://res.cloudinary.com/djdct0pxu/image/upload/v1788328940/ChatGPT_Image_Sep_2_2026_11_31_53_AM_po0rgl.png"
export const Header = ({
    userName = "Arav",
    userRole = "Parent",
    avatarUrl,

    notificationCount = 3,
}) => {
    const [story, setStory] = useState("");

    return (

        <header className="relative mb-4 w-full shrink-0 overflow-hidden rounded-[28px] border border-[#ebe5ff] bg-white px-2 py-3 shadow-[0_4px_24px_rgba(84,38,199,0.06)]">

            <div className="absolute right-8 top-7 z-30 flex items-center gap-3 ">

                <button
                    type="button"
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#5426c7] transition hover:bg-[#f5f1ff]"
                >
                    <Bell size={22} strokeWidth={1.8} />

                    {notificationCount > 0 && (
                        <span className="absolute right-0 top-[-2px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#e94b4b] px-1 text-[9px] font-bold text-white">
                            {notificationCount}
                        </span>
                    )}
                </button>

                <div className="mx-1 h-9 w-px bg-[#eee9f7]" />

                <button
                    type="button"
                    className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-[#faf8ff]"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#cfe8c1] shadow-[0_2px_8px_rgba(80,50,30,0.08)]">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={userName}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-[15px] font-bold text-[#33502a]">
                                {userName.charAt(0)}
                            </span>
                        )}
                    </div>

                    <div className="flex min-w-[65px] flex-col text-left">
                        <span className="text-[13px] font-bold leading-tight text-[#30215c]">
                            {userName}
                        </span>
                        <span className="mt-0.5 text-[10px] font-medium text-[#918aa5]">
                            {userRole}
                        </span>
                    </div>

                    <ChevronDown size={16} className="ml-1 text-[#918aa5]" />
                </button>
            </div>


            <div className="flex items-start gap-4">
                {/* Robot mascot */}
                <div className="relative flex  w-[96px] shrink-0 items-center justify-center ">
                    {robotImageUrl ? (
                        <img
                            src={robotImageUrl}
                            alt="AI assistant"
                            className="h-[80%] w-full rounded-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full rounded-full bg-[#f2edff]" />
                    )}

                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-md bg-[#5426c7] text-[9px] font-bold text-white shadow-sm">
                        AI
                    </span>
                </div>

                {/* Greeting + input + suggestions */}
                <div className="flex-1 p-0">

                    <h2 className="text-[26px] font-extrabold leading-tight text-[#241748]">
                        Good morning, {userName}! <span>👋</span>
                    </h2>

                    <p className="mt-1 text-[15px] text-[#8b84a0]">
                        What shall we turn into a{" "}
                        <span className="font-semibold text-[#5426c7]">
                            wonder book
                        </span>{" "}
                        today? <span>✨</span>
                    </p>

                    <HeaderAnimationSearch story={story} setStory={setStory} suggestions={suggestions} bookImageUrl={bookImageUrl} />

                    {/* Quick suggestion pills */}
                    {/* <div className="mt-4 flex flex-wrap items-center gap-3">
                        {suggestions.map(({ icon, label }) => (
                            <button
                                key={label}
                                type="button"
                                className="
                flex items-center gap-2
                rounded-full
                bg-[#f6f3ff]
                px-4 py-2.5
                text-[13px]
                font-semibold
                text-[#30215c]
                transition-all duration-200
                hover:bg-[#efe9ff]
                hover:-translate-y-0.5
            "
                            >
                                <img
                                    src={icon}
                                    alt=""
                                    className="
                    h-6 w-6
                    shrink-0
                    object-contain
                "
                                />

                                <span>{label}</span>
                            </button>
                        ))}
                    </div> */}
                </div>
            </div>

{/* book */}
            <div className="pointer-events-none absolute bottom-4 right-6 z-10 h-[110px] w-[220px] mt-5 ">

                {bookImageUrl && (
                    <img
                        src={bookImageUrl}
                        alt=""
                        className=" w-full"
                    />
                )}

                {/* <span className="absolute bottom-[60px] left-[0px] text-[13px] leading-none text-[#cdb8ff]">
                    ✦
                </span>
                <span className="absolute bottom-[80px] left-[30px] text-[8px] leading-none text-[#ddd1ff]">
                    ✦
                </span> */}
                {/* <span className="absolute bottom-[95px] left-[75px] text-[10px] leading-none text-[#cdb8ff]">
                    ✦
                </span> */}
                {/* <span className="absolute bottom-[100px] right-[10px] text-[16px] leading-none text-[#e4d9ff]">
                    ☁
                </span>
                <span className="absolute bottom-[40px] right-[0px] text-[9px] leading-none text-[#d8c8ff]">
                    ✦
                </span> */}
            </div>
        </header>
    );
};