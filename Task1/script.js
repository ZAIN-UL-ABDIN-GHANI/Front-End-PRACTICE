document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');

  // Toggle mobile nav
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('open');
  });

  // Smooth scroll helper with offset for fixed navbar height (78px)
  window.scrollToSection = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return;
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - 78,
      behavior: 'smooth'
    });
  };

  // Smooth scroll for nav links
  const navLinkElements = document.querySelectorAll('.nav-links a[href^="#"]');
  navLinkElements.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault(); // prevent default jump

      const target = link.getAttribute('href');
      if (!target || target === '#') return;

      window.scrollToSection(target);

      // Close mobile nav if open
      if (navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
      }
    });
  });

  // Change navbar style on scroll
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  });

  // Services filter + search
  const filters = Array.from(document.querySelectorAll('.filter-btn'));
  const searchInput = document.getElementById('service-search');
  const cards = Array.from(document.querySelectorAll('.service-card'));

  function applyFilter() {
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    const query = (searchInput.value || '').trim().toLowerCase();

    cards.forEach(card => {
      const title = (card.dataset.title || card.querySelector('h3').textContent).toLowerCase();
      const desc = (card.querySelector('p')?.textContent || '').toLowerCase();
      const category = (card.dataset.category || '').toLowerCase();

      const matchesFilter = activeFilter === 'all' ? true : category === activeFilter;
      const matchesSearch = query === '' ? true : (title.includes(query) || desc.includes(query));

      if (matchesFilter && matchesSearch) {
        card.style.display = '';
        card.classList.remove('hidden');
      } else {
        card.style.display = 'none';
        card.classList.add('hidden');
      }
    });
  }

  // Filter button clicks
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter();
    });
  });

  // Search input event
  searchInput.addEventListener('input', () => {
    applyFilter();
  });

  // Escape key clears search
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      applyFilter();
    }
  });

  // Set current year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
