"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Explorer" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-warm-200/50 bg-warm-50/80 backdrop-blur-md supports-[backdrop-filter]:bg-warm-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-xl font-bold text-warm-900 tracking-tight group-hover:text-ship-700 transition-colors">
                Ship<span className="text-ship-600">Or</span>Skip
              </span>
              <span className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-warm-200 text-warm-700 font-mono tracking-wide">
                BNB
              </span>
            </Link>
          </div>

          {/* Centered Navigation */}
          <div className="hidden md:flex items-center border border-warm-200/60 bg-white/50 rounded-full px-1.5 py-1 shadow-warm-sm backdrop-blur-sm">
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${active
                    ? "bg-white text-ship-700 shadow-sm ring-1 ring-black/5"
                    : "text-warm-600 hover:text-warm-900 hover:bg-white/60"
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/validate"
              onClick={(e) => {
                if (pathname.startsWith("/validate")) {
                  e.preventDefault();
                  window.dispatchEvent(new Event("resetValidator"));
                }
              }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all border ${pathname.startsWith("/validate")
                ? "bg-ship-50 shadow-inner border-ship-200 text-ship-700"
                : "bg-white border-warm-200 text-warm-700 hover:border-ship-300 hover:text-ship-700 hover:shadow-warm-sm"
                }`}
            >
              Validate Idea
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              href="/validate"
              onClick={(e) => {
                if (pathname.startsWith("/validate")) {
                  e.preventDefault();
                  window.dispatchEvent(new Event("resetValidator"));
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white border border-warm-200 text-warm-700 shadow-warm-sm"
            >
              Validate
            </Link>
            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              className="w-9 h-9 inline-flex items-center justify-center rounded-md text-warm-500 hover:text-warm-900 hover:bg-white/50 transition-colors"
            >
              {mobileOpen ? (
                <span className="text-xl font-bold">×</span>
              ) : (
                <span className="text-xl font-bold">≡</span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileOpen && (
          <div className="md:hidden py-3 border-t border-warm-200 space-y-1">
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                    ? "bg-ship-50 text-ship-700"
                    : "text-warm-600 hover:bg-warm-100/50 hover:text-warm-900"
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/validate"
              onClick={(e) => {
                setMobileOpen(false);
                if (pathname.startsWith("/validate")) {
                  e.preventDefault();
                  window.dispatchEvent(new Event("resetValidator"));
                }
              }}
              className="block mt-2 px-3 py-2.5 rounded-lg text-sm font-bold bg-ship-600 text-white shadow-warm-md text-center"
            >
              Validate Idea
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
