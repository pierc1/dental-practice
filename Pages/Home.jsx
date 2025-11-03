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
  Heart,
  Shield,
  Award,
  Star,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const features = [
    {
      icon: Sparkles,
      title: "Advanced Technology",
      description: "State-of-the-art equipment for precise, comfortable treatments"
    },
    {
      icon: Heart,
      title: "Patient-Centered Care",
      description: "Personalized treatment plans tailored to your unique needs"
    },
    {
      icon: Shield,
      title: "Insurance Accepted",
      description: "We work with most major insurance providers"
    },
    {
      icon: Award,
      title: "Expert Team",
      description: "Board-certified dentists with decades of combined experience"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      text: "Best dental experience I've ever had. The team is professional, gentle, and truly cares about their patients.",
      rating: 5
    },
    {
      name: "Michael Chen",
      text: "My smile transformation exceeded my expectations. Dr. Williams is an artist!",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      text: "Finally found a dentist I trust. The office is modern and the staff is wonderful.",
      rating: 5
    }
  ];

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["services"],
    queryFn: () => base44.entities.Service.list(),
    initialData: [],
  });

  const servicesPreview = services.slice(0, 3);
  const appointmentUrl = createPageUrl(PRIMARY_CTA_ROUTE_ID);
  const serviceImageFallback =
    "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80";

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-50 to-cyan-50 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjMDZCNkQ0IiBzdHJva2Utb3BhY2l0eT0iLjA1IiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-40"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block mb-4">
                <span className="bg-cyan-100 text-cyan-700 text-sm font-medium px-4 py-2 rounded-full">
                  Manhattan's Premier Dental Practice
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Your Perfect
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-cyan-700"> Smile</span> Starts Here
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Experience world-class dental care in the heart of NYC. From routine cleanings to complete smile makeovers, we're dedicated to your oral health.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to={appointmentUrl}>
                  <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-xl shadow-cyan-500/30 text-lg px-8">
                    Book Appointment
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a href={CONTACT_INFO.phone.href}>
                  <Button size="lg" variant="outline" className="text-lg px-8 border-2 border-slate-200 hover:border-cyan-500 hover:text-cyan-600">
                    Call Us Now
                  </Button>
                </a>
              </div>
              <div className="flex items-center gap-6 mt-8 pt-8 border-t border-slate-200">
                <div>
                  <div className="text-3xl font-bold text-slate-900">15+</div>
                  <div className="text-sm text-slate-600">Years Experience</div>
                </div>
                <div className="w-px h-12 bg-slate-200"></div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">5,000+</div>
                  <div className="text-sm text-slate-600">Happy Patients</div>
                </div>
                <div className="w-px h-12 bg-slate-200"></div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <div className="text-sm text-slate-600">5-Star Rated</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-3xl transform rotate-3"></div>
              <img
                src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80"
                alt="Modern dental office"
                className="relative rounded-3xl shadow-2xl w-full h-[500px] object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Same-Day Appointments</div>
                    <div className="text-sm text-slate-600">Available Now</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Why Choose NYC Smiles?</h2>
            <p className="text-xl text-slate-600">Experience the difference of exceptional dental care</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Services</h2>
            <p className="text-xl text-slate-600">Comprehensive dental care for every need</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
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
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 h-full">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={service.image_url || serviceImageFallback}
                        alt={service.name}
                        className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h3 className="text-2xl font-bold mb-2">{service.name}</h3>
                        <p className="text-white/90">{service.description}</p>
                      </div>
                    </div>
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

          <div className="text-center mt-12">
            <Link to={createPageUrl("Services")}>
              <Button size="lg" variant="outline" className="border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-500 hover:text-white">
                View All Services
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">What Our Patients Say</h2>
            <p className="text-xl text-slate-600">Real stories from real patients</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border-none shadow-lg h-full">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 mb-6 text-lg italic">"{testimonial.text}"</p>
                    <div className="font-semibold text-slate-900">{testimonial.name}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CtaSection
        title="Ready to Transform Your Smile?"
        description="Schedule your appointment today and experience the NYC Smiles difference"
        buttonText="Book Your Appointment"
        to={appointmentUrl}
        buttonClassName="text-lg px-10"
      />
    </div>
  );
}
