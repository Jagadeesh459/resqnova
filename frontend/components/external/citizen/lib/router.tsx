import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';

export interface RouterContextType {
  pathname: string;
  push: (href: string) => void;
  replace: (href: string) => void;
}

const RouterContext = createContext<RouterContextType>({
  pathname: '/citizen',
  push: () => {},
  replace: () => {},
});

export function normalizePath(path: string): string {
  let clean = path.split('?')[0].split('#')[0];
  if (
    (!clean || clean === '/' || clean === '' || clean.endsWith('index.html')) &&
    typeof window !== 'undefined' &&
    window.location.hash
  ) {
    clean = window.location.hash.replace(/^#/, '');
  }
  clean = clean.split('?')[0].split('#')[0];
  if (!clean || clean === '/' || clean === '' || clean.endsWith('index.html')) return '/citizen';
  // If user enters without /citizen prefix
  if (clean === '/safe-route') return '/citizen/safe-route';
  if (clean === '/shelters') return '/citizen/shelters';
  if (clean === '/alerts') return '/citizen/alerts';
  if (clean === '/sos-emergency' || clean === '/sos') return '/citizen/sos-emergency';
  return clean;
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return normalizePath(window.location.pathname);
    }
    return '/citizen';
  });

  const [, startTransition] = useTransition();

  useEffect(() => {
    const handleStateChange = () => {
      startTransition(() => {
        setPathname(normalizePath(window.location.pathname));
      });
    };

    window.addEventListener('popstate', handleStateChange);
    window.addEventListener('hashchange', handleStateChange);
    return () => {
      window.removeEventListener('popstate', handleStateChange);
      window.removeEventListener('hashchange', handleStateChange);
    };
  }, []);

  const push = (href: string) => {
    const target = normalizePath(href);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', href);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    startTransition(() => {
      setPathname(target);
    });
  };

  const replace = (href: string) => {
    const target = normalizePath(href);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', href);
    }
    startTransition(() => {
      setPathname(target);
    });
  };

  return (
    <RouterContext.Provider value={{ pathname, push, replace }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}

export function usePathname() {
  return useContext(RouterContext).pathname;
}

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function Link({ href, children, className, onClick, ...rest }: LinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);

    // If external link or modified click, use native browser behavior
    if (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('tel:') ||
      href.startsWith('mailto:') ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.defaultPrevented
    ) {
      return;
    }

    e.preventDefault();
    router.push(href);
  };

  return (
    <a href={href} onClick={handleClick} className={className} {...rest}>
      {children}
    </a>
  );
}
