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
              Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-cyan-700">Expert Team</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Our board-certified dentists bring decades of experience and a passion for creating beautiful, healthy smiles.
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
                <Card key={i} className="border-none shadow-lg">
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
              <div className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-10 h-10 text-cyan-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Amazing Team</h3>
              <p className="text-slate-600 mb-8">
                We're currently updating our team profiles. Please check back soon or call us to learn more about our dentists.
              </p>
              <a href={CONTACT_INFO.phone.href}>
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white">
                  Call to Learn More
                </Button>
              </a>
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
                  <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden h-full">
                    <div className="relative h-80 overflow-hidden bg-gradient-to-br from-slate-100 to-cyan-100">
                      {dentist.photo_url ? (
                        <img
                          src={dentist.photo_url}
                          alt={dentist.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-32 h-32 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center">
                            <span className="text-5xl text-white font-bold">
                              {dentist.full_name.charAt(0)}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-white text-cyan-600 shadow-lg">
                          {dentist.specialty}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <h3 className="text-2xl font-bold text-slate-900 mb-1">
                        {dentist.full_name}
                      </h3>
                      {dentist.title && (
                        <p className="text-cyan-600 font-medium mb-4">{dentist.title}</p>
                      )}

                      {dentist.bio && (
                        <p className="text-slate-600 mb-6 line-clamp-3">{dentist.bio}</p>
                      )}

                      <div className="space-y-3 mb-6">
                        {dentist.education && (
                          <div className="flex items-start gap-3">
                            <GraduationCap className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium text-slate-900">Education</div>
                              <div className="text-sm text-slate-600">{dentist.education}</div>
                            </div>
                          </div>
                        )}

                        {dentist.years_experience && (
                          <div className="flex items-start gap-3">
                            <Award className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium text-slate-900">Experience</div>
                              <div className="text-sm text-slate-600">{dentist.years_experience} years</div>
                            </div>
                          </div>
                        )}

                        {dentist.available_days && dentist.available_days.length > 0 && (
                          <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium text-slate-900">Available</div>
                              <div className="text-sm text-slate-600">
                                {dentist.available_days.join(", ")}
                              </div>
                              {dentist.available_hours && (
                                <div className="text-sm text-slate-600">{dentist.available_hours}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <Link to={appointmentUrl}>
                        <Button className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white">
                          Book with Dr. {dentist.full_name.split(" ").pop()}
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
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
      />
    </div>
  );
}
