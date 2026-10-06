import {
  Star,
  ArrowRight,
  Sparkles,
  Play,
  Clock3,
  WandSparkles,
  BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ContinueCreating = ({ book, onGetIdeas, onCreateNew }) => {
  const navigate = useNavigate();

  const hasBook = Boolean(book);
  const isCompleted = book?.status === "Completed";
  const progress = hasBook ? (isCompleted ? 100 : book.progress || 5) : 0;
  const bookTitle = book?.title || "Your WonderStory";

  const radius = 108;
  const circumference = 2 * Math.PI * radius;

  const progressOffset =
    circumference - (progress / 100) * circumference;

  // Text + the primary button toggle by state; the layout stays the same.
  const subtitle = !hasBook
    ? "Start your next magical story"
    : isCompleted
      ? "Your story is ready to view"
      : "Pick up where your story paused";

  const storyLabel = hasBook ? "Your story" : "Get started";

  const heading = hasBook ? bookTitle : "Start Creating Your Book";

  const description = !hasBook ? (
    "You don't have a story in progress right now. Start creating your book and it'll show up here so you can pick up right where you left off."
  ) : isCompleted ? (
    <>
      Great news - <span className="font-semibold text-[#5f4a96]">"{bookTitle}"</span> is complete.
      Whenever you're ready, tap below to open it.
    </>
  ) : (
    <>
      Your story is waiting for you. You paused your creation at{" "}
      <span className="font-semibold text-[#5f4a96]">{progress}% complete</span>. Continue from where
      you left off and bring "{bookTitle}" to life.
    </>
  );

  const badgeText = !hasBook ? "Let's get started" : isCompleted ? "Ready to view" : `${progress}% complete`;

  const ctaLabel = !hasBook ? "Start Creating" : isCompleted ? "View Your Book" : "Continue Creating";
  const CtaIcon = !hasBook ? Sparkles : isCompleted ? BookOpen : Play;

  const handleCtaClick = () => {
    if (!hasBook) {
      onCreateNew?.();
    } else {
      navigate(`/books/${book.id}`);
    }
  };

  return (
    <>
      <section
        className="
          relative w-full overflow-hidden
          rounded-3xl
          border border-[#dfd9ef]
          bg-linear-to-br from-white via-[#fdfcff] to-(--tint)
          shadow-[0_12px_35px_rgba(65,48,120,0.07)]
        "
      >
        {/* ================= HEADER ================= */}

        <div className="flex items-start justify-between px-6 pb-2 pt-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-10 w-10 shrink-0 items-center justify-center
                rounded-xl bg-[#f1ecff]
              "
            >
              <Star
                size={22}
                className="fill-[#5935bb] text-[#5935bb]"
              />
            </div>

            <div>
              <h2 className="text-[21px] font-bold tracking-[-0.25px] text-[#333662]">
                Continue Creating
              </h2>

              <p className="mt-0.5 text-[12px] font-medium text-[#918b9e]">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Decorative wand */}

          <div
            className="
              relative flex h-13.5 w-13.5 shrink-0
              items-center justify-center rounded-full
              border border-white/80
              bg-linear-to-br
              from-[#eee7ff]
              via-[#f8eaff]
              to-[#fff0e5]
              shadow-[0_8px_25px_rgba(91,55,181,0.10)]
            "
          >
            <WandSparkles
              size={29}
              className="text-[#6036c5]"
              strokeWidth={1.8}
            />

            <span className="absolute right-0.5 top-2.25 text-[#ee70b5]">
              ✦
            </span>

            <span className="absolute bottom-0.5 right-2.25 text-[14px] text-[#f4a62a]">
              ✦
            </span>

            <span className="absolute left-0.75 top-3.25 text-[10px] text-[#8b68e8]">
              ✦
            </span>
          </div>
        </div>


        {/* ================= MAIN CONTENT ================= */}

        <div
          className="
            grid
            grid-cols-1
            items-center
            gap-2
            px-5
            pb-6
            pt-1

            sm:px-7

            md:grid-cols-[290px_minmax(0,1fr)]
            md:gap-5

            lg:grid-cols-[360px_minmax(0,1fr)]
            lg:gap-10
          "
        >
          {/* ================= LEFT : ILLUSTRATION ================= */}

          <div
            className="
              relative flex h-77.5
              items-center justify-center
              md:h-75
            "
          >
            {/* Soft glow */}

            <div
              className="
                absolute left-1/2 top-[48%]
                h-56.25 w-56.25
                -translate-x-1/2 -translate-y-1/2
                rounded-full
                bg-[#8b67e8]/10
                blur-3xl
              "
            />


            {/* ================= PROGRESS CIRCLE ================= */}

            <div
              className="
                absolute left-1/2 top-[47%]
                h-66.25 w-66.25
                -translate-x-1/2 -translate-y-1/2
              "
            >
              <svg
                className="progress-svg h-full w-full"
                viewBox="0 0 250 250"
              >
                <defs>
                  <linearGradient
                    id="progressGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#5A36B9" />
                    <stop offset="55%" stopColor="#7549D2" />
                    <stop offset="100%" stopColor="#A778F1" />
                  </linearGradient>
                </defs>


                {/* Background */}

                <circle
                  cx="125"
                  cy="125"
                  r={radius}
                  fill="none"
                  stroke="#ebe8f3"
                  strokeWidth="7"
                />


                {/* Actual progress */}

                <circle
                  cx="125"
                  cy="125"
                  r={radius}
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                  className="progress-ring"
                />
              </svg>
            </div>
            {/* ================= BOOK ================= */}

            <div className="relative z-10">
              <img
                src="https://res.cloudinary.com/djdct0pxu/image/upload/v1788419160/ChatGPT_Image_Sep_3_2026_12_35_39_PM_rgykwb.png"
                alt={bookTitle}
                className="
                  h-62.5 w-75
                  object-contain
                  drop-shadow-[0_18px_24px_rgba(60,40,120,0.16)]
                "
              />


              {/* Animated pen */}

              <div
                className="
                  pen-animation
                  pointer-events-none
                  absolute left-21 top-10.5
                  z-20
                "
              >
                <img
                  src="https://res.cloudinary.com/djdct0pxu/image/upload/v1788419451/ChatGPT_Image_Sep_3__2026__12_39_50_PM-removebg-preview_zjyswa.png"
                  alt=""
                  className="h-16.5 w-auto object-contain"
                />
              </div>
            </div>


            {/* ================= PROGRESS BADGE ================= */}

            <div
              className="
                absolute bottom-0.75 left-1/2 z-30
                flex -translate-x-1/2
                items-center gap-2
                whitespace-nowrap
                rounded-full
                border border-[#e3dcf4]
                bg-white
                px-4 py-2
                shadow-[0_8px_20px_rgba(74,49,145,0.10)]
              "
            >
              <div className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7a53d6]/40" />

                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#6944c5]" />
              </div>

              <span className="text-[12px] font-bold text-[#57536a]">
                {badgeText}
              </span>
            </div>
          </div>


          {/* ================= RIGHT : CONTENT ================= */}

          <div
            className="
              flex min-w-0 flex-col
              justify-center

              pb-3
              md:min-h-75
              md:pb-0
            "
          >
            {/* Story heading */}

            <div className="flex items-center gap-3">
              <div
                className="
                  flex h-10 w-10 shrink-0
                  items-center justify-center
                  rounded-xl
                  bg-(--tint)
                "
              >
                <Sparkles
                  size={19}
                  className="text-[#6b46c1]"
                />
              </div>

              <div className="min-w-0 flex-1">
                <span
                  className="
                    text-[10px] font-bold uppercase
                    tracking-[1.2px]
                    text-[#9a88c5]
                  "
                >
                  {storyLabel}
                </span>

                <h3
                  title={heading}
                  className="
                    mt-0.5 line-clamp-2 wrap-break-word text-[20px] lg:text-[24px]
                    font-bold leading-tight
                    tracking-[-0.3px]
                    text-[#57419d]
                  "
                >
                  {heading}
                </h3>

                {hasBook && (book.theme || book.createdFor) && (
                  <p className="mt-1 text-[12px] font-medium text-[#9a88c5]">
                    {[book.theme, book.createdFor && `for ${book.createdFor}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            </div>


            {/* Description */}

            <p
              className="
                mt-5
                max-w-107.5
                text-[14px]
                leading-[1.75]
                text-[#777286]
              "
            >
              {description}
            </p>


            {/* Saved status */}

            <div
              className="
                mt-4 flex items-center gap-2
                text-[12px] font-medium
                text-[#9994a4]
              "
            >
              <div
                className="
                  flex h-7 w-7 items-center justify-center
                  rounded-full bg-[#f7f5fb]
                "
              >
                <Clock3 size={14} />
              </div>

              <span>Your progress is safely saved</span>
            </div>


            {/* CTA */}

            <button
              onClick={handleCtaClick}
              className="
                group mt-6 flex w-fit
                items-center gap-2.5
                rounded-xl
                bg-[#5c3db4]
                px-5 py-3.5
                text-[13px] font-bold text-white
                shadow-[0_8px_18px_rgba(92,61,180,0.22)]

                transition-all duration-200

                hover:-translate-y-px
                hover:bg-[#6847c4]
                hover:shadow-[0_12px_24px_rgba(92,61,180,0.30)]

                active:translate-y-0
              "
            >
              <CtaIcon
                size={14}
                className={CtaIcon === Play ? "fill-white" : ""}
              />

              {ctaLabel}

              <ArrowRight
                size={16}
                className="
                  transition-transform duration-200
                  group-hover:translate-x-1
                "
              />
            </button>
          </div>
        </div>
      </section>


      {/* ================= ANIMATIONS ================= */}

      <style>{`

        .progress-svg {
          transform: rotate(90deg);
        }

        .progress-ring {
          transition:
            stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1);

          filter:
            drop-shadow(
              0px 3px 6px
              rgba(105,69,210,0.22)
            );
        }


        .pen-animation {
          animation: writingMotion 4s ease-in-out infinite;
        }


        @keyframes writingMotion {

          0% {
            transform:
              translateX(0px)
              translateY(0px)
              rotate(-3deg);

            opacity: 0;
          }

          8% {
            opacity: 1;
          }

          20% {
            transform:
              translateX(20px)
              translateY(4px)
              rotate(1deg);
          }

          40% {
            transform:
              translateX(55px)
              translateY(-2px)
              rotate(-2deg);
          }

          60% {
            transform:
              translateX(90px)
              translateY(3px)
              rotate(2deg);
          }

          72% {
            transform:
              translateX(105px)
              translateY(0px)
              rotate(0deg);
          }

          88% {
            opacity: 1;
          }

          100% {
            transform:
              translateX(0px)
              translateY(0px)
              rotate(-3deg);

            opacity: 0;
          }
        }
        @media (max-width: 768px) {

          .pen-animation {
            animation-duration: 4.5s;
          }

        }

      `}</style>
    </>
  );
};