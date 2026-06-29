(function () {
  const fallbackLanguage = 'de';
  const translations = window.PlantrichTranslations || {};
  const navbarWrapper = document.getElementById('navbarWrapper');
  const mobileMenu = document.getElementById('mobileMenu');
  const openButton = document.getElementById('mobileMenuButton');
  const closeButton = document.getElementById('mobileMenuClose');

  function getTranslation(lang, key) {
    return translations[lang]?.[key] || translations[fallbackLanguage]?.[key] || '';
  }

  function translateElement(element, lang) {
    const key = element.dataset.translateKey;
    const value = getTranslation(lang, key);

    if (!value) return;

    if (element.dataset.translateHtml !== undefined) {
      element.innerHTML = value;
      return;
    }

    element.textContent = value;
  }

  function updatePageMeta(lang) {
    const title = getTranslation(lang, 'metaTitle');
    const description = getTranslation(lang, 'metaDescription');
    const descriptionElement = document.querySelector('meta[name="description"]');

    if (title) document.title = title;
    if (description && descriptionElement) {
      descriptionElement.setAttribute('content', description);
    }
  }

  function updateLanguageControls(lang) {
    const summary = document.getElementById('languageSummary');
    const menuOpenLabel = getTranslation(lang, 'navMenuOpen');
    const menuCloseLabel = getTranslation(lang, 'navMenuClose');

    if (summary) summary.textContent = `${lang.toUpperCase()} ▾`;
    if (openButton && menuOpenLabel) openButton.setAttribute('aria-label', menuOpenLabel);
    if (closeButton && menuCloseLabel) closeButton.setAttribute('aria-label', menuCloseLabel);

    document.querySelectorAll('[data-lang]').forEach((button) => {
      const isActive = button.dataset.lang === lang;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  }

  function applyLanguage(lang) {
    const nextLang = translations[lang] ? lang : fallbackLanguage;

    document.documentElement.lang = nextLang;
    document.querySelectorAll('[data-translate-key]').forEach((element) => {
      translateElement(element, nextLang);
    });
    updatePageMeta(nextLang);
    updateLanguageControls(nextLang);

    try {
      window.localStorage.setItem('plantrichLanguage', nextLang);
    } catch (error) {
      // Some privacy modes disable localStorage; the language still applies.
    }
  }

  function getPreferredLanguage() {
    try {
      const storedLanguage = window.localStorage.getItem('plantrichLanguage');
      if (translations[storedLanguage]) return storedLanguage;
    } catch (error) {
      // Ignore storage access errors and continue with the page default.
    }

    return fallbackLanguage;
  }

  function setMobileMenuOpen(isOpen) {
    if (!mobileMenu || !openButton) return;

    mobileMenu.classList.toggle('hidden', !isOpen);
    openButton.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function closeLanguageDropdowns() {
    document.querySelectorAll('.language-dropdown[open]').forEach((details) => {
      details.removeAttribute('open');
    });
  }

  function setupLanguageSwitcher() {
    document.querySelectorAll('[data-lang]').forEach((button) => {
      button.addEventListener('click', (event) => {
        applyLanguage(event.currentTarget.dataset.lang);
        closeLanguageDropdowns();
      });
    });

    document.addEventListener('click', (event) => {
      document.querySelectorAll('.language-dropdown[open]').forEach((details) => {
        if (!details.contains(event.target)) {
          details.removeAttribute('open');
        }
      });
    });
  }

  function setupMobileMenu() {
    if (!mobileMenu || !openButton || !closeButton) return;

    openButton.addEventListener('click', () => {
      const isOpen = openButton.getAttribute('aria-expanded') === 'true';
      setMobileMenuOpen(!isOpen);
    });

    closeButton.addEventListener('click', () => setMobileMenuOpen(false));

    document.querySelectorAll('[data-mobile-link]').forEach((link) => {
      link.addEventListener('click', () => setMobileMenuOpen(false));
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1280) setMobileMenuOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        closeLanguageDropdowns();
      }
    });
  }

  function setupStickyNav() {
    if (!navbarWrapper) return;

    const updateNavState = () => {
      navbarWrapper.classList.toggle('is-scrolled', window.scrollY > 24);
    };

    updateNavState();
    window.addEventListener('scroll', updateNavState, { passive: true });
  }

  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        const targetId = anchor.getAttribute('href');
        if (!targetId || targetId.length <= 1) return;

        const target = document.querySelector(targetId);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function setupScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.setAttribute('aria-hidden', 'true');
    progressBar.style.cssText = 'position:fixed;left:0;top:0;height:3px;width:0;z-index:60;background:#C9A227;transition:width 120ms ease;';
    document.body.appendChild(progressBar);

    const updateProgress = () => {
      const scrollableHeight = document.body.scrollHeight - window.innerHeight;
      const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
      progressBar.style.width = `${progress}%`;
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
  }

  function setupAnimations() {
    if (!window.gsap) return;

    if (window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
    }

    window.gsap.from(
      '.gsap-hero-up',
      { y: 32, duration: 0.9, stagger: 0.16, ease: 'power3.out', delay: 0.1, clearProps: 'transform' }
    );

    window.gsap.utils.toArray('.gsap-section').forEach((section) => {
      window.gsap.from(
        section,
        {
          y: 36,
          duration: 1.2,
          ease: 'power3.out',
          clearProps: 'transform',
          scrollTrigger: window.ScrollTrigger
            ? {
                trigger: section,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
              }
            : undefined
        }
      );
    });
  }

  function init() {
    if (window.lucide) {
      window.lucide.createIcons();
      document.body.classList.add('icons-ready');
    }

    setupLanguageSwitcher();
    setupMobileMenu();
    setupStickyNav();
    setupSmoothScroll();
    setupScrollProgress();
    applyLanguage(getPreferredLanguage());
    setupAnimations();
  }

  window.PlantrichSite = {
    applyLanguage
  };

  window.addEventListener('DOMContentLoaded', init);
})();
