import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  Clock3,
  FileText,
  Lightbulb,
  MoreVertical,
  PenLine,
  Plus,
  Sparkles,
  Star,
  WandSparkles,
  X,
} from "lucide-react";

import {
  templates,
  myBooks,
  categoryThemes,
} from "../../Data/Templatesdata";

/* ========================================================================== */
/*                              MAIN DASHBOARD                                */
/* ========================================================================== */

export const Dashboard = () => {
  const [ideasOpen, setIdeasOpen] = useState(false);

 
  const dashboardBooks = useMemo(() => {
    const userBooks = myBooks.map((book) => ({
      id: `book-${book.id}`,
      title: book.title,
      cover: book.cover,
      type: book.type,
      themeColor: book.themeColor,
      spineDark: book.spineDark,
      updatedAt: book.updatedAt,
      progress: book.progress,
      status:
        book.progress >= 100
          ? "Completed"
          : book.progress > 60
          ? "In Progress"
          : "Draft",
    }));

    const templateBooks = templates
      .filter(
        (template, index, array) =>
          index ===
          array.findIndex(
            (item) => item.title === template.title
          )
      )
      .slice(2, 5)
      .map((template, index) => {
        const theme =
          categoryThemes[template.category];

        return {
          id: `template-${template.id}-${index}`,
          title: template.title,
          cover: template.image,
          type: index === 2 ? "premium" : "free",
          themeColor: theme?.primary || "#7563C9",
          spineDark: theme?.dark || "#302454",
          updatedAt:
            index === 0
              ? "Updated 1 week ago"
              : index === 1
              ? "Updated 2 weeks ago"
              : "Updated 3 days ago",
          progress: index === 2 ? 15 : 100,
          status:
            index === 2 ? "Draft" : "Completed",
        };
      });

    return [...userBooks, ...templateBooks].slice(0, 5);
  }, []);

  const continueBook = myBooks[0];

  return (
    <>
      <div className="min-h-screen bg-[#faf9fc] p-3 sm:p-4 lg:p-5">
        <div className="grid min-h-[calc(100vh-40px)] grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_270px]">

          {/* LEFT MAIN CONTENT */}

          <div className="min-w-0 space-y-3">

            <ContinueCreating
              book={continueBook}
              onGetIdeas={() => setIdeasOpen(true)}
            />

            <MyBooksSection books={dashboardBooks} />
          </div>

          {/* RIGHT SIDEBAR */}

          <aside className="space-y-3">
            <QuickActions />

            <JourneyCard />
          </aside>
        </div>
      </div>

      {/* IDEAS RIGHT DRAWER */}

      <IdeasDrawer
        open={ideasOpen}
        onClose={() => setIdeasOpen(false)}
      />
    </>
  );
}

/* ========================================================================== */
/*                           CONTINUE CREATING                                */
/* ========================================================================== */

const ContinueCreating = ({
  book,
  onGetIdeas,
}) => {
  if (!book) return null;

  return (
    <section className="overflow-hidden rounded-[12px] border border-[#ebe9f2] bg-white shadow-[0_4px_20px_rgba(72,55,125,0.04)]">

      {/* Section header */}

      <div className="flex items-center justify-between px-5 pt-4">
        <h2 className="text-[13px] font-bold text-[#343957]">
          Continue Creating
        </h2>

        <button className="flex items-center gap-1 text-[10px] font-semibold text-[#4f3ba2] transition hover:text-[#7057d0]">
          View All
          <ArrowRight size={12} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 px-5 pb-5 pt-4 lg:grid-cols-[110px_minmax(0,1fr)_135px] lg:items-center">

        {/* Physical Book */}

        <div className="flex justify-center lg:justify-start">
          <PhysicalBook
            book={book}
            size="continue"
          />
        </div>

        {/* Continue Details */}

        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-bold text-[#303652]">
            {book.title}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] text-[#8a8da1]">
            <span>Page 12 of 24</span>

            <span className="h-[3px] w-[3px] rounded-full bg-[#b7b6c2]" />

            <span>Last edited 2 days ago</span>
          </div>

          {/* Progress */}

          <div className="mt-4 flex items-center gap-3">
            <div className="h-[4px] flex-1 overflow-hidden rounded-full bg-[#eeedf3]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6346c3] to-[#8a73dc]"
                style={{
                  width: `${book.progress}%`,
                }}
              />
            </div>

            <span className="text-[9px] font-bold text-[#514b71]">
              {book.progress}%
            </span>
          </div>

          <p className="mt-3 max-w-[390px] text-[10px] leading-[1.7] text-[#747991]">
            Arav and his dog, Buddy, travel to the stars
            and explore a mysterious new planet.
          </p>

          {/* Actions */}

          <div className="mt-3 flex items-center gap-2">
            <button className="rounded-[5px] bg-[#4d2699] px-4 py-2 text-[9px] font-semibold text-white shadow-[0_4px_10px_rgba(78,38,153,0.2)] transition hover:bg-[#6038b5]">
              Continue Writing
            </button>

            <button className="flex h-[29px] w-[29px] items-center justify-center rounded-[5px] border border-[#e5e1ef] text-[#625b80] transition hover:bg-[#f7f5fb]">
              <MoreVertical size={14} />
            </button>
          </div>
        </div>

        {/* Inspiration */}

        <div className="relative overflow-hidden rounded-[10px] border border-[#ebe7f5] bg-gradient-to-br from-[#f7f5ff] to-[#efedf9] p-4">

          {/* Decorative sparkles */}

          <Sparkles
            size={10}
            className="absolute right-5 top-3 text-[#d5c8f6]"
          />

          <WandSparkles
            size={28}
            strokeWidth={1.6}
            className="mt-1 text-[#6543bd]"
          />

          <h4 className="mt-2 text-[10px] font-bold text-[#474b69]">
            Need inspiration?
          </h4>

          <p className="mt-2 text-[9px] leading-relaxed text-[#7b7f96]">
            Get AI story ideas to continue your book.
          </p>

          <button
            onClick={onGetIdeas}
            className="mt-4 w-full rounded-[5px] border border-[#ddd8ea] bg-white py-2 text-[9px] font-semibold text-[#5542a4] shadow-sm transition hover:border-[#bfb2e5] hover:bg-[#faf8ff]"
          >
            Get Ideas
          </button>
        </div>
      </div>
    </section>
  );
};

/* ========================================================================== */
/*                              MY BOOKS SECTION                              */
/* ========================================================================== */

const MyBooksSection = ({ books }) => {
  return (
    <section className="overflow-hidden rounded-[12px] border border-[#ebe9f2] bg-white px-5 py-4 shadow-[0_4px_20px_rgba(72,55,125,0.04)]">

      {/* Header */}

      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-bold text-[#343957]">
          My Books
        </h2>

        <button className="flex items-center gap-1 text-[10px] font-semibold text-[#4f3ba2] transition hover:text-[#7057d0]">
          View All
          <ArrowRight size={12} />
        </button>
      </div>

      {/* Books Row */}

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {books.map((book) => (
          <DashboardBookCard
            key={book.id}
            book={book}
          />
        ))}
      </div>
    </section>
  );
};

/* ========================================================================== */
/*                           DASHBOARD BOOK CARD                              */
/* ========================================================================== */

const DashboardBookCard = ({ book }) => {
  return (
    <button className="group min-w-0 text-left">

      {/* Book */}

      <div className="flex justify-center">
        <PhysicalBook
          book={book}
          size="grid"
        />
      </div>

      {/* Book Details */}

      <div className="mt-3">
        <h3 className="truncate text-[10px] font-bold text-[#3a3e58] transition group-hover:text-[#513aa5]">
          {book.title}
        </h3>

        <p className="mt-1 text-[8px] text-[#888ca0]">
          {getShortSubtitle(book)}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <StatusBadge status={book.status} />

          <MoreVertical
            size={13}
            className="text-[#777c94]"
          />
        </div>

        <p className="mt-2 text-[8px] text-[#9295a7]">
          {book.updatedAt}
        </p>
      </div>
    </button>
  );
};

/* ========================================================================== */
/*                              PHYSICAL BOOK                                 */
/* ========================================================================== */

const PhysicalBook = ({
  book,
  size = "grid",
}) => {
  const sizes = {
    continue: {
      width: "105px",
      height: "140px",
      title: "10px",
      spine: "9px",
    },

    grid: {
      width: "82px",
      height: "105px",
      title: "8px",
      spine: "7px",
    },
  };

  const config = sizes[size];

  return (
    <div
      className="relative shrink-0"
      style={{
        width: config.width,
        height: config.height,
        perspective: "800px",
      }}
    >
      {/* Book ground shadow */}

      <div className="absolute -bottom-2 left-[10%] h-3 w-[85%] rounded-full bg-[#29233d]/15 blur-md" />

      {/* Page Block */}

      <div className="absolute bottom-[2px] right-[-5px] top-[4px] w-[9px] rounded-r-[2px] border-y border-r border-[#d6d0c6] bg-[#f4efe5]" />

      {/* Page Lines */}

      <div className="absolute bottom-[8px] right-[-5px] top-[10px] w-[8px] opacity-50">
        <div className="h-full border-r border-[#d7d0c4]" />
      </div>

      {/* Spine */}

      <div
        className="absolute bottom-0 left-0 top-0 rounded-l-[3px]"
        style={{
          width: config.spine,
          background:
            book.spineDark ||
            "#302454",
        }}
      >
        <div className="absolute bottom-2 left-[2px] top-2 w-[1px] bg-white/15" />
      </div>

      {/* Cover */}

      <div
        className="absolute bottom-0 left-[6px] right-0 top-0 overflow-hidden rounded-r-[4px] border border-black/10 bg-[#15132a] shadow-[5px_8px_12px_rgba(34,27,58,0.28)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[7px_12px_18px_rgba(34,27,58,0.32)]"
        style={{
          transform: "rotateY(-3deg)",
          transformOrigin: "left center",
        }}
      >
        {/* Cover Image */}

        <img
          src={book.cover}
          alt={book.title}
          className="h-full w-full object-cover"
        />

        {/* Dark Overlay */}

        <div className="absolute inset-0 bg-gradient-to-b from-[#050516]/15 via-transparent to-[#080611]/55" />

        {/* Top book title */}

        <div className="absolute inset-x-1.5 top-3 text-center">
          <p
            className="font-bold leading-[1.25] tracking-[0.02em] text-[#f6b847] drop-shadow-md"
            style={{
              fontSize: config.title,
            }}
          >
            {formatBookTitle(book.title)}
          </p>
        </div>

        {/* Decorative stars */}

        {book.type === "premium" && (
          <>
            <Star
              size={5}
              className="absolute left-[18%] top-[28%] fill-[#f6ba45] text-[#f6ba45]"
            />

            <Star
              size={4}
              className="absolute right-[18%] top-[38%] fill-[#f6ba45] text-[#f6ba45]"
            />
          </>
        )}

        {/* Bottom shine */}

        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/25 to-transparent" />
      </div>
    </div>
  );
};

/* ========================================================================== */
/*                               QUICK ACTIONS                                */
/* ========================================================================== */

const QuickActions = () => {
  const actions = [
    {
      title: "Create New Book",
      subtitle: "Start a new magical story",
      icon: Plus,
      iconBg: "bg-[#f1edff]",
      iconColor: "text-[#6145b6]",
    },
    {
      title: "AI Story Ideas",
      subtitle: "Get inspired with ideas",
      icon: Sparkles,
      iconBg: "bg-[#f6efff]",
      iconColor: "text-[#754bb5]",
    },
    {
      title: "Browse Templates",
      subtitle: "Choose from beautiful templates",
      icon: FileText,
      iconBg: "bg-[#eeeaff]",
      iconColor: "text-[#5d47b5]",
    },
    {
      title: "My Characters",
      subtitle: "View your created characters",
      icon: BrainCircuit,
      iconBg: "bg-[#f1ebff]",
      iconColor: "text-[#6a46bd]",
    },
  ];

  return (
    <section className="overflow-hidden rounded-[10px] border border-[#ebe9f2] bg-white shadow-[0_4px_20px_rgba(72,55,125,0.04)]">

      <div className="px-4 pb-3 pt-4">
        <h2 className="text-[12px] font-bold text-[#383d58]">
          Quick Actions
        </h2>
      </div>

      <div className="divide-y divide-[#f0eef4]">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#fbfaff]"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] ${action.iconBg} ${action.iconColor}`}
              >
                <Icon size={15} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold text-[#454a65]">
                  {action.title}
                </p>

                <p className="mt-1 truncate text-[8px] text-[#9194a5]">
                  {action.subtitle}
                </p>
              </div>

              <ChevronRight
                size={14}
                className="text-[#8d8fa0]"
              />
            </button>
          );
        })}
      </div>
    </section>
  );
};

/* ========================================================================== */
/*                               JOURNEY CARD                                 */
/* ========================================================================== */

const JourneyCard = () => {
  const stats = [
    {
      label: "Stories Created",
      value: "8",
      icon: BookOpen,
    },
    {
      label: "Pages Written",
      value: "124",
      icon: FileText,
    },
    {
      label: "Books Completed",
      value: "3",
      icon: BookOpen,
    },
    {
      label: "Hours Imagined",
      value: "6.5",
      icon: Clock3,
    },
  ];

  return (
    <section className="overflow-hidden rounded-[10px] border border-[#ebe9f2] bg-white shadow-[0_4px_20px_rgba(72,55,125,0.04)]">

      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <h2 className="text-[12px] font-bold text-[#383d58]">
          Your Journey
        </h2>

        <button className="flex items-center gap-1 rounded-[4px] border border-[#ebe8f0] px-2 py-1 text-[8px] text-[#777b92]">
          This Month
          <ChevronRight
            size={10}
            className="rotate-90"
          />
        </button>
      </div>

      <div className="divide-y divide-[#f0eef4]">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#f3f0fc] text-[#7359c6]">
                <Icon size={13} />
              </div>

              <span className="flex-1 text-[9px] font-medium text-[#676b83]">
                {stat.label}
              </span>

              <span className="text-[10px] font-bold text-[#44405f]">
                {stat.value}
              </span>

              <ChevronRight
                size={11}
                className="text-[#aaa9b4]"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};

/* ========================================================================== */
/*                              IDEAS DRAWER                                  */
/* ========================================================================== */

const IdeasDrawer = ({
  open,
  onClose,
}) => {
  const ideas = [
    {
      icon: RocketIdeaIcon,
      title: "A Mysterious Signal",
      description:
        "Arav discovers a strange signal coming from a distant planet. Buddy insists they investigate.",
      color: "#7563C9",
      background: "#F7F5FF",
    },
    {
      icon: StarIdeaIcon,
      title: "The Lost Star",
      description:
        "A tiny star has fallen from the sky and needs Arav and Buddy's help to find its way home.",
      color: "#E59A32",
      background: "#FFF9F0",
    },
    {
      icon: PlanetIdeaIcon,
      title: "A Planet That Talks",
      description:
        "Their spaceship lands on a mysterious planet where everything — even the trees — can talk.",
      color: "#3E9A77",
      background: "#F2FBF7",
    },
    {
      icon: RobotIdeaIcon,
      title: "Buddy's Robot Friend",
      description:
        "Buddy meets a friendly little robot who knows a secret about the universe.",
      color: "#B45A8A",
      background: "#FFF5FA",
    },
    {
      icon: WandSparkles,
      title: "The Cosmic Door",
      description:
        "Arav finds a glowing door floating in space that leads somewhere completely unexpected.",
      color: "#5368A5",
      background: "#F4F6FF",
    },
  ];

  return (
    <>
      {/* Overlay */}

      <div
        onClick={onClose}
        className={`
          fixed inset-0 z-40 bg-[#1d1738]/20 backdrop-blur-[1px]
          transition-opacity duration-300
          ${
            open
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
      />

      {/* Drawer */}

      <aside
        className={`
          fixed bottom-0 right-0 top-0 z-50
          flex w-full max-w-[460px] flex-col
          border-l border-[#e6e1ef] bg-[#fcfbff]
          shadow-[-15px_0_45px_rgba(42,31,75,0.12)]
          transition-transform duration-500 ease-out
          ${
            open
              ? "translate-x-0"
              : "translate-x-full"
          }
        `}
      >
        {/* Drawer Header */}

        <div className="border-b border-[#ece9f2] px-7 pb-5 pt-7">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#eee9ff] text-[#6045b7]">
                  <Lightbulb size={20} />
                </div>

                <div>
                  <h2 className="text-[18px] font-bold text-[#333853]">
                    Story Ideas
                  </h2>

                  <p className="mt-1 text-[10px] text-[#85899d]">
                    Fresh inspiration for your adventure
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#777b91] transition hover:bg-[#f1eff6] hover:text-[#4d3b98]"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* Drawer Intro */}

        <div className="px-7 pt-6">
          <div className="rounded-[12px] border border-[#e5dff7] bg-gradient-to-br from-[#f7f4ff] to-[#f1eefb] p-4">
            <div className="flex items-start gap-3">
              <Sparkles
                size={18}
                className="mt-0.5 text-[#7055c7]"
              />

              <div>
                <h3 className="text-[12px] font-bold text-[#4a4c68]">
                  Where should Arav go next?
                </h3>

                <p className="mt-1 text-[10px] leading-relaxed text-[#777c92]">
                  Choose an idea below and use it to continue
                  your magical space adventure.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ideas List */}

        <div className="flex-1 overflow-y-auto px-7 py-5">
          <div className="space-y-3">
            {ideas.map((idea, index) => (
              <IdeaCard
                key={idea.title}
                idea={idea}
                index={index}
              />
            ))}
          </div>
        </div>

        {/* Drawer Footer */}

        <div className="border-t border-[#ece9f2] bg-white px-7 py-5">
          <button className="flex w-full items-center justify-center gap-2 rounded-[9px] bg-[#51309e] py-3 text-[11px] font-semibold text-white shadow-[0_6px_16px_rgba(81,48,158,0.2)] transition hover:bg-[#6341b5]">
            <Sparkles size={15} />
            Generate More Ideas
          </button>
        </div>
      </aside>
    </>
  );
};

/* ========================================================================== */
/*                                IDEA CARD                                   */
/* ========================================================================== */

const IdeaCard = ({
  idea,
  index,
}) => {
  const Icon = idea.icon;

  return (
    <button
      className="group relative w-full overflow-hidden rounded-[12px] border bg-white p-4 text-left transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(54,42,95,0.08)]"
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: idea.color,
      }}
    >
      <div className="flex gap-3">

        {/* Number */}

        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]"
          style={{
            backgroundColor: idea.background,
            color: idea.color,
          }}
        >
          <Icon size={18} />
        </div>

        {/* Text */}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[12px] font-bold text-[#42465f]">
              {idea.title}
            </h3>

            <span
              className="text-[9px] font-bold"
              style={{
                color: idea.color,
              }}
            >
              0{index + 1}
            </span>
          </div>

          <p className="mt-2 text-[10px] leading-[1.65] text-[#7b7f93]">
            {idea.description}
          </p>

          <div className="mt-3 flex items-center gap-1 text-[9px] font-semibold text-[#5a43ad] opacity-0 transition group-hover:opacity-100">
            Use this idea
            <ArrowRight size={11} />
          </div>
        </div>
      </div>
    </button>
  );
};

/* ========================================================================== */
/*                              STATUS BADGE                                  */
/* ========================================================================== */

const StatusBadge = ({ status }) => {
  const styles = {
    Completed:
      "bg-[#edf8f2] text-[#3e8a69]",

    "In Progress":
      "bg-[#fff8ed] text-[#c98a35]",

    Draft:
      "bg-[#f2f0fb] text-[#7568aa]",
  };

  return (
    <span
      className={`
        rounded-[3px] px-1.5 py-[3px]
        text-[7px] font-semibold
        ${styles[status] || styles.Draft}
      `}
    >
      {status}
    </span>
  );
};

/* ========================================================================== */
/*                              CUSTOM IDEA ICONS                             */
/* ========================================================================== */

const RocketIdeaIcon = ({ size = 18 }) => (
  <Sparkles
    size={size}
    strokeWidth={1.8}
  />
);

const StarIdeaIcon = ({ size = 18 }) => (
  <Star
    size={size}
    strokeWidth={1.8}
  />
);

const PlanetIdeaIcon = ({ size = 18 }) => (
  <div
    className="flex items-center justify-center"
    style={{
      width: size,
      height: size,
    }}
  >
    <span
      className="block rounded-full border-2 border-current"
      style={{
        width: size * 0.65,
        height: size * 0.65,
      }}
    />
  </div>
);

const RobotIdeaIcon = ({ size = 18 }) => (
  <BrainCircuit
    size={size}
    strokeWidth={1.8}
  />
);

/* ========================================================================== */
/*                              HELPER FUNCTIONS                              */
/* ========================================================================== */

const formatBookTitle = (title = "") => {
  const words = title.split(" ");

  if (words.length <= 2) return title;

  return (
    <>
      {words.slice(0, 2).join(" ")}
      <br />
      {words.slice(2).join(" ")}
    </>
  );
};

const getShortSubtitle = (book) => {
  if (book.title.includes("Space")) {
    return "Adventure";
  }

  if (book.title.includes("Forest")) {
    return "Fantasy";
  }

  if (book.title.includes("Birthday")) {
    return "Surprise";
  }

  if (book.title.includes("Unicorn")) {
    return "Dream";
  }

  if (book.title.includes("Pirate")) {
    return "Adventure";
  }

  return "Story";
};