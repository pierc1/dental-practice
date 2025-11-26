import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import CtaSection from "@/components/CtaSection";
import { PRIMARY_CTA_ROUTE_ID } from "@/config/siteConfig";
import {
  Smile,
  Sparkles,
  Stethoscope,
  Scissors,
  Baby,
  ArrowRight,
  Clock,
  DollarSign
} from "lucide-react";
import { motion } from "framer-motion";

const categoryIcons = {
  "General Dentistry": Stethoscope,
  "Cosmetic Dentistry": Sparkles,
  "Orthodontics": Smile,
  "Oral Surgery": Scissors,
  "Pediatric Dentistry": Baby
};

export default function Services() {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
    initialData: []
  });

  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {});

  const appointmentUrl = createPageUrl(PRIMARY_CTA_ROUTE_ID);

  return (
    <div className="bg-white text-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 md:pt-36 lg:pt-40 pb-20 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.18),transparent_35%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_5%,rgba(14,165,233,0.15),transparent_30%)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black opacity-95" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/15 shadow-glow-cyan mb-5">
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span className="text-sm font-semibold text-white uppercase tracking-wide">Comprehensive Care</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-semibold text-white mb-6">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-cyan-200">signature services</span>
            </h1>
            <p className="text-xl text-slate-200 max-w-3xl mx-auto mb-10 leading-relaxed">
              Preventive, restorative, and cosmetic dentistry crafted to your smile goals—with concierge-level comfort at every visit.
            </p>
            <Link to={createPageUrl("BookAppointment")}>
              <Button size="lg" className="rounded-full border border-white text-white bg-transparent hover:bg-white/10 hover:text-white shadow-xl shadow-cyan-500/30 px-8">
                Schedule consultation
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Services by Category */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="space-y-16">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-10 w-64 mb-8" />
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-64" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-20">
              {Object.entries(groupedServices).map(([category, categoryServices], categoryIndex) => {
                const Icon = categoryIcons[category] || Smile;
                
                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 bg-cyan-50 border border-cyan-100 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200/70">
                        <Icon className="w-8 h-8 text-cyan-600" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-slate-900">{category}</h2>
                        <p className="text-slate-500">{categoryServices.length} services available</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr items-stretch">
                      {categoryServices.map((service, serviceIndex) => (
                        <motion.div
                          key={service.id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: serviceIndex * 0.1 }}
                          viewport={{ once: true }}
                          className="h-full"
                        >
                          <Card className="border border-white/15 bg-gradient-to-br from-[#14243d] via-[#0f1f35] to-[#0b1a2e] text-white transition-all duration-300 shadow-xl shadow-slate-900/40 hover:shadow-2xl h-[340px] overflow-hidden flex flex-col">
                            <div className="h-1 w-full bg-gradient-to-r from-cyan-300 via-cyan-200 to-cyan-100" />
                            <CardHeader className="pt-6 pb-5 flex items-center justify-between gap-4 min-h-[88px]">
                              <CardTitle className="text-xl text-white flex-1 leading-tight line-clamp-2">
                                {service.name}
                              </CardTitle>
                              <span className="inline-flex items-center justify-center text-center whitespace-normal break-words text-xs font-semibold text-cyan-900 bg-cyan-200 border border-cyan-200 px-3 py-1.5 rounded-full leading-tight min-h-[42px] min-w-[92px] max-w-[92px] shrink-0">
                                {category}
                              </span>
                            </CardHeader>
                            <CardContent className="flex flex-col flex-1 gap-5">
                              <div className="space-y-4 flex-1">
                                <p className="text-slate-200 leading-relaxed line-clamp-3 min-h-[72px]">{service.description}</p>
                              </div>

                              <div className="mt-auto w-full flex flex-col gap-3">
                                <div className="border-t border-white/10" />
                                <div className="flex items-center justify-start gap-4 text-slate-200 flex-wrap">
                                  {service.duration && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Clock className="w-4 h-4 text-cyan-200" />
                                      <span>{service.duration} min</span>
                                    </div>
                                  )}
                                  {service.price_range && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <DollarSign className="w-4 h-4 text-cyan-200" />
                                      <span>{service.price_range}</span>
                                    </div>
                                  )}
                                </div>

                                <Link to={createPageUrl("BookAppointment")}>
                                  <Button variant="outline" className="w-full rounded-full border-white text-white hover:bg-white/10">
                                    Book this service
                                  </Button>
                                </Link>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <CtaSection
        title="Not Sure Which Service You Need?"
        description="Schedule a consultation and let our expert team guide you to the perfect treatment plan"
        buttonText="Book Free Consultation"
        to={appointmentUrl}
        className="pt-12 md:pt-16"
      />
    </div>
  );
}
