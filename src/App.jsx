import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '../Layout'
import Home from '../Pages/Home'
import Services from '../Pages/Services'
import Team from '../Pages/Team'
import BookAppointment from '../Pages/BookAppointment'
import { ROUTES } from '@/config/siteConfig'

function withLayout(Component, currentPageName) {
  return (
    <Layout currentPageName={currentPageName}>
      <Component />
    </Layout>
  )
}

export default function App() {
  const routeComponents = {
    Home,
    Services,
    Team,
    BookAppointment,
  }

  return (
    <Routes>
      {ROUTES.map((route) => {
        const Component = routeComponents[route.id]
        if (!Component) return null

        return (
          <Route
            key={route.path}
            path={route.path}
            element={withLayout(Component, route.id)}
          />
        )
      })}
      <Route path="*" element={withLayout(Home, 'Home')} />
    </Routes>
  )
}
