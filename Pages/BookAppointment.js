import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Stethoscope
} from "lucide-react";
import { motion } from "framer-motion";
import { format, addDays, isBefore, startOfDay } from "date-fns";

export default function BookAppointment() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    patient_name: "",
    patient_email: "",
    patient_phone: "",
    dentist_id: "",
    service_name: "",
    appointment_date: "",
    appointment_time: "",
    notes: "",
    is_new_patient: true
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const { data: dentists = [], isLoading: dentistsLoading } = useQuery({
    queryKey: ['dentists'],
    queryFn: () => base44.entities.Dentist.list(),
    initialData: []
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
    initialData: []
  });

  const createAppointmentMutation = useMutation({
    mutationFn: (data) => base44.entities.Appointment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setSubmitted(true);
      setError(null);
    },
    onError: (error) => {
      setError("Failed to book appointment. Please try again.");
      console.error(error);
    }
  });

  const selectedDentist = dentists.find(d => d.id === formData.dentist_id);

  const getAvailableTimes = () => {
    const times = [];
    for (let hour = 9; hour <= 17; hour++) {
      times.push(`${hour}:00`);
      if (hour < 17) {
        times.push(`${hour}:30`);
      }
    }
    return times;
  };

  const getNextAvailableDates = () => {
    const dates = [];
    const today = startOfDay(new Date());
    
    for (let i = 1; i <= 30; i++) {
      const date = addDays(today, i);
      const dayName = format(date, 'EEEE');
      
      if (selectedDentist?.available_days?.includes(dayName)) {
        dates.push(date);
      }
    }
    
    return dates;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.dentist_id || !formData.appointment_date || !formData.appointment_time) {
      setError("Please fill in all required fields");
      return;
    }

    const dentist = dentists.find(d => d.id === formData.dentist_id);
    
    createAppointmentMutation.mutate({
      ...formData,
      dentist_name: dentist?.full_name || "",
      status: "pending"
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-2xl border-none shadow-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Appointment Requested!</h2>
              <p className="text-lg text-slate-600 mb-8">
                Thank you for choosing NYC Smiles. We've received your appointment request and will contact you shortly to confirm.
              </p>
              <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left">
                <h3 className="font-semibold text-slate-900 mb-4">Appointment Details:</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-cyan-600" />
                    <span className="text-slate-700">{formData.patient_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Stethoscope className="w-5 h-5 text-cyan-600" />
                    <span className="text-slate-700">Dr. {selectedDentist?.full_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-cyan-600" />
                    <span className="text-slate-700">
                      {format(new Date(formData.appointment_date), 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-cyan-600" />
                    <span className="text-slate-700">{formData.appointment_time}</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    patient_name: "",
                    patient_email: "",
                    patient_phone: "",
                    dentist_id: "",
                    service_name: "",
                    appointment_date: "",
                    appointment_time: "",
                    notes: "",
                    is_new_patient: true
                  });
                }}
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Book Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-cyan-700">Appointment</span>
            </h1>
            <p className="text-xl text-slate-600">
              Choose your preferred dentist and time. We'll confirm your appointment shortly.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="border-none shadow-xl">
            <CardHeader className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
              <CardTitle className="text-2xl">Appointment Information</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-600" />
                    Personal Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="patient_name">Full Name *</Label>
                      <Input
                        id="patient_name"
                        value={formData.patient_name}
                        onChange={(e) => setFormData({...formData, patient_name: e.target.value})}
                        placeholder="John Doe"
                        required
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="patient_email">Email Address *</Label>
                      <Input
                        id="patient_email"
                        type="email"
                        value={formData.patient_email}
                        onChange={(e) => setFormData({...formData, patient_email: e.target.value})}
                        placeholder="john@example.com"
                        required
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="patient_phone">Phone Number *</Label>
                      <Input
                        id="patient_phone"
                        type="tel"
                        value={formData.patient_phone}
                        onChange={(e) => setFormData({...formData, patient_phone: e.target.value})}
                        placeholder="(555) 123-4567"
                        required
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="is_new_patient">Patient Type</Label>
                      <Select
                        value={formData.is_new_patient.toString()}
                        onValueChange={(value) => setFormData({...formData, is_new_patient: value === "true"})}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">New Patient</SelectItem>
                          <SelectItem value="false">Existing Patient</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Service Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-cyan-600" />
                    Service Type
                  </h3>
                  <div>
                    <Label htmlFor="service_name">Select Service</Label>
                    {servicesLoading ? (
                      <Skeleton className="h-10 w-full mt-2" />
                    ) : (
                      <Select
                        value={formData.service_name}
                        onValueChange={(value) => setFormData({...formData, service_name: value})}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Choose a service..." />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.name}>
                              {service.name} - {service.category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* Dentist Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-600" />
                    Choose Your Dentist *
                  </h3>
                  {dentistsLoading ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-32" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {dentists.map((dentist) => (
                        <div
                          key={dentist.id}
                          onClick={() => setFormData({...formData, dentist_id: dentist.id, appointment_date: "", appointment_time: ""})}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.dentist_id === dentist.id
                              ? "border-cyan-500 bg-cyan-50"
                              : "border-slate-200 hover:border-cyan-300"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xl text-white font-bold">
                                {dentist.full_name.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-slate-900">{dentist.full_name}</div>
                              <Badge variant="secondary" className="text-xs mt-1">
                                {dentist.specialty}
                              </Badge>
                              {dentist.available_days && dentist.available_days.length > 0 && (
                                <div className="text-xs text-slate-600 mt-2">
                                  Available: {dentist.available_days.slice(0, 3).join(", ")}
                                  {dentist.available_days.length > 3 && "..."}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date & Time Selection */}
                {formData.dentist_id && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-cyan-600" />
                      Select Date & Time *
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="appointment_date">Appointment Date</Label>
                        <Select
                          value={formData.appointment_date}
                          onValueChange={(value) => setFormData({...formData, appointment_date: value})}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Choose a date..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getNextAvailableDates().map((date) => (
                              <SelectItem key={date.toISOString()} value={format(date, 'yyyy-MM-dd')}>
                                {format(date, 'EEEE, MMMM d, yyyy')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="appointment_time">Appointment Time</Label>
                        <Select
                          value={formData.appointment_time}
                          onValueChange={(value) => setFormData({...formData, appointment_time: value})}
                          disabled={!formData.appointment_date}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Choose a time..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableTimes().map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Notes */}
                <div>
                  <Label htmlFor="notes">Additional Notes or Concerns</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Any specific concerns or information we should know..."
                    className="mt-2 h-32"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={createAppointmentMutation.isPending}
                  className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-lg text-lg"
                >
                  {createAppointmentMutation.isPending ? "Booking..." : "Book Appointment"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm text-slate-600">
            <p>Need immediate assistance? Call us at <a href="tel:+12125551234" className="text-cyan-600 hover:underline font-semibold">(212) 555-1234</a></p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}