export const briefError = (error) => {
  const parts = [
    error?.name,
    error?.status ? `status ${error.status}` : null,
    error?.code,
    error?.requestID ? `request ${error.requestID}` : null,
  ].filter(Boolean);

  const message = String(error?.message || error || "unknown error")
    .replace(/\s+/g, " ")
    .slice(0, 300);

  return parts.length ? `${parts.join(" | ")}: ${message}` : message;
};