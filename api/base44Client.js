// Minimal mock API client to power the demo UI locally

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const demoDentists = [
  {
    id: 'd1',
    full_name: 'Dr. Emily Williams',
    title: 'DDS',
    specialty: 'Cosmetic Dentistry',
    bio: 'Passionate about smile design with 10+ years of experience.',
    photo_url: '',
    available_days: ['Monday', 'Tuesday', 'Thursday'],
    available_hours: '9:00 AM - 5:00 PM',
  },
  {
    id: 'd2',
    full_name: 'Dr. Michael Chen',
    title: 'DMD',
    specialty: 'Orthodontics',
    bio: 'Expert in Invisalign and comprehensive orthodontic care.',
    photo_url: '',
    available_days: ['Wednesday', 'Friday'],
    available_hours: '10:00 AM - 6:00 PM',
  },
]

const demoServices = [
  {
    id: 's1',
    name: 'Dental Cleaning',
    description: 'Professional cleaning to maintain oral health',
    duration: 60,
    price_range: '$120-$180',
    category: 'General Dentistry',
    icon: 'cleaning',
  },
  {
    id: 's2',
    name: 'Teeth Whitening',
    description: 'Advanced whitening treatment for a brighter smile',
    duration: 90,
    price_range: '$250-$400',
    category: 'Cosmetic Dentistry',
    icon: 'sparkles',
  },
  {
    id: 's3',
    name: 'Invisalign',
    description: 'Clear aligner therapy for teeth straightening',
    duration: 30,
    price_range: '$3500-$6000',
    category: 'Orthodontics',
    icon: 'smile',
  },
]

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
        return demoDentists
      },
    },
    Service: {
      async list() {
        await delay()
        return demoServices
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

