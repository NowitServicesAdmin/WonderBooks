// import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Pencil,
  ShieldCheck,
  WandSparkles,
} from "lucide-react";
import { InfoTip } from "../../Components/InfoTip";

const AI_CREATION_IMAGE =
  "https://res.cloudinary.com/djdct0pxu/image/upload/v1788436524/Screenshot_2026-09-03_172334_r8ny2y.png";

const MANUAL_CREATION_IMAGE =
  "https://res.cloudinary.com/djdct0pxu/image/upload/v1788436524/Screenshot_2026-09-03_172354_u2kukv.png";

export const CreateBook = () => {
  const navigate = useNavigate();
  const handleCreateAI = () => {
    navigate("bookcreation", { state: { mode: "ai" } });
    // Navigate to AI creation flow
  };

  const handleCreateManual = () => {
    navigate("bookcreation", { state: { mode: "manual" } });
    // Navigate to Manual creation flow
  };



  return (
    <div className="w-full px-4 pb-10 sm:px-6">
      <main className="mx-auto flex w-full max-w-280 flex-col items-center justify-start">
        <section className="mt-4 grid w-full grid-cols-1 gap-10 md:grid-cols-2">

          {/* AI Creation Card */}
          <div
            className="
      relative flex min-h-122.5 w-full flex-col overflow-hidden
      rounded-[30px] border-[1.5px] border-[#d9c9f5]
      bg-white/60 px-7 pb-7 pt-5
      shadow-[0_18px_45px_rgba(83,55,160,0.10)]
      backdrop-blur-sm
      transition-all duration-300
      hover:-translate-y-1
      hover:shadow-[0_22px_55px_rgba(83,55,160,0.14)]
    "
          >
            {/* Recommended Badge */}
            <div className="absolute left-5 top-4 z-20">
              <div className="flex items-center gap-2 rounded-full bg-linear-to-r from-[#eee7ff] to-[#ded9f5] px-4 py-2 text-[14px] font-semibold text-[#49359c] shadow-sm">
                <Sparkles size={16} fill="currentColor" />
                Recommended
              </div>
            </div>

            {/* Image Area */}
            <div className="flex h-58.75 shrink-0 items-center justify-center pt-8">
              <img
                src={AI_CREATION_IMAGE}
                alt="AI Book Creation"
                className="h-full w-full object-contain"
              />
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col text-center">
              <h2 className="flex items-center justify-center gap-2 text-[27px] font-bold tracking-[-0.5px] text-[#332985]">
                AI Creation

                <Sparkles
                  size={26}
                  className="text-[#f6b51b]"
                  fill="currentColor"
                />
              </h2>

              <p className="mx-auto mt-2 max-w-82.5 text-[15px] leading-[1.55] text-[#505979]">
                Tell us your ideas and
                <br />
                AI will create the book for you.
              </p>

              {/* CTA */}
              <button
                onClick={handleCreateAI}
                className="
          group mt-auto flex h-12.5 w-full shrink-0
          items-center justify-center gap-3 rounded-full
          bg-linear-to-r from-[#5620cc] via-[#5723cf] to-[#6427d8]
          text-[18px] font-bold text-white
          shadow-[0_10px_22px_rgba(82,30,194,0.22)]
          transition-all duration-300
          hover:-translate-y-0.5
          hover:shadow-[0_14px_28px_rgba(82,30,194,0.30)]
        "
              >
                <WandSparkles
                  size={21}
                  className="transition-transform group-hover:rotate-12"
                />

                <span>Create with AI</span>
              </button>

              {/* Bottom Info */}
              <InfoTip
                label="Quick, easy and magical!"
                title="How AI Creation works"
                steps={[
                  "Tell the AI your story idea in the chat.",
                  "Answer a few quick questions about characters and style.",
                  "AI writes the story and creates the illustrations.",
                  "Review your book and edit anything you like.",
                ]}
                note="Tip: the more detail you give, the better your story."
              />
            </div>
          </div>


          {/* Manual Creation Card */}
          <div
            className="
      relative flex min-h-122.5 w-full flex-col overflow-hidden
      rounded-[30px] border-[1.5px] border-[#d9c9f5]
      bg-white/60 px-7 pb-7 pt-5
      shadow-[0_18px_45px_rgba(83,55,160,0.10)]
      backdrop-blur-sm
      transition-all duration-300
      hover:-translate-y-1
      hover:shadow-[0_22px_55px_rgba(83,55,160,0.14)]
    "
          >
            {/* Spacer matching badge area */}
            <div className="absolute left-5 top-4 h-9.5" />

            {/* Image Area */}
            <div className="flex h-58.75 shrink-0 items-center justify-center pt-8">
              <img
                src={MANUAL_CREATION_IMAGE}
                alt="Manual Book Creation"
                className="h-full w-full object-contain"
              />
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col text-center">
              <h2 className="flex items-center justify-center gap-2 text-[27px] font-bold tracking-[-0.5px] text-[#332985]">
                Create Manually

                <Pencil
                  size={25}
                  className="rotate-[-8deg] text-[#f0a71b]"
                  fill="currentColor"
                />
              </h2>

              <p className="mx-auto mt-2 max-w-82.5 text-[15px] leading-[1.55] text-[#505979]">
                Choose templates, write your story
                <br />
                and add illustrations yourself.
              </p>

              {/* CTA */}
              <button
                onClick={handleCreateManual}
                className="
          group mt-auto flex h-12.5 w-full shrink-0
          items-center justify-center gap-3 rounded-full
          border-[1.5px] border-[#6534d4]
          bg-white/70 text-[18px] font-bold text-[#4c2fb2]
          shadow-[0_10px_22px_rgba(82,30,194,0.08)]
          transition-all duration-300
          hover:-translate-y-0.5
          hover:bg-(--tint)
          hover:shadow-[0_14px_28px_rgba(82,30,194,0.14)]
        "
              >
                <Pencil
                  size={21}
                  className="rotate-[-8deg] transition-transform group-hover:-translate-y-0.5"
                />

                <span>Create Manually</span>
              </button>

              {/* Bottom Info */}
              <InfoTip
                label="Step by step, just the way you like!"
                title="How Manual Creation works"
                steps={[
                  "Choose the age group and theme.",
                  "Pick a subject and the central message.",
                  "Select an image style for your illustrations.",
                  "Create your main character, then build your book.",
                ]}
                note="You stay in control of every choice along the way."
              />
            </div>
          </div>

        </section>
        {/* privacy message */}
        <div className="mt-5 flex items-center gap-3 rounded-full ">
          <ShieldCheck
            size={19}
            className="text-[#5934c9]"
            strokeWidth={2}
          />
          <span className="text-[14px] font-medium text-[#4e4b87]">
            Your stories are always safe and private with us.
          </span>
        </div>
      </main>
    </div>
  );
}