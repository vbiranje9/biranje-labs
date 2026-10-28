(() => {
  const body = document.body;
  const header = document.querySelector('.site-header');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  document.querySelector('#year').textContent = new Date().getFullYear();

  const updateHeader = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const menuToggle = document.querySelector('.menu-toggle');
  const primaryMenu = document.querySelector('#primary-menu');

  const setMenuState = (isOpen) => {
    header.classList.toggle('menu-open', isOpen);
    body.classList.toggle('menu-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  };

  menuToggle.addEventListener('click', () => {
    setMenuState(menuToggle.getAttribute('aria-expanded') !== 'true');
  });

  primaryMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenuState(false));
  });

  document.querySelectorAll('[data-media-shell]').forEach((mediaShell) => {
    const image = mediaShell.querySelector('img');

    if (!image || mediaShell.dataset.mediaEnabled !== 'true') {
      return;
    }

    image.src = image.dataset.src;

    if (mediaShell.dataset.href) {
      mediaShell.href = mediaShell.dataset.href;
      mediaShell.target = '_blank';
      mediaShell.rel = 'noreferrer';
      mediaShell.removeAttribute('aria-disabled');
      mediaShell.removeAttribute('tabindex');
      mediaShell.querySelector('.award-action').innerHTML = 'View award <i aria-hidden="true">&#8599;</i>';
    }

    const setImageState = () => {
      mediaShell.classList.toggle('has-image', image.complete && image.naturalWidth > 0);
    };

    image.addEventListener('load', setImageState);
    image.addEventListener('error', setImageState);
    setImageState();
  });

  if (!reducedMotion) {
    body.classList.add('motion-ready');

    window.setTimeout(() => {
      document.querySelectorAll('.hero-reveal').forEach((element) => {
        element.classList.add('is-visible');
      });
    }, 90);

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -45px' },
    );

    document.querySelectorAll('.reveal').forEach((element) => {
      revealObserver.observe(element);
    });
  } else {
    document.querySelectorAll('.reveal, .hero-reveal').forEach((element) => {
      element.classList.add('is-visible');
    });
  }

  const formatCount = (value, target, suffix, decimal) => {
    if (decimal) {
      return `${value.toFixed(1)}${suffix}`;
    }

    return `${Math.round(value)}${suffix}`;
  };

  const startCounter = (element) => {
    const target = Number.parseFloat(element.dataset.count);
    const suffix = element.dataset.suffix ?? '';
    const decimal = element.dataset.decimal === 'true';
    const duration = 1300;
    const startedAt = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      element.textContent = formatCount(target * eased, target, suffix, decimal);

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window && !reducedMotion) {
    const statsObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          startCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.7 },
    );

    document.querySelectorAll('.stat dt[data-count]').forEach((stat) => {
      statsObserver.observe(stat);
    });
  } else {
    document.querySelectorAll('.stat dt[data-count]').forEach((stat) => {
      stat.textContent = `${stat.dataset.count}${stat.dataset.suffix ?? ''}`;
    });
  }

  document.querySelectorAll('.timeline-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.timeline-item');
      const detail = item.querySelector('.timeline-detail');
      const isExpanded = button.getAttribute('aria-expanded') === 'true';

      button.setAttribute('aria-expanded', String(!isExpanded));
      button.setAttribute('aria-label', isExpanded ? 'Show experience highlights' : 'Hide experience highlights');
      detail.hidden = isExpanded;
    });
  });

  if (finePointer && !reducedMotion) {
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorRing = document.querySelector('.cursor-ring');
    let pointerX = -100;
    let pointerY = -100;
    let isCursorScheduled = false;

    body.classList.add('has-custom-cursor');

    const positionCursor = () => {
      cursorDot.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
      cursorRing.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
      isCursorScheduled = false;
    };

    window.addEventListener(
      'pointermove',
      (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;

        if (!isCursorScheduled) {
          requestAnimationFrame(positionCursor);
          isCursorScheduled = true;
        }
      },
      { passive: true },
    );

    document.querySelectorAll('a, button, input, textarea').forEach((element) => {
      element.addEventListener('pointerenter', () => body.classList.add('cursor-active'));
      element.addEventListener('pointerleave', () => body.classList.remove('cursor-active'));
    });

    document.querySelectorAll('.magnetic').forEach((element) => {
      element.addEventListener('pointermove', (event) => {
        const bounds = element.getBoundingClientRect();
        const offsetX = (event.clientX - bounds.left - bounds.width / 2) * 0.14;
        const offsetY = (event.clientY - bounds.top - bounds.height / 2) * 0.18;
        element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      });

      element.addEventListener('pointerleave', () => {
        element.style.transform = '';
      });
    });

    const portrait = document.querySelector('.hero-portrait');
    window.addEventListener(
      'scroll',
      () => {
        portrait.style.translate = `0 ${Math.min(window.scrollY * 0.17, 132)}px`;
      },
      { passive: true },
    );
  }

  const form = document.querySelector('#contact-form');
  const formStatus = form.querySelector('.form-status');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const name = formData.get('name').trim();
    const email = formData.get('email').trim();
    const message = formData.get('message').trim();
    const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
    const bodyText = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);

    formStatus.textContent = 'Opening your email client...';
    window.location.href = `mailto:vbiranje07@gmail.com?subject=${subject}&body=${bodyText}`;
  });
})();