import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bot, Pencil, 
  // Sparkles 
} from "lucide-react";
import { AiBookCreation } from "./AiBookCreation";
import { ManualMode } from "./ManualMode";
import { useAuth } from "../context/AuthContext";
export const BookCreation = () => {
  const location = useLocation();
  const navigate = useNavigate();
   const {user}=useAuth();

  // An idea typed in the header arrives via router state and always opens AI mode.
  const [incomingIdea] = useState(() => location.state?.idea?.trim() || "");
  const [creationMode, setCreationMode] = useState(
    location.state?.mode === "manual" && !incomingIdea ? "manual" : "ai"
  );

  // Clear the router state so a refresh doesn't resend the idea.
  useEffect(() => {
    if (location.state?.idea) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden px-10">
      
      {/* ================= PAGE HEADER ================= */}
      <div className="relative z-20 flex shrink-0 items-start justify-between pt-5">
        
        {/* Greeting */}
        <div>
          <h1 className="flex items-center gap-2 text-[30px] font-bold tracking-[-0.8px] text-[#29246f]">
            Hello, {user?.name || "Arav"}!
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
            className={`flex h-11.5 w-22 items-center justify-center rounded-full transition-all duration-300 ${
              creationMode === "ai"
                ? "bg-linear-to-br from-[#6537d7] to-(--accent-hover) text-white shadow-[0_6px_18px_rgba(83,45,190,0.3)]"
                : "text-[#5c5691] hover:bg-(--tint)"
            }`}
            aria-label="AI Creation Mode"
          >
            <Bot size={24} strokeWidth={2.2} />
          </button>

          {/* Manual Mode */}
          <button
            onClick={() => setCreationMode("manual")}
            className={`flex h-11.5 w-17 items-center justify-center rounded-full transition-all duration-300 ${
              creationMode === "manual"
                ? "bg-linear-to-br from-[#6537d7] to-(--accent-hover) text-white shadow-[0_6px_18px_rgba(83,45,190,0.3)]"
                : "text-[#5c5691] hover:bg-(--tint)"
            }`}
            aria-label="Manual Creation Mode"
          >
            <Pencil size={22} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* ================= PAGE CONTENT ================= */}

      {/* AI mode manages its own inner scroll (only the chat scrolls);
          manual mode keeps scrolling as a normal page. */}
      {creationMode === "ai" && (
        <div className="min-h-0 flex-1 overflow-hidden">
          <AiBookCreation initialIdea={incomingIdea} />
        </div>
      )}

      {creationMode === "manual" && (
        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
          <ManualMode />
        </div>
      )}
      
    </div>
  );
};

export default BookCreation;