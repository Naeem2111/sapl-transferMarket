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
 * Also handles: "27", "0718665667" -> "27718665667" (strips leading 0)
 */
export function toFullNumber(dialingCode: string, number: string): string {
  const code = normalizePhoneDigits(dialingCode);
  let num = normalizePhoneDigits(number);
  if (!num) return "";
  // If number already starts with country code, use as-is
  if (code && num.startsWith(code)) return num;
  // Strip leading 0 when a dialing code is provided (local format → international)
  if (code && num.startsWith("0")) {
    num = num.slice(1);
  }
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

/** All country dialing codes — South Africa first, then A-Z by country name */
export const DIALING_CODES = [
  // ── South Africa (always first) ──
  { code: "27", country: "South Africa", label: "+27 South Africa" },
  // ── All others A-Z ──
  { code: "93", country: "Afghanistan", label: "+93 Afghanistan" },
  { code: "355", country: "Albania", label: "+355 Albania" },
  { code: "213", country: "Algeria", label: "+213 Algeria" },
  { code: "376", country: "Andorra", label: "+376 Andorra" },
  { code: "244", country: "Angola", label: "+244 Angola" },
  { code: "54", country: "Argentina", label: "+54 Argentina" },
  { code: "374", country: "Armenia", label: "+374 Armenia" },
  { code: "61", country: "Australia", label: "+61 Australia" },
  { code: "43", country: "Austria", label: "+43 Austria" },
  { code: "994", country: "Azerbaijan", label: "+994 Azerbaijan" },
  { code: "1242", country: "Bahamas", label: "+1242 Bahamas" },
  { code: "973", country: "Bahrain", label: "+973 Bahrain" },
  { code: "880", country: "Bangladesh", label: "+880 Bangladesh" },
  { code: "1246", country: "Barbados", label: "+1246 Barbados" },
  { code: "375", country: "Belarus", label: "+375 Belarus" },
  { code: "32", country: "Belgium", label: "+32 Belgium" },
  { code: "229", country: "Benin", label: "+229 Benin" },
  { code: "975", country: "Bhutan", label: "+975 Bhutan" },
  { code: "591", country: "Bolivia", label: "+591 Bolivia" },
  { code: "387", country: "Bosnia", label: "+387 Bosnia" },
  { code: "267", country: "Botswana", label: "+267 Botswana" },
  { code: "55", country: "Brazil", label: "+55 Brazil" },
  { code: "673", country: "Brunei", label: "+673 Brunei" },
  { code: "359", country: "Bulgaria", label: "+359 Bulgaria" },
  { code: "226", country: "Burkina Faso", label: "+226 Burkina Faso" },
  { code: "257", country: "Burundi", label: "+257 Burundi" },
  { code: "855", country: "Cambodia", label: "+855 Cambodia" },
  { code: "237", country: "Cameroon", label: "+237 Cameroon" },
  { code: "238", country: "Cape Verde", label: "+238 Cape Verde" },
  { code: "236", country: "Central African Republic", label: "+236 Central African Republic" },
  { code: "235", country: "Chad", label: "+235 Chad" },
  { code: "56", country: "Chile", label: "+56 Chile" },
  { code: "86", country: "China", label: "+86 China" },
  { code: "57", country: "Colombia", label: "+57 Colombia" },
  { code: "269", country: "Comoros", label: "+269 Comoros" },
  { code: "242", country: "Congo", label: "+242 Congo" },
  { code: "506", country: "Costa Rica", label: "+506 Costa Rica" },
  { code: "385", country: "Croatia", label: "+385 Croatia" },
  { code: "53", country: "Cuba", label: "+53 Cuba" },
  { code: "357", country: "Cyprus", label: "+357 Cyprus" },
  { code: "420", country: "Czech Republic", label: "+420 Czech Republic" },
  { code: "45", country: "Denmark", label: "+45 Denmark" },
  { code: "253", country: "Djibouti", label: "+253 Djibouti" },
  { code: "1809", country: "Dominican Republic", label: "+1809 Dominican Republic" },
  { code: "243", country: "DR Congo", label: "+243 DR Congo" },
  { code: "593", country: "Ecuador", label: "+593 Ecuador" },
  { code: "20", country: "Egypt", label: "+20 Egypt" },
  { code: "503", country: "El Salvador", label: "+503 El Salvador" },
  { code: "240", country: "Equatorial Guinea", label: "+240 Equatorial Guinea" },
  { code: "291", country: "Eritrea", label: "+291 Eritrea" },
  { code: "372", country: "Estonia", label: "+372 Estonia" },
  { code: "268", country: "Eswatini", label: "+268 Eswatini" },
  { code: "251", country: "Ethiopia", label: "+251 Ethiopia" },
  { code: "679", country: "Fiji", label: "+679 Fiji" },
  { code: "358", country: "Finland", label: "+358 Finland" },
  { code: "33", country: "France", label: "+33 France" },
  { code: "241", country: "Gabon", label: "+241 Gabon" },
  { code: "220", country: "Gambia", label: "+220 Gambia" },
  { code: "995", country: "Georgia", label: "+995 Georgia" },
  { code: "49", country: "Germany", label: "+49 Germany" },
  { code: "233", country: "Ghana", label: "+233 Ghana" },
  { code: "30", country: "Greece", label: "+30 Greece" },
  { code: "502", country: "Guatemala", label: "+502 Guatemala" },
  { code: "224", country: "Guinea", label: "+224 Guinea" },
  { code: "245", country: "Guinea-Bissau", label: "+245 Guinea-Bissau" },
  { code: "592", country: "Guyana", label: "+592 Guyana" },
  { code: "509", country: "Haiti", label: "+509 Haiti" },
  { code: "504", country: "Honduras", label: "+504 Honduras" },
  { code: "852", country: "Hong Kong", label: "+852 Hong Kong" },
  { code: "36", country: "Hungary", label: "+36 Hungary" },
  { code: "354", country: "Iceland", label: "+354 Iceland" },
  { code: "91", country: "India", label: "+91 India" },
  { code: "62", country: "Indonesia", label: "+62 Indonesia" },
  { code: "98", country: "Iran", label: "+98 Iran" },
  { code: "964", country: "Iraq", label: "+964 Iraq" },
  { code: "353", country: "Ireland", label: "+353 Ireland" },
  { code: "972", country: "Israel", label: "+972 Israel" },
  { code: "39", country: "Italy", label: "+39 Italy" },
  { code: "225", country: "Ivory Coast", label: "+225 Ivory Coast" },
  { code: "1876", country: "Jamaica", label: "+1876 Jamaica" },
  { code: "81", country: "Japan", label: "+81 Japan" },
  { code: "962", country: "Jordan", label: "+962 Jordan" },
  { code: "7", country: "Kazakhstan", label: "+7 Kazakhstan" },
  { code: "254", country: "Kenya", label: "+254 Kenya" },
  { code: "383", country: "Kosovo", label: "+383 Kosovo" },
  { code: "965", country: "Kuwait", label: "+965 Kuwait" },
  { code: "996", country: "Kyrgyzstan", label: "+996 Kyrgyzstan" },
  { code: "856", country: "Laos", label: "+856 Laos" },
  { code: "371", country: "Latvia", label: "+371 Latvia" },
  { code: "961", country: "Lebanon", label: "+961 Lebanon" },
  { code: "266", country: "Lesotho", label: "+266 Lesotho" },
  { code: "231", country: "Liberia", label: "+231 Liberia" },
  { code: "218", country: "Libya", label: "+218 Libya" },
  { code: "423", country: "Liechtenstein", label: "+423 Liechtenstein" },
  { code: "370", country: "Lithuania", label: "+370 Lithuania" },
  { code: "352", country: "Luxembourg", label: "+352 Luxembourg" },
  { code: "853", country: "Macau", label: "+853 Macau" },
  { code: "261", country: "Madagascar", label: "+261 Madagascar" },
  { code: "265", country: "Malawi", label: "+265 Malawi" },
  { code: "60", country: "Malaysia", label: "+60 Malaysia" },
  { code: "960", country: "Maldives", label: "+960 Maldives" },
  { code: "223", country: "Mali", label: "+223 Mali" },
  { code: "356", country: "Malta", label: "+356 Malta" },
  { code: "222", country: "Mauritania", label: "+222 Mauritania" },
  { code: "230", country: "Mauritius", label: "+230 Mauritius" },
  { code: "52", country: "Mexico", label: "+52 Mexico" },
  { code: "373", country: "Moldova", label: "+373 Moldova" },
  { code: "377", country: "Monaco", label: "+377 Monaco" },
  { code: "976", country: "Mongolia", label: "+976 Mongolia" },
  { code: "382", country: "Montenegro", label: "+382 Montenegro" },
  { code: "212", country: "Morocco", label: "+212 Morocco" },
  { code: "258", country: "Mozambique", label: "+258 Mozambique" },
  { code: "95", country: "Myanmar", label: "+95 Myanmar" },
  { code: "264", country: "Namibia", label: "+264 Namibia" },
  { code: "977", country: "Nepal", label: "+977 Nepal" },
  { code: "31", country: "Netherlands", label: "+31 Netherlands" },
  { code: "64", country: "New Zealand", label: "+64 New Zealand" },
  { code: "505", country: "Nicaragua", label: "+505 Nicaragua" },
  { code: "227", country: "Niger", label: "+227 Niger" },
  { code: "234", country: "Nigeria", label: "+234 Nigeria" },
  { code: "850", country: "North Korea", label: "+850 North Korea" },
  { code: "389", country: "North Macedonia", label: "+389 North Macedonia" },
  { code: "47", country: "Norway", label: "+47 Norway" },
  { code: "968", country: "Oman", label: "+968 Oman" },
  { code: "92", country: "Pakistan", label: "+92 Pakistan" },
  { code: "970", country: "Palestine", label: "+970 Palestine" },
  { code: "507", country: "Panama", label: "+507 Panama" },
  { code: "675", country: "Papua New Guinea", label: "+675 Papua New Guinea" },
  { code: "595", country: "Paraguay", label: "+595 Paraguay" },
  { code: "51", country: "Peru", label: "+51 Peru" },
  { code: "63", country: "Philippines", label: "+63 Philippines" },
  { code: "48", country: "Poland", label: "+48 Poland" },
  { code: "351", country: "Portugal", label: "+351 Portugal" },
  { code: "974", country: "Qatar", label: "+974 Qatar" },
  { code: "262", country: "Réunion", label: "+262 Réunion" },
  { code: "40", country: "Romania", label: "+40 Romania" },
  { code: "7", country: "Russia", label: "+7 Russia" },
  { code: "250", country: "Rwanda", label: "+250 Rwanda" },
  { code: "685", country: "Samoa", label: "+685 Samoa" },
  { code: "378", country: "San Marino", label: "+378 San Marino" },
  { code: "239", country: "São Tomé and Príncipe", label: "+239 São Tomé and Príncipe" },
  { code: "966", country: "Saudi Arabia", label: "+966 Saudi Arabia" },
  { code: "221", country: "Senegal", label: "+221 Senegal" },
  { code: "381", country: "Serbia", label: "+381 Serbia" },
  { code: "248", country: "Seychelles", label: "+248 Seychelles" },
  { code: "232", country: "Sierra Leone", label: "+232 Sierra Leone" },
  { code: "65", country: "Singapore", label: "+65 Singapore" },
  { code: "421", country: "Slovakia", label: "+421 Slovakia" },
  { code: "386", country: "Slovenia", label: "+386 Slovenia" },
  { code: "252", country: "Somalia", label: "+252 Somalia" },
  { code: "82", country: "South Korea", label: "+82 South Korea" },
  { code: "211", country: "South Sudan", label: "+211 South Sudan" },
  { code: "34", country: "Spain", label: "+34 Spain" },
  { code: "94", country: "Sri Lanka", label: "+94 Sri Lanka" },
  { code: "249", country: "Sudan", label: "+249 Sudan" },
  { code: "597", country: "Suriname", label: "+597 Suriname" },
  { code: "46", country: "Sweden", label: "+46 Sweden" },
  { code: "41", country: "Switzerland", label: "+41 Switzerland" },
  { code: "963", country: "Syria", label: "+963 Syria" },
  { code: "886", country: "Taiwan", label: "+886 Taiwan" },
  { code: "992", country: "Tajikistan", label: "+992 Tajikistan" },
  { code: "255", country: "Tanzania", label: "+255 Tanzania" },
  { code: "66", country: "Thailand", label: "+66 Thailand" },
  { code: "670", country: "Timor-Leste", label: "+670 Timor-Leste" },
  { code: "228", country: "Togo", label: "+228 Togo" },
  { code: "676", country: "Tonga", label: "+676 Tonga" },
  { code: "1868", country: "Trinidad & Tobago", label: "+1868 Trinidad & Tobago" },
  { code: "216", country: "Tunisia", label: "+216 Tunisia" },
  { code: "90", country: "Turkey", label: "+90 Turkey" },
  { code: "993", country: "Turkmenistan", label: "+993 Turkmenistan" },
  { code: "256", country: "Uganda", label: "+256 Uganda" },
  { code: "380", country: "Ukraine", label: "+380 Ukraine" },
  { code: "971", country: "UAE", label: "+971 UAE" },
  { code: "44", country: "UK", label: "+44 UK" },
  { code: "598", country: "Uruguay", label: "+598 Uruguay" },
  { code: "1", country: "USA/Canada", label: "+1 USA/Canada" },
  { code: "998", country: "Uzbekistan", label: "+998 Uzbekistan" },
  { code: "678", country: "Vanuatu", label: "+678 Vanuatu" },
  { code: "58", country: "Venezuela", label: "+58 Venezuela" },
  { code: "84", country: "Vietnam", label: "+84 Vietnam" },
  { code: "967", country: "Yemen", label: "+967 Yemen" },
  { code: "260", country: "Zambia", label: "+260 Zambia" },
  { code: "263", country: "Zimbabwe", label: "+263 Zimbabwe" },
];
