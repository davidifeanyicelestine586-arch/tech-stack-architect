import * as React from "react"

const MOBILE_BREAKPOINT = 1025

const subscribeToMediaQuery = (callback: () => void) => {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  const onChange = () => callback()

  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

const getMobileSnapshot = () =>
  typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT

const getServerSnapshot = () => false

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeToMediaQuery,
    getMobileSnapshot,
    getServerSnapshot,
  )
}

