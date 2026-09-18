const localBangladeshPhonePattern = /^01[3-9]\d{8}$/;
const countryCodeBangladeshPhonePattern = /^8801[3-9]\d{8}$/;
const internationalBangladeshPhonePattern = /^\+8801[3-9]\d{8}$/;

export function normalizeBangladeshPhone(input: string): string {
  const value = input.trim().replace(/[\s-]+/g, "");

  if (localBangladeshPhonePattern.test(value)) {
    return `+88${value}`;
  }

  if (countryCodeBangladeshPhonePattern.test(value)) {
    return `+${value}`;
  }

  if (internationalBangladeshPhonePattern.test(value)) {
    return value;
  }

  throw new Error("INVALID_BANGLADESH_PHONE");
}
