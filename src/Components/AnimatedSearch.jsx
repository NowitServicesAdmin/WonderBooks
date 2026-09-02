import { Search } from "lucide-react";
import { useEffect, useState } from "react";

export function AnimatedSearch({ search, setSearch }) {
  const fullPlaceholder = "Search templates";
  const [placeholder, setPlaceholder] = useState("");

  useEffect(() => {
    // Stop animation while user is typing
    if (search) {
      setPlaceholder("");
      return;
    }

    let index = 0;
    let interval;

    const startTyping = () => {
      interval = setInterval(() => {
        if (index < fullPlaceholder.length) {
          index++;
          setPlaceholder(fullPlaceholder.slice(0, index));
        } else {
          clearInterval(interval);

          // Restart after a pause
          setTimeout(() => {
            if (!search) {
              setPlaceholder("");
              startTyping();
            }
          }, 1800);
        }
      }, 90);
    };

    startTyping();

    return () => {
      clearInterval(interval);
    };
  }, [search]);

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
}