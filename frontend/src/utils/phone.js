import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
} from "libphonenumber-js/min";

export const DEFAULT_COUNTRY = "IN";
const PHONE_MAX_DIGITS = 15; // E.164 maximum

const regionNames =
  typeof Intl !== "undefined" && Intl.DisplayNames
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

export const COUNTRIES = getCountries()
  .map((code) => ({
    code,
    name: regionNames?.of(code) || code,
    dial: getCountryCallingCode(code),
  }))
  .sort((x, y) => x.name.localeCompare(y.name));

export const flagUrl = (code, w = 40) =>
  `https://flagcdn.com/w${w}/${code.toLowerCase()}.png`;

export const digitsOf = (v) => String(v || "").replace(/\D/g, "");

export const dialCodeOf = (country) => {
  try {
    return String(getCountryCallingCode(country || DEFAULT_COUNTRY));
  } catch {
    return "91";
  }
};

export function formatNational(digits, country) {
  const max = PHONE_MAX_DIGITS - dialCodeOf(country).length;
  let d = "";
  for (const ch of digits.slice(0, max)) {
    if (validatePhoneNumberLength(d + ch, country) === "TOO_LONG") break;
    if (
      d &&
      isValidPhoneNumber(d, country) &&
      !isValidPhoneNumber(d + ch, country)
    )
      break;
    d += ch;
  }
  return new AsYouType(country).input(d);
}

const MAIN_COUNTRY = { GG: "GB", JE: "GB", IM: "GB", CX: "AU", CC: "AU" };

export function parsePhoneInput(raw, country) {
  if (raw.trimStart().startsWith("+")) {
    const digits = digitsOf(raw).slice(0, PHONE_MAX_DIGITS);
    const parsed = parsePhoneNumberFromString(`+${digits}`);
    if (parsed?.country && parsed.isPossible()) {
      const detected = MAIN_COUNTRY[parsed.country] || parsed.country;
      return {
        country: detected,
        value: formatNational(String(parsed.nationalNumber), detected),
      };
    }
    return { country, value: digits ? `+${digits}` : "+" };
  }
  return { country, value: formatNational(digitsOf(raw), country) };
}

export function isValidPhone(value, country) {
  const v = String(value || "").trim();
  if (!v) return false;
  return v.startsWith("+")
    ? isValidPhoneNumber(v)
    : isValidPhoneNumber(v, country);
}

export function toStorablePhone(value, country) {
  const v = String(value || "").trim();
  const parsed = parsePhoneNumberFromString(
    v,
    v.startsWith("+") ? undefined : country,
  );
  if (!parsed) return null;
  const code = String(parsed.countryCallingCode);
  const phoneCountry =
    !v.startsWith("+") && dialCodeOf(country) === code
      ? country
      : MAIN_COUNTRY[parsed.country] || parsed.country || country;
  return {
    phone: String(parsed.nationalNumber),
    phoneCountry,
    phoneCode: code,
  };
}

export function displayPhone(item) {
  if (!item?.phone) return "";
  const code =
    item.phoneCode || dialCodeOf(item.phoneCountry || DEFAULT_COUNTRY);
  return `+${code} ${item.phone}`;
}

export function e164Phone(item) {
  if (!item?.phone) return "";
  const code =
    item.phoneCode || dialCodeOf(item.phoneCountry || DEFAULT_COUNTRY);
  return `+${code}${digitsOf(item.phone)}`;
}
