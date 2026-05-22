"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CabinClass, Flight, Passenger, SearchQuery } from "@/lib/types";

export type BookingStep = "search" | "flight" | "passenger" | "seat" | "confirm";

export type PassengerFormData = {
  fullName: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
  passport_no: string;
};

type FlightSearchState = {
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string;
  passengers: number;
  cabinClass: CabinClass;
};

type FlightStore = {
  search: FlightSearchState;
  searchQuery: SearchQuery;
  selectedFlight: Flight | null;
  selectedCabin: CabinClass;
  selectedSeat: string | null;
  currentBookingStep: BookingStep;
  passengerFormData: PassengerFormData;
  setSearch: (search: Partial<FlightSearchState>) => void;
  setSearchQuery: (query: SearchQuery) => void;
  setSelectedFlight: (flight: Flight | null, cabinClass?: CabinClass) => void;
  setFlightSelection: (flight: Flight, cabinClass: CabinClass) => void;
  setSelectedSeat: (seat: string | null) => void;
  setCurrentBookingStep: (step: BookingStep) => void;
  setPassengerFormData: (passenger: Passenger | PassengerFormData) => void;
  updatePassenger: (passenger: Partial<PassengerFormData>) => void;
  clearSensitivePassengerData: () => void;
  setPassenger: (passenger: Partial<Passenger>) => void;
  resetBookingFlow: () => void;
  resetAll: () => void;
  resetStore: () => void;
};

const defaultSearch: FlightSearchState = {
  origin: "BLR",
  destination: "DEL",
  departDate: "",
  returnDate: "",
  passengers: 1,
  cabinClass: "economy"
};

const defaultSearchQuery: SearchQuery = {
  origin: "BLR",
  destination: "DEL",
  date: "",
  passengerCount: 1,
  cabinClass: "economy"
};

const defaultPassengerFormData: PassengerFormData = {
  fullName: "",
  passportNumber: "",
  nationality: "",
  dateOfBirth: "",
  passport_no: ""
};

function normalizePassenger(input: Partial<PassengerFormData>): PassengerFormData {
  return {
    fullName: input.fullName ?? "",
    passportNumber: input.passportNumber ?? input.passport_no ?? "",
    nationality: input.nationality ?? "",
    dateOfBirth: input.dateOfBirth ?? "",
    passport_no: input.passport_no ?? input.passportNumber ?? ""
  };
}

export const useFlightStore = create<FlightStore>()(
  persist(
    (set) => ({
      search: defaultSearch,
      searchQuery: defaultSearchQuery,
      selectedFlight: null,
      selectedCabin: "economy",
      selectedSeat: null,
      currentBookingStep: "search",
      passengerFormData: defaultPassengerFormData,
      setSearch: (search) =>
        set((state) => ({
          search: {
            ...state.search,
            ...search
          }
        })),
      setSearchQuery: (query) =>
        set(() => ({
          searchQuery: query,
          search: {
            origin: query.origin,
            destination: query.destination,
            departDate: query.date,
            returnDate: "",
            passengers: query.passengerCount,
            cabinClass: query.cabinClass
          }
        })),
      setSelectedFlight: (flight, cabinClass) =>
        set(() => ({
          selectedFlight: flight,
          selectedCabin: cabinClass ?? "economy",
          selectedSeat: null
        })),
      setFlightSelection: (flight, cabinClass) =>
        set(() => ({
          selectedFlight: flight,
          selectedCabin: cabinClass,
          selectedSeat: null,
          currentBookingStep: "passenger"
        })),
      setSelectedSeat: (seat) =>
        set(() => ({
          selectedSeat: seat
        })),
      setCurrentBookingStep: (step) =>
        set(() => ({
          currentBookingStep: step
        })),
      setPassengerFormData: (passenger) =>
        set(() => ({
          passengerFormData: normalizePassenger(passenger)
        })),
      updatePassenger: (passenger) =>
        set((state) => ({
          passengerFormData: {
            ...state.passengerFormData,
            ...passenger
          }
        })),
      clearSensitivePassengerData: () =>
        set((state) => ({
          passengerFormData: {
            ...state.passengerFormData,
            passportNumber: "",
            passport_no: ""
          }
        })),
      setPassenger: (passenger) =>
        set((state) => ({
          passengerFormData: {
            ...state.passengerFormData,
            ...passenger,
            passport_no: passenger.passport_no ?? passenger.passportNumber ?? state.passengerFormData.passport_no
          },
          currentBookingStep: "seat"
        })),
      resetBookingFlow: () =>
        set((state) => ({
          selectedFlight: null,
          selectedCabin: state.searchQuery.cabinClass,
          selectedSeat: null,
          passengerFormData: defaultPassengerFormData,
          currentBookingStep: "search"
        })),
      resetAll: () =>
        set(() => ({
          search: defaultSearch,
          searchQuery: defaultSearchQuery,
          selectedFlight: null,
          selectedCabin: "economy",
          selectedSeat: null,
          currentBookingStep: "search",
          passengerFormData: defaultPassengerFormData
        })),
      resetStore: () =>
        set(() => ({
          search: defaultSearch,
          searchQuery: defaultSearchQuery,
          selectedFlight: null,
          selectedCabin: "economy",
          selectedSeat: null,
          currentBookingStep: "search",
          passengerFormData: defaultPassengerFormData
        }))
    }),
    {
      name: "aeromint-flight-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlight: state.selectedFlight,
        selectedCabin: state.selectedCabin,
        selectedSeat: state.selectedSeat,
        currentBookingStep: state.currentBookingStep,
        passengerFormData: {
          ...state.passengerFormData,
          passportNumber: "",
          passport_no: ""
        }
      })
    }
  )
);
