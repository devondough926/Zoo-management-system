// Utility to format and normalize phone numbers
// formatPhone('(123) 456-7890') => '(123) 456-7890'
// formatPhone('1234567890') => '(123) 456-7890'
// normalizePhone('(123) 456-7890') => '1234567890'
export function normalizePhone(value) {
  if (!value) return "";
  // Only keep digits and cap to 10 digits (allow full US 10-digit numbers)
  return String(value)
    .replace(/[^0-9]/g, "")
    .slice(0, 10);
}

export function formatPhone(value) {
  if (!value) return "";
  const digits = normalizePhone(value);

  // Format progressively while typing
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  // 10 or more digits: (XXX) XXX-XXXX and append extra digits
  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 6);
  const part3 = digits.slice(6, 10);
  const rest = digits.slice(10);
  return `(${part1}) ${part2}-${part3}${rest ? " " + rest : ""}`.trim();
}

export default formatPhone;
