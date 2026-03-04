import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import CtaSection from "@/components/CtaSection";
import { CONTACT_INFO, PRIMARY_CTA_ROUTE_ID } from "@/config/siteConfig";
import {
  GraduationCap,
  Award,
  Calendar,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";

export default function Team() {
  const { data: dentists = [], isLoading } = useQuery({
    queryKey: ['dentists'],
    queryFn: () => base44.entities.Dentist.list(),
    initialData: []
  });

  const appointmentUrl = createPageUrl(PRIMARY_CTA_ROUTE_ID);

  return (
    <div className="bg-slate-950 text-white">
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
              <Award className="w-4 h-4 text-cyan-200" />
              <span className="text-sm font-semibold text-white uppercase tracking-wide">Award-Winning Dentists</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-semibold text-white mb-6">
              Meet our <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-cyan-200">expert team</span>
            </h1>
            <p className="text-xl text-slate-200 max-w-3xl mx-auto mb-8 leading-relaxed">
              Board-certified clinicians, advanced training, and a shared obsession with comfortable, beautiful outcomes.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border border-white/10 bg-white/5 shadow-lg">
                  <Skeleton className="h-80 w-full" />
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : dentists.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-10 h-10 text-cyan-200" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Our Amazing Team</h3>
              <p className="text-slate-300 mb-8">
                We're currently updating our team profiles. Please check back soon or call us to learn more about our dentists.
              </p>
              <Button asChild size="lg" className="bg-transparent border border-white text-white hover:bg-white/10">
                <a href={CONTACT_INFO.phone.href}>
                  Call to Learn More
                </a>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dentists.map((dentist, index) => (
                <motion.div
                  key={dentist.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="border border-white/10 bg-white/5 backdrop-blur transition-all duration-300 shadow-md shadow-black/30 overflow-hidden h-full flex flex-col">
                    <div className="relative h-80 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
                      {dentist.photo_url ? (
                        <img
                          src={dentist.photo_url}
                          alt={dentist.full_name}
                          className="w-full h-full object-cover"
                          style={{
                            objectPosition:
                              dentist.id === 'd1'
                                ? 'center 20%'
                                : dentist.id === 'd2'
                                  ? 'center 39%'
                                : dentist.id === 'd3'
                                  ? 'center 74%'
                                  : 'center 40%',
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-32 h-32 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center">
                            <span className="text-5xl text-white font-bold">
                              {dentist.full_name.charAt(0)}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-white/90 text-cyan-800 shadow-lg border border-white">
                          {dentist.specialty}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-6 flex flex-col flex-1">
                      <div className="flex-1">
                        <h3 className="text-2xl font-semibold text-white mb-1">
                          {dentist.full_name}
                        </h3>
                        {dentist.title && (
                          <p className="text-cyan-200 font-medium mb-4">{dentist.title}</p>
                        )}

                        {dentist.bio && (
                          <p className="text-slate-200 mb-6 line-clamp-3 leading-relaxed">{dentist.bio}</p>
                        )}

                        <div className="space-y-3 mb-6">
                          {dentist.education && (
                            <div className="flex items-start gap-3">
                              <GraduationCap className="w-5 h-5 text-cyan-200 flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="text-sm font-medium text-white">Education</div>
                                <div className="text-sm text-slate-200">{dentist.education}</div>
                              </div>
                            </div>
                          )}

                          {dentist.years_experience && (
                            <div className="flex items-start gap-3">
                              <Award className="w-5 h-5 text-cyan-200 flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="text-sm font-medium text-white">Experience</div>
                                <div className="text-sm text-slate-200">{dentist.years_experience} years</div>
                              </div>
                            </div>
                          )}

                          {dentist.available_days && dentist.available_days.length > 0 && (
                            <div className="flex items-start gap-3">
                              <Calendar className="w-5 h-5 text-cyan-200 flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="text-sm font-medium text-white">Available</div>
                                <div className="text-sm text-slate-200">
                                  {dentist.available_days.join(", ")}
                                </div>
                                {dentist.available_hours && (
                                  <div className="text-sm text-slate-200">{dentist.available_hours}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button asChild className="mt-auto w-full rounded-full border border-white text-white bg-transparent hover:bg-white/10">
                        <Link to={appointmentUrl}>
                          Book with Dr. {dentist.full_name.split(" ").pop()}
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <CtaSection
        title="Ready to Meet Your New Dentist?"
        description="Schedule an appointment with one of our experienced professionals today"
        buttonText="Book Your Appointment"
        to={appointmentUrl}
        className="pt-12 md:pt-16"
      />
    </div>
  );
}
