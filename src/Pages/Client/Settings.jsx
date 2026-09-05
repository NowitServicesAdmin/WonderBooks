import React, { useState } from "react";
import {
  Sparkles,
  User,
  BookOpen,
  Bell,
  Users,
  Lock,
  HelpCircle,
  ChevronRight,
  ArrowLeft,
  Palette,
  Globe,
  Clock,
  BarChart3,
  Camera,
  KeyRound,
  Smartphone,
  History,
  Download,
  ShieldCheck,
  Trash2,
  FileText,
  Info,
  Moon,
  ClipboardCheck,
  Check,
} from "lucide-react";


const tokens = {
  ink: "#241B3A",
  inkSoft: "#5B5372",
  bg: "#F6F3FC",
  card: "#FFFFFF",
  line: "#E8E1F7",
  purple: "#6D28D9",
  purpleDeep: "#4C1D95",
  purpleTint: "#F1EBFC",
  gold: "#F0B429",
  danger: "#D64545",
};

const illustrationStyles = [
  { id: "adventure", label: "Adventure", swatch: "linear-gradient(135deg,#3B2E7A,#6D28D9)" },
  { id: "fantasy", label: "Fantasy", swatch: "linear-gradient(135deg,#B98CF0,#7C3AED)" },
  { id: "animal", label: "Animal", swatch: "linear-gradient(135deg,#F2C879,#E08E45)" },
  { id: "princess", label: "Princess", swatch: "linear-gradient(135deg,#F6B9D6,#E874B0)" },
  { id: "education", label: "Education", swatch: "linear-gradient(135deg,#8FD3E8,#3E9CC6)" },
];

/* ---------------------------------------------------------------
   Small building blocks
----------------------------------------------------------------*/
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200"
      style={{ backgroundColor: checked ? tokens.purple : "#D8D2EA" }}
      aria-pressed={checked}
    >
      <span
        className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? "translateX(20px)" : "translateX(2px)" }}
      />
    </button>
  );
}

function Row({ icon: Icon, title, description, control }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: tokens.purpleTint, color: tokens.purple }}
        >
          <Icon size={17} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: tokens.ink }}>
            {title}
          </p>
          {description && (
            <p className="mt-0.5 text-sm" style={{ color: tokens.inkSoft }}>
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0 pt-1">{control}</div>
    </div>
  );
}

function Select({ value, options }) {
  return (
    <select
      defaultValue={value}
      className="rounded-lg border bg-white px-3 py-2 text-sm outline-none"
      style={{ borderColor: tokens.line, color: tokens.ink, minWidth: 150 }}
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

function LinkRow({ icon, title, description, danger }) {
  return (
    <Row
      icon={icon}
      title={title}
      description={description}
      control={
        <ChevronRight size={18} style={{ color: danger ? tokens.danger : tokens.inkSoft }} />
      }
    />
  );
}

function Divider() {
  return <div className="h-px w-full" style={{ backgroundColor: tokens.line }} />;
}

function SaveBar() {
  return (
    <div className="mt-6 flex justify-end">
      <button
        className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.98]"
        style={{ backgroundColor: tokens.purple }}
      >
        Save changes
        <Sparkles size={15} />
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------
   Category definitions
----------------------------------------------------------------*/
function ProfilePanel() {
  const [name, setName] = useState("Ananya");
  const [email, setEmail] = useState("ananya@email.com");
  return (
    <div>
      <div className="flex items-center gap-4 pb-5">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#B98CF0,#6D28D9)" }}
        >
          AN
        </div>
        <button
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
          style={{ borderColor: tokens.line, color: tokens.ink }}
        >
          <Camera size={15} /> Change photo
        </button>
      </div>
      <Divider />
      <div className="grid grid-cols-1 gap-4 py-5 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium" style={{ color: tokens.ink }}>
            Name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 outline-none"
            style={{ borderColor: tokens.line }}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium" style={{ color: tokens.ink }}>
            Email
          </span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 outline-none"
            style={{ borderColor: tokens.line }}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium" style={{ color: tokens.ink }}>
            Language
          </span>
          <Select value="English" options={["English", "Hindi", "Telugu", "Spanish"]} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium" style={{ color: tokens.ink }}>
            Child's age group
          </span>
          <Select value="6 – 8 years" options={["3 – 5 years", "6 – 8 years", "9 – 12 years"]} />
        </label>
      </div>
      <SaveBar />
    </div>
  );
}

function StoryPreferencesPanel() {
  const [style, setStyle] = useState("adventure");
  const [moral, setMoral] = useState(true);
  const [personalized, setPersonalized] = useState(true);
  return (
    <div>
      <Row icon={Clock} title="Default story length" description="Preferred length for new stories" control={<Select value="Medium (24 pages)" options={["Short (12 pages)", "Medium (24 pages)", "Long (36 pages)"]} />} />
      <Divider />
      <Row icon={Globe} title="Preferred language" description="Language your stories are written in" control={<Select value="English" options={["English", "Hindi", "Telugu"]} />} />
      <Divider />
      <Row icon={BarChart3} title="Reading level" description="Complexity of vocabulary and sentences" control={<Select value="Intermediate" options={["Beginner", "Intermediate", "Advanced"]} />} />
      <Divider />
      <div className="py-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: tokens.purpleTint, color: tokens.purple }}>
            <Palette size={17} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: tokens.ink }}>Favourite illustration style</p>
            <p className="text-sm" style={{ color: tokens.inkSoft }}>Sets the look of new books by default</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pl-12">
          {illustrationStyles.map((s) => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className="relative flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background: s.swatch,
                  boxShadow: style === s.id ? `0 0 0 2px ${tokens.purple}` : "none",
                }}
              >
                {style === s.id && (
                  <span
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: tokens.purple }}
                  >
                    <Check size={12} />
                  </span>
                )}
              </span>
              <span className="text-xs font-medium" style={{ color: tokens.inkSoft }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
      <SaveBar />
    </div>
  );
}

function NotificationsPanel() {
  const [email, setEmail] = useState(true);
  const [alerts, setAlerts] = useState(true);
  const [tips, setTips] = useState(false);
  const [promos, setPromos] = useState(false);
  return (
    <div>
      <Row icon={Bell} title="Email notifications" description="Receive updates by email" control={<Toggle checked={email} onChange={setEmail} />} />
      <Divider />
      <Row icon={BookOpen} title="New book alerts" description="Get notified when a book finishes" control={<Toggle checked={alerts} onChange={setAlerts} />} />
      <Divider />
     
      <Row icon={Sparkles} title="Promotions" description="Special offers on premium plans" control={<Toggle checked={promos} onChange={setPromos} />} />
    </div>
  );
}



function AccountPrivacyPanel() {
  const [twoFA, setTwoFA] = useState(false);
  return (
    <div>
      <LinkRow icon={KeyRound} title="Change password" description="Update your account password" />
      <Divider />
      <Row icon={Smartphone} title="Two-factor authentication" description="Add an extra layer of security" control={<Toggle checked={twoFA} onChange={setTwoFA} />} />
      <Divider />
      <LinkRow icon={History} title="Login activity" description="See recent sign-ins to your account" />
      {/* <Divider />
      <LinkRow icon={Download} title="Download my data" description="Get a copy of everything you've stored" />
      <Divider />
      <Row icon={History} title="Data retention" description="How long we keep your stories" control={<Select value="Keep forever" options={["30 days", "1 year", "Keep forever"]} />} /> */}
      <Divider />
      <LinkRow icon={Trash2} title="Delete account" description="Permanently remove your account and data" danger />
    </div>
  );
}

function HelpAboutPanel() {
  return (
    <div>
      <Row icon={Info} title="Version" description="1.0.0" control={null} />
      <Divider />
      <Row icon={Clock} title="Last updated" description="May 28, 2025" control={null} />
      <Divider />
      <LinkRow icon={FileText} title="Terms of service" description="Read our terms and conditions" />
      <Divider />
      <LinkRow icon={Lock} title="Privacy policy" description="Read our privacy policy" />
      <Divider />
      <LinkRow icon={HelpCircle} title="Help & support" description="Get help or contact our team" />
    </div>
  );
}

const CATEGORIES = [
  { id: "profile", icon: User, title: "Profile", description: "Your name, photo and language", Panel: ProfilePanel },
  { id: "notifications", icon: Bell, title: "Notifications", description: "Choose what you hear about", Panel: NotificationsPanel },
  { id: "account", icon: Lock, title: "Account & privacy", description: "Security and data settings", Panel: AccountPrivacyPanel },
  { id: "help", icon: HelpCircle, title: "Help & about", description: "App info and support", Panel: HelpAboutPanel },
];

/* ---------------------------------------------------------------
   Page
----------------------------------------------------------------*/
export const Settings = () => {
  const [activeId, setActiveId] = useState("profile");
  const active = CATEGORIES.find((c) => c.id === activeId);
  const listRef = React.useRef(null);

  return (
    <div className="max-h-[100%] w-full " style={{ backgroundColor: "transparent" }} >
      <div className="wb-font-body px-4">
        
        {/* Title */}
       <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#05021b] sm:text-3xl">
              Settings
            </h2>
            <p className="mt-1.5 text-sm text-[#8f8ba3]">
             {active.description}
            </p>
          </div>
          </div>


        {/* -------- Always-on: list / panel split -------- */}
        <div className="h-[70%]  flex flex-row gap-8  w-[100%]">
            <div className="rounded-2xl  p-1 border-2 w-[30%]" style={{ backgroundColor: tokens.card, borderColor: tokens.line }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveId(cat.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors"
                  style={{
                    backgroundColor: cat.id === activeId ? tokens.purpleTint : "transparent",
                  }}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: cat.id === activeId ? tokens.purple : tokens.purpleTint,
                      color: cat.id === activeId ? "#fff" : tokens.purple,
                    }}
                  >
                    <cat.icon size={15} />
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: cat.id === activeId ? tokens.purpleDeep : tokens.ink }}
                  >
                    {cat.title}
                  </span>
                </button>
              ))}
              <img src="https://res.cloudinary.com/djdct0pxu/image/upload/v1788325763/ChatGPT_Image_Sep_2_2026_10_38_58_AM_hl3v06.png" alt="Wonder Book" className="mt-6 w-full rounded-lg" />  
            </div>

            <div className="rounded-2xl border p-6 w-[70%]" style={{ backgroundColor: tokens.card, borderColor: tokens.line }}>
              <div className="mb-4 flex items-center gap-3">
                <button
                  onClick={() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border lg:hidden"
                  style={{ borderColor: tokens.line, color: tokens.inkSoft }}
                  aria-label="Back to settings list"
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: tokens.purpleTint, color: tokens.purple }}
                  >
                    <active.icon size={16} />
                  </div>
                  <p className="wb-font-display text-lg font-semibold" style={{ color: tokens.purpleDeep }}>
                    {active.title}
                  </p>
                </div>
              </div>
              <Divider />
              <div className="pt-2">
                <active.Panel />
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}