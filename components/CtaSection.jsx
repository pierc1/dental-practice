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
    <section className={`py-20 bg-gradient-to-r from-cyan-500 to-cyan-600 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          {title}
        </h2>
        <p className="text-xl text-cyan-50 mb-8">{description}</p>
        <Link to={to}>
          <Button
            size="lg"
            className={`bg-white text-cyan-600 hover:bg-cyan-50 shadow-xl ${buttonClassName}`}
          >
            {buttonText}
            {ButtonIcon && (
              <ButtonIcon className="ml-2 w-5 h-5" />
            )}
          </Button>
        </Link>
        {children}
      </div>
    </section>
  );
}

