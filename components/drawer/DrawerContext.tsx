import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { getDrawerOpen, setDrawerOpen } from '../../lib/sidebarPrefs';

type DrawerApi = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  enabled: boolean;
};

const Ctx = createContext<DrawerApi | null>(null);

function isAppPath(pathname: string) {
  return pathname === '/(app)' || pathname.startsWith('/(app)/');
}

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const enabled = useMemo(() => !isDesktop && isAppPath(pathname), [isDesktop, pathname]);
  const [open, setOpenState] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const saved = await getDrawerOpen();
        if (cancelled) return;
        setOpenState(saved);
      } catch {
        if (cancelled) return;
        setOpenState(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // If drawer is not enabled (desktop or not in app group), force close.
    if (!enabled && open) {
      setOpenState(false);
      setDrawerOpen(false).catch(() => {});
    }
  }, [enabled, open]);

  async function setOpen(openNext: boolean) {
    setOpenState(openNext);
    try {
      await setDrawerOpen(openNext);
    } catch {
      // ignore
    }
  }

  const api = useMemo<DrawerApi>(
    () => ({
      open: enabled ? open : false,
      setOpen,
      openDrawer: () => setOpen(true),
      closeDrawer: () => setOpen(false),
      toggleDrawer: () => setOpen(!open),
      enabled,
    }),
    [enabled, open]
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useDrawer() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDrawer must be used within DrawerProvider');
  return v;
}
