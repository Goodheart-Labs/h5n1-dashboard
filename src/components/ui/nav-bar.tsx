"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
}

interface NavBarProps extends React.HTMLAttributes<HTMLElement> {
  items: NavItem[];
  logo?: React.ReactNode;
}

export function NavBar({ items, logo, className, ...props }: NavBarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className={cn("", className)} {...props}>
      <div className="mx-auto flex max-w-6xl items-center justify-end px-4 py-2">
        {logo && <div className="flex-shrink-0">{logo}</div>}

        {/* Desktop Navigation */}
        <div className="hidden space-x-8 md:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground/40 transition-colors hover:text-foreground/80"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile Navigation */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-4 py-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-2 text-sm font-medium text-foreground/40 transition-colors hover:text-foreground/80"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
