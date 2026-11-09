import { useCallback, useEffect, useState } from 'react';

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    window.navigator.standalone === true
  );
}

function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || '';
  const isIosUserAgent = /iphone|ipad|ipod/i.test(userAgent);
  const isIpadOsDesktop =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isIosUserAgent || isIpadOsDesktop;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(isStandaloneMode);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsInstalled(isStandaloneMode());
    setIsIOS(isIosDevice() && !isStandaloneMode());

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      return isIOS ? 'ios' : 'unavailable';
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
      return 'accepted';
    }

    return 'dismissed';
  }, [deferredPrompt, isIOS]);

  return {
    canInstall: Boolean(deferredPrompt) || (isIOS && !isInstalled),
    isInstalled,
    isIOS,
    install,
  };
}
