export function renderNav() {
  const nav = document.getElementById('site-nav')!
  const hamburger = nav.querySelector<HTMLButtonElement>('.nav-hamburger')!
  const links = nav.querySelector<HTMLUListElement>('.nav-links')!

  hamburger.addEventListener('click', () => {
    const open = hamburger.getAttribute('aria-expanded') === 'true'
    hamburger.setAttribute('aria-expanded', String(!open))
    links.classList.toggle('nav-links--open', !open)
  })

  // Close menu when a link is clicked
  links.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.setAttribute('aria-expanded', 'false')
      links.classList.remove('nav-links--open')
    })
  })

  // Highlight active section on scroll
  const sections = ['overview', 'explorer', 'journey', 'engineering']
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          nav.querySelectorAll('.nav-link').forEach(l => l.classList.remove('nav-link--active'))
          nav.querySelector(`[data-section="${entry.target.id}"]`)?.classList.add('nav-link--active')
        }
      })
    },
    { rootMargin: '-40% 0px -55% 0px' }
  )

  sections.forEach(id => {
    const el = document.getElementById(id)
    if (el) observer.observe(el)
  })
}
