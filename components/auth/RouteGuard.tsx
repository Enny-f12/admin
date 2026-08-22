// components/auth/RouteGuard.tsx
"use client";

import { useEffect, useState, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { isPathAllowed, getDefaultRoute, Role } from "@/lib/permissions";

// ─────────────────────────────────────────────────────────────
// IMPORTANT — what this component can and can't do:
//
// useAuthStore uses zustand's `persist` middleware, which writes session
// state to localStorage. Next.js middleware runs on the edge/server and
// can only read cookies — it has no access to localStorage. So a "real"
// server-enforced route guard isn't possible with the auth setup as it
// stands today; this component is the closest available substitute, and
// it only runs in the browser, after the store has rehydrated.
//
// What it DOES stop: an honest user hitting a page they shouldn't via a
// typed URL, browser back button, or a stale bookmark from before their
// role changed — cases where the nav correctly hid the link but the page
// itself had no guard of its own.
//
// What it does NOT stop: someone deliberately editing localStorage or
// intercepting requests to fake a role. No frontend-only mechanism can
// prevent that. The only real fix is the backend rejecting API calls a
// role isn't authorized for — this component doesn't replace that, it
// just closes the obvious UX gap until backend enforcement exists.
// ─────────────────────────────────────────────────────────────
export default function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  // zustand persist hasn't necessarily rehydrated from localStorage on
  // first render — checking role before that finishes would read `user`
  // as null and incorrectly redirect a legitimately logged-in user.
  const [hydrated, setHydrated] = useState(
    () => useAuthStore.persist?.hasHydrated?.() ?? true
  );
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    const unsub = useAuthStore.persist?.onFinishHydration?.(() => setHydrated(true));
    return unsub;
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    if (!user) {
      // No session at all. This isn't this component's job — whatever
      // already redirects unauthenticated users to /login (the axios
      // 401 interceptor, or a check elsewhere in the admin layout) should
      // handle it. Don't fight over the redirect here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChecked(true);
      return;
    }

    const role = user.role as Role;
    if (!isPathAllowed(role, pathname)) {
      // Redirects to the role's own first allowed route rather than a
      // hardcoded /dashboard, since a couple of roles' allow-lists here
      // don't actually include it in every configuration you might change
      // later. Swap for a dedicated /unauthorized page if you'd rather
      // show an explicit "not allowed" message than silently redirect.
      router.replace(getDefaultRoute(role));
      return;
    }

    setChecked(true);
  }, [hydrated, user, pathname, router]);

  // Render nothing while hydration/the access check is still in flight,
  // so a restricted page doesn't flash on screen before the redirect
  // fires. This does mean a brief blank frame on every navigation within
  // the admin area — acceptable for an internal tool, but worth knowing.
  if (!hydrated || !checked) return null;

  return <>{children}</>;
}