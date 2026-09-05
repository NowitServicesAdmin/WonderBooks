

import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  Lightbulb,
 
  MoreVertical,
  PenLine,
  Plus,
  Sparkles,
  Users,
  CalendarDays,
  ChevronLeft,
  X,
} from "lucide-react";
import { templates, myBooks } from "../../Data/Templatesdata";
import { ContinueCreating } from "../../Components/AnimatedBook";
import { useNavigate } from "react-router-dom";

/* -------------------------------------------------------------------------- */
/*                               MAIN DASHBOARD                               */
/* -------------------------------------------------------------------------- */

export const Dashboard = () => {
  const [ideasOpen, setIdeasOpen] = useState(false);

  const dashboardBooks = useMemo(() => {
    const allBooks = myBooks.map((item, index) => ({
      id: item.id || index,
      title: item.title,
      cover: item.cover,
      updatedAt: item.updatedAt || `Updated ${index + 2} days ago`,
      progress: item.progress ?? (index === 4 ? 15 : 100),
    }));

    return allBooks.slice(0, 5);
  }, []);

  const templateCards = useMemo(
    () => templates.slice(0, 6),
    []
  );
  const continueBook = dashboardBooks[0];
  return (
    <>
      <main className="min-h-full px-4  sm:px-5 lg:px-6 xl:px-6 2xl:px-7">
        <div className="mx-auto w-full max-w-[1450px]">

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_342px]">
            <div className="min-w-0 space-y-4">
              <ContinueCreating
                book={continueBook}
                onGetIdeas={() => setIdeasOpen(true)}
              />

              <MyBooksSection books={dashboardBooks} />

              {/* <TemplatesSection templates={templateCards} /> */}
            </div>

            <aside className="space-y-4">
              <QuickActions />
              <JourneyCard />
              {/* <PrintBookCard /> */}
            </aside>
          </div>
        </div>
      </main>

      <IdeasDrawer open={ideasOpen} onClose={() => setIdeasOpen(false)} />
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  MY BOOKS                                  */
/* -------------------------------------------------------------------------- */

const MyBooksSection = ({ books }) => (
  <section className="rounded-[20px] border border-[#e5e2ec] bg-white px-6 py-5 shadow-[0_7px_24px_rgba(61,48,104,0.04)]">
    <SectionHeader icon={BookOpen} title="My Books" />

    <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 md:grid-cols-5">
      {books.map((book, index) => (
        <DashboardBookCard key={book.id} book={book} index={index} />
      ))}
    </div>
  </section>
);

const DashboardBookCard = ({ book, index }) => {
  const status = index === 1 || index === 3 ? "Completed" : index === 2 ? "In Progress" : index === 4 ? "Draft" : "Completed";

  return (
    <button className="group min-w-0 text-left">
      <div className="flex h-[145px] items-end justify-center sm:h-[155px]">
        <SmallBook book={book} />
      </div>

      <div className="mt-3">
        <h3 className="truncate text-[13px] font-bold text-[#39405f] group-hover:text-[#5534ae]">
          {book.title}
        </h3>

        <div className="mt-2 flex items-center justify-between gap-2">
          <StatusBadge status={status} />
          <MoreVertical size={17} className="text-[#333860]" />
        </div>

        <p className="mt-2 text-[11px] text-[#747b95]">
          {book.updatedAt || "Updated 2 days ago"}
        </p>
      </div>
    </button>
  );
};


const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {Icon && <Icon size={25} className="text-[#4d2ba4]" strokeWidth={1.9} />}
      <h2 className="text-[20px] font-bold text-[#34395c]">{title}</h2>
    </div>
    <button className="flex items-center gap-1 text-[13px] font-semibold text-[#4d319f] hover:text-[#6a49c4]">
      View All <ArrowRight size={16} />
    </button>
  </div>
);


const SmallBook = ({ book }) => (
  <div className="relative h-[145px] w-[120px] [perspective:800px]">
    <div className="absolute bottom-0 left-1/2 h-3 w-[100px] -translate-x-1/2 rounded-full bg-[#33284d]/20 blur-md" />
    <div className="absolute bottom-[4px] left-[4px] h-[118px] w-[13px] rounded-l-[4px] bg-[#27233e] shadow-[2px_5px_7px_rgba(39,31,64,0.2)]" />
    <div className="absolute bottom-[2px] right-[4px] h-[112px] w-[10px] rounded-r-[3px] border-y border-r border-[#d7c9b5] bg-[#f4ebdc]" />
    <div className="absolute bottom-[6px] left-[11px] h-[121px] w-[100px] overflow-hidden rounded-r-[6px] border border-black/20 bg-[#201b36] shadow-[5px_8px_12px_rgba(42,33,68,0.28)] [transform:rotateY(-4deg)] [transform-origin:left_center]">
      <img src={book.cover} alt={book.title} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/15" />
    </div>
    <div className="absolute bottom-[-1px] left-[29px] h-[16px] w-[7px] rounded-b-sm bg-[#ff9f15]" />
  </div>
);

/* -------------------------------------------------------------------------- */
/*                               RIGHT SIDEBAR                                */
/* -------------------------------------------------------------------------- */

const QuickActions = () => {
  const navigate=useNavigate()
  const actions = [
    { title: "Create New Book", subtitle: "Start a new magical story", icon: Plus ,navigation:'/create'},
    { title: "AI Story Ideas", subtitle: "Get inspired with ideas", icon: Sparkles ,navigation:'/home'},
    { title: "Browse Templates", subtitle: "Choose from beautiful templates", icon: FileText,navigation:'/templates' },
    { title: "My Characters", subtitle: "View your created characters", icon: Users },
  ];

  return (
    <section className="rounded-[20px] border border-[#e4e1ea] bg-white p-5 shadow-[0_7px_24px_rgba(61,48,104,0.045)]">
      <div className="mb-4 flex items-center gap-3">
        <Sparkles size={26} className="text-[#4f2aad]" />
        <h2 className="text-[21px] font-bold text-[#33385c]">Quick Actions</h2>
      </div>

      <div className="divide-y divide-[#eeeaf2]">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button key={action.title} className="flex w-full items-center gap-3 py-4 text-left first:pt-1 last:pb-1 group">
              <span className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[12px] bg-[#f0edfa] text-[#5736b1] transition group-hover:bg-[#e8e2fa]">
                <Icon size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-[#3d435f]">{action.title}</span>
                <span className="mt-1 block truncate text-[13px] text-[#68708c]">{action.subtitle}</span>
              </span>
              <ChevronRight size={20} className="text-[#6d6596]" />
            </button>
          );
        })}
      </div>
    </section>
  );
};

const JourneyCard = () => {
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const pickerRef = useRef(null);

  const stats = [
    { label: "Stories Created", value: "8", icon: FileText },
    { label: "Pages Written", value: "124", icon: PenLine },
    { label: "Books Completed", value: "3", icon: BookOpen },
    { label: "Hours Imagined", value: "6.5", icon: Clock3 },
  ];

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsMonthPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMonthSelect = (index) => {
    setSelectedMonth(index);
    setIsMonthPickerOpen(false);

    // Fetch/filter dashboard statistics here
    // Example:
    // fetchJourneyStats(selectedYear, index + 1);
  };

  const displayLabel =
    selectedMonth === currentMonth && selectedYear === currentYear
      ? "This Month"
      : `${months[selectedMonth].slice(0, 3)} ${selectedYear}`;

  return (
    <section className="relative rounded-[20px] border border-[#e4e1ea] bg-white p-5 shadow-[0_7px_24px_rgba(61,48,104,0.045)]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-[#34395d]">
            Your Journey
          </h2>
          <p className="mt-1 text-[12px] text-[#9296a8]">
            Your creative progress
          </p>
        </div>

        {/* Month Selector */}
        <div ref={pickerRef} className="relative">
          <button
            onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
            className={`flex items-center gap-2 rounded-[10px] border px-3 py-2 text-[12px] font-medium transition-all ${isMonthPickerOpen
              ? "border-[#8b6ee8] bg-[#f6f3ff] text-[#5939b1]"
              : "border-[#e5e1eb] bg-white text-[#646b85] hover:border-[#b9a9e8]"
              }`}
          >
            <CalendarDays size={14} />
            {displayLabel}
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${isMonthPickerOpen ? "rotate-180" : ""
                }`}
            />
          </button>

          {/* Month Picker Dropdown */}
          {isMonthPickerOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[290px] rounded-[16px] border border-[#e7e3ee] bg-white p-4 shadow-[0_16px_40px_rgba(61,48,104,0.15)]">

              {/* Year Navigation */}
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => setSelectedYear(selectedYear - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#72778c] transition hover:bg-[#f3f0fa] hover:text-[#5939b1]"
                >
                  <ChevronLeft size={17} />
                </button>

                <span className="text-[15px] font-bold text-[#34395d]">
                  {selectedYear}
                </span>

                <button
                  disabled={selectedYear >= currentYear}
                  onClick={() => setSelectedYear(selectedYear + 1)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${selectedYear >= currentYear
                    ? "cursor-not-allowed text-[#d4d1db]"
                    : "text-[#72778c] hover:bg-[#f3f0fa] hover:text-[#5939b1]"
                    }`}
                >
                  <ChevronRight size={17} />
                </button>
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-3 gap-2">
                {months.map((month, index) => {
                  const isSelected =
                    selectedMonth === index &&
                    selectedYear === selectedYear;

                  const isFutureMonth =
                    selectedYear === currentYear &&
                    index > currentMonth;

                  return (
                    <button
                      key={month}
                      disabled={isFutureMonth}
                      onClick={() => handleMonthSelect(index)}
                      className={`rounded-[9px] px-2 py-2.5 text-[12px] font-medium transition-all ${isSelected
                        ? "bg-[#5939b1] text-white shadow-[0_4px_10px_rgba(89,57,177,0.25)]"
                        : isFutureMonth
                          ? "cursor-not-allowed text-[#d8d5df]"
                          : "text-[#626880] hover:bg-[#f2eff9] hover:text-[#5939b1]"
                        }`}
                    >
                      {month.slice(0, 3)}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-4 border-t border-[#eeeaf2] pt-3">
                <button
                  onClick={() => {
                    setSelectedMonth(currentMonth);
                    setSelectedYear(currentYear);
                    setIsMonthPickerOpen(false);
                  }}
                  className="w-full rounded-[9px] bg-[#f3f0fa] py-2 text-[12px] font-semibold text-[#5939b1] transition hover:bg-[#ebe6f7]"
                >
                  Go to Current Month
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 divide-y divide-[#eeeaf2]">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <button
              key={stat.label}
              className="group flex w-full items-center gap-3 py-4 text-left transition"
            >
              <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-[#f1eef9] text-[#5939b1] transition group-hover:scale-105 group-hover:bg-[#e9e3fa]">
                <Icon size={18} />
              </span>

              <span className="flex-1 text-[14px] font-medium text-[#4c536f]">
                {stat.label}
              </span>

              <span className="text-[16px] font-bold text-[#303651]">
                {stat.value}
              </span>

              <ChevronRight
                size={18}
                className="text-[#b0b2bf] transition group-hover:translate-x-0.5 group-hover:text-[#5939b1]"
              />
            </button>
          );
        })}
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*                                IDEAS DRAWER                                */
/* -------------------------------------------------------------------------- */

const IdeasDrawer = ({ open, onClose }) => {
  const ideas = [
    ["A Mysterious Signal", "Arav discovers a strange signal coming from a distant planet. Buddy insists they investigate."],
    ["The Lost Star", "A tiny star has fallen from the sky and needs Arav and Buddy's help to find its way home."],
    ["A Planet That Talks", "Their spaceship lands on a mysterious planet where everything can talk."],
    ["Buddy's Robot Friend", "Buddy meets a friendly little robot who knows a secret about the universe."],
  ];

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-[#20173d]/20 backdrop-blur-[1px] transition ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside className={`fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[430px] flex-col border-l border-[#e7e2ef] bg-[#fcfbff] shadow-[-16px_0_45px_rgba(37,26,69,0.14)] transition-transform duration-500 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-start justify-between border-b border-[#ece8f2] p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#eee9ff] text-[#5735b0]"><Lightbulb size={22} /></span>
            <div>
              <h2 className="text-[20px] font-bold text-[#343955]">Story Ideas</h2>
              <p className="mt-1 text-[12px] text-[#7d8296]">Fresh inspiration for your adventure</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-[#6d7186] hover:bg-[#f1eff5]"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="rounded-[14px] border border-[#e3ddf5] bg-[#f7f4ff] p-4">
            <div className="flex gap-3"><Sparkles className="shrink-0 text-[#6749bf]" size={20} /><div><h3 className="font-bold text-[#454b67]">Where should the story go next?</h3><p className="mt-1 text-[12px] leading-5 text-[#777d92]">Choose an idea and use it to continue your magical adventure.</p></div></div>
          </div>
          <div className="mt-5 space-y-3">
            {ideas.map(([title, description], index) => (
              <button key={title} className="w-full rounded-[14px] border border-[#e7e3ed] bg-white p-4 text-left transition hover:-translate-y-[1px] hover:shadow-md">
                <div className="flex items-start justify-between gap-3"><h3 className="font-bold text-[#414661]">{title}</h3><span className="text-[#6749bf]">0{index + 1}</span></div>
                <p className="mt-2 text-[12px] leading-5 text-[#747a91]">{description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[#ece8f2] p-6">
          <button className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#4e299f] py-3.5 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(78,41,159,0.2)]"><Sparkles size={16} />Generate More Ideas</button>
        </div>
      </aside>
    </>
  );
};


const StatusBadge = ({ status }) => {
  const styles = {
    Completed: "bg-[#eaf7ef] text-[#408467]",
    "In Progress": "bg-[#fff6e7] text-[#c68830]",
    Draft: "bg-[#eef1f7] text-[#5d6684]",
  };

  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[status]}`}>{status}</span>;
};

export default Dashboard;
