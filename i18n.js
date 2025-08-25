/**
 * Internationalization system for CoderOne IDE website
 * Supports Arabic (RTL), Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean
 */

class I18n {
  constructor() {
    this.currentLang = 'en';
    this.translations = {};
    this.supportedLanguages = {
      'en': { name: 'English', flag: '🇺🇸', rtl: false },
      'ar': { name: 'العربية', flag: '🇸🇦', rtl: true },
      'es': { name: 'Español', flag: '🇪🇸', rtl: false },
      'fr': { name: 'Français', flag: '🇫🇷', rtl: false },
      'de': { name: 'Deutsch', flag: '🇩🇪', rtl: false },
      'it': { name: 'Italiano', flag: '🇮🇹', rtl: false },
      'pt': { name: 'Português', flag: '🇵🇹', rtl: false },
      'ru': { name: 'Русский', flag: '🇷🇺', rtl: false },
      'ja': { name: '日本語', flag: '🇯🇵', rtl: false },
      'ko': { name: '한국어', flag: '🇰🇷', rtl: false }
    };
    
    this.init();
  }

  async init() {
    // Get saved language or detect from browser
    this.currentLang = this.getSavedLanguage() || this.detectLanguage();
    
    // Load translation for current language
    await this.loadTranslation(this.currentLang);
    
    // Apply initial translation
    this.applyTranslations();
    
    // Setup language selector
    this.createLanguageSelector();
  }

  getSavedLanguage() {
    return localStorage.getItem('coderone-language');
  }

  saveLanguage(lang) {
    localStorage.setItem('coderone-language', lang);
  }

  detectLanguage() {
    const browserLang = navigator.language.slice(0, 2);
    return this.supportedLanguages[browserLang] ? browserLang : 'en';
  }

  async loadTranslation(lang) {
    if (this.translations[lang]) {
      return this.translations[lang];
    }

    try {
      const response = await fetch(`./i18n/${lang}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load ${lang}.json`);
      }
      this.translations[lang] = await response.json();
      return this.translations[lang];
    } catch (error) {
      console.warn(`Failed to load translation for ${lang}:`, error);
      // Fallback to English
      if (lang !== 'en') {
        return await this.loadTranslation('en');
      }
      return {};
    }
  }

  async setLanguage(lang) {
    if (!this.supportedLanguages[lang]) {
      console.warn(`Language ${lang} not supported`);
      return;
    }

    this.currentLang = lang;
    this.saveLanguage(lang);
    
    // Load translation if not already loaded
    await this.loadTranslation(lang);
    
    // Apply translations
    this.applyTranslations();
    
    // Apply RTL/LTR direction
    this.setDirection();
    
    // Update language selector
    this.updateLanguageSelector();
  }

  setDirection() {
    const isRTL = this.supportedLanguages[this.currentLang].rtl;
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', this.currentLang);
    
    // Add RTL class to body for additional styling
    if (isRTL) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }

  t(key, defaultValue = '') {
    const keys = key.split('.');
    let value = this.translations[this.currentLang];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue || key;
      }
    }
    
    return value || defaultValue || key;
  }

  applyTranslations() {
    // Update HTML lang attribute
    document.documentElement.setAttribute('lang', this.currentLang);
    
    // Apply direction
    this.setDirection();
    
    // Translate elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      
      if (element.tagName === 'INPUT' && element.type === 'text') {
        element.placeholder = translation;
      } else if (element.tagName === 'TEXTAREA') {
        element.placeholder = translation;
      } else {
        element.innerHTML = translation;
      }
    });

    // Translate elements with data-i18n-title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = this.t(key);
    });

    // Update page title if it exists
    const titleElement = document.querySelector('title');
    if (titleElement && titleElement.hasAttribute('data-i18n')) {
      const key = titleElement.getAttribute('data-i18n');
      titleElement.textContent = this.t(key);
    }

    // Update meta description if it exists
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && metaDesc.hasAttribute('data-i18n')) {
      const key = metaDesc.getAttribute('data-i18n');
      metaDesc.setAttribute('content', this.t(key));
    }

    // Special handling for arrays (like features or roadmap items)
    document.querySelectorAll('[data-i18n-array]').forEach(element => {
      const key = element.getAttribute('data-i18n-array');
      const array = this.t(key);
      if (Array.isArray(array)) {
        element.innerHTML = array.map(item => `<li>${item}</li>`).join('');
      }
    });
  }

  createLanguageSelector() {
    // Remove existing language selector if any
    const existing = document.querySelector('.language-selector');
    if (existing) {
      existing.remove();
    }

    // Create language selector
    const selector = document.createElement('div');
    selector.className = 'language-selector';
    selector.innerHTML = `
      <button class="language-btn" aria-label="Select Language">
        <span class="lang-flag">${this.supportedLanguages[this.currentLang].flag}</span>
        <span class="lang-name">${this.supportedLanguages[this.currentLang].name}</span>
        <span class="lang-arrow">▼</span>
      </button>
      <div class="language-dropdown">
        ${Object.entries(this.supportedLanguages).map(([code, lang]) => `
          <button class="language-option ${code === this.currentLang ? 'active' : ''}" 
                  data-lang="${code}">
            <span class="lang-flag">${lang.flag}</span>
            <span class="lang-name">${lang.name}</span>
          </button>
        `).join('')}
      </div>
    `;

    // Add styles
    this.addLanguageSelectorStyles();

    // Add to navigation
    const nav = document.querySelector('.nav .badges') || document.querySelector('.nav');
    if (nav) {
      nav.appendChild(selector);
    }

    // Add event listeners
    this.setupLanguageSelectorEvents(selector);
  }

  addLanguageSelectorStyles() {
    // Check if styles already added
    if (document.querySelector('#i18n-styles')) {
      return;
    }

    const styles = document.createElement('style');
    styles.id = 'i18n-styles';
    styles.textContent = `
      .language-selector {
        position: relative;
        display: inline-block;
        z-index: 1000;
      }

      .language-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border: 1px solid rgba(255,255,255,0.2);
        background: rgba(15,17,21,0.8);
        color: #e8ecf8;
        border-radius: 8px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
        backdrop-filter: blur(10px);
      }

      .language-btn:hover {
        background: rgba(94,240,255,0.1);
        border-color: rgba(94,240,255,0.3);
      }

      .lang-flag {
        font-size: 14px;
      }

      .lang-name {
        font-weight: 500;
        min-width: 60px;
        text-align: left;
      }

      .lang-arrow {
        font-size: 10px;
        transition: transform 0.2s ease;
      }

      .language-selector.open .lang-arrow {
        transform: rotate(180deg);
      }

      .language-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background: rgba(15,17,21,0.95);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 8px;
        padding: 8px 0;
        min-width: 140px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        backdrop-filter: blur(20px);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.2s ease;
      }

      .language-selector.open .language-dropdown {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .language-option {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border: none;
        background: none;
        color: #e8ecf8;
        cursor: pointer;
        font-size: 12px;
        transition: background 0.2s ease;
      }

      .language-option:hover {
        background: rgba(94,240,255,0.1);
      }

      .language-option.active {
        background: rgba(94,240,255,0.2);
        color: #5ef0ff;
      }

      /* RTL Support */
      .rtl .language-dropdown {
        right: auto;
        left: 0;
      }

      .rtl .lang-name {
        text-align: right;
      }

      /* RTL specific adjustments */
      .rtl {
        direction: rtl;
      }

      .rtl .nav {
        flex-direction: row-reverse;
      }

      .rtl .badges {
        flex-direction: row-reverse;
      }

      .rtl .hero {
        text-align: right;
      }

      .rtl .features {
        direction: rtl;
      }

      .rtl .pricing-grid {
        direction: rtl;
      }

      .rtl .footer {
        direction: rtl;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .language-btn .lang-name {
          display: none;
        }
        
        .language-dropdown {
          min-width: 120px;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  setupLanguageSelectorEvents(selector) {
    const btn = selector.querySelector('.language-btn');
    const dropdown = selector.querySelector('.language-dropdown');
    const options = selector.querySelectorAll('.language-option');

    // Toggle dropdown
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      selector.classList.toggle('open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!selector.contains(e.target)) {
        selector.classList.remove('open');
      }
    });

    // Handle language selection
    options.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = option.getAttribute('data-lang');
        this.setLanguage(lang);
        selector.classList.remove('open');
      });
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        selector.classList.remove('open');
      }
    });
  }

  updateLanguageSelector() {
    const selector = document.querySelector('.language-selector');
    if (!selector) return;

    const btn = selector.querySelector('.language-btn');
    const options = selector.querySelectorAll('.language-option');

    // Update button
    const flagSpan = btn.querySelector('.lang-flag');
    const nameSpan = btn.querySelector('.lang-name');
    
    flagSpan.textContent = this.supportedLanguages[this.currentLang].flag;
    nameSpan.textContent = this.supportedLanguages[this.currentLang].name;

    // Update active option
    options.forEach(option => {
      const lang = option.getAttribute('data-lang');
      option.classList.toggle('active', lang === this.currentLang);
    });
  }
}

// Initialize when DOM is loaded
let i18n;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    i18n = new I18n();
  });
} else {
  i18n = new I18n();
}

// Export for global access
window.i18n = i18n;