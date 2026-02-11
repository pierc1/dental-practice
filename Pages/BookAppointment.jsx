import React, { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CONTACT_INFO } from "@/config/siteConfig";
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
} from "lucide-react";
import { motion } from "framer-motion";
import { addDays, format, startOfDay } from "date-fns";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed.");
  }

  return payload;
};

const toLocalDate = (dateKey) => new Date(`${dateKey}T00:00:00`);

export default function BookAppointment() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    contactEmail: "",
    contactPhone: "",
    serviceId: "",
    appointmentDate: "",
    slotStart: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const today = startOfDay(new Date());
  const startDateKey = format(today, "yyyy-MM-dd");
  const endDateKey = format(addDays(today, 13), "yyyy-MM-dd");

  const servicesQuery = useQuery({
    queryKey: ["services"],
    queryFn: () => fetchJson(`${API_URL}/api/services`),
  });

  const availabilityQuery = useQuery({
    queryKey: ["availability", startDateKey, endDateKey, formData.serviceId],
    queryFn: () => {
      const params = new URLSearchParams({
        start: startDateKey,
        end: endDateKey,
      });
      if (formData.serviceId) {
        params.set("serviceId", formData.serviceId);
      }
      return fetchJson(`${API_URL}/api/availability?${params.toString()}`);
    },
  });

  const slotsByDate = useMemo(() => {
    const slots = availabilityQuery.data?.slots || [];
    return slots.reduce((acc, slot) => {
      if (!acc[slot.date]) acc[slot.date] = [];
      acc[slot.date].push(slot);
      return acc;
    }, {});
  }, [availabilityQuery.data]);

  const availableDates = useMemo(() => Object.keys(slotsByDate).sort(), [slotsByDate]);

  const selectedService = servicesQuery.data?.find(
    (service) => String(service.id) === String(formData.serviceId)
  );

  const selectedSlots = (slotsByDate[formData.appointmentDate] || []).slice().sort((a, b) =>
    a.start.localeCompare(b.start)
  );
  const confirmationTime = formData.slotStart
    ? format(new Date(formData.slotStart), "h:mm a")
    : "";

  const bookingMutation = useMutation({
    mutationFn: (payload) =>
      fetchJson(`${API_URL}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      setSubmitted(true);
      setError(null);
    },
    onError: (error) => {
      setError(error.message || "Failed to book appointment.");
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setError(null);

    if (!formData.serviceId) {
      setError("Please select a service.");
      return;
    }

    if (!formData.appointmentDate || !formData.slotStart) {
      setError("Please select a date and time.");
      return;
    }

    if (!formData.firstName.trim()) {
      setError("Please enter your first name.");
      return;
    }

    if (!formData.lastName.trim()) {
      setError("Please enter your last name.");
      return;
    }

    if (!formData.contactEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!formData.contactPhone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!formData.notes.trim()) {
      setError("Please add a short note.");
      return;
    }

    bookingMutation.mutate({
      serviceId: Number(formData.serviceId),
      startTime: formData.slotStart,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      contactEmail: formData.contactEmail.trim() || null,
      contactPhone: formData.contactPhone.trim() || null,
      notes: formData.notes.trim() || null,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Appointment Requested!</h2>
              <p className="text-lg text-slate-200 mb-8">
                Thank you for choosing NYC Smiles. We've received your appointment request and will contact you shortly to confirm.
              </p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 text-left text-white">
                <h3 className="font-semibold text-white mb-4">Appointment Details:</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-100">
                    <User className="w-5 h-5 text-cyan-200" />
                    <span>
                      {formData.firstName} {formData.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-100">
                    <Stethoscope className="w-5 h-5 text-cyan-200" />
                    <span>{selectedService?.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-100">
                    <Calendar className="w-5 h-5 text-cyan-200" />
                    <span>
                      {formData.appointmentDate
                        ? format(toLocalDate(formData.appointmentDate), "EEEE, MMMM d, yyyy")
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-100">
                    <Clock className="w-5 h-5 text-cyan-200" />
                    <span>
                      {confirmationTime}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    firstName: "",
                    lastName: "",
                    contactEmail: "",
                    contactPhone: "",
                    serviceId: "",
                    appointmentDate: "",
                    slotStart: "",
                    notes: "",
                  });
                }}
                className="bg-transparent border border-white text-white hover:bg-white/10"
              >
                Book Another Appointment
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-36 md:pt-40 lg:pt-44 pb-16 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Book Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-cyan-200">
                Appointment
              </span>
            </h1>
            <p className="text-xl text-slate-200">
              Pick a service and a time that works for you. We'll confirm your appointment shortly.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-500/10 text-white border-red-500/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="border border-white/10 bg-white/5 shadow-xl backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
              <CardTitle className="text-2xl">Appointment Information</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-200" />
                    Personal Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        value={formData.firstName}
                        onChange={(event) =>
                          setFormData({ ...formData, firstName: event.target.value })
                        }
                        placeholder="Alex"
                        required
                        className="mt-2 bg-white border-slate-300 text-black placeholder:text-slate-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={formData.lastName}
                        onChange={(event) =>
                          setFormData({ ...formData, lastName: event.target.value })
                        }
                        placeholder="Smith"
                        required
                        className="mt-2 bg-white border-slate-300 text-black placeholder:text-slate-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_email">Email Address</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(event) =>
                          setFormData({ ...formData, contactEmail: event.target.value })
                        }
                        placeholder="alex@example.com"
                        required
                        className="mt-2 bg-white border-slate-300 text-black placeholder:text-slate-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_phone">Phone Number</Label>
                      <Input
                        id="contact_phone"
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(event) =>
                          setFormData({ ...formData, contactPhone: event.target.value })
                        }
                        placeholder="(555) 123-4567"
                        required
                        className="mt-2 bg-white border-slate-300 text-black placeholder:text-slate-500"
                      />
                      <p className="mt-2 text-xs text-slate-400">Email and phone are required.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-cyan-200" />
                    Service Type
                  </h3>
                  <div>
                    <Label htmlFor="service_name">Select Service *</Label>
                    {servicesQuery.isLoading ? (
                      <Skeleton className="h-10 w-full mt-2" />
                    ) : (
                      <Select
                        value={formData.serviceId}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            serviceId: value,
                            appointmentDate: "",
                            slotStart: "",
                          })
                        }
                      >
                        <SelectTrigger className="mt-2 bg-white border-slate-300 text-black">
                          <SelectValue placeholder="Choose a service..." className="placeholder:text-slate-400" />
                        </SelectTrigger>
                        <SelectContent>
                          {servicesQuery.data?.map((service) => (
                            <SelectItem key={service.id} value={String(service.id)}>
                              {service.name} · {service.duration_minutes} min
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-cyan-200" />
                    Select Date & Time *
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="appointment_date">Appointment Date</Label>
                      {availabilityQuery.isLoading ? (
                        <Skeleton className="h-10 w-full mt-2" />
                      ) : (
                        <Select
                          value={formData.appointmentDate}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              appointmentDate: value,
                              slotStart: "",
                            })
                          }
                        >
                          <SelectTrigger className="mt-2 bg-white border-slate-300 text-black">
                            <SelectValue placeholder="Choose a date..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDates.map((dateKey) => (
                              <SelectItem key={dateKey} value={dateKey}>
                                {format(toLocalDate(dateKey), "EEEE, MMMM d, yyyy")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="appointment_time">Appointment Time</Label>
                      <Select
                        value={formData.slotStart}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            slotStart: value,
                          })
                        }
                        disabled={!formData.appointmentDate || availabilityQuery.isLoading}
                      >
                        <SelectTrigger className="mt-2 bg-white border-slate-300 text-black">
                          <SelectValue
                            placeholder={
                              formData.appointmentDate ? "Choose a time..." : "Select a date first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedSlots.map((slot) => (
                            <SelectItem key={slot.start} value={slot.start}>
                              {format(new Date(slot.start), "h:mm a")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!availabilityQuery.isLoading &&
                        formData.appointmentDate &&
                        selectedSlots.length === 0 && (
                          <p className="mt-2 text-xs text-amber-200">
                            No times available for this date.
                          </p>
                        )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes (no medical details)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(event) =>
                      setFormData({ ...formData, notes: event.target.value })
                    }
                    placeholder="Anything else we should know before we reach out?"
                    required
                    className="mt-2 h-32 bg-white border-slate-300 text-black placeholder:text-slate-500"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={bookingMutation.isPending}
                  className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-lg text-lg"
                >
                  {bookingMutation.isPending ? "Booking..." : "Book Appointment"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm text-slate-300">
            <p>
              Need immediate assistance? Call us at{" "}
              <a
                href={CONTACT_INFO.phone.href}
                className="text-cyan-300 hover:underline font-semibold"
              >
                {CONTACT_INFO.phone.display}
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
