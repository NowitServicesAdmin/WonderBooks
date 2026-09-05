// import { useState } from "react";
// import {
//   Sparkles,
//   Mic,
//   Send,
//   Lightbulb,
//   Rocket,
//   PawPrint,
//   Trees,
//   RefreshCw,
// } from "lucide-react";

// // Replace this with your robot image
// const AI_ROBOT_IMAGE =
//   "https://res.cloudinary.com/djdct0pxu/image/upload/v1788501579/Screenshot_2026-09-04_112746-removebg-preview_etj2un.png";

// const storyIdeas = [
//   {
//     icon: Lightbulb,
//     iconColor: "text-[#7054d6]",
//     bg: "bg-[#f0ebff]",
//     text: (
//       <>
//         A brave little
//         <br />
//         elephant
//       </>
//     ),
//   },
//   {
//     icon: Rocket,
//     iconColor: "text-[#e95028]",
//     bg: "bg-[#fff0eb]",
//     text: (
//       <>
//         An exciting
//         <br />
//         space adventure
//       </>
//     ),
//   },
//   {
//     icon: PawPrint,
//     iconColor: "text-[#ed5b1d]",
//     bg: "bg-[#fff0e8]",
//     text: (
//       <>
//         A dog who
//         <br />
//         finds a new friend
//       </>
//     ),
//   },
//   {
//     icon: Trees,
//     iconColor: "text-[#3e9c72]",
//     bg: "bg-[#eaf8f0]",
//     text: (
//       <>
//         An adventure
//         <br />
//         in the forest
//       </>
//     ),
//   },
// ];

// export const AiBookCreation = () => {
//   const [storyIdea, setStoryIdea] = useState("");

//   const handleIdeaClick = (idea) => {
//     setStoryIdea(idea);
//   };

//   const handleSubmit = () => {
//     if (!storyIdea.trim()) return;

//     console.log("Create AI Book:", storyIdea);

//     // Navigate / trigger AI generation here
//   };

//   const handleKeyDown = (event) => {
//     if (event.key === "Enter" && !event.shiftKey) {
//       event.preventDefault();
//       handleSubmit();
//     }
//   };

//   return (
//     <div className="relative flex min-h-screen w-full flex-col items-center overflow-hidden px-6 pt-2">
//       {/* Soft Background Glow */}
//       <div className="pointer-events-none absolute left-1/2 top-[180px] h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[#eee8ff]/40 blur-[120px]" />
//       {/* Main Content */}
//       <div className="relative z-10 flex w-full max-w-[1150px] flex-1 flex-col items-center">
//         {/* Robot Hero */}
//         <div className="relative  flex h-[310px] items-center justify-center">
//           {/* Robot Image */}
//           <img
//             src={AI_ROBOT_IMAGE}
//             alt="AI Book Assistant"
//             className="h-[300px] w-[390px] object-contain"
//           />
//         </div>
//         {/* Heading */}
//         <div className="text-center">
//           <h1 className="flex items-center justify-center gap-3 text-[30px] font-bold tracking-[-1px] text-[#29246f]">
//             Hi Arav!

//             <span className="text-[36px]">👋</span>
//           </h1>

//           <p className="text-[15px] font-medium text-[#65688c]">
//             Tell me your story idea and I'll create a{" "}
//             <span className="text-[#4436a6]">
//               magical book
//             </span>{" "}
//             for you!
//           </p>
//         </div>

//         {/* Story Suggestions */}
//         <div className="mt-8 flex w-full items-stretch justify-center gap-4">

//           {storyIdeas.map((idea, index) => {
//             const Icon = idea.icon;

//             return (
//               <button
//                 key={index}
//                 onClick={() =>
//                   handleIdeaClick(
//                     index === 0
//                       ? "A brave little elephant"
//                       : index === 1
//                       ? "An exciting space adventure"
//                       : index === 2
//                       ? "A dog who finds a new friend"
//                       : "An adventure in the forest"
//                   )
//                 }
//                 className="
//                   group flex h-[82px] min-w-[195px] flex-1
//                   items-center justify-center gap-3
//                   rounded-[20px]
//                   border border-[#dedbed]
//                   bg-white/55 px-5
//                   text-left
//                   shadow-[0_5px_18px_rgba(78,57,150,0.03)]
//                   backdrop-blur-sm
//                   transition-all duration-300
//                   hover:-translate-y-1
//                   hover:border-[#cfc2f0]
//                   hover:bg-white
//                   hover:shadow-[0_10px_25px_rgba(78,57,150,0.10)]
//                 "
//                 title="Use this idea"
//               >
//                 <div
//                   className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full ${idea.bg}`}
//                 >
//                   <Icon
//                     size={23}
//                     className={`${idea.iconColor} transition-transform duration-300 group-hover:scale-110`}
//                     strokeWidth={2.2}
//                   />
//                 </div>

//                 <span className="text-[16px] font-medium leading-[1.45] text-[#53577d]">
//                   {idea.text}
//                 </span>
//               </button>
//             );
//           })}
//           <button
//             className="
//               flex h-[82px] min-w-[150px] items-center justify-center
//               gap-3 rounded-[20px]
//               border border-[#dedbed]
//               bg-white/55 px-5
//               text-[#53577d]
//               transition-all duration-300
//               hover:-translate-y-1
//               hover:border-[#cfc2f0]
//               hover:bg-white
//               hover:shadow-[0_10px_25px_rgba(78,57,150,0.10)]
//             "
//           >
//             <RefreshCw
//               size={24}
//               className="text-[#4436a6]"
//             />

//             <span className="text-[16px] font-medium">
//               More
//               <br />
//               ideas
//             </span>
//           </button>
//         </div> 
//         {/* Prompt Input */}
//         <div className="mt-8 w-full max-w-[1120px]">
//           <div
//             className="
//               flex min-h-[66px] items-center
//               rounded-[48px]
//               border border-[#ded9ee]
//               bg-white
//               px-3
//               shadow-[0_15px_40px_rgba(220, 216, 231, 0.06)]
//               backdrop-blur-md
//               transition-all
//               focus-within:border-[#b9a7e8]
//               focus-within:shadow-[0_18px_45px_rgba(74,50,145,0.10)]
//             "
//           >

//             <Sparkles
//               size={28}
//               className="mr-5 shrink-0 text-[#4931bd]"
//             />
//             <textarea
//               value={storyIdea}
//               onChange={(event) => setStoryIdea(event.target.value)}
//               onKeyDown={handleKeyDown}
//               placeholder="Type your story idea here..."
//               rows={1}
//               className="
//                 max-h-[100px] min-h-[45px] flex-1 resize-none
//                 bg-transparent py-3
//                 text-[18px] text-[#38345f]
//                 outline-none
//                 placeholder:text-[#8586a2]
//               "
//             />

//             {/* Microphone */}
//             <button
//               type="button"
//               className="
//                 mx-5 flex h-[46px] w-[46px]
//                 items-center justify-center rounded-full
//                 text-[#4931bd]
//                 transition hover:bg-[#f3efff]
//               "
//               aria-label="Voice input"
//             >
//               <Mic size={27} />
//             </button>

//             {/* Send */}
//             <button
//               onClick={handleSubmit}
//               disabled={!storyIdea.trim()}
//               className="
//                 flex h-[54px] w-[54px] shrink-0
//                 items-center justify-center
//                 rounded-full
//                 bg-gradient-to-br from-[#6539d5] to-[#3d1bb1]
//                 text-white
//                 shadow-[0_10px_25px_rgba(74,39,180,0.28)]
//                 transition-all duration-300
//                 hover:scale-105
//                 hover:shadow-[0_14px_32px_rgba(74,39,180,0.38)]
//                 active:scale-95
//                 disabled:cursor-not-allowed
//                 disabled:opacity-50
//               "
//               aria-label="Create book"
//             >
//               <Send size={28} strokeWidth={2} />
//             </button>
//           </div>

//           {/* Helper Text */}
//           <p className="mt-5 text-center text-[14px] text-[#777a9b]">
//             You can tell me anything — characters, theme, age group or even a
//             simple idea.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AiBookCreation;
import { useState } from "react";
import {
    Sparkles,
    Mic,
    Send,
    Lightbulb,
    Rocket,
    PawPrint,
    Trees,
    Castle,
} from "lucide-react";


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
    //     emoji: "🐶",
    //     text: "A dog who finds a new friend",
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

    const handleIdeaClick = (idea) => {
        setStoryIdea(idea);
    };


    const handleSubmit = () => {
        if (!storyIdea.trim()) return;

        console.log("Create AI Book:", storyIdea);

        // Navigate to AI generation workflow
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
            <div className="pointer-events-none absolute left-1/2 top-[100px] h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-[#eee8ff]/30 blur-[120px]" />

            <div className="relative z-10 mx-auto flex w-full max-w-[1260px] flex-col">
                {/* ================= ROBOT + MESSAGE ================= */}
                <div className="mt-12 flex items-center justify-center gap-8">
                    {/* Robot */}
                    <div className="relative flex h-[300px] w-[390px] shrink-0 items-center justify-center">

                        {/* Decorative sparkles */}

                        <Sparkles
                            size={22}
                            className="absolute left-[5px] top-[60px] text-[#c29aff]"
                            fill="currentColor"
                        />

                        <Sparkles
                            size={28}
                            className="absolute right-[15px] top-[55px] text-[#ffc34e]"
                            fill="currentColor"
                        />

                        <Sparkles
                            size={18}
                            className="absolute left-[25px] bottom-[55px] text-[#f3b13b]"
                            fill="currentColor"
                        />

                        {/* Robot Image */}

                        <img
                            src={AI_ROBOT_IMAGE}
                            alt="AI Story Assistant"
                            className="h-full w-full object-contain"
                        />

                    </div>

                </div>
                {/* story Ideas */}

                <div className="mt-4 flex w-full justify-center">
                    <div className="grid grid-cols-5 gap-4">

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
                                    className={`
            group relative flex h-[96px] w-[210px]
            items-center gap-3 overflow-hidden
            rounded-[20px]
            border px-4 text-left
            transition-all duration-300 ease-out

            ${isSelected
                                            ? "border-[#7654d8] bg-gradient-to-br from-[#faf8ff] to-[#f1edff] shadow-[0_10px_28px_rgba(99,66,190,0.16)]"
                                            : `border-[#e5e1ed] bg-white/75 ${theme.border} ${theme.glow}`
                                        }

            hover:-translate-y-[3px]
            active:translate-y-0
          `}
                                >
                                    {/* Background Glow */}
                                    <div
                                        className="
              absolute -right-5 -top-5
              h-[80px] w-[80px]
              rounded-full bg-white/50
              opacity-0 blur-xl
              transition-opacity duration-300
              group-hover:opacity-100
            "
                                    />

                                    {/* Emoji */}
                                    <div
                                        className={`
              relative z-10 flex h-[54px] w-[54px]
              shrink-0 items-center justify-center
              rounded-[17px]
              ${theme.iconBg}
              shadow-[0_6px_14px_rgba(80,60,150,0.08)]
              transition-all duration-300
              group-hover:scale-110
              group-hover:rotate-[-4deg]
            `}
                                    >
                                        <span className="text-[32px] leading-none">
                                            {idea.emoji}
                                        </span>

                                        <Sparkles
                                            size={10}
                                            className="
                absolute -right-1 -top-1
                text-[#f3b126]
                opacity-0
                transition-all duration-300
                group-hover:opacity-100
              "
                                            fill="currentColor"
                                        />
                                    </div>

                                    {/* Text */}
                                    <div className="relative z-10 flex flex-1 flex-col">
                                        <span
                                            className={`
                text-[15px] font-semibold leading-[1.45]
                transition-colors duration-300
                ${isSelected
                                                    ? "text-[#4d36a5]"
                                                    : "text-[#53577d] group-hover:text-[#40328f]"
                                                }
              `}
                                        >
                                            {idea.text}
                                        </span>
                                    </div>

                                    {/* Selected Dot */}
                                    {isSelected && (
                                        <div
                                            className="
                absolute right-4 top-4
                h-2.5 w-2.5 rounded-full
                bg-[#6845d2]
                shadow-[0_0_0_4px_rgba(104,69,210,0.12)]
              "
                                        />
                                    )}
                                </button>
                            );
                        })}


                        {/* Surprise Me */}

                        <button
                            onClick={() => {
                                const randomIdea =
                                    storyIdeas[
                                    Math.floor(Math.random() * storyIdeas.length)
                                    ];

                                setStoryIdea(randomIdea.text);
                            }}
                            className="
        group relative flex h-[96px] w-[210px]
        items-center gap-3 overflow-hidden
        rounded-[20px]
        border border-[#eadfbd]

        bg-gradient-to-br
        from-[#fffdf7]
        to-[#fff3cf]

        px-4 text-left

        shadow-[0_5px_18px_rgba(180,130,30,0.06)]

        transition-all duration-300 ease-out

        hover:-translate-y-[3px]
        hover:border-[#f0c75f]
        hover:shadow-[0_12px_28px_rgba(180,130,30,0.14)]

        active:translate-y-0
      "
                        >
                            {/* Background Glow */}

                            <div
                                className="
          absolute -right-5 -top-5
          h-[85px] w-[85px]
          rounded-full bg-[#ffe9a9]/50
          blur-xl
        "
                            />

                            {/* Icon */}

                            <div
                                className="
          relative z-10 flex h-[54px] w-[54px]
          shrink-0 items-center justify-center
          rounded-[17px]

          bg-gradient-to-br
          from-[#fff0b3]
          to-[#ffd66f]

          shadow-[0_6px_16px_rgba(214,160,35,0.15)]

          transition-all duration-300

          group-hover:scale-110
          group-hover:rotate-6
        "
                            >
                                <Lightbulb
                                    size={27}
                                    className="text-[#d99614]"
                                    fill="currentColor"
                                />

                                <Sparkles
                                    size={10}
                                    className="
            absolute -right-1 -top-1
            text-[#f0a71b]
          "
                                    fill="currentColor"
                                />
                            </div>

                            {/* Text */}

                            <div className="relative z-10">
                                <span className="block text-[15px] font-bold text-[#76602c]">
                                    Surprise me!
                                </span>
                            </div>

                            <Sparkles
                                size={13}
                                className="
          absolute bottom-3 right-4
          text-[#e5a91d]/60
        "
                                fill="currentColor"
                            />
                        </button>

                    </div>
                </div>
                {/* ================= PROMPT INPUT ================= */}

                <div className="mx-auto mt-10 w-full max-w-[1100px]">

                    <div
                        className="
      flex 
      items-center
      rounded-[22px]
      border border-[#DED9EE]
      bg-white
      px-5 py-2
      shadow-[0_12px_35px_rgba(120,100,180,0.08)]
      transition-all duration-300
      focus-within:border-[#B9A7E8]
      focus-within:shadow-[0_16px_40px_rgba(74,50,145,0.12)]
    "
                    >

                        {/* Left AI Icon */}

                        <div
                            className="
        mr-4 flex h-[46px] w-[46px]
        shrink-0 items-center justify-center
        rounded-[14px]
        bg-gradient-to-br
        from-[#F0EAFF]
        to-[#E3D7FF]
        text-[#5A39C7]
      "
                        >
                            <Sparkles size={23} />
                        </div>
                        {/* Textarea */}

                        <textarea
                            value={storyIdea}
                            onChange={(event) => setStoryIdea(event.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your story idea here..."
                            rows={1}
                            className="
        min-h-[50px] max-h-[120px] flex-1 resize-none
        bg-transparent
        py-3
        text-[17px]
        text-[#38345F]

        outline-none

        placeholder:text-[#9693A8]
      "
                        />


                        {/* Divider */}
                        <div className="mx-3 h-[36px] w-px bg-[#E7E3EF]" />
                        {/* Microphone */}
                        <button
                            type="button"
                            className="
        mr-3 flex h-[44px] w-[44px]
        shrink-0 items-center justify-center
        rounded-[12px]

        text-[#5B3BC4]

        transition-all duration-200

        hover:bg-[#F3EFFF]
        hover:text-[#4323B2]
      "
                            aria-label="Voice input"
                        >
                            <Mic size={24} />
                        </button>


                        {/* ================= SEND BUTTON ================= */}
                        <button
                            onClick={handleSubmit}
                            disabled={!storyIdea.trim()}
                            className="
    flex h-[52px] w-[58px]
    shrink-0
    items-center justify-center

    rounded-[10px]

    bg-gradient-to-r
    from-[#6539D5]
    to-[#4822B8]

    text-white

    shadow-[0_8px_20px_rgba(74,39,180,0.22)]

    transition-all duration-300

    hover:-translate-y-0.5
    hover:shadow-[0_12px_26px_rgba(74,39,180,0.32)]

    active:translate-y-0
    active:scale-[0.96]

    disabled:cursor-not-allowed
    disabled:opacity-50
  "
                            aria-label="Create book"
                        >
                            <Send
                                size={22}
                                strokeWidth={2.3}
                            />
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