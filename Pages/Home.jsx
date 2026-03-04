import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { base44 } from "@/api/base44Client";
import CtaSection from "@/components/CtaSection";
import { CONTACT_INFO, PRIMARY_CTA_ROUTE_ID } from "@/config/siteConfig";
import {
  Sparkles,
  Shield,
  Award,
  Star,
  ArrowRight,
  Clock,
  MapPin,
  Phone,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["services"],
    queryFn: () => base44.entities.Service.list(),
    initialData: [],
  });

  const servicesPreview = services.slice(0, 3);
  const appointmentUrl = createPageUrl(PRIMARY_CTA_ROUTE_ID);
  const serviceImageFallback =
    "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80";
  const heroPhoto = "/Woman Smiling.jpg";


  const trustPoints = [
    { title: "Safety guarantee", body: "Precision sterilization, medical-grade filtration, and transparent protocols for every visit." },
    { title: "Comfort-first", body: "Noise-canceling headphones, aromatherapy, warm towels, and gentle, patient-led pacing." },
    { title: "Advanced tech", body: "3D scanning, digital smile design, and minimally invasive techniques that protect healthy enamel." },
  ];

  const experiences = [
    { icon: Sparkles, title: "Minimal wait", text: "Concierge check-in with appointments that run on time." },
    { icon: Shield, title: "Insurance-friendly", text: "We work with major providers and keep billing crystal clear." },
    { icon: Award, title: "NYC-renowned team", text: "Board-certified clinicians with a portfolio of aesthetic wins." },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      text: "Best dental experience I've ever had. The team is professional, gentle, and truly cares about their patients.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      text: "My smile transformation exceeded my expectations. Dr. Williams is an artist!",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      text: "Finally found a dentist I trust. The office is modern and the staff is wonderful.",
      rating: 5,
    },
  ];

  return (
    <div className="bg-transparent">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 text-white min-h-[80vh]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.18),transparent_32%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.15),transparent_32%)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black opacity-90" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pt-40 md:pt-52 pb-0">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="relative z-10 space-y-7 pb-16 md:pb-24">
              <div className="text-sm uppercase tracking-[0.28em] text-cyan-200 font-semibold">
                NYC Smiles
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-semibold leading-tight">
                <span className="block">Because your smile</span>
                <span className="block">
                  deserves the{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-cyan-200">
                    best
                  </span>
                </span>
              </h1>
              <p className="text-lg text-slate-200 max-w-xl">
                A modern, technology-led dental studio delivering<br></br> safe, aesthetic results with concierge-level care.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild className="rounded-full px-8 h-12 text-base shadow-lg shadow-cyan-500/20">
                  <Link to={appointmentUrl}>
                    Consultation
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-white/30 text-white hover:border-cyan-300 hover:text-cyan-100 px-6 h-12 text-base">
                  <Link to={createPageUrl("Services")}>
                    View services
                  </Link>
                </Button>
              </div>
              <div className="flex flex-col gap-3 text-sm text-slate-200 pt-2">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Clock className="w-4 h-4 text-cyan-200" />
                    <span className="font-semibold text-white">Mon – Sat 8:00 – 20:00</span>
                  </div>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <MapPin className="w-4 h-4 text-cyan-200" />
                    <span className="font-semibold text-white">123 Park Avenue, New York</span>
                  </div>
                </div>
                <a
                  href={CONTACT_INFO.phone.href}
                  className="flex items-center gap-2 text-cyan-200 hover:text-white transition-colors whitespace-nowrap"
                >
                  <Phone className="w-4 h-4" />
                  {CONTACT_INFO.phone.display}
                </a>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex justify-end px-4 sm:px-6 lg:px-8">
            <div className="hidden md:block w-full max-w-[200px] md:max-w-[300px] lg:max-w-[475px] -translate-x-4 md:-translate-x-6 lg:-translate-x-10">
              <img
                src={heroPhoto}
                alt="Modern dental studio"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-[4rem] md:py-24 border-t border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.15),transparent_35%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(14,165,233,0.12),transparent_32%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-200 font-semibold">
                Why patients trust us
              </p>
              <h2 className="text-4xl md:text-5xl font-semibold leading-tight">
                Safety, comfort,
                <br />
                and results
              </h2>
              <p className="text-lg text-slate-200 max-w-xl">
                We blend meticulous clinical protocols with a calm, crafted environment—so every visit feels intentional and elevated.
              </p>
            </div>
            <div className="space-y-4">
              {trustPoints.map((point) => (
                <div key={point.title} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-lg shadow-cyan-900/20">
                  <h3 className="text-lg font-semibold mb-2">{point.title}</h3>
                  <p className="text-sm text-slate-200 leading-relaxed">{point.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Signature Services */}
      <section className="relative overflow-hidden pt-[3.75rem] pb-14 md:pt-20 md:pb-18 bg-gradient-to-br from-slate-50 via-white to-cyan-50">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -right-32 -bottom-20 w-96 h-96 bg-cyan-100 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-700 font-semibold mb-3">Signature services</p>
              <h2 className="text-4xl font-semibold text-slate-900">Tailored treatments for every smile</h2>
              <p className="text-lg text-slate-600 mt-2 max-w-2xl">
                Explore a curated selection of our most-loved services—crafted for comfort and results.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full border-2 border-cyan-500 text-cyan-700 hover:bg-cyan-500 hover:text-white px-6">
              <Link to={createPageUrl("Services")}>
                View all services
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {servicesLoading ? (
              [1, 2, 3].map((placeholder) => (
                <Card key={placeholder} className="overflow-hidden border-none shadow-xl">
                  <Skeleton className="h-64 w-full" />
                </Card>
              ))
            ) : servicesPreview.length > 0 ? (
              servicesPreview.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  viewport={{ once: true }}
                >
                  <Card className="overflow-hidden border border-slate-100 bg-white/85 backdrop-blur hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 h-full">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={service.image_url || serviceImageFallback}
                        alt={service.name}
                        className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/30 to-transparent" />
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-cyan-700 text-xs font-semibold px-3 py-1 rounded-full border border-white/60">
                        {service.category || "Dental Care"}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white space-y-2">
                        <h3 className="text-2xl font-semibold">{service.name}</h3>
                        <p className="text-white/90 line-clamp-2">{service.description}</p>
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <Button asChild variant="outline" className="rounded-full border-cyan-500 text-cyan-700 hover:bg-cyan-500 hover:text-white">
                          <Link to={createPageUrl("BookAppointment")}>
                            Book this service
                          </Link>
                        </Button>
                        <ArrowRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card className="overflow-hidden border-none shadow-xl col-span-full">
                <CardContent className="p-8 text-center text-slate-600">
                  Our team is updating service highlights. Explore all offerings on the{" "}
                  <Link to={createPageUrl("Services")} className="text-cyan-600 font-semibold hover:underline">
                    services page
                  </Link>
                  .
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Experience */}
      <section className="py-16 md:py-20 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200 font-semibold mb-3">Experience</p>
              <h2 className="text-4xl font-semibold leading-tight">Dentistry that feels like a private studio</h2>
            </div>
            <a href={CONTACT_INFO.phone.href} className="text-cyan-200 hover:text-white transition-colors">
              {CONTACT_INFO.phone.display}
            </a>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {experiences.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-lg shadow-cyan-900/20">
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-cyan-200" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-slate-200 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-[4rem] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left mb-14">
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-600 font-semibold mb-3">Patient Love</p>
            <h2 className="text-4xl font-semibold text-slate-900">Stories that make us smile</h2>
            <p className="text-lg text-slate-600 mt-3 max-w-2xl">Real voices from New Yorkers who chose us for their care.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                viewport={{ once: true }}
              >
                <Card className="border border-slate-100 bg-white/90 backdrop-blur shadow-lg hover:shadow-2xl transition-all duration-300 h-full">
                  <CardContent className="p-7 flex flex-col h-full">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 mb-6 text-lg leading-relaxed flex-1">
                      “{testimonial.text}”
                    </p>
                    <div className="font-semibold text-slate-900">{testimonial.name}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CtaSection
        title="Ready to transform your smile?"
        description="Schedule your appointment today and experience the NYC Smiles difference."
        buttonText="Book your appointment"
        to={appointmentUrl}
        buttonClassName="text-lg px-10"
        className="py-12 md:pt-16"
      />
    </div>
  );
}
