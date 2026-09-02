

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Heart, Crown, Lock, BookOpen, Clock } from "lucide-react";
import { templates, categories, categoryThemes } from './../../Data/Templatesdata';
import { useEffect } from "react";

export const Templates = () => {
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [heartBursts, setHeartBursts] = useState({});
  const fullPlaceholder = "Search Templates";
  const [placeholder, setPlaceholder] = useState("");


  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();

    return templates.filter((template) => {
      const categoryMatch =
        activeCategory === "All" || template.category === activeCategory;

      const searchMatch =
        !query ||
        template.title.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query);

      return categoryMatch && searchMatch;
    });
  }, []);
  // Animatd search
  const AnimatedSearch = ({ search, setSearch }) => {
    return (
      <div className="flex h-11 w-[420px] items-center gap-2 rounded-xl border border-[#e4e1ed] bg-[#faf9fc] px-3.5 transition focus-within:border-[#b9b0f2] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(148,120,235,0.12)]">
        <Search
          size={18}
          strokeWidth={2}
          className="shrink-0 text-[#8c87a3]"
        />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-[#403b61] outline-none placeholder:text-[#aaa7b8]"
        />
      </div>
    );
  };

  useEffect(() => {
    // Stop animation while user is typing
    if (search) {
      setPlaceholder("");
      return;
    }
    let index = 0;
    let deleting = false;
    let timeoutId;
    const animate = () => {
      if (!deleting) {
        // Typing forward
        index++;
        setPlaceholder(fullPlaceholder.slice(0, index));
        if (index >= fullPlaceholder.length) {
          deleting = true;

          // Pause after completing the text
          timeoutId = setTimeout(animate, 1800);
          return;
        }

        timeoutId = setTimeout(animate, 90);
      } else {
        // Erasing backward
        index--;

        setPlaceholder(fullPlaceholder.slice(0, index));

        if (index <= 0) {
          deleting = false;

          // Small pause before typing again
          timeoutId = setTimeout(animate, 500);
          return;
        }

        timeoutId = setTimeout(animate, 55);
      }
    };
    animate();
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const handleTemplateClick = (id) => {
    navigate(`/templates/${id}`);
  };
  console.log("Filtered Templates:@j", filteredTemplates); // Debugging line
  return (
    <section className="w-full overflow-hidden rounded-2xl bg-transparent">
      <div className="p-3">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-extrabold tracking-tight text-[#29264d] sm:text-3xl">
                Templates
              </h2>
            </div>

            <p className="mt-1.5 text-sm text-[#8f8ba3]">
              Explore our ready-made stories and find one you love.
            </p>
          </div>

          {/* Search */}
          <AnimatedSearch
            search={search}
            setSearch={setSearch}
          />
        </div>

        {/* Categories */}
        <div className="mb-7 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => {
            const active = activeCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`
                  shrink-0 rounded-xl border px-4.5 py-2.5
                  text-[13px] font-bold
                  transition-all
                  ${active
                    ? "border-[#c8c0f6] bg-[#f0edff] text-[#624fc1] shadow-[0_2px_8px_rgba(93,43,197,0.10)]"
                    : "border-[#e5e2ed] bg-white text-[#77738d] hover:border-[#cec8e8] hover:bg-[#faf9ff]"
                  }
                `}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {filteredTemplates.map((template) => {
            const theme = categoryThemes[template.category];
            const isPremium = template.type === "premium";

            return (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateClick(template.id)}
                className="group min-w-0 text-left outline-none"
              >
                {/* BOOK COVER */}
                <div
                  className="
            relative aspect-[3/4]
            overflow-hidden
            rounded-r-[18px] rounded-l-[8px]
            bg-[#1f1b28]
            transition-all duration-300 ease-out
            group-hover:-translate-y-1.5
          "
                  style={{
                    boxShadow: `
              3px 0 0 ${theme.primary},
              0 10px 22px rgba(45,35,70,0.16)
            `,
                  }}
                >
                  {/* LEFT BOOK SPINE */}
                  <div
                    className="absolute inset-y-0 left-0 z-30 w-[7px]"
                    style={{
                      background: `linear-gradient(
                to right,
                ${theme.dark},
                ${theme.primary}
              )`,
                    }}
                  />

                  {/* RIGHT PAGE EDGE */}
                  <div
                    className="absolute inset-y-[4px] right-0 z-10 w-[3px] opacity-60"
                    style={{
                      background:
                        "linear-gradient(to bottom, #ffffff, #ece7dc, #ffffff)",
                    }}
                  />

                  {/* COVER IMAGE */}
                  <img
                    src={template.image}
                    alt={template.title}
                    className="
              absolute inset-0
              h-full w-full
              object-cover
              transition-transform duration-500 ease-out
              group-hover:scale-[1.045]
            "
                  />

                  {/* TOP COLOR OVERLAY */}
                  <div
                    className="absolute inset-0 z-[1]"
                    style={{
                      background: `
                linear-gradient(
                  to bottom,
                  ${theme.primary}22 0%,
                  transparent 35%
                )
              `,
                    }}
                  />

                  {/* DARK COVER OVERLAY */}
                  <div
                    className="absolute inset-0 z-[2]"
                    style={{
                      background: theme.gradient,
                    }}
                  />

                  {/* ================= TOP SECTION ================= */}

                  {/* CATEGORY BADGE - SOFT COLORED GLASS */}
                  <div className="absolute left-4 top-4 z-30">
                    <div
                      className="
      relative
      flex items-center gap-2
      overflow-hidden
      rounded-full
      border
      px-3.5 py-1.5
      text-[11px]
      font-bold
      tracking-[0.02em]
      text-white
      backdrop-blur-md
      shadow-[0_4px_14px_rgba(0,0,0,0.14)]
    "
                      style={{
                        background: `linear-gradient(
        135deg,
        ${theme.primary}75,
        ${theme.primary}38
      )`,
                        borderColor: `${theme.primary}DD`,
                        boxShadow: `
        0 4px 14px rgba(0,0,0,0.14),
        inset 0 1px 0 rgba(255,255,255,0.35),
        inset 0 -1px 0 rgba(0,0,0,0.08),
        0 0 10px ${theme.primary}35
      `,
                      }}
                    >
                      {/* Glass reflection */}
                      <div
                        className="
        pointer-events-none
        absolute
        inset-x-2
        top-0
        h-[48%]
        rounded-full
      "
                        style={{
                          background:
                            "linear-gradient(to bottom, rgba(255,255,255,0.28), rgba(255,255,255,0.03))",
                        }}
                      />

                      {/* Color dot */}
                      <span
                        className="
        relative z-10
        h-1.5 w-1.5
        shrink-0
        rounded-full
        bg-white/90
        shadow-[0_0_5px_rgba(255,255,255,0.8)]
      "
                      />

                      {/* Category name */}
                      <span className="relative z-10 whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
                        {template.category}
                      </span>
                    </div>
                  </div>
                  {/* FAVORITE BUTTON */}
                  <button
                    type="button"
                    onClick={(event) => toggleFavorite(event, template.id)}
                    className="
              absolute right-3 top-3 z-40
              flex h-10 w-10 items-center justify-center
              rounded-full
              bg-white/90
              backdrop-blur-md
              shadow-[0_4px_14px_rgba(0,0,0,0.16)]
              transition-all duration-200
              hover:scale-110
              active:scale-90
            "
                    aria-label="Add to favorites"
                  >
                    <Heart
                      size={19}
                      strokeWidth={1.8}
                      className={`
                transition-all duration-300
                ${favorites.includes(template.id)
                          ? "fill-[#F05B78] text-[#F05B78] scale-110"
                          : "text-[#777387]"
                        }
              `}
                    />
                  </button>

                  {/* HEART BURST */}
                  {heartBursts[template.id] && (
                    <div className="pointer-events-none absolute inset-0 z-50 overflow-visible">
                      {[...Array(10)].map((_, index) => (
                        <span
                          key={index}
                          className={`heart-burst heart-${index}`}
                        >
                          ♥
                        </span>
                      ))}
                    </div>
                  )}

                  {/* ================= BOOK TITLE ================= */}

                  <div
                    className={`
              absolute left-4 right-4 z-20 text-center
              ${isPremium ? "bottom-14" : "bottom-5"}
            `}
                  >
                    {/* Decorative line */}
                    <div className="mx-auto mb-3 flex items-center justify-center gap-2">
                      <div className="h-px w-8 bg-white/55" />

                      <div
                        className="h-1 w-1 rounded-full"
                        style={{
                          backgroundColor: theme.secondary,
                        }}
                      />

                      <div className="h-px w-8 bg-white/55" />
                    </div>

                    {/* TITLE */}
                    <h3
                      className="
                font-serif
                text-[19px]
                font-bold
                leading-[1.15]
                tracking-[0.01em]
                text-white
                drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)]
                sm:text-[21px]
              "
                    >
                      {template.title}
                    </h3>

                    {/* CATEGORY */}
                    <p
                      className="
                mt-2
                text-[10px]
                font-bold
                uppercase
                tracking-[0.2em]
                text-white/75
              "
                    >
                      {template.category}
                    </p>
                  </div>

                  {/* ================= PREMIUM CROWN - BOTTOM RIGHT ================= */}

                  {isPremium && (
                    <div
                      className="
                absolute bottom-4 right-4 z-40
                flex h-11 w-11
                items-center justify-center
                rounded-full
                border border-[#ffe6a0]
                bg-gradient-to-br
                from-[#fff6c7]
                via-[#ffd96b]
                to-[#e5a42d]
                shadow-[0_5px_16px_rgba(230,165,43,0.45)]
                transition-all duration-300
                group-hover:scale-110
                group-hover:rotate-6
              "
                      title="Premium Book"
                    >
                      {/* Inner highlight */}
                      <div
                        className="
                  absolute inset-[3px]
                  rounded-full
                  border border-white/40
                "
                      />

                      <Crown
                        size={20}
                        strokeWidth={2.2}
                        className="relative z-10 text-[#70460b]"
                      />
                    </div>
                  )}

                  {/* PREMIUM SUBTLE GLOW */}
                  {isPremium && (
                    <div
                      className="
                pointer-events-none
                absolute bottom-0 right-0 z-[5]
                h-24 w-24
                rounded-full
                opacity-30 blur-2xl
              "
                      style={{
                        background:
                          "radial-gradient(circle, #FFD15C 0%, transparent 70%)",
                      }}
                    />
                  )}

                  {/* HOVER GLOW */}
                  <div
                    className="
              pointer-events-none
              absolute inset-0 z-40
              opacity-0
              transition-opacity duration-300
              group-hover:opacity-100
            "
                    style={{
                      boxShadow: `inset 0 0 0 2px ${theme.primary}80`,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <p className="text-base font-semibold text-[#4a4665]">
                No templates found
              </p>
              <p className="mt-1.5 text-sm text-[#9995aa]">
                Try another search or category.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
