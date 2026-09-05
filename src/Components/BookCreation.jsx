import { useState } from "react";
import { Bot, Pencil, Sparkles } from "lucide-react";
import { AiBookCreation } from "./AiBookCreation";
import { ManualMode } from "./ManualMode";
export const BookCreation = () => {
  const [creationMode, setCreationMode] = useState("ai");

  return (
    <div className="relative min-h-screen w-full px-10">
      
      {/* ================= PAGE HEADER ================= */}
      <div className="relative z-20 flex items-start justify-between pt-5">
        
        {/* Greeting */}
        <div>
          <h1 className="flex items-center gap-2 text-[30px] font-bold tracking-[-0.8px] text-[#29246f]">
            Good morning, Arav!
            <span className="text-[34px]">👋</span>
          </h1>

          {/* <p className="mt-1 flex items-center gap-1 text-[18px] font-medium text-[#65688c]">
            What amazing story shall we create today?
            <Sparkles
              size={20}
              className="text-[#f3ad24]"
              fill="currentColor"
            />
          </p> */}
        </div>

        {/* ================= MODE TOGGLE ================= */}
        <div className="flex items-center rounded-full border border-[#ddd8f2] bg-white/80 p-1 shadow-sm backdrop-blur-md">
          
          {/* AI Mode */}
          <button
            onClick={() => setCreationMode("ai")}
            className={`flex h-[46px] w-[88px] items-center justify-center rounded-full transition-all duration-300 ${
              creationMode === "ai"
                ? "bg-gradient-to-br from-[#6537d7] to-[#4320b5] text-white shadow-[0_6px_18px_rgba(83,45,190,0.3)]"
                : "text-[#5c5691] hover:bg-[#f5f2ff]"
            }`}
            aria-label="AI Creation Mode"
          >
            <Bot size={24} strokeWidth={2.2} />
          </button>

          {/* Manual Mode */}
          <button
            onClick={() => setCreationMode("manual")}
            className={`flex h-[46px] w-[68px] items-center justify-center rounded-full transition-all duration-300 ${
              creationMode === "manual"
                ? "bg-gradient-to-br from-[#6537d7] to-[#4320b5] text-white shadow-[0_6px_18px_rgba(83,45,190,0.3)]"
                : "text-[#5c5691] hover:bg-[#f5f2ff]"
            }`}
            aria-label="Manual Creation Mode"
          >
            <Pencil size={22} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* ================= PAGE CONTENT ================= */}

      {creationMode === "ai" && <AiBookCreation />}

      {creationMode === "manual" && <ManualMode />}
      
    </div>
  );
};

export default BookCreation;