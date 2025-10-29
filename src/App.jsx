import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '../Layout'
import Home from '../Pages/Home'
import Services from '../Pages/Services'
import Team from '../Pages/Team'
import BookAppointment from '../Pages/BookAppointment'

function withLayout(Component, currentPageName) {
  return (
    <Layout currentPageName={currentPageName}>
      <Component />
    </Layout>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={withLayout(Home, 'Home')} />
      <Route path="/services" element={withLayout(Services, 'Services')} />
      <Route path="/team" element={withLayout(Team, 'Team')} />
      <Route path="/book-appointment" element={withLayout(BookAppointment, 'BookAppointment')} />
      <Route path="*" element={withLayout(Home, 'Home')} />
    </Routes>
  )
}

