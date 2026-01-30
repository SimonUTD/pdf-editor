/**
 * Converts a number to Roman numerals.
 * @param num - The number to convert (must be positive)
 * @returns Roman numeral string
 * @example
 * toRoman(1) // "I"
 * toRoman(4) // "IV"
 * toRoman(1999) // "MCMXCIX"
 */
export function toRoman(num: number): string {
  if (num <= 0 || num > 3999) {
    throw new Error('Number must be between 1 and 3999 for Roman numeral conversion');
  }

  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];

  let result = '';
  let remaining = num;

  for (let i = 0; i < values.length; i++) {
    while (remaining >= values[i]) {
      result += symbols[i];
      remaining -= values[i];
    }
  }

  return result;
}

/**
 * Safely converts a number to Roman numerals.
 * Falls back to Arabic numerals if the number is out of range.
 * @param num - The number to convert (must be positive)
 * @returns Roman numeral string or Arabic number string as fallback
 * @example
 * toRomanSafe(1) // "I"
 * toRomanSafe(4000) // "4000"
 */
export function toRomanSafe(num: number): string {
  if (num <= 0 || num > 3999) {
    return String(num);
  }
  return toRoman(num);
}

/**
 * Converts Roman numerals to a number.
 * @param roman - The Roman numeral string
 * @returns The number value
 * @example
 * fromRoman("I") // 1
 * fromRoman("IV") // 4
 * fromRoman("MCMXCIX") // 1999
 */
export function fromRoman(roman: string): number {
  const romanUpper = roman.toUpperCase();
  const values: Record<string, number> = {
    'I': 1,
    'V': 5,
    'X': 10,
    'L': 50,
    'C': 100,
    'D': 500,
    'M': 1000,
  };

  let result = 0;
  let prev = 0;

  for (let i = romanUpper.length - 1; i >= 0; i--) {
    const current = values[romanUpper[i]];
    if (!current) {
      throw new Error(`Invalid Roman numeral character: ${romanUpper[i]}`);
    }

    if (current < prev) {
      result -= current;
    } else {
      result += current;
    }
    prev = current;
  }

  return result;
}
