import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ROUTES, CONTACT_INFO, PRIMARY_CTA_ROUTE_ID } from "@/config/siteConfig";
import { Phone, Mail, MapPin, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpeedInsights } from "@vercel/speed-insights/react";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = ROUTES;
  const appointmentUrl = createPageUrl(PRIMARY_CTA_ROUTE_ID);

  const isActive = (url) => location.pathname === url;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-10 w-[480px] h-[480px] bg-cyan-200 blur-3xl opacity-50 mix-blend-screen"></div>
        <div className="absolute top-40 right-0 w-[540px] h-[540px] bg-blue-200 blur-3xl opacity-40 mix-blend-screen"></div>
      </div>

      {/* Top Bar */}
      <div className="relative z-20 bg-transparent backdrop-blur-sm text-white py-2 px-4 drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center text-sm text-black/85">
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs uppercase tracking-wide">New Patients Welcome</span>
            <a href={CONTACT_INFO.phone.href} className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone className="w-4 h-4" />
              <span>{CONTACT_INFO.phone.display}</span>
            </a>
            <a href={CONTACT_INFO.email.href} className="hidden md:flex items-center gap-2 hover:text-white transition-colors">
              <Mail className="w-4 h-4" />
              <span>{CONTACT_INFO.email.display}</span>
            </a>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <MapPin className="w-4 h-4" />
            <span>
              {CONTACT_INFO.address.line1}, {CONTACT_INFO.address.line2}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="absolute top-14 left-0 right-0 z-30 bg-transparent backdrop-blur-md px-4">
        <div className="max-w-7xl mx-auto px-0 sm:px-2 lg:px-4 relative">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-3 group">
              <img
                src="/NYC-smiles.svg"
                alt="NYC Smiles"
                className="h-12 md:h-16 w-auto transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`group relative px-3 py-2 text-sm font-semibold uppercase tracking-[0.08em] transition-colors drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)] ${
                    isActive(item.path) ? "text-white" : "text-white/75 hover:text-white"
                  }`}
                >
                  <span
                    className={`inline-block pb-1 border-b ${
                      isActive(item.path)
                        ? "border-white"
                        : "border-white/30 group-hover:border-white/70"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
              <Link to={appointmentUrl}>
                <Button className="rounded-full border border-white/80 text-white bg-transparent hover:bg-white/10 hover:text-white px-5 h-11 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
                  Book Now
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950/90 backdrop-blur-xl border-t border-white/10 shadow-2xl">
            <div className="px-4 py-4 space-y-3 text-white">
              {navigationItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group block py-3 px-1 text-base font-semibold uppercase tracking-[0.08em] transition-colors drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)] ${
                    isActive(item.path) ? "text-white" : "text-white/75 hover:text-white"
                  }`}
                >
                  <span
                    className={`inline-block pb-1 border-b ${
                      isActive(item.path)
                        ? "border-white"
                        : "border-white/25 group-hover:border-white/70"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
              <Link to={appointmentUrl} onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full rounded-full border border-white text-white bg-transparent hover:bg-white/10">
                  Book Appointment
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="relative z-10">{children}</main>

      {/* Footer */}
      <footer className="relative mt-0 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.25),transparent_30%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.25),transparent_30%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/NYC-smiles.svg"
                  alt="NYC Smiles"
                  className="h-16 w-auto max-w-full"
                />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Elevated, technology-forward dentistry in the heart of Manhattan. Experience concierge-level care designed around your smile.
              </p>
              <div className="flex gap-3">
                <a href={CONTACT_INFO.phone.href} className="text-cyan-200 text-sm hover:text-white transition-colors underline underline-offset-4">
                  Call {CONTACT_INFO.phone.display}
                </a>
                <span className="text-slate-500">•</span>
                <a href={CONTACT_INFO.email.href} className="text-cyan-200 text-sm hover:text-white transition-colors underline underline-offset-4">
                  Email Us
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Quick Links</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li><Link to={createPageUrl("Home")} className="hover:text-white transition-colors">Home</Link></li>
                <li><Link to={createPageUrl("Services")} className="hover:text-white transition-colors">Services</Link></li>
                <li><Link to={createPageUrl("Team")} className="hover:text-white transition-colors">Our Team</Link></li>
                <li><Link to={createPageUrl("BookAppointment")} className="hover:text-white transition-colors">Book Appointment</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Office Hours</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>Mon – Fri: 8:00 AM – 6:00 PM</li>
                <li>Saturday: 9:00 AM – 3:00 PM</li>
                <li>Sunday: Closed</li>
                <li className="pt-2 text-cyan-200">Emergency care 24/7</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Visit Us</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-cyan-200" />
                  <span>
                    {CONTACT_INFO.address.line1}
                    <br />
                    {CONTACT_INFO.address.line2}
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 flex-shrink-0 text-cyan-200" />
                  <a href={CONTACT_INFO.phone.href} className="hover:text-white transition-colors">{CONTACT_INFO.phone.display}</a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 flex-shrink-0 text-cyan-200" />
                  <a href={CONTACT_INFO.email.href} className="hover:text-white transition-colors">{CONTACT_INFO.email.display}</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-left text-sm text-slate-300">
            <p>&copy; 2025 NYC Smiles Dental Practice. Crafted for confident smiles.</p>
          </div>
        </div>
      </footer>

      <SpeedInsights />
    </div>
  );
}
