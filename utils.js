import { ROUTE_MAP } from '@/config/siteConfig'

export function createPageUrl(name) {
  return ROUTE_MAP[name] ?? '/'
}
