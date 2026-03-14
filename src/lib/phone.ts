/**
 * Normalize phone to digits only. For matching we also produce a variant
 * with local prefix (0) replaced by country code (e.g. 071... -> 2771...).
 */
export function normalizePhoneDigits(phone: string): string {
  return (phone || "").replace(/\D/g, "");
}

/**
 * Build full international number from dialing code + number (digits only).
 * E.g. dialingCode "27", number "718665667" -> "27718665667"
 */
export function toFullNumber(dialingCode: string, number: string): string {
  const code = normalizePhoneDigits(dialingCode);
  const num = normalizePhoneDigits(number);
  if (!num) return "";
  // If number already starts with country code, use as-is
  if (code && num.startsWith(code)) return num;
  return code + num;
}

/**
 * Return possible normalized forms for a stored phone (e.g. from CSV) so we can
 * match user input. E.g. "071 866 5667" with defaultCode 27 -> ["0718665667", "27718665667"]
 */
export function normalizedFormsForMatch(phone: string, defaultCountryCode = "27"): string[] {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return [];
  const forms = [digits];
  // If 10 digits and starts with 0, add variant with country code (SA/local)
  if (digits.length === 10 && digits.startsWith("0")) {
    forms.push(defaultCountryCode + digits.slice(1));
  }
  // If 9 digits and default is 27 (SA), add 27 prefix
  if (digits.length === 9 && defaultCountryCode === "27" && !digits.startsWith("0")) {
    forms.push("27" + digits);
  }
  return forms;
}

/**
 * Best number for WhatsApp: prefer authPhone (already intl), else first usable from mobile/work/home.
 * For CSV-only phones we use 27 prefix if 10 digits starting with 0.
 */
export function getWhatsAppNumber(
  authPhone: string | null,
  mobilePhone: string | null,
  workPhone: string | null,
  homePhone: string | null
): string | null {
  if (authPhone && normalizePhoneDigits(authPhone).length >= 9) {
    return normalizePhoneDigits(authPhone);
  }
  for (const ph of [mobilePhone, workPhone, homePhone]) {
    if (!ph) continue;
    const forms = normalizedFormsForMatch(ph);
    const digits = forms[0];
    if (digits.length >= 9) return forms[forms.length - 1] || digits; // prefer intl form
  }
  return null;
}

/** https://wa.me/XXXXXXXXXX (no +) */
export function getWhatsAppLink(
  authPhone: string | null,
  mobilePhone: string | null,
  workPhone: string | null,
  homePhone: string | null
): string | null {
  const num = getWhatsAppNumber(authPhone, mobilePhone, workPhone, homePhone);
  return num ? `https://wa.me/${num}` : null;
}

/** Common dialing codes for a dropdown (SA first, then Southern Africa, then common) */
export const DIALING_CODES = [
  // South Africa first
  { code: "27", country: "South Africa", label: "+27" },
  { code: "254", country: "Kenya", label: "+254" },
  { code: "255", country: "Tanzania", label: "+255" },
  { code: "256", country: "Uganda", label: "+256" },
  { code: "258", country: "Mozambique", label: "+258" },
  { code: "264", country: "Namibia", label: "+264" },
  { code: "268", country: "Eswatini", label: "+268" },
  { code: "255", country: "Tanzania", label: "+255" },
  { code: "260", country: "Zambia", label: "+260" },
  { code: "263", country: "Zimbabwe", label: "+263" },
  { code: "244", country: "Angola", label: "+244" },
  { code: "261", country: "Madagascar", label: "+261" },
  { code: "230", country: "Mauritius", label: "+230" },
  { code: "248", country: "Seychelles", label: "+248" },
  { code: "269", country: "Comoros", label: "+269" },
  // Rest of Africa
  { code: "213", country: "Algeria", label: "+213" },
  { code: "237", country: "Cameroon", label: "+237" },
  { code: "243", country: "DR Congo", label: "+243" },
  { code: "242", country: "Congo", label: "+242" },
  { code: "20", country: "Egypt", label: "+20" },
  { code: "251", country: "Ethiopia", label: "+251" },
  { code: "233", country: "Ghana", label: "+233" },
  { code: "225", country: "Ivory Coast", label: "+225" },
  { code: "254", country: "Kenya", label: "+254" },
  { code: "218", country: "Libya", label: "+218" },
  { code: "212", country: "Morocco", label: "+212" },
  { code: "234", country: "Nigeria", label: "+234" },
  { code: "250", country: "Rwanda", label: "+250" },
  { code: "221", country: "Senegal", label: "+221" },
  { code: "249", country: "Sudan", label: "+249" },
  { code: "211", country: "South Sudan", label: "+211" },
  { code: "216", country: "Tunisia", label: "+216" },
  { code: "256", country: "Uganda", label: "+256" },
  // Europe
  { code: "355", country: "Albania", label: "+355" },
  { code: "43", country: "Austria", label: "+43" },
  { code: "32", country: "Belgium", label: "+32" },
  { code: "387", country: "Bosnia", label: "+387" },
  { code: "359", country: "Bulgaria", label: "+359" },
  { code: "385", country: "Croatia", label: "+385" },
  { code: "357", country: "Cyprus", label: "+357" },
  { code: "420", country: "Czech Republic", label: "+420" },
  { code: "45", country: "Denmark", label: "+45" },
  { code: "372", country: "Estonia", label: "+372" },
  { code: "358", country: "Finland", label: "+358" },
  { code: "33", country: "France", label: "+33" },
  { code: "49", country: "Germany", label: "+49" },
  { code: "30", country: "Greece", label: "+30" },
  { code: "36", country: "Hungary", label: "+36" },
  { code: "354", country: "Iceland", label: "+354" },
  { code: "353", country: "Ireland", label: "+353" },
  { code: "39", country: "Italy", label: "+39" },
  { code: "371", country: "Latvia", label: "+371" },
  { code: "370", country: "Lithuania", label: "+370" },
  { code: "352", country: "Luxembourg", label: "+352" },
  { code: "356", country: "Malta", label: "+356" },
  { code: "382", country: "Montenegro", label: "+382" },
  { code: "31", country: "Netherlands", label: "+31" },
  { code: "47", country: "Norway", label: "+47" },
  { code: "48", country: "Poland", label: "+48" },
  { code: "351", country: "Portugal", label: "+351" },
  { code: "40", country: "Romania", label: "+40" },
  { code: "7", country: "Russia", label: "+7" },
  { code: "381", country: "Serbia", label: "+381" },
  { code: "421", country: "Slovakia", label: "+421" },
  { code: "386", country: "Slovenia", label: "+386" },
  { code: "34", country: "Spain", label: "+34" },
  { code: "46", country: "Sweden", label: "+46" },
  { code: "41", country: "Switzerland", label: "+41" },
  { code: "90", country: "Turkey", label: "+90" },
  { code: "383", country: "Kosovo", label: "+383" },
  { code: "389", country: "North Macedonia", label: "+389" },
  { code: "44", country: "UK", label: "+44" },
  // Americas
  { code: "1", country: "USA/Canada", label: "+1" },
  { code: "54", country: "Argentina", label: "+54" },
  { code: "55", country: "Brazil", label: "+55" },
  { code: "56", country: "Chile", label: "+56" },
  { code: "57", country: "Colombia", label: "+57" },
  { code: "52", country: "Mexico", label: "+52" },
  { code: "51", country: "Peru", label: "+51" },
  { code: "58", country: "Venezuela", label: "+58" },
  // Middle East & Gulf
  { code: "973", country: "Bahrain", label: "+973" },
  { code: "972", country: "Israel", label: "+972" },
  { code: "964", country: "Iraq", label: "+964" },
  { code: "962", country: "Jordan", label: "+962" },
  { code: "965", country: "Kuwait", label: "+965" },
  { code: "961", country: "Lebanon", label: "+961" },
  { code: "974", country: "Qatar", label: "+974" },
  { code: "966", country: "Saudi Arabia", label: "+966" },
  { code: "971", country: "UAE", label: "+971" },
  // Asia Pacific
  { code: "61", country: "Australia", label: "+61" },
  { code: "880", country: "Bangladesh", label: "+880" },
  { code: "86", country: "China", label: "+86" },
  { code: "852", country: "Hong Kong", label: "+852" },
  { code: "91", country: "India", label: "+91" },
  { code: "62", country: "Indonesia", label: "+62" },
  { code: "81", country: "Japan", label: "+81" },
  { code: "60", country: "Malaysia", label: "+60" },
  { code: "977", country: "Nepal", label: "+977" },
  { code: "64", country: "New Zealand", label: "+64" },
  { code: "92", country: "Pakistan", label: "+92" },
  { code: "63", country: "Philippines", label: "+63" },
  { code: "65", country: "Singapore", label: "+65" },
  { code: "82", country: "South Korea", label: "+82" },
  { code: "94", country: "Sri Lanka", label: "+94" },
  { code: "886", country: "Taiwan", label: "+886" },
  { code: "66", country: "Thailand", label: "+66" },
  { code: "84", country: "Vietnam", label: "+84" },
];
