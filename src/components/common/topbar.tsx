// src/components/Topbar.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./button";

// Chevron Icon (rotates when open)
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`w-4 h-4 ml-1 transition-transform ${open ? "rotate-180" : ""}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

// Hamburger / Close Icon (SVG)
const HamburgerIcon = ({ open }: { open: boolean }) => (
  <svg
    className="w-6 h-6 text-gray-800"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    {open ? (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16M4 12h16" />
    )}
  </svg>
);

export default function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const router = useRouter();

  const menuVariants = {
    hidden: { height: 0, opacity: 0, transition: { duration: 0.3 } },
    visible: { height: "auto", opacity: 1, transition: { duration: 0.3 } },
    exit: { height: 0, opacity: 0, transition: { duration: 0.3 } },
  };

  const servicesMenuVariants = {
    hidden: { opacity: 0, y: -10, transition: { duration: 0.2 } },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  const links = [
    { label: "Contact Us", href: "/contact" },
    { label: "About", href: "/about" },
  ];

  const services = [
    { label: "Consulting", href: "/services/consulting" },
    { label: "Campaign Management", href: "/services/campaigns" },
    { label: "Influencer Analytics", href: "/services/analytics" },
    { label: "Brand Strategy", href: "/services/strategy" },
  ];

  return (
    <header className="fixed top-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center">
        {/* Left: Logo, using a plain <img> */}
        <Link href="/" className="flex-shrink-0 flex items-center">
          <img
            src="/logo.jpeg"       /* Make sure `public/logo.jpeg` really exists with that exact name */
            alt="Brand Logo"
            width={50}
            height={50}
            className="object-contain rounded-full"
          />
        </Link>

        {/* Center: Nav links (desktop only) */}
        <nav className="hidden lg:flex items-center space-x-8 ml-50">
          {/* Services dropdown */}
          <div className="relative">
            <button
              onClick={() => setServicesOpen((prev) => !prev)}
              className="flex items-center text-gray-800 font-medium transition hover:text-[#ef2f5b] focus:outline-none"
            >
              <span>Services</span>
              <ChevronIcon open={servicesOpen} />
            </button>
            <AnimatePresence initial={false}>
              {servicesOpen && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={servicesMenuVariants}
                  className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden z-20"
                >
                  <ul>
                    {services.map(({ label, href }) => (
                      <li key={label} className="border-b last:border-b-0">
                        <Link
                          href={href}
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                          onClick={() => setServicesOpen(false)}
                        >
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Other links */}
          {links.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="relative text-gray-800 font-medium transition hover:text-[#ef2f5b]"
            >
              {label}
              <span className="absolute left-0 -bottom-0.5 w-0 h-0.5 bg-[#ef2f5b] transition-all duration-300 hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Right: Login button (desktop) */}
        <div className="ml-auto hidden lg:flex">
          <Button onClick={() => router.push("/login")}>Login</Button>
        </div>

        {/* Mobile Hamburger */}
        <div className="lg:hidden ml-auto">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            className="p-2 rounded-md hover:bg-gray-100 transition"
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </div>
      </div>

      {/* Mobile Menu (with Framer Motion) */}
      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={menuVariants}
            className="lg:hidden bg-white border-t border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 space-y-4">
              {/* Mobile: Services as accordion-style */}
              <div>
                <button
                  onClick={() => setServicesOpen((prev) => !prev)}
                  className="flex items-center text-gray-800 font-medium transition hover:text-[#ef2f5b] focus:outline-none"
                >
                  <span>Services</span>
                  <ChevronIcon open={servicesOpen} />
                </button>
                <AnimatePresence initial={false}>
                  {servicesOpen && (
                    <motion.ul
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={servicesMenuVariants}
                      className="mt-2 space-y-2"
                    >
                      {services.map(({ label, href }) => (
                        <li key={label}>
                          <Link
                            href={href}
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
                            onClick={() => {
                              setMenuOpen(false);
                              setServicesOpen(false);
                            }}
                          >
                            {label}
                          </Link>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              {/* Other mobile links */}
              {links.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="block text-gray-800 hover:text-[#ef2f5b] font-medium transition"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}

              <Button
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/login");
                }}
                className="block w-full"
              >
                Login
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
