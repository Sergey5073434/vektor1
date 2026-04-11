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
    /* total = шаги без result */
    const total = 4;
    let current = 1;
    const answers = {};

    /* Цены за м² по типам зданий */
    const PRICING = {
      rental:     11800,
      warehouse:  18000,
      industrial: 22000,
      agro:       16500,
    };

    const TYPE_NAMES = {
      rental:     'Аренда в Своё',
      warehouse:  'Складское здание',
      industrial: 'Производственный цех',
      agro:       'Сельскохозяйственное',
    };

    if (totalEl) totalEl.textContent = total;

    const showStep = (n) => {
      steps.forEach((s) => s.classList.remove('is-active'));
      const step = quiz.querySelector(`.quiz__step[data-step="${n}"]`);
      if (step) step.classList.add('is-active');

      /* Шаг 5 — экран результата (без прогресса и навигации) */
      const isResult = n === 5;
      quiz.classList.toggle('is-result', isResult);

      if (!isResult) {
        if (stepNum) stepNum.textContent = n;
        if (progressFill) progressFill.style.width = (n / total) * 100 + '%';
        if (backBtn) backBtn.disabled = n === 1;
        if (nextBtn) nextBtn.style.display = n === total ? 'none' : 'inline-flex';
      }
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

    /* Форматирование числа: 17500000 → "17,5" (млн) */
    const formatMillions = (num) => {
      const m = num / 1000000;
      if (m >= 100) return Math.round(m).toString();
      return m.toFixed(1).replace('.', ',').replace(',0', '');
    };

    const formatThousand = (num) =>
      Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');

    /* Расчёт срока по площади */
    const calcDays = (area) => {
      if (area < 1500) return '90 дней';
      if (area < 3000) return '90–110 дней';
      if (area < 5000) return '110–140 дней';
      return '140–180 дней';
    };

    /* Submit */
    const submitBtn = quiz.querySelector('#quizSubmit');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const inputs = quiz.querySelectorAll('.quiz__step[data-step="4"] .quiz__input');
        const name = inputs[0]?.value.trim();
        const phone = inputs[1]?.value.trim();
        if (!name || !phone) {
          if (!name) inputs[0]?.focus();
          else inputs[1]?.focus();
          return;
        }
        answers.name = name;
        answers.phone = phone;

        /* Расчёт цены */
        const type = answers['1'] || 'warehouse';
        const area = parseInt(answers['2'] || 1500, 10);
        const minPricePerM2 = PRICING[type] || 18000;
        const maxPricePerM2 = minPricePerM2 * 1.35;

        const minTotal = minPricePerM2 * area;
        const maxTotal = maxPricePerM2 * area;

        /* Заполняем экран результата */
        const $ = (id) => document.getElementById(id);
        if ($('resultPrice'))
          $('resultPrice').textContent = `от\u00A0${formatMillions(minTotal)}`;
        if ($('resultRange'))
          $('resultRange').textContent =
            `${formatMillions(minTotal)}\u00A0—\u00A0${formatMillions(maxTotal)} млн\u00A0₽ под\u00A0ключ`;
        if ($('resultType'))
          $('resultType').textContent = TYPE_NAMES[type] || 'Промышленное здание';
        if ($('resultArea'))
          $('resultArea').textContent = `${formatThousand(area)}\u00A0м²`;
        if ($('resultDays'))
          $('resultDays').textContent = calcDays(area);

        console.log('Quiz answers:', answers, { minTotal, maxTotal });

        /* Переход на шаг результата */
        showStep(5);
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

    /* Виджет скрыт первые 15 секунд после загрузки страницы */
    chatWidget.classList.add('is-pending');
    setTimeout(() => {
      chatWidget.classList.remove('is-pending');
    }, 15000);

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

    /* Hide-on-scroll: на мобиле прячем виджет при скролле вниз,
       показываем при скролле вверх. На десктопе всегда виден. */
    const isNarrow = () => window.matchMedia('(max-width: 768px)').matches;
    let lastY = window.scrollY;
    let ticking = false;
    const onScrollChat = () => {
      if (!isNarrow()) {
        chatWidget.classList.remove('is-hidden');
        ticking = false;
        return;
      }
      if (chatWidget.classList.contains('is-open')) {
        ticking = false;
        return;
      }
      const y = window.scrollY;
      const delta = y - lastY;
      if (y > 320 && delta > 8) {
        chatWidget.classList.add('is-hidden');
      } else if (delta < -4 || y < 200) {
        chatWidget.classList.remove('is-hidden');
      }
      lastY = y;
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(onScrollChat);
        ticking = true;
      }
    }, { passive: true });
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
