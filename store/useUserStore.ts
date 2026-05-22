"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { BookingWithDetails } from "@/lib/types";

type UserStore = {
  sessionToken: string | null;
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
  cachedBookings: BookingWithDetails[];
  lastSyncedAt: string | null;
  setSession: (userId: string, email: string, sessionToken?: string | null) => void;
  setSessionToken: (sessionToken: string | null) => void;
  setCachedBookings: (bookings: BookingWithDetails[]) => void;
  resetUserStore: () => void;
};

const initialState = {
  sessionToken: null,
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
      setSession: (userId, email, sessionToken = null) =>
        set(() => ({
          sessionToken,
          userId,
          email,
          isAuthenticated: true
        })),
      setSessionToken: (sessionToken) =>
        set((state) => ({
          sessionToken,
          isAuthenticated: state.isAuthenticated || Boolean(sessionToken)
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
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<UserStore>;
        const sessionToken = typeof state.sessionToken === "string" ? state.sessionToken : null;
        return {
          ...initialState,
          sessionToken,
          isAuthenticated: Boolean(sessionToken),
          cachedBookings: Array.isArray(state.cachedBookings) ? state.cachedBookings : [],
          lastSyncedAt: typeof state.lastSyncedAt === "string" ? state.lastSyncedAt : null
        };
      },
      partialize: (state) => ({
        sessionToken: state.sessionToken,
        cachedBookings: state.cachedBookings,
        lastSyncedAt: state.lastSyncedAt
      })
    }
  )
);

export function setSession(userId: string, email: string, sessionToken?: string | null) {
  useUserStore.getState().setSession(userId, email, sessionToken ?? null);
}

export function setCachedBookings(bookings: BookingWithDetails[]) {
  useUserStore.getState().setCachedBookings(bookings);
}

export function resetUserStore() {
  useUserStore.getState().resetUserStore();
}

export const setUserSession = setSession;
export const clearUserSession = resetUserStore;
