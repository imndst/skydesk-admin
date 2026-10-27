export default defineNuxtRouteMiddleware(async (to) => {
  const user = useState<{ email: string } | null | undefined>('user', () => undefined)
  if (user.value === undefined) {
    try { user.value = await useRequestFetch()('/api/auth/me') as { email: string } }
    catch { user.value = null }
  }
  if (!user.value && to.path !== '/login') return navigateTo('/login')
  if (user.value && to.path === '/login') return navigateTo('/')
})
