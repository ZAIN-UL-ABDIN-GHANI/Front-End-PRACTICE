// script.js — ZYNSHOP UI logic
// Requires products.js loaded first (window.products)

let currentFilter = 'all';
let currentPage = 1;
const productsPerPage = 12;
let allProducts = [];
let filteredProducts = [];
let cart = [];
let wishlist = [];
let isLoading = false;

// DOM refs
const elements = {};

document.addEventListener('DOMContentLoaded', () => initializeApp());

function initializeApp() {
  // ---- Collect DOM refs
  elements.mobileMenuToggle = document.getElementById('mobileMenuToggle');
  elements.mobileNav = document.getElementById('mobileNav');
  elements.searchInput = document.getElementById('searchInput');
  elements.searchBtn = document.getElementById('searchBtn');
  elements.themeToggle = document.getElementById('themeToggle');
  elements.cartBtn = document.getElementById('cartBtn');
  elements.wishlistBtn = document.getElementById('wishlistBtn');
  elements.filterTabs = document.querySelectorAll('.filter-tab');
  elements.productsGrid = document.getElementById('productsGrid');
  elements.loadingSpinner = document.getElementById('loadingSpinner');
  elements.loadMoreBtn = document.getElementById('loadMoreBtn');
  elements.backToTop = document.getElementById('backToTop');
  elements.productModal = document.getElementById('productModal');
  elements.modalBody = document.getElementById('modalBody');
  elements.newsletterForm = document.getElementById('newsletterForm');

  // ---- Data
  allProducts = (Array.isArray(window.products) ? window.products : []).map(p => ({ ...p }));
  filteredProducts = allProducts.slice();

  // ---- UI init
  initializeTheme();
  setupEventListeners();
  initializeAnimations();

  // ---- First render
  renderProducts();
  updateCartBadge();
  updateWishlistBadge();
}

// ===================== Events & UI =====================
function setupEventListeners() {
  if (elements.mobileMenuToggle) elements.mobileMenuToggle.addEventListener('click', toggleMobileMenu);
  if (elements.searchInput) elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
  if (elements.searchBtn) elements.searchBtn.addEventListener('click', handleSearch);
  if (elements.themeToggle) elements.themeToggle.addEventListener('click', toggleTheme);
  elements.filterTabs.forEach(tab => tab.addEventListener('click', () => handleFilter(tab)));
  if (elements.loadMoreBtn) elements.loadMoreBtn.addEventListener('click', loadMoreProducts);
  if (elements.backToTop) elements.backToTop.addEventListener('click', scrollToTop);
  if (elements.newsletterForm) elements.newsletterForm.addEventListener('submit', handleNewsletterSubmit);
  window.addEventListener('scroll', handleScroll);

  // Category cards (if present in DOM)
  document.querySelectorAll('.category-card').forEach(card =>
    card.addEventListener('click', () => handleCategoryFilter(card.dataset.category))
  );

  // Smooth anchors
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const headerHeight = 80;
      const t = target.offsetTop - headerHeight;
      window.scrollTo({ top: t, behavior: 'smooth' });
    });
  });

  // Footer category shortcuts
  document.querySelectorAll('[data-category]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const cat = link.dataset.category;
      handleCategoryFilter(cat);
      const productsSection = document.getElementById('products');
      if (productsSection) {
        const headerHeight = 80;
        const targetPosition = productsSection.offsetTop - headerHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });
}

// ===================== Theme =====================
function initializeTheme() {
  const saved = localStorage.getItem('zynshop-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  const icon = elements.themeToggle && elements.themeToggle.querySelector('i');
  if (icon) icon.className = saved === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('zynshop-theme', next);
  const icon = elements.themeToggle && elements.themeToggle.querySelector('i');
  if (icon) icon.className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
  setTimeout(() => (document.body.style.transition = ''), 300);
}

// ===================== Mobile Nav =====================
function toggleMobileMenu() {
  if (!elements.mobileMenuToggle || !elements.mobileNav) return;
  elements.mobileMenuToggle.classList.toggle('active');
  elements.mobileNav.classList.toggle('active');
  document.body.style.overflow = elements.mobileNav.classList.contains('active') ? 'hidden' : '';
}
function closeMobileMenu() {
  if (!elements.mobileMenuToggle || !elements.mobileNav) return;
  elements.mobileMenuToggle.classList.remove('active');
  elements.mobileNav.classList.remove('active');
  document.body.style.overflow = '';
}

// ===================== Scroll UI =====================
function handleScroll() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  if (elements.backToTop) elements.backToTop.classList.toggle('visible', scrollTop > 300);
  const header = document.querySelector('.header');
  if (header) {
    if (scrollTop > 100)
      header.style.backgroundColor =
        document.documentElement.getAttribute('data-theme') === 'dark'
          ? 'rgba(26,26,26,0.98)'
          : 'rgba(255,255,255,0.98)';
    else
      header.style.backgroundColor =
        document.documentElement.getAttribute('data-theme') === 'dark'
          ? 'rgba(26,26,26,0.95)'
          : 'rgba(255,255,255,0.95)';
  }
}
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===================== Search =====================
function handleSearch() {
  const raw = elements.searchInput ? elements.searchInput.value.trim() : '';
  const query = raw.toLowerCase();
  if (query === '') {
    filteredProducts = allProducts.slice();
    currentPage = 1;
    renderProducts();
    return;
  }

  const tokens = query.split(/\s+/).filter(Boolean);
  const exactMatches = [];
  const partialMatches = [];

  allProducts.forEach(product => {
    const title = (product.title || '').toLowerCase();
    const brand = (product.brand || '').toLowerCase();
    const category = (product.category || '').toLowerCase();
    const description = (product.description || '').toLowerCase();

    let totalScore = 0;
    let matchedTokens = 0;

    tokens.forEach(token => {
      let matched = false;
      if (title === token || title.split(/\s+/).includes(token)) { totalScore += 6; matched = true; }
      else if (title.includes(token)) { totalScore += 4; matched = true; if (title.startsWith(token)) totalScore += 1; }

      if (brand === token || brand.split(/\s+/).includes(token)) { totalScore += 5; matched = true; }
      else if (brand.includes(token)) { totalScore += 3; matched = true; if (brand.startsWith(token)) totalScore += 1; }

      if (category === token) { totalScore += 4; matched = true; }
      else if (category.includes(token)) { totalScore += 2; matched = true; }

      if (description.includes(token)) { totalScore += 1; matched = true; }

      if (matched) matchedTokens++;
    });

    if (matchedTokens === tokens.length) exactMatches.push({ product, score: totalScore });
    else if (matchedTokens > 0) partialMatches.push({ product, score: totalScore, matchedTokens });
  });

  exactMatches.sort((a, b) => b.score - a.score);
  partialMatches.sort((a, b) =>
    b.matchedTokens === a.matchedTokens ? b.score - a.score : b.matchedTokens - a.matchedTokens
  );

  filteredProducts = exactMatches.map(x => x.product).concat(partialMatches.map(x => x.product));

  // Deduplicate by id
  filteredProducts = Array.from(new Map(filteredProducts.map(p => [p.id, p])).values());

  currentPage = 1;
  renderProducts();
}

// ===================== Filters =====================
function handleFilter(activeTab) {
  elements.filterTabs.forEach(tab => tab.classList.remove('active'));
  activeTab.classList.add('active');
  currentFilter = activeTab.dataset.filter;
  filterProducts();
}
function handleCategoryFilter(category) {
  elements.filterTabs.forEach(tab => tab.classList.remove('active'));
  const targetTab = document.querySelector(`[data-filter="${category}"]`);
  if (targetTab) targetTab.classList.add('active');
  currentFilter = category;
  filterProducts();
}
function filterProducts() {
  const filter = (currentFilter || 'all').toString().toLowerCase();
  if (filter === 'all') {
    filteredProducts = allProducts.slice();
    currentPage = 1;
    renderProducts();
    return;
  }
  const exact = [];
  const fuzzy = [];
  allProducts.forEach(product => {
    const title = (product.title || '').toLowerCase();
    const brand = (product.brand || '').toLowerCase();
    const category = (product.category || '').toLowerCase();
    const description = (product.description || '').toLowerCase();

    if (category === filter) { exact.push(product); return; }
    if (category.includes(filter) || title.includes(filter) || brand.includes(filter) || description.includes(filter))
      fuzzy.push(product);
  });
  filteredProducts = exact.concat(fuzzy);
  currentPage = 1;
  renderProducts();
}

// ===================== Pagination / Render =====================
function loadMoreProducts() {
  if (isLoading) return;
  currentPage++;
  renderProducts(true);
}

function renderProducts(append = false) {
  if (isLoading) return;
  isLoading = true;
  showLoadingSpinner();

  // Simulate async (so spinner is visible)
  setTimeout(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;

    if (!append && elements.productsGrid) elements.productsGrid.innerHTML = '';

    const newProducts = filteredProducts.slice(startIndex, endIndex);

    newProducts.forEach((product, index) => {
      const el = createProductCard(product);
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      elements.productsGrid.appendChild(el);
      setTimeout(() => {
        el.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, index * 70);
    });

    updateLoadMoreButton();
    hideLoadingSpinner();
    isLoading = false;
  }, 80);
}

function createProductCard(product) {
  const productCard = document.createElement('div');
  productCard.className = 'product-card';
  productCard.dataset.category = product.category;

  const isInWishlist = wishlist.some(i => i.id === product.id);
  const isInCart = cart.some(i => i.id === product.id);

  const src = product.image;

  productCard.innerHTML = `
    <div class="product-image">
      <img src="${src}" alt="${escapeHtml(product.title)}" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'600\' height=\'400\'><rect width=\'100%\' height=\'100%\' fill=\'#f3f4f6\'/><text x=\'50%\' y=\'50%\' fill=\'#9ca3af\' font-family=\'Arial, Helvetica, sans-serif\' font-size=\'18\' dy=\'.3em\' text-anchor=\'middle\'>Image unavailable</text></svg>`)}'">
      <div class="product-overlay">
        <button class="overlay-btn" onclick="quickView(${product.id})" title="Quick View"><i class="fas fa-eye"></i></button>
        <button class="overlay-btn ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist(${product.id})" title="Add to Wishlist"><i class="fas fa-heart"></i></button>
        <button class="overlay-btn" onclick="addToCart(${product.id})" title="Add to Cart"><i class="fas fa-shopping-cart"></i></button>
      </div>
    </div>
    <div class="product-info">
      <h3 class="product-title">${escapeHtml(product.title)}</h3>
      <p class="product-brand">${escapeHtml(product.brand)}</p>
      <div class="product-rating">
        <div class="stars">${generateStars(product.rating)}</div>
        <span class="rating-text">(${product.rating})</span>
      </div>
      <div class="product-price"><span class="current-price">$${product.price}</span></div>
      <div class="product-actions">
        <button class="btn-cart ${isInCart ? 'added' : ''}" onclick="addToCart(${product.id})"><i class="fas fa-shopping-cart"></i> ${isInCart ? 'Added to Cart' : 'Add to Cart'}</button>
        <button class="btn-wishlist ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist(${product.id})" title="Add to Wishlist"><i class="fas fa-heart"></i></button>
      </div>
    </div>
  `;
  return productCard;
}

function updateLoadMoreButton() {
  if (!elements.loadMoreBtn) return;
  const totalDisplayed = currentPage * productsPerPage;
  const hasMore = totalDisplayed < filteredProducts.length;
  elements.loadMoreBtn.style.display = hasMore ? 'flex' : 'none';
  if (hasMore) {
    const remaining = filteredProducts.length - totalDisplayed;
    elements.loadMoreBtn.innerHTML = `<i class="fas fa-plus"></i> Load More Products (${remaining} remaining)`;
  }
}

function showLoadingSpinner() {
  if (elements.loadingSpinner) elements.loadingSpinner.style.display = 'flex';
}
function hideLoadingSpinner() {
  if (elements.loadingSpinner) elements.loadingSpinner.style.display = 'none';
}

// ===================== Modal / Cart / Wishlist =====================
function quickView(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product || !elements.modalBody || !elements.productModal) return;

  const isInWishlist = wishlist.some(i => i.id === productId);
  const isInCart = cart.some(i => i.id === productId);

  elements.modalBody.innerHTML = `
    <div class="modal-product">
      <div class="modal-product-image">
        <img src="${product.image}" alt="${escapeHtml(product.title)}">
      </div>
      <div class="modal-product-info">
        <h2 class="modal-product-title">${escapeHtml(product.title)}</h2>
        <p class="modal-product-brand">${escapeHtml(product.brand)}</p>
        <div class="modal-product-rating"><div class="stars">${generateStars(product.rating)}</div><span class="rating-text">(${product.rating})</span></div>
        <div class="modal-product-price"><span class="current-price">$${product.price}</span></div>
        <div class="modal-product-description"><p>${escapeHtml(product.description || '')}</p></div>
        <div class="modal-product-features">
          <h4>Key Features:</h4>
          <ul>
            <li>Premium quality materials</li>
            <li>Expert craftsmanship</li>
            <li>Modern design</li>
            <li>Satisfaction guaranteed</li>
          </ul>
        </div>
        <div class="modal-product-actions">
          <button class="btn btn-primary" onclick="addToCart(${product.id}); closeModal();"><i class="fas fa-shopping-cart"></i> ${isInCart ? 'Added to Cart' : 'Add to Cart'}</button>
          <button class="btn btn-secondary ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist(${product.id});"><i class="fas fa-heart"></i> ${isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}</button>
        </div>
      </div>
    </div>
  `;

  elements.productModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  if (elements.productModal) elements.productModal.classList.remove('active');
  document.body.style.overflow = '';
}

function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  const existing = cart.find(i => i.id === productId);
  if (existing) existing.quantity = (existing.quantity || 1) + 1;
  else cart.push({ ...product, quantity: 1 });
  updateCartBadge();
  showNotification(`${product.title} added to cart!`, 'success');
  updateProductCardButton(productId, 'cart', true);
}

function toggleWishlist(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  const idx = wishlist.findIndex(i => i.id === productId);
  if (idx !== -1) {
    wishlist.splice(idx, 1);
    showNotification(`${product.title} removed from wishlist!`, 'info');
    updateProductCardButton(productId, 'wishlist', false);
  } else {
    wishlist.push(product);
    showNotification(`${product.title} added to wishlist!`, 'success');
    updateProductCardButton(productId, 'wishlist', true);
  }
  updateWishlistBadge();
}

function updateProductCardButton(productId, type, isActive) {
  document.querySelectorAll('.product-card').forEach(card => {
    const titleEl = card.querySelector('.product-title');
    if (!titleEl) return;
    const title = titleEl.textContent || titleEl.innerText;
    const product = allProducts.find(p => p.title === title);
    if (!product || product.id !== productId) return;

    const cartBtn = card.querySelector('.btn-cart');
    const wishBtn = card.querySelector('.btn-wishlist');
    const overlayCartBtn = card.querySelector('.overlay-btn[onclick*="addToCart"]');
    const overlayWishBtn = card.querySelector('.overlay-btn[onclick*="toggleWishlist"]');

    if (type === 'cart' && cartBtn) {
      if (isActive) {
        cartBtn.classList.add('added');
        cartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Added to Cart';
      } else {
        cartBtn.classList.remove('added');
        cartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
      }
    }

    if (type === 'wishlist' && wishBtn) wishBtn.classList.toggle('active', isActive);
    if (overlayCartBtn) overlayCartBtn.classList.toggle('active', isActive);
    if (overlayWishBtn) overlayWishBtn.classList.toggle('active', isActive);
  });
}

function updateCartBadge() {
  if (!elements.cartBtn) return;
  const badge = elements.cartBtn.querySelector('.badge');
  if (!badge) return;
  const total = cart.reduce((s, it) => s + (it.quantity || 0), 0);
  badge.textContent = total;
  badge.style.display = total > 0 ? 'flex' : 'none';
}
function updateWishlistBadge() {
  if (!elements.wishlistBtn) return;
  const badge = elements.wishlistBtn.querySelector('.badge');
  if (!badge) return;
  badge.textContent = wishlist.length;
  badge.style.display = wishlist.length > 0 ? 'flex' : 'none';
}

function showNotification(message, type = 'info') {
  document.querySelectorAll('.notification').forEach(n => n.remove());
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    <span>${escapeHtml(message)}</span>
    <button class="notification-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
  `;
  document.body.appendChild(notification);
  setTimeout(() => { if (notification.parentElement) notification.remove(); }, 3000);
}

function handleNewsletterSubmit(e) {
  e.preventDefault();
  const emailInput = e.target.querySelector('input[type="email"]');
  const email = emailInput && emailInput.value.trim();
  if (email) {
    showNotification('Thank you for subscribing to our newsletter!', 'success');
    if (emailInput) emailInput.value = '';
  }
}

// ===================== Helpers =====================
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}
function generateStars(rating) {
  const r = Number(rating) || 0;
  let s = '';
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  for (let i = 0; i < full; i++) s += '<i class="fas fa-star star"></i>';
  if (half) s += '<i class="fas fa-star-half-alt star"></i>';
  const remaining = 5 - Math.ceil(r);
  for (let i = 0; i < remaining; i++) s += '<i class="far fa-star star empty"></i>';
  return s;
}
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => { clearTimeout(timeout); func(...args); };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
function initializeAnimations() {
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  const observer = new IntersectionObserver(entries =>
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('animate-in'); }),
    observerOptions
  );
  document.querySelectorAll('.category-card, .feature, .stat-card').forEach(el => observer.observe(el));
}
// Scroll Buttons Functionality
const tabs = document.getElementById('filterTabs');
document.getElementById('scrollLeft').addEventListener('click', () => {
    tabs.scrollBy({ left: -220, behavior: 'smooth' });
});
document.getElementById('scrollRight').addEventListener('click', () => {
    tabs.scrollBy({ left: 220, behavior: 'smooth' });
});

// Optional: Arrow Key Navigation
tabs.addEventListener('keydown', (e) => {
    if(e.key === "ArrowRight") tabs.scrollBy({ left: 220, behavior: 'smooth' });
    if(e.key === "ArrowLeft") tabs.scrollBy({ left: -220, behavior: 'smooth' });
});


// Expose globals used in HTML attributes
window.quickView = quickView;
window.addToCart = addToCart;
window.toggleWishlist = toggleWishlist;
window.closeModal = closeModal;
