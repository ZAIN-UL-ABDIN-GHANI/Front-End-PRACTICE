document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle
  const themeToggle = document.getElementById('theme-toggle');
  const themeToggleMobile = document.getElementById('theme-toggle-mobile');
  const body = document.body;
  
  // Check for saved theme preference or default to 'light'
  const currentTheme = localStorage.getItem('theme') || 'light';
  body.setAttribute('data-theme', currentTheme);

  // Update theme label and icon
  const updateThemeLabel = () => {
    const themeLabel = document.querySelector('.theme-label');
    const themeIcon = document.getElementById('theme-icon');
    const isDark = body.getAttribute('data-theme') === 'dark';
    
    if (themeLabel) {
      themeLabel.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    }
    
    if (themeIcon) {
      themeIcon.className = isDark ? 'fas fa-sun theme-icon' : 'fas fa-moon theme-icon';
    }
  };

  updateThemeLabel();

  const toggleTheme = () => {
    const theme = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeLabel();
  };

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  if (themeToggleMobile) {
    themeToggleMobile.addEventListener('click', toggleTheme);
  }

  // Mobile Navigation
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('open');
  });

  // Smooth scroll helper
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
      e.preventDefault();
      const target = link.getAttribute('href');
      if (!target || target === '#') return;
      window.scrollToSection(target);
      
      if (navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
      }
    });
  });

  // Navbar scroll effect + auto-close menu on scroll
  const navbar = document.getElementById('navbar');
  const scrollThreshold = window.innerHeight * 0.2; // 20% of viewport height
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    
    // Auto-close mobile menu when scrolling 20% of viewport height
    if (navLinks.classList.contains('open') && window.scrollY > scrollThreshold) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
    }
  });

  // Services filter + search
  const filters = Array.from(document.querySelectorAll('.filter-btn'));
  const searchInput = document.getElementById('service-search');
  const cards = Array.from(document.querySelectorAll('.service-card'));
  let currentFilterIndex = 0;

  // Mobile filter slider functionality
  const filtersContainer = document.getElementById('filters-container');
  let isTouch = false;

  // Touch events for mobile filter sliding
  if (window.innerWidth <= 768) {
    setupMobileFilters();
  }

  function setupMobileFilters() {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    filtersContainer.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
      isTouch = true;
    });

    filtersContainer.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      currentX = e.touches[0].clientX;
      const diff = startX - currentX;
      filtersContainer.scrollLeft += diff * 0.8;
      startX = currentX;
    });

    filtersContainer.addEventListener('touchend', () => {
      isDragging = false;
    });

    // Auto-scroll to active filter
    const activeFilter = document.querySelector('.filter-btn.active');
    if (activeFilter) {
      const containerWidth = filtersContainer.offsetWidth;
      const filterLeft = activeFilter.offsetLeft;
      const filterWidth = activeFilter.offsetWidth;
      const scrollPosition = filterLeft - (containerWidth / 2) + (filterWidth / 2);
      
      filtersContainer.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  }

  function applyFilter() {
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    const query = (searchInput.value || '').trim().toLowerCase();

    cards.forEach((card, index) => {
      const title = (card.dataset.title || card.querySelector('h3').textContent).toLowerCase();
      const desc = (card.querySelector('p')?.textContent || '').toLowerCase();
      const category = (card.dataset.category || '').toLowerCase();

      const matchesFilter = activeFilter === 'all' ? true : category === activeFilter;
      const matchesSearch = query === '' ? true : (title.includes(query) || desc.includes(query));

      if (matchesFilter && matchesSearch) {
        card.style.display = '';
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
          card.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, index * 50);
      } else {
        card.style.opacity = '0';
        card.style.transform = 'translateY(-20px)';
        setTimeout(() => {
          card.style.display = 'none';
        }, 200);
      }
    });
  }

  // Filter button clicks
  filters.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      filters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilterIndex = index;
      
      // Smooth scroll to active filter on mobile
      if (window.innerWidth <= 768) {
        const containerWidth = filtersContainer.offsetWidth;
        const filterLeft = btn.offsetLeft;
        const filterWidth = btn.offsetWidth;
        const scrollPosition = filterLeft - (containerWidth / 2) + (filterWidth / 2);
        
        filtersContainer.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
      
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

  // Scroll to top functionality
  const scrollToTopBtn = document.getElementById('scroll-to-top');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollToTopBtn.classList.add('visible');
    } else {
      scrollToTopBtn.classList.remove('visible');
    }
  });

  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // Set current year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Intersection Observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe service cards for animation
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
    observer.observe(card);
  });

  // Handle window resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth <= 768 && !isTouch) {
        setupMobileFilters();
      }
    }, 250);
  });

  // Preload and optimize images
  const heroImg = document.querySelector('.hero-card img');
  if (heroImg) {
    const img = new Image();
    img.onload = () => {
      heroImg.style.opacity = '1';
    };
    img.src = heroImg.src;
    heroImg.style.opacity = '0.7';
    heroImg.style.transition = 'opacity 0.3s ease';
  }

  // Form submission
  const contactForm = document.querySelector('.contact-form');
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(contactForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    
    // Basic validation
    if (!name || !email || !message) {
      alert('Please fill in all fields.');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }
    
    // Simulate form submission
    const submitBtn = contactForm.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
      alert('Message sent successfully! We will get back to you soon.');
      contactForm.reset();
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }, 1500);
  });

  // Performance optimization
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Initialize non-critical features
      applyFilter();
    });
  } else {
    setTimeout(() => {
      applyFilter();
    }, 100);
  }

  // Add click outside to close mobile menu
  document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
    }
  });

  // Keyboard navigation support
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
    }
  });

  // Smooth reveal animations for sections
  const sections = document.querySelectorAll('section');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  });

  sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(50px)';
    section.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    sectionObserver.observe(section);
  });
});