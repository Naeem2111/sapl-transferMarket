const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

export function generateOtpCode(): string {
  const digits = [];
  for (let i = 0; i < OTP_LENGTH; i++) {
    digits.push(Math.floor(Math.random() * 10));
  }
  return digits.join("");
}

export function getOtpExpiry(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + OTP_EXPIRY_MINUTES);
  return d;
}

export { OTP_EXPIRY_MINUTES };
