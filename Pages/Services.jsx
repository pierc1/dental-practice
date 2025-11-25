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
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-sky-50" />
        <div className="absolute -left-24 -top-24 w-[420px] h-[420px] bg-cyan-200/50 blur-3xl rounded-full" />
        <div className="absolute right-0 bottom-0 w-[420px] h-[420px] bg-blue-200/40 blur-3xl rounded-full" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-slate-100 shadow-glow-cyan mb-5">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Comprehensive Care</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-semibold text-slate-900 mb-6">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-700">signature services</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Preventive, restorative, and cosmetic dentistry crafted to your smile goals—with concierge-level comfort at every visit.
            </p>
            <Link to={createPageUrl("BookAppointment")}>
              <Button size="lg" className="rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-700 text-white shadow-xl shadow-cyan-500/30 px-8">
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
                      <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-slate-900">{category}</h2>
                        <p className="text-slate-600">{categoryServices.length} services available</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryServices.map((service, serviceIndex) => (
                        <motion.div
                          key={service.id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: serviceIndex * 0.1 }}
                          viewport={{ once: true }}
                        >
                          <Card className="border border-slate-100 bg-white/85 backdrop-blur hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-2xl h-full overflow-hidden">
                            <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-700" />
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xl text-slate-900 flex items-start justify-between gap-3">
                                <span>{service.name}</span>
                                <span className="text-xs font-semibold text-cyan-700 bg-cyan-50 border border-cyan-100 px-3 py-1 rounded-full">
                                  {category}
                                </span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                              <p className="text-slate-600 leading-relaxed">{service.description}</p>
                              
                              <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                                {service.duration && (
                                  <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Clock className="w-4 h-4 text-cyan-600" />
                                    <span>{service.duration} min</span>
                                  </div>
                                )}
                                {service.price_range && (
                                  <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <DollarSign className="w-4 h-4 text-cyan-600" />
                                    <span>{service.price_range}</span>
                                  </div>
                                )}
                              </div>

                              <Link to={createPageUrl("BookAppointment")}>
                                <Button variant="outline" className="w-full rounded-full border-cyan-500 text-cyan-700 hover:bg-cyan-500 hover:text-white">
                                  Book this service
                                </Button>
                              </Link>
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
      />
    </div>
  );
}
