const airportCodeRegex = /^[A-Z]{3}$/;
const nameRegex = /^[A-Za-z ]{2,100}$/;

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidAirportCode(code: string): boolean {
  return airportCodeRegex.test(code.toUpperCase());
}

export function isValidPassengerName(name: string): boolean {
  return nameRegex.test(name.trim());
}

export function isFutureDate(dateInput: string): boolean {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.getTime() > Date.now();
}

