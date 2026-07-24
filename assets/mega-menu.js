class MegaMenu {
  constructor() {
    this.closeTimeout = null;
    this.observers = new Map();
    this.init();
  }

  init() {
    this.menuItems = document.querySelectorAll('[header-menu] .menu-list__list-item');
    this.megaMenus = document.querySelectorAll('[data-mega-menu-for]');

    if (!this.menuItems.length) return;

    this.setupCollectionTabs();
    this.setupEventListeners();
    this.setupEditorListeners();
  }

  /**
   * Sets up collection tab navigation for each mega menu
   */
  setupCollectionTabs() {
    this.megaMenus.forEach(megaMenu => {
      const collectionsNavList = megaMenu.querySelector('.collections-nav-list');
      const tabPanels = megaMenu.querySelectorAll('.collection-menu-tab-panel');

      if (!collectionsNavList || !tabPanels.length) return;

      // Prevent re-initialization
      if (megaMenu.hasAttribute('data-tabs-initialized')) return;

      // Build navigation items
      this.buildNavItems(megaMenu, collectionsNavList, tabPanels);

      // Mark as initialized
      megaMenu.setAttribute('data-tabs-initialized', 'true');

      // Watch for external changes and re-initialize if needed
      this.observeNavList(megaMenu, collectionsNavList);
    });
  }

  /**
   * Builds navigation items from tab panels
   */
  buildNavItems(megaMenu, collectionsNavList, tabPanels) {
    // Clear existing content
    collectionsNavList.innerHTML = '';

    const fragment = document.createDocumentFragment();

    tabPanels.forEach((panel, index) => {
      const collectionHandle = panel.getAttribute('data-collection');
      const collectionTitle = panel.getAttribute('data-collection-title');
      const collectionURL = panel.getAttribute('data-collection-url')

      if (!collectionTitle) return;

      // Create and configure nav item
      const navItem = this.createNavItem(collectionHandle, collectionTitle, collectionURL);

      // Set first item as active
      if (index === 0) {
        navItem.classList.add('active');
        panel.classList.add('active');
      }

      // Attach event listeners
      this.attachNavItemEvents(navItem, megaMenu, collectionHandle);

      fragment.appendChild(navItem);
    });

    collectionsNavList.appendChild(fragment);
  }

  /**
   * Creates a navigation item element
   */
  createNavItem(collectionHandle, collectionTitle, collectionURL) {
    const navItem = document.createElement('a');
    navItem.href = collectionURL;
    navItem.className = 'collection-nav-item';
    navItem.textContent = collectionTitle;
    navItem.setAttribute('data-collection-tab', collectionHandle || 'all');
    return navItem;
  }

  /**
   * Attaches click and hover events to navigation item
   */
  attachNavItemEvents(navItem, megaMenu, collectionHandle) {
    // Prevent default link behavior and activate tab
    // navItem.addEventListener('click', (e) => {
    //   e.preventDefault();
    //   this.activateCollectionTab(megaMenu, collectionHandle);
    // });

    // Activate on hover
    navItem.addEventListener('mouseenter', () => {
      this.activateCollectionTab(megaMenu, collectionHandle);
    });
  }

  /**
   * Activates a collection tab by handle
   */
  activateCollectionTab(megaMenu, collectionHandle) {
    if (!megaMenu || !collectionHandle) return;

    const navItems = megaMenu.querySelectorAll('.collection-nav-item');
    const tabPanels = megaMenu.querySelectorAll('.collection-menu-tab-panel');

    // Remove active state from all
    navItems.forEach(item => item.classList.remove('active'));
    tabPanels.forEach(panel => panel.classList.remove('active'));

    // Add active state to selected
    const activeNavItem = megaMenu.querySelector(`[data-collection-tab="${collectionHandle}"]`);
    const activePanel = megaMenu.querySelector(`[data-collection="${collectionHandle}"]`);

    if (activeNavItem) activeNavItem.classList.add('active');
    if (activePanel) activePanel.classList.add('active');
  }

  /**
   * Observes collections nav list for external changes
   */
  observeNavList(megaMenu, collectionsNavList) {
    // Disconnect existing observer if any
    if (this.observers.has(megaMenu)) {
      this.observers.get(megaMenu).disconnect();
    }

    const observer = new MutationObserver((mutations) => {
      const wasCleared = mutations.some(
        mutation => mutation.type === 'childList' &&
        mutation.removedNodes.length > 0 &&
        collectionsNavList.children.length === 0
      );

      if (wasCleared) {
        megaMenu.removeAttribute('data-tabs-initialized');
        this.setupCollectionTabs();
      }
    });

    observer.observe(collectionsNavList, {
      childList: true,
      subtree: false
    });

    this.observers.set(megaMenu, observer);
  }

  /**
   * Sets up mega menu open/close event listeners
   */
  setupEventListeners() {
    this.menuItems.forEach(item => {
      const link = item.querySelector('.menu-list__link, .menu-list__link-title');
      if (!link) return;

      const menuText = link.querySelector('.menu-list__link-title')?.textContent?.trim()
        || link.textContent.trim();

      const megaMenu = Array.from(this.megaMenus).find(
        menu => menu.getAttribute('data-mega-menu-for') === menuText
      );

      if (!megaMenu) return;

      this.attachMegaMenuEvents(item, link, megaMenu);
    });
  }

  /**
   * Attaches events for mega menu interaction
   */
  attachMegaMenuEvents(item, link, megaMenu) {
    // Mouse enter on menu item - open immediately
    item.addEventListener('mouseenter', () => {
      this.clearCloseTimeout();
      this.openMegaMenu(item, megaMenu);
    });

    // Mouse leave on menu item - close after delay
    item.addEventListener('mouseleave', () => {
      this.startCloseTimeout(item, megaMenu);
    });

    // Mouse enter on mega menu - prevent closing
    megaMenu.addEventListener('mouseenter', () => {
      this.clearCloseTimeout();
    });

    // Mouse leave on mega menu - close after delay
    megaMenu.addEventListener('mouseleave', () => {
      this.startCloseTimeout(item, megaMenu);
    });

    // Click toggle for touch devices
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleMegaMenu(item, megaMenu);
    });
  }

  /**
   * Starts timeout to close mega menu
   */
  startCloseTimeout(item, megaMenu) {
    this.clearCloseTimeout();
    this.closeTimeout = setTimeout(() => {
      this.closeMegaMenu(item, megaMenu);
    }, 300);
  }

  /**
   * Clears the close timeout
   */
  clearCloseTimeout() {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  }

  /**
   * Opens a mega menu
   */
  openMegaMenu(item, megaMenu) {
    this.closeAllMegaMenus();
    item.classList.add('active-mega-menu');
    megaMenu.classList.add('active-mega-menu');
  }

  /**
   * Closes a mega menu
   */
  closeMegaMenu(item, megaMenu) {
    item.classList.remove('active-mega-menu');
    megaMenu.classList.remove('active-mega-menu');
  }

  /**
   * Toggles a mega menu open/closed
   */
  toggleMegaMenu(item, megaMenu) {
    if (megaMenu.classList.contains('active-mega-menu')) {
      this.closeMegaMenu(item, megaMenu);
    } else {
      this.openMegaMenu(item, megaMenu);
    }
  }

  /**
   * Closes all open mega menus
   */
  closeAllMegaMenus() {
    this.clearCloseTimeout();

    this.menuItems.forEach(item => {
      item.classList.remove('active-mega-menu');
    });

    this.megaMenus.forEach(menu => {
      menu.classList.remove('active-mega-menu');
    });
  }

  /**
   * Sets up Shopify theme editor event listeners
   */
  setupEditorListeners() {
    if (!Shopify?.designMode) return;

    const handleBlockSelect = this.handleBlockSelect.bind(this);

    document.addEventListener('shopify:block:select', handleBlockSelect);

    // Store cleanup function for potential future use
    this.cleanupEditorListeners = () => {
      document.removeEventListener('shopify:block:select', handleBlockSelect);
    };
  }

  /**
   * Handles block selection in theme customizer
   */
  handleBlockSelect(event) {
    const selectedBlock = event.target;
    if (!selectedBlock) return;

    // Find the mega menu that contains this block
    let parentMegaMenu = null;
    this.megaMenus.forEach(megaMenu => {
      if (megaMenu.contains(selectedBlock)) {
        parentMegaMenu = megaMenu;
      }
    });

    if (!parentMegaMenu) return;

    // Find the collection menu tab panel
    let tabPanel = null;
    if (selectedBlock.classList?.contains('collection-menu-tab-panel')) {
      tabPanel = selectedBlock;
    } else {
      tabPanel = selectedBlock.closest('.collection-menu-tab-panel');
      if (!tabPanel) {
        tabPanel = selectedBlock.querySelector('.collection-menu-tab-panel');
      }
    }

    if (!tabPanel) return;

    const collectionHandle = tabPanel.getAttribute('data-collection');
    if (!collectionHandle) return;

    // Activate the corresponding tab
    this.activateCollectionTab(parentMegaMenu, collectionHandle);

    // Ensure the mega menu is visible in the customizer
    parentMegaMenu.classList.add('active-mega-menu');
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new MegaMenu();
});
