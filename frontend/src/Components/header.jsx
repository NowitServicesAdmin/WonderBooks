// import { useState } from "react";
// import {
//     Bell,
//     ChevronDown,
// } from "lucide-react";
// import { HeaderAnimationSearch } from "./HeaderAnimationSearch";



// const robotImageUrl =
//     "https://res.cloudinary.com/djdct0pxu/image/upload/c_crop,g_north_west,h_878,w_724,y_49/ChatGPT_Image_Sep_2_2026_10_25_46_AM_qusdfk.png";



// export const Header = ({
//     userName = "Arav",
//     userRole = "Parent",
//     avatarUrl,
//     notificationCount = 3,
// }) => {
//     const [story, setStory] = useState("");

//     return (
//         <header
//             className="
//                 relative w-full shrink-0 overflow-hidden
//                 rounded-[24px] border border-[#ebe5ff]
//                 bg-white px-2 py-2.5
//                 shadow-[0_4px_24px_rgba(84,38,199,0.06)]
//             "
//         >
//             {/* Top-right profile section */}
//             <div className="absolute right-6 top-8 z-30 flex items-center gap-1">
//                 {/* Notifications */}
//                 <button
//                     type="button"
//                     className="
//                         relative flex h-9 w-9 items-center justify-center
//                         rounded-xl text-[#5426c7]
//                         transition hover:bg-[#f5f1ff]
//                     "
//                 >
//                     <Bell size={24} strokeWidth={1.8} />

//                     {notificationCount > 0 && (
//                         <span
//                             className="
//                                 absolute right-0 top-[-2px]
//                                 flex h-[17px] min-w-[17px]
//                                 items-center justify-center
//                                 rounded-full bg-[#e94b4b]
//                                 px-1 text-[9px] font-bold text-white
//                             "
//                         >
//                             {notificationCount}
//                         </span>
//                     )}
//                 </button>


//                 {/* Profile */}
//                 <button
//                     type="button"
//                     className="
//                         flex items-center gap-2
//                         rounded-xl px-2 py-1
//                         transition hover:bg-[#faf8ff]
//                     "
//                 >
//                     <div
//                         className="
//                             flex h-9 w-9 shrink-0 items-center
//                             justify-center overflow-hidden
//                             rounded-full border-2 border-white
//                             bg-[#cfe8c1]
//                             shadow-[0_2px_8px_rgba(80,50,30,0.08)]
//                         "
//                     >
//                         {avatarUrl ? (
//                             <img
//                                 src={avatarUrl}
//                                 alt={userName}
//                                 className="h-full w-full object-cover"
//                             />
//                         ) : (
//                             <span className="text-[14px] font-bold text-[#33502a]">
//                                 {userName.charAt(0)}
//                             </span>
//                         )}
//                     </div>

//                     {/* <div className="flex min-w-[65px] flex-col text-left">
//                         <span className="text-[12px] font-bold leading-tight text-[#30215c]">
//                             {userName}
//                         </span>

//                         <span className="mt-0.5 text-[9px] font-medium text-[#918aa5]">
//                             {userRole}
//                         </span>
//                     </div> */}


//                 </button>
//             </div>

//             {/* Main content */}
//             <div className="flex items-center gap-5 pr-[260px]">
//                 {/* Robot mascot */}
//                 <div
//                     className="
//             relative flex w-[82px] shrink-0
//             items-center justify-center
//         "
//                 >
//                     {robotImageUrl ? (
//                         <img
//                             src={robotImageUrl}
//                             alt="AI assistant"
//                             className="
//                     h-[80px] 
//                     rounded-full object-contain
//                 "
//                         />
//                     ) : (
//                         <div className="h-[72px] w-full rounded-full bg-[#f2edff]" />
//                     )}


//                 </div>
//                 <div className="w-[420px] shrink-0">
//                 <HeaderAnimationSearch
//                     story={story}
//                     setStory={setStory}
//                     userName={userName}
//                 />
//                 </div>

//                 {/* Search */}
//                 {/* <div className="ml-auto w-[420px] shrink-0"> */}

//                 {/* </div> */}

//             </div>

//         </header>
//     );
// };

import { useState } from "react";
import { Bell } from "lucide-react";
import { HeaderAnimationSearch } from "./HeaderAnimationSearch";



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
    notificationCount = 3,
}) => {
    const [story, setStory] = useState("");

    return (
        <header className="relative isolate w-full shrink-0 overflow-hidden rounded-r-[24px] border border-[#ebe5ff] bg-[#fbf9ff] shadow-[0_4px_24px_rgba(84,38,199,0.06)] h-[120px]">

            {/* =====================================================
                BACKGROUND IMAGE
            ===================================================== */}

            {imageUrls.background && (
                <img
                    src={imageUrls.background}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
                />
            )}

            {/* Soft overlay to keep UI readable */}
            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-white/30 via-white/10 to-white/20" />

            {/* =====================================================
                RIGHT SIDE DECORATION
            ===================================================== */}

            {/* {imageUrls.rightIllustration && (
                <img
                    src={imageUrls.rightIllustration}
                    alt="WonderBook stories"
                    className="pointer-events-none absolute right-[105px] bottom-0 z-[2] h-[92px] w-[230px] object-contain object-bottom opacity-95 drop-shadow-[0_8px_16px_rgba(84,38,199,0.10)] transition-transform duration-700 hover:scale-[1.02]"
                />
            )} */}

            {/* =====================================================
                TOP RIGHT CONTROLS
            ===================================================== */}

            <div className="absolute right-5 top-4 z-30 flex items-center gap-3">

                {/* Notification */}
                <button
                    type="button"
                    aria-label="Notifications"
                    className="relative flex h-[46px] w-[46px] items-center justify-center rounded-xl text-[#5426c7] transition-all duration-200 hover:bg-white/70 hover:scale-105"
                >
                    <Bell size={28} strokeWidth={1.8} />

                    {notificationCount > 0 && (
                        <span className="absolute right-[-3px] top-[-4px] flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-[#e94b4b] px-1 text-[10px] font-bold text-white shadow-sm">
                            {notificationCount}
                        </span>
                    )}
                </button>

                {/* Profile */}
                <button
                    type="button"
                    aria-label="Profile"
                    className="flex items-center justify-center rounded-full transition hover:scale-105"
                >
                    <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#cfe8c1] shadow-[0_3px_12px_rgba(80,50,30,0.10)]">
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

            {/* =====================================================
                MAIN HEADER CONTENT
            ===================================================== */}

            <div className="relative z-10 flex min-h-[118px] w-full items-center px-5 py-3 pr-[330px]">

                {/* =================================================
                    LEFT ROBOT + MESSAGE
                ================================================= */}

                <div className="flex shrink-0 items-center gap-3">

                    {/* Robot */}
                    <div className="relative flex h-[92px] w-[82px] shrink-0 items-center justify-center">
                        {imageUrls.robot ? (
                            <img
                                src={imageUrls.robot}
                                alt="WonderBook AI assistant"
                                className="h-[88px] w-[80px] object-contain drop-shadow-[0_7px_12px_rgba(84,38,199,0.14)] animate-header-robot"
                            />
                        ) : (
                            <div className="h-[75px] w-[75px] rounded-full bg-[#f2edff]" />
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
                            className="h-[78px] w-[105px] shrink-0 object-contain drop-shadow-[0_5px_12px_rgba(84,38,199,0.08)] transition-transform duration-300 hover:scale-[1.03]"
                        />
                    )}
                </div>

                {/* =================================================
                    CENTER AI CREATION AREA
                ================================================= */}

                <div className="ml-6 min-w-0 flex-1">
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