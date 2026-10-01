import { Link } from "react-router-dom";
import { IoIosMail } from "react-icons/io";
import { IoCall } from "react-icons/io5";
import { FaLocationDot, FaHouse } from "react-icons/fa6";
import { RiLoginBoxLine } from "react-icons/ri";
import { PiCopyright } from "react-icons/pi";
import PropTypes from "prop-types";
import logo from "../assets/wonder-books/wonderbook-logo.png";

const BLUE = "#1e40af";
const BLUE_LIGHT = "#08107d";
const BLUE_BG = "rgba(30,64,175,0.08)";
const BLUE_BORDER = "rgba(30,64,175,0.25)";

const SOCIALS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/NowITServices?_rdr",
    d: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/_nowitservices_/profilecard/",
    d: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z M17.5 6.5h.01 M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5z",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/nowitservices/",
    d: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z M2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@nowitservicesltd",
    d: "M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z M9.75 15.02V8.98L15.5 12l-5.75 3.02z",
  },
];

const SvgIcon = ({ d, size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export const PolicyLayout = ({ title, children }) => {
  return (
    <>
      <style>{`
        .wonpulse-policy-root {
          position: fixed;
          top: 0; left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f9fafb;
          z-index: 9999;
          overflow: hidden;
        }
        .wonpulse-policy-root .policy-content ol {
          list-style: decimal !important;
          padding-left: 20px !important;
          margin: 0 !important;
        }
        .wonpulse-policy-root .policy-content ol li {
          display: list-item !important;
        }
      `}</style>

      <div translate="no" className="notranslate wonpulse-policy-root">

        {/* ===== Header ===== */}
        <header style={{
          width: "100%",
          flexShrink: 0,
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          borderBottom: "1px solid #f3f4f6",
          zIndex: 10,
        }}>
          <div style={{
            width: "100%",
            padding: "0 24px",
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}>
            {/* Logo + Name */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link
                to="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                }}
              >
                <div className="">
                  <img
                    src={logo}
                    alt="WonderBooks"
                    style={{
                      width: 36,
                      height: 36,
                      objectFit: "contain",
                      borderRadius: 8,
                    }}
                  />
                </div>

              </Link>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: 0 }}>
                WonderBooks
              </p>
            </div>

            {/* Nav */}
            <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Link to="/" style={{ textDecoration: "none" }}>
                <span
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 14, fontWeight: 500, color: "#4b5563",
                    padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                    transition: "background 0.2s, color 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = BLUE_BG; e.currentTarget.style.color = BLUE; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4b5563"; }}
                >
                  <FaHouse size={13} /> Home
                </span>
              </Link>
              <Link to="/auth" style={{ textDecoration: "none" }}>
                <span
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 14, fontWeight: 500, color: "#fff",
                    padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                    backgroundColor: BLUE, transition: "background 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = BLUE_LIGHT)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = BLUE)}
                >
                  <RiLoginBoxLine size={14} /> Login
                </span>
              </Link>
            </nav>
          </div>
        </header>

        {/* ===== Main ===== */}
        <main style={{
          flexGrow: 1,
          width: "100%",
          padding: "24px 24px 0",
          boxSizing: "border-box",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
          {title && (
            <p style={{ fontSize: 17, fontWeight: 700, color: BLUE, marginBottom: 12, flexShrink: 0 }}>
              {title}
            </p>
          )}

          <div style={{
            width: "100%",
            background: "#ffffff",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid #e5e7eb",
            boxSizing: "border-box",
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}>
            <div style={{ padding: "16px 24px", overflowY: "auto", flexGrow: 1 }}>
              <div className="policy-content" style={{ fontSize: 14, lineHeight: 1.7, color: "#374151" }}>
                {children}
              </div>
            </div>
          </div>
        </main>

        {/* ===== Footer ===== */}
        <footer style={{
          width: "100%",
          flexShrink: 0,
          background: "#ffffff",
          borderTop: "1px solid #e5e7eb",
          padding: "12px 24px 0",
          boxSizing: "border-box",
        }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#111827" }}>
            By NOWIT SERVICES Pvt Ltd
          </p>

          <div style={{
            width: "100%",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            paddingBottom: 12,
          }}>
            {/* Call */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IoCall size={20} color={BLUE} />
              <div>
                <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>Call us</p>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#1f2937", margin: 0 }}>+91 7893536373</p>
              </div>
            </div>

            {/* Email */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IoIosMail size={20} color={BLUE} />
              <div>
                <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>Email us</p>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#1f2937", margin: 0 }}>sales@nowitservices.com</p>
              </div>
            </div>

            {/* Address */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <FaLocationDot size={18} color={BLUE} style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 14, color: "#1f2937", lineHeight: 1.5, margin: 0 }}>
                17-6-284-1, Uma Shankar Nagar,<br />
                Vijayawada, Andhra Pradesh, India - 520007
              </p>
            </div>

            {/* Socials */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                Follow Us On
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {SOCIALS.map(({ label, href, d }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                    style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: BLUE_BG, border: `1px solid ${BLUE_BORDER}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: BLUE, textDecoration: "none", transition: "all 0.2s", flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(30,64,175,0.18)"; e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = BLUE_BG; e.currentTarget.style.borderColor = BLUE_BORDER; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <SvgIcon d={d} size={13} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div style={{
            borderTop: "1px solid #e5e7eb", padding: "10px 0",
            display: "flex", justifyContent: "center", alignItems: "center",
            gap: 4, color: "#9ca3af",
          }}>
            <PiCopyright size={13} />
            <span style={{ fontSize: 12 }}>{new Date().getFullYear()} All Rights Reserved</span>
          </div>
        </footer>
      </div>
    </>
  );
};

PolicyLayout.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
};

SvgIcon.propTypes = {
  d: PropTypes.string.isRequired,
  size: PropTypes.number,
};

