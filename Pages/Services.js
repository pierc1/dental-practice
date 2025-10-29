import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-50 to-cyan-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-cyan-700">Services</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Comprehensive dental care tailored to your unique needs. From preventive care to advanced treatments, we've got you covered.
            </p>
            <Link to={createPageUrl("BookAppointment")}>
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-xl shadow-cyan-500/30">
                Schedule Consultation
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
                          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full">
                            <CardHeader>
                              <CardTitle className="text-xl text-slate-900">{service.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <p className="text-slate-600">{service.description}</p>
                              
                              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
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
                                <Button variant="outline" className="w-full border-cyan-500 text-cyan-600 hover:bg-cyan-500 hover:text-white">
                                  Book This Service
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-cyan-500 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Not Sure Which Service You Need?
          </h2>
          <p className="text-xl text-cyan-50 mb-8">
            Schedule a consultation and let our expert team guide you to the perfect treatment plan
          </p>
          <Link to={createPageUrl("BookAppointment")}>
            <Button size="lg" className="bg-white text-cyan-600 hover:bg-cyan-50 shadow-xl">
              Book Free Consultation
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}