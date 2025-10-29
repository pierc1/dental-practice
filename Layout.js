import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Phone, Mail, MapPin, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { name: "Home", url: createPageUrl("Home") },
    { name: "Services", url: createPageUrl("Services") },
    { name: "Our Team", url: createPageUrl("Team") },
    { name: "Book Appointment", url: createPageUrl("BookAppointment") },
  ];

  const isActive = (url) => location.pathname === url;

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center text-sm">
          <div className="flex items-center gap-6">
            <a href="tel:+12125551234" className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
              <Phone className="w-4 h-4" />
              <span>(212) 555-1234</span>
            </a>
            <a href="mailto:info@nycsmiles.com" className="hidden md:flex items-center gap-2 hover:text-cyan-400 transition-colors">
              <Mail className="w-4 h-4" />
              <span>info@nycsmiles.com</span>
            </a>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <MapPin className="w-4 h-4" />
            <span>123 Park Avenue, New York, NY 10016</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl text-white font-bold">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">NYC Smiles</h1>
                <p className="text-xs text-slate-500">Dental Excellence</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.url}
                  className={`text-sm font-medium transition-colors relative py-2 ${
                    isActive(item.url)
                      ? "text-cyan-600"
                      : "text-slate-600 hover:text-cyan-600"
                  }`}
                >
                  {item.name}
                  {isActive(item.url) && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600"></span>
                  )}
                </Link>
              ))}
              <Link to={createPageUrl("BookAppointment")}>
                <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-lg shadow-cyan-500/30">
                  Book Now
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-900" />
              ) : (
                <Menu className="w-6 h-6 text-slate-900" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.url}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.url)
                      ? "bg-cyan-50 text-cyan-600"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <Link to={createPageUrl("BookAppointment")} onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white">
                  Book Appointment
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <span className="text-xl text-white font-bold">S</span>
                </div>
                <div>
                  <h3 className="font-bold">NYC Smiles</h3>
                  <p className="text-xs text-slate-400">Dental Excellence</p>
                </div>
              </div>
              <p className="text-sm text-slate-400">
                Premier dental care in the heart of Manhattan. Your smile is our priority.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to={createPageUrl("Home")} className="hover:text-cyan-400 transition-colors">Home</Link></li>
                <li><Link to={createPageUrl("Services")} className="hover:text-cyan-400 transition-colors">Services</Link></li>
                <li><Link to={createPageUrl("Team")} className="hover:text-cyan-400 transition-colors">Our Team</Link></li>
                <li><Link to={createPageUrl("BookAppointment")} className="hover:text-cyan-400 transition-colors">Book Appointment</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Office Hours</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Monday - Friday: 8:00 AM - 6:00 PM</li>
                <li>Saturday: 9:00 AM - 3:00 PM</li>
                <li>Sunday: Closed</li>
                <li className="pt-2 text-cyan-400">Emergency? Call 24/7</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                  <span>123 Park Avenue<br />New York, NY 10016</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <a href="tel:+12125551234" className="hover:text-cyan-400 transition-colors">(212) 555-1234</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <a href="mailto:info@nycsmiles.com" className="hover:text-cyan-400 transition-colors">info@nycsmiles.com</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2025 NYC Smiles Dental Practice. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}