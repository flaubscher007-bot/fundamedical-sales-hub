import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || window.navigator.standalone === true;
    if (isStandalone) return;

    // Check if dismissed before
    const dismissed = localStorage.getItem("pwa-banner-dismissed");
    if (dismissed) return;

    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    if (ios) {
      setShowBanner(true);
      return;
    }

    // Android / Chrome
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowBanner(false);
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-banner-dismissed", "1");
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a1628] border-t border-white/10 px-4 py-3 flex items-center gap-3 shadow-2xl">
        <div className="w-10 h-10 rounded-xl bg-[#00bcd4]/20 flex items-center justify-center shrink-0">
          <span className="text-[#7ed957] font-bold text-xs">FM</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">Install FundaMedical</p>
          <p className="text-slate-400 text-xs truncate">
            {isIOS ? "Add to your home screen" : "Install as app on your device"}
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="flex items-center gap-1.5 bg-[#00bcd4] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Install
        </button>
        <button onClick={dismiss} className="text-slate-400 hover:text-white shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={() => setShowIOSInstructions(false)}>
          <div className="bg-[#0a1628] w-full rounded-t-2xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg mb-4">Install on iPhone / iPad</h3>
            <ol className="space-y-3 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="bg-[#00bcd4] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                Tap the <strong className="text-white mx-1">Share</strong> button at the bottom of Safari (the square with an arrow)
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-[#00bcd4] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                Scroll down and tap <strong className="text-white mx-1">"Add to Home Screen"</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-[#00bcd4] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                Tap <strong className="text-white mx-1">"Add"</strong> in the top right corner
              </li>
            </ol>
            <button
              onClick={() => { setShowIOSInstructions(false); dismiss(); }}
              className="mt-6 w-full bg-[#00bcd4] text-white font-semibold py-3 rounded-xl"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}