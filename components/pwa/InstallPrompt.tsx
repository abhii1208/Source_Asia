"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const DISMISS_KEY = "flyahead-pwa-install-dismissed";

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

    setIsInstalled(standalone);
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "true");

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setDismissed(false);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
      setDismissed(true);
      window.localStorage.setItem(DISMISS_KEY, "true");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function installApp() {
    if (!installEvent) {
      return;
    }

    setIsInstalling(true);
    await installEvent.prompt();
    const choice = await installEvent.userChoice;

    if (choice.outcome === "accepted") {
      setIsInstalled(true);
      setDismissed(true);
      window.localStorage.setItem(DISMISS_KEY, "true");
    } else {
      setDismissed(true);
    }

    setInstallEvent(null);
    setIsInstalling(false);
  }

  function dismissPrompt() {
    setDismissed(true);
    window.localStorage.setItem(DISMISS_KEY, "true");
  }

  if (dismissed || isInstalled || !installEvent) {
    return null;
  }

  return (
    <aside className="fixed left-4 right-4 bottom-[84px] md:left-auto md:right-6 md:bottom-6 md:w-[420px] z-[80]">
      <div className="glass-panel rounded-2xl border border-primary/35 bg-primary-container/20 shadow-glass p-4">
        <p className="font-headline-md text-headline-md text-primary">Install FlyAhead App</p>
        <p className="text-sm text-on-surface mt-1">
          Install FlyAhead for faster access, cached flight views, and offline bookings support.
        </p>
        <div className="mt-4 flex gap-2 justify-end">
          <button
            type="button"
            onClick={dismissPrompt}
            className="rounded-xl border border-outline px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors focus-ring"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => void installApp()}
            disabled={isInstalling}
            className="rounded-xl bg-primary text-on-primary px-4 py-2 text-sm hover:bg-primary-container hover:text-on-primary-container transition-colors focus-ring disabled:opacity-60"
          >
            {isInstalling ? "Installing..." : "Install"}
          </button>
        </div>
      </div>
    </aside>
  );
}
