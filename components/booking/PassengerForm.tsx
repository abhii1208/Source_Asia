"use client";

import { useState } from "react";
import type { Traveler } from "@/lib/types";

type PassengerFormProps = {
  initialValue?: Traveler;
  onSubmit: (value: Traveler) => void;
};

type FormErrors = Partial<Record<keyof Traveler, string>>;

const emptyTraveler: Traveler = {
  fullName: "",
  passportNumber: "",
  nationality: "",
  dateOfBirth: ""
};

export default function PassengerForm({ initialValue, onSubmit }: PassengerFormProps) {
  const [value, setValue] = useState<Traveler>(initialValue ?? emptyTraveler);
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (value.fullName.trim().length < 3) {
      nextErrors.fullName = "Full name must be at least 3 characters.";
    }
    const trimmedPassport = value.passportNumber.trim();
    if (trimmedPassport.length > 0 && !/^[A-Z0-9]{6,10}$/i.test(trimmedPassport)) {
      nextErrors.passportNumber = "Passport number should be 6-10 letters/numbers.";
    }
    if (value.nationality.trim().length < 2) {
      nextErrors.nationality = "Please provide nationality.";
    }
    if (!value.dateOfBirth) {
      nextErrors.dateOfBirth = "Date of birth is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    onSubmit(value);
  }

  function updateField<K extends keyof Traveler>(field: K, fieldValue: Traveler[K]) {
    setValue((current) => ({ ...current, [field]: fieldValue }));
  }

  return (
    <form onSubmit={submitForm} className="glass-panel rounded-2xl p-6 md:p-8 shadow-glass space-y-4">
      <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Passenger Details</h2>

      <label className="block">
        <span className="font-label-caps text-label-caps text-on-surface-variant">Full Name</span>
        <input
          type="text"
          value={value.fullName}
          onChange={(event) => updateField("fullName", event.target.value)}
          className="w-full mt-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 focus:ring-2 focus:ring-primary/30"
          placeholder="Enter passenger full name"
        />
        {errors.fullName ? <span className="text-sm text-error mt-1 block">{errors.fullName}</span> : null}
      </label>

      <label className="block">
        <span className="font-label-caps text-label-caps text-on-surface-variant">Passport Number (Optional)</span>
        <input
          type="text"
          value={value.passportNumber}
          onChange={(event) => updateField("passportNumber", event.target.value.toUpperCase())}
          className="w-full mt-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 focus:ring-2 focus:ring-primary/30"
          placeholder="N1234567"
        />
        {errors.passportNumber ? <span className="text-sm text-error mt-1 block">{errors.passportNumber}</span> : null}
      </label>

      <label className="block">
        <span className="font-label-caps text-label-caps text-on-surface-variant">Nationality</span>
        <input
          type="text"
          value={value.nationality}
          onChange={(event) => updateField("nationality", event.target.value)}
          className="w-full mt-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 focus:ring-2 focus:ring-primary/30"
          placeholder="Indian"
        />
        {errors.nationality ? <span className="text-sm text-error mt-1 block">{errors.nationality}</span> : null}
      </label>

      <label className="block">
        <span className="font-label-caps text-label-caps text-on-surface-variant">Date of Birth</span>
        <input
          type="date"
          value={value.dateOfBirth}
          onChange={(event) => updateField("dateOfBirth", event.target.value)}
          className="w-full mt-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 focus:ring-2 focus:ring-primary/30"
        />
        {errors.dateOfBirth ? <span className="text-sm text-error mt-1 block">{errors.dateOfBirth}</span> : null}
      </label>

      <button
        type="submit"
        className="w-full md:w-auto mt-3 bg-primary text-on-primary rounded-xl px-7 py-3 font-headline-md text-headline-md hover:bg-primary-container hover:text-on-primary-container transition-colors focus-ring"
      >
        Continue to Seat Selection
      </button>
    </form>
  );
}
