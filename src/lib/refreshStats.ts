/**
 * Utilità globale per triggerare il refresh delle statistiche del dashboard
 */

export const refreshDashboardStats = () => {
  console.log('📊 Triggering dashboard stats refresh...')
  
  // Dispatch custom event per notificare il dashboard
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('refreshStats'))
  }
}

export const refreshStatsAfterDelay = (delay = 500) => {
  setTimeout(() => {
    refreshDashboardStats()
  }, delay)
}