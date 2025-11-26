import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CtaSection({
  title,
  description,
  buttonText,
  to,
  buttonClassName = "",
  buttonIcon: ButtonIcon = ArrowRight,
  className = "",
  children,
}) {
  return (
    <section className={`relative pt-24 pb-24 md:pt-28 md:pb-24 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-700" />
      <div className="absolute -right-10 -bottom-24 w-72 h-72 bg-white/20 blur-3xl rounded-full" />
      <div className="absolute -left-16 -top-24 w-72 h-72 bg-cyan-300/30 blur-3xl rounded-full" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="rounded-3xl bg-white/10 border border-white/20 backdrop-blur-xl shadow-2xl p-10 md:p-14 text-center">
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6 leading-tight">
            {title}
          </h2>
          <p className="text-xl text-cyan-50/90 mb-10 leading-relaxed">{description}</p>
          <Link to={to}>
            <Button
              size="lg"
              className={`rounded-full px-10 shadow-xl shadow-cyan-900/25 ${buttonClassName}`}
            >
              {buttonText}
              {ButtonIcon && (
                <ButtonIcon className="ml-2 w-5 h-5" />
              )}
            </Button>
          </Link>
          {children}
        </div>
      </div>
    </section>
  );
}
