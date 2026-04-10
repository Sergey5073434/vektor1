/* ============================================================
   main.js — точка входа
   ============================================================ */

(() => {
  'use strict';

  /* ── Header scroll state ── */
  const header = document.querySelector('.header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── Smooth anchor scroll ── */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId.length > 1) {
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  /* ── Stats counters ──
     Анимирует числа в .stat-card__value при появлении в viewport */
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length && 'IntersectionObserver' in window) {
    const animate = (el) => {
      const target = parseInt(el.dataset.counter, 10);
      if (isNaN(target)) return;
      const sup = el.querySelector('sup');
      const supHTML = sup ? sup.outerHTML : '';
      const duration = 1600;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);
        el.innerHTML = value + supHTML;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    counters.forEach((c) => io.observe(c));
  }

  /* ── Cases filter ── */
  const filterBtns = document.querySelectorAll('.cases__filter-btn');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
    });
  });

  /* ── FAQ: закрыть остальные при открытии одного ── */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        faqItems.forEach((other) => {
          if (other !== item && other.open) other.open = false;
        });
      }
    });
  });

  /* ============================================================
     QUIZ
     ============================================================ */
  const quiz = document.getElementById('quiz');
  if (quiz) {
    const steps = quiz.querySelectorAll('.quiz__step');
    const progressFill = quiz.querySelector('#quizFill');
    const stepNum = quiz.querySelector('#quizStepNum');
    const totalEl = quiz.querySelector('#quizTotal');
    const nextBtn = quiz.querySelector('#quizNext');
    const backBtn = quiz.querySelector('#quizBack');
    const total = steps.length;
    let current = 1;
    const answers = {};

    if (totalEl) totalEl.textContent = total;

    const showStep = (n) => {
      steps.forEach((s) => s.classList.remove('is-active'));
      const step = quiz.querySelector(`.quiz__step[data-step="${n}"]`);
      if (step) step.classList.add('is-active');
      if (stepNum) stepNum.textContent = n;
      if (progressFill) progressFill.style.width = (n / total) * 100 + '%';
      if (backBtn) backBtn.disabled = n === 1;
      if (nextBtn) nextBtn.style.display = n === total ? 'none' : 'inline-flex';
      current = n;
    };

    /* Опции с одиночным выбором */
    quiz.querySelectorAll('.quiz__step .quiz__option').forEach((opt) => {
      opt.addEventListener('click', () => {
        const step = opt.closest('.quiz__step');
        step.querySelectorAll('.quiz__option').forEach((o) => o.classList.remove('is-selected'));
        opt.classList.add('is-selected');
        answers[step.dataset.step] = opt.dataset.value;
        // авто-переход через 350мс
        setTimeout(() => { if (current < total) showStep(current + 1); }, 350);
      });
    });

    /* Range slider */
    const areaInput = quiz.querySelector('#quizAreaInput');
    const areaValue = quiz.querySelector('#quizArea');
    if (areaInput && areaValue) {
      const formatNum = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      const update = () => {
        areaValue.textContent = formatNum(parseInt(areaInput.value, 10));
        answers['2'] = areaInput.value;
      };
      areaInput.addEventListener('input', update);
      update();
    }

    /* Навигация */
    if (nextBtn) nextBtn.addEventListener('click', () => { if (current < total) showStep(current + 1); });
    if (backBtn) backBtn.addEventListener('click', () => { if (current > 1) showStep(current - 1); });

    /* Submit */
    const submitBtn = quiz.querySelector('#quizSubmit');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const inputs = quiz.querySelectorAll('.quiz__step[data-step="4"] .quiz__input');
        const name = inputs[0]?.value.trim();
        const phone = inputs[1]?.value.trim();
        if (!name || !phone) {
          alert('Пожалуйста, заполните имя и телефон');
          return;
        }
        answers.name = name;
        answers.phone = phone;
        console.log('Quiz answers:', answers);
        alert('Спасибо! Ваша заявка принята. Мы свяжемся с вами в течение 24 часов.');
      });
    }
  }

  /* ── Form submit handlers (mailto fallback) ── */
  document.querySelectorAll('form').forEach((form) => {
    if (form.classList.contains('hero__form') || form.classList.contains('final-cta__form')) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());
        console.log('Form submission:', data);
        alert('Спасибо! Ваша заявка принята. Мы свяжемся с вами в течение 15 минут в рабочее время.');
        form.reset();
      });
    }
  });

  /* ============================================================
     CHAT WIDGET
     ============================================================ */
  const chatWidget = document.getElementById('chatWidget');
  if (chatWidget) {
    const toggleBtn = chatWidget.querySelector('#chatToggle');
    const closeBtn = chatWidget.querySelector('#chatClose');
    const form = chatWidget.querySelector('#chatForm');
    const badge = chatWidget.querySelector('.chat-widget__badge');

    const open = () => {
      chatWidget.classList.add('is-open');
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
      if (badge) badge.style.display = 'none';
    };

    const close = () => {
      chatWidget.classList.remove('is-open');
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    };

    if (toggleBtn) toggleBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);

    /* Закрытие по Esc */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && chatWidget.classList.contains('is-open')) close();
    });

    /* Submit */
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        if (!data.phone || data.phone.trim().length < 5) {
          form.querySelector('input[name="phone"]').focus();
          return;
        }
        console.log('Chat widget submission:', data);
        chatWidget.classList.add('is-sent');
        form.reset();
      });
    }
  }

  /* ── Active nav highlight ── */
  const navLinks = document.querySelectorAll('.nav__link');
  if (navLinks.length && 'IntersectionObserver' in window) {
    const sections = [...navLinks]
      .map((l) => document.querySelector(l.getAttribute('href')))
      .filter(Boolean);

    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = '#' + entry.target.id;
          navLinks.forEach((l) => {
            l.classList.toggle('is-active', l.getAttribute('href') === id);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach((s) => navIO.observe(s));
  }

})();
