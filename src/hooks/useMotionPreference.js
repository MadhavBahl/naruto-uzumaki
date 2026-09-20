import { useSyncExternalStore } from 'react'

const query = '(prefers-reduced-motion: reduce)'

function subscribe(callback) {
  const media = window.matchMedia(query)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

function snapshot() { return window.matchMedia(query).matches }

// Respond live to OS changes; Motion's installed hook only captures the initial value.
export default function useMotionPreference() {
  return useSyncExternalStore(subscribe, snapshot, () => true)
}