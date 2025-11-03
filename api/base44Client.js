// Minimal mock API client to power the demo UI locally
// Centralized, schema-aligned demo data lives in data/*.json

import dentists from "@/data/dentists.json";
import services from "@/data/services.json";

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// NOTE: These seed datasets follow Entities/Dentist and Entities/Service
// schema so UI components (e.g., Pages/Team.jsx) can rely on consistent fields.

function loadAppointments() {
  try {
    const raw = localStorage.getItem('appointments')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAppointments(list) {
  try {
    localStorage.setItem('appointments', JSON.stringify(list))
  } catch {
    // ignore
  }
}

export const base44 = {
  entities: {
    Dentist: {
      async list() {
        await delay()
        return dentists
      },
    },
    Service: {
      async list() {
        await delay()
        return services
      },
    },
    Appointment: {
      async create(data) {
        await delay(600)
        const list = loadAppointments()
        const created = { id: `a${list.length + 1}`, ...data }
        list.push(created)
        saveAppointments(list)
        return created
      },
    },
  },
}

export default base44
