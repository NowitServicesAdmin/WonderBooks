import { useState } from "react";
import { HeaderAnimationSearch } from "./HeaderAnimationSearch";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./Notificationbell";
import { useNavigate } from "react-router-dom";
import { CartButton } from "./CartButton";



const imageUrls = {
    // Left side
    robot:
        "https://res.cloudinary.com/djdct0pxu/image/upload/v1789624540/Screenshot_2026-09-17_063400-removebg-preview_nsy6e8.png",

    messageBubble:
        "https://res.cloudinary.com/djdct0pxu/image/upload/v1789624539/Screenshot_2026-09-17_063408-removebg-preview_n4gc5b.png",

    // Complete soft background / cloud decoration
    background:
        "https://res.cloudinary.com/djdct0pxu/image/upload/v1789627251/ChatGPT_Image_Sep_17_2026_12_08_42_PM_jjxjjf.png",

    // Right side WonderBook illustration
    rightIllustration:
        "https://res.cloudinary.com/djdct0pxu/image/upload/v1789607514/Screenshot_2026-09-17_063434_diaknd.png",

    // Optional separate WonderBook logo
    wonderBookLogo:
        "https://res.cloudinary.com/djdct0pxu/image/upload/v1788416221/ChatGPT_Image_Sep_3_2026_11_46_34_AM_zjlan2.pngr",
};

export const Header = ({
    userName = "Arav",
    userRole = "Parent",
    avatarUrl,
}) => {
    const [story, setStory] = useState("");
    const navigate = useNavigate();

    return (
        <header className="relative isolate w-full shrink-0 overflow-hidden rounded-b-[20px] border border-[#ebe5ff] bg-[#fbf9ff] shadow-[0_4px_24px_rgba(84,38,199,0.06)] md:h-30 md:rounded-b-none md:rounded-r-3xl">

            {/* =====================================================
                BACKGROUND IMAGE
            ===================================================== */}

            {imageUrls.background && (
                <img
                    src={imageUrls.background}
                    alt=""
                    aria-hidden="true"
                    className="wb-header-art pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
                />
            )}

            {/* Soft overlay to keep UI readable */}
            <div className="pointer-events-none absolute inset-0 z-1 bg-linear-to-r from-white/30 via-white/10 to-white/20" />


            <div className="absolute right-3 top-3 z-30 flex shrink-0 items-center gap-2 md:right-4 md:top-3 md:gap-2 lg:right-5 lg:top-4 lg:gap-3">

                {/* Light / dark theme */}
                <ThemeToggle />

                {/* Notification */}
                {/* <button
                    aria-label="Notifications"
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl md:h-11.5 md:w-11.5 text-[#5426c7] transition-all duration-200 hover:bg-white/70 hover:scale-105"
                >
                    <Bell size={28} strokeWidth={1.8} className="h-6 w-6 md:h-7 md:w-7" />

                    {notificationCount > 0 && (
                        <span className="absolute -right-0.75 -top-1 flex h-4.75 min-w-4.75 items-center justify-center rounded-full bg-[#e94b4b] px-1 text-[10px] font-bold text-white shadow-sm">
                            {notificationCount}
                        </span>
                    )}
                </button> */}
                {/* Cart: regular users only */}
                {userRole === "user" && <CartButton />}

                <NotificationBell />

                {/* Profile */}
                <button
                    type="button"
                    aria-label="Profile"
                    className="flex items-center justify-center rounded-full transition hover:scale-105"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full md:h-12.5 md:w-12.5 border-2 border-white bg-[#cfe8c1] shadow-[0_3px_12px_rgba(80,50,30,0.10)]"
                    onClick={() => {
                        // Handle profile click, e.g., navigate to profile page or open a dropdown
                        // console.log("Profile button clicked");
                        navigate("/settings"); // Example navigation to profile page
                    }}>
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={userName}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-[17px] font-bold text-[#33502a]">
                                {userName.charAt(0)}
                            </span>
                        )}
                    </div>
                </button>
            </div>


            <div className="relative z-10 flex w-full flex-col justify-center gap-2 px-3 py-3 sm:px-5 md:min-h-29.5 md:flex-row md:items-center md:gap-0 md:pr-62.5 lg:pr-65 xl:pr-82.5">


                <div className="flex shrink-0 items-center gap-2 pl-11 md:gap-3 md:pl-0">

                    {/* Robot */}
                    <div className="relative flex h-16 w-14.5 shrink-0 items-center justify-center md:h-23 md:w-20.5">
                        {imageUrls.robot ? (
                            <img
                                src={imageUrls.robot}
                                alt="WonderBook AI assistant"
                                className="h-15.5 w-14 object-contain drop-shadow-[0_7px_12px_rgba(84,38,199,0.14)] animate-header-robot md:h-22 md:w-20"
                            />
                        ) : (
                            <div className="h-18.75 w-18.75 rounded-full bg-[#f2edff]" />
                        )}

                        {/* Tiny sparkle */}
                        <span className="pointer-events-none absolute right-0 top-1 text-[14px] text-[#a879ff] animate-sparkle">
                            ✦
                        </span>
                    </div>

                    {/* Message bubble */}
                    {imageUrls.messageBubble && (
                        <img
                            src={imageUrls.messageBubble}
                            alt="Let's create something amazing"
                            className="h-14 w-19 shrink-0 object-contain drop-shadow-[0_5px_12px_rgba(84,38,199,0.08)] transition-transform duration-300 hover:scale-[1.03] md:hidden lg:block lg:h-19.5 lg:w-26.25"
                        />
                    )}
                </div>

                {/* =================================================
                    CENTER AI CREATION AREA
                ================================================= */}

                <div className="w-full min-w-0 md:ml-4 md:w-0 md:flex-1 lg:ml-6">
                    <HeaderAnimationSearch
                        story={story}
                        setStory={setStory}
                        userName={userName}
                    />
                </div>

                {/* =================================================
                    OPTIONAL WONDERBOOK BRAND
                ================================================= */}

                {/* {imageUrls.wonderBookLogo && (
                    <img
                        src={imageUrls.wonderBookLogo}
                        alt="WonderBook"
                        className="absolute right-[100px] top-[15px] z-10 h-[42px] w-[115px] object-contain"
                    />
                )} */}
            </div>
        </header>
    );
};