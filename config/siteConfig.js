export const ROUTES = [
  { id: 'Home', path: '/', label: 'Home' },
  { id: 'Services', path: '/services', label: 'Services' },
  { id: 'Team', path: '/team', label: 'Our Team' },
  { id: 'BookAppointment', path: '/book-appointment', label: 'Book Appointment' },
];

export const ROUTE_MAP = ROUTES.reduce((acc, route) => {
  acc[route.id] = route.path;
  return acc;
}, {});

export const CONTACT_INFO = {
  phone: {
    display: '(212) 555-1234',
    href: 'tel:+12125551234',
  },
  email: {
    display: 'info@nycsmiles.com',
    href: 'mailto:info@nycsmiles.com',
  },
  address: {
    line1: '123 Park Avenue',
    line2: 'New York, NY 10016',
  },
};

export const PRIMARY_CTA_ROUTE_ID = 'BookAppointment';

