"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { BookingWithDetails } from "@/lib/types";

type UserStore = {
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
  cachedBookings: BookingWithDetails[];
  lastSyncedAt: string | null;
  setSession: (userId: string, email: string) => void;
  setCachedBookings: (bookings: BookingWithDetails[]) => void;
  resetUserStore: () => void;
};

const initialState = {
  userId: null,
  email: null,
  isAuthenticated: false,
  cachedBookings: [] as BookingWithDetails[],
  lastSyncedAt: null as string | null
};

function sanitizeCachedBookings(bookings: BookingWithDetails[]): BookingWithDetails[] {
  return bookings.map((booking) => ({
    ...booking,
    passengers: booking.passengers.map((passenger) => ({
      ...passenger,
      nationality: "",
      dateOfBirth: ""
    }))
  }));
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      ...initialState,
      setSession: (userId, email) =>
        set(() => ({
          userId,
          email,
          isAuthenticated: true
        })),
      setCachedBookings: (bookings) =>
        set(() => ({
          cachedBookings: sanitizeCachedBookings(bookings),
          lastSyncedAt: new Date().toISOString()
        })),
      resetUserStore: () =>
        set(() => ({
          ...initialState
        }))
    }),
    {
      name: "aeromint-user-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userId: state.userId,
        email: state.email,
        isAuthenticated: state.isAuthenticated,
        cachedBookings: state.cachedBookings,
        lastSyncedAt: state.lastSyncedAt
      })
    }
  )
);

export function setSession(userId: string, email: string) {
  useUserStore.getState().setSession(userId, email);
}

export function setCachedBookings(bookings: BookingWithDetails[]) {
  useUserStore.getState().setCachedBookings(bookings);
}

export function resetUserStore() {
  useUserStore.getState().resetUserStore();
}

export const setUserSession = setSession;
export const clearUserSession = resetUserStore;
