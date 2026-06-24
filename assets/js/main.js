document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const closeBtn = document.querySelector('.mobile-nav-close');

  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => mobileNav.classList.add('open'));
    closeBtn?.addEventListener('click', () => mobileNav.classList.remove('open'));
    mobileNav.addEventListener('click', (e) => {
      if (e.target === mobileNav) mobileNav.classList.remove('open');
    });
    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => mobileNav.classList.remove('open'));
    });
  }

  document.querySelectorAll('.lang-select').forEach((select) => {
    select.addEventListener('change', (e) => {
      const url = e.target.value;
      if (url) window.location.href = url;
    });
  });
});
