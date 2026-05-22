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

export function isTodayOrFutureDate(dateInput: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return false;
  }

  const date = new Date(`${dateInput}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date.getTime() >= today.getTime();
}

export function getTodayDateInputValue(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
