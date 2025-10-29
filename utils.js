export const RoutesMap = {
  Home: '/',
  Services: '/services',
  Team: '/team',
  BookAppointment: '/book-appointment',
}

export function createPageUrl(name) {
  return RoutesMap[name] ?? '/'
}

