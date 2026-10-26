(() => {
  'use strict';

  const KEY = 'ta3leemy_v1';
  const DAYS = [
    { id: 'saturday', name: 'السبت' },
    { id: 'sunday', name: 'الأحد' },
    { id: 'monday', name: 'الإثنين' },
    { id: 'tuesday', name: 'الثلاثاء' },
    { id: 'wednesday', name: 'الأربعاء' },
    { id: 'thursday', name: 'الخميس' },
    { id: 'friday', name: 'الجمعة' }
  ];
  const SUBJECTS = [
    'اللغة العربية',
    'اللغة الإنجليزية',
    'اللغة الفرنسية',
    'العلوم',
    'التربية الإسلامية',
    'الرياضيات',
    'الفلسفة والمنطق',
    'البرمجة والذكاء الاصطناعي',
    'التاريخ'
  ];
  const TODAY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));

  let state;
  try {
    state = JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    state = {};
  }

  state.schedule = Object.fromEntries(DAYS.map(day => [
    day.id,
    Array.from({ length: 7 }, (_, index) => {
      const savedSubject = state.schedule?.[day.id]?.[index];
      return SUBJECTS.includes(savedSubject) ? savedSubject : '';
    })
  ]));
  state.plan = Array.isArray(state.plan)
    ? state.plan.map(day => ({
      name: DAYS.find(item => item.name === day.name)?.name,
      subjects: Array.isArray(day.subjects) ? day.subjects.filter(subject => SUBJECTS.includes(subject)) : []
    })).filter(day => day.name && day.subjects.length)
    : [];
  delete state.books;
  delete state.chat;
  delete state.quizzes;

  let toastTimer;

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      toast('مساحة التخزين ممتلئة. احذف صورة المدرسة أو بعض البيانات وحاول مرة أخرى.');
    }
  }

  function toast(message) {
    const element = $('#toast');
    if (!element) return;
    element.textContent = message;
    element.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove('show'), 3500);
  }

  function subjectsInSchedule() {
    const items = new Set();
    DAYS.forEach(day => (state.schedule[day.id] || []).forEach(subject => {
      if (SUBJECTS.includes(subject)) items.add(subject);
    }));
    return [...items];
  }

    function showApp() {
    $('#loginScreen').classList.add('hidden');
    $('#appShell').classList.remove('hidden');
    const name = state.name || 'يا بطل';
    $('#welcomeName').textContent = name.split(/\s+/)[0];
    $('#schoolLabel').textContent = state.school || 'مدرستك';
    $('#schoolPhotoName').textContent = state.school || 'مدرستك';
    $('#profileAvatar').textContent = [...name][0] || 'ط';
    $('#todayDate').textContent = new Intl.DateTimeFormat('ar-EG', {
      weekday: 'long', day: 'numeric', month: 'long'
    }).format(new Date());

    // --- هنا التعديل الذكي لصورة المدرسة الثابتة والمخصصة ---
    const defaultSchoolPhoto = "images/a.jpg"; // ضع هنا رابط أو مسار صورتك الافتراضية الثابتة للجميع
    const photoToDisplay = state.photo || defaultSchoolPhoto;

    $('#schoolPhoto').style.backgroundImage = `linear-gradient(0deg,#101a32d9,#101a321c 75%),url("${photoToDisplay}")`;
    if (state.photo) {
      $('#schoolPhoto').classList.add('custom-photo');
    }
    // -----------------------------------------------------

    renderSchedule();
    renderHome();
    renderPlan();
  }
  function renderSchedule() {
    const grid = $('#weekGrid');
    if (!grid) return;

    grid.innerHTML = DAYS.map(day => {
      const entries = Array.from({ length: 7 }, (_, index) => {
        const selected = state.schedule[day.id][index];
        const options = SUBJECTS.map(subject =>
          `<option value="${escapeHTML(subject)}" ${selected === subject ? 'selected' : ''}>${escapeHTML(subject)}</option>`
        ).join('');
        return `<label class="subject-slot"><span class="slot-number">${String(index + 1).padStart(2, '0')}</span><select data-day="${day.id}" data-slot="${index}" aria-label="${day.name}، الحصة ${index + 1}"><option value="">اختر مادة...</option>${options}</select></label>`;
      }).join('');
      const count = state.schedule[day.id].filter(Boolean).length;
      return `<article class="day-card ${day.id === TODAY ? 'is-today' : ''}"><div class="day-heading"><b>${day.name}${day.id === TODAY ? ' · اليوم' : ''}</b><span>${count} / ٧ مواد</span></div><div class="subject-slots">${entries}</div></article>`;
    }).join('');

    $$('select[data-day]', grid).forEach(select => select.addEventListener('change', () => {
      const day = select.dataset.day;
      state.schedule[day][Number(select.dataset.slot)] = select.value;
      save();
      select.closest('.day-card').querySelector('.day-heading span').textContent = `${state.schedule[day].filter(Boolean).length} / ٧ مواد`;
      renderHome();
    }));
  }

  function renderHome() {
    $('#statSubjects').textContent = subjectsInSchedule().length;
    $('#statSessions').textContent = state.plan.reduce((total, day) => total + day.subjects.length, 0);
    const totalSubjects = $('#statSubjectsTotal');
    if (totalSubjects) totalSubjects.textContent = SUBJECTS.length;

    const today = (state.schedule[TODAY] || []).filter(Boolean);
    $('#todaySchedule').innerHTML = today.length
      ? today.map((subject, index) => `<div class="today-row"><span class="today-time">${String(index + 1).padStart(2, '0')}</span><b>${escapeHTML(subject)}</b><small>حصة ${index + 1}</small></div>`).join('')
      : '<div class="empty-state"><span class="empty-icon">▦</span>لسه مفيش مواد في جدول النهارده.<br>ضيف المواد عشان تلاقيها هنا.</div>';
  }

  function renderPlan() {
    const element = $('#studyPlan');
    if (!state.plan.length) {
      element.innerHTML = '<div class="plan-empty"><span>◷</span><b>خطتك الدراسية لسه مستنياك</b><p>ضيف المواد في جدول الأسبوع، وبعدها ولّد خطة مناسبة ليك.</p><button class="button button-outline" data-go="schedule">روح لجدول المواد</button></div>';
      return;
    }
    element.innerHTML = state.plan.map(day =>
      `<article class="plan-day"><div class="plan-day-head"><b>${escapeHTML(day.name)}</b><span>${day.subjects.length} جلسات · ٤٥ دقيقة</span></div>${day.subjects.map((subject, index) => `<div class="plan-session"><span class="session-time">${['٤:٠٠ م', '٥:٠٠ م', '٦:٠٠ م'][index % 3]}</span><div class="session-info"><b>${escapeHTML(subject)}</b><small>مراجعة الدرس + حل تدريبات</small></div><span class="session-check">✓</span></div>`).join('')}</article>`
    ).join('');
  }

  function generatePlan() {
    const result = [];
    DAYS.forEach(day => {
      const scheduled = [...new Set(state.schedule[day.id].filter(subject => SUBJECTS.includes(subject)))];
      if (!scheduled.length) return;
      const chosen = scheduled.length <= 3
        ? scheduled
        : [scheduled[0], scheduled[Math.floor(scheduled.length / 2)], scheduled[scheduled.length - 1]];
      result.push({ name: day.name, subjects: chosen });
    });
    if (!result.length) {
      toast('اختار مادة واحدة على الأقل في جدول الأسبوع الأول.');
      return;
    }
    state.plan = result;
    save();
    renderPlan();
    renderHome();
    toast('اتعملت خطتك الأسبوعية بنجاح ✦');
  }

  function setPage(page) {
    const valid = ['home', 'schedule', 'plan'].includes(page) ? page : 'home';
    $$('.page').forEach(section => section.classList.toggle('active-page', section.id === `page-${valid}`));
    $$('.nav-link[data-page]').forEach(button => button.classList.toggle('active', button.dataset.page === valid));
    $('#breadcrumbTitle').textContent = ({ home: 'الرئيسية', schedule: 'جدول المواد', plan: 'خطة المذاكرة' })[valid];
    history.replaceState(null, '', `#${valid}`);
    $('#sidebar').classList.remove('open');
    $('#sidebarBackdrop').classList.remove('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function init() {
    if (state.name && state.school) {
      showApp();
      if (location.hash) setPage(location.hash.slice(1));
    }

    $('#loginForm').addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      state.name = String(data.get('name')).trim();
      state.school = String(data.get('school')).trim();
      if (state.name && state.school) {
        save();
        showApp();
      }
    });

    $$('.nav-link[data-page]').forEach(button => button.addEventListener('click', () => setPage(button.dataset.page)));
    document.addEventListener('click', event => {
      const go = event.target.closest('[data-go]');
      if (go) setPage(go.dataset.go);
    });
    $('#generatePlan').addEventListener('click', generatePlan);
    $('#clearSchedule').addEventListener('click', () => {
      if (!confirm('هل تريد مسح كل المواد من جدول الأسبوع؟')) return;
      state.schedule = Object.fromEntries(DAYS.map(day => [day.id, Array(7).fill('')]));
      state.plan = [];
      save();
      renderSchedule();
      renderHome();
      renderPlan();
      toast('الجدول اتنضّف.');
    });

    $('#changeSchoolPhoto').addEventListener('click', () => $('#schoolPhotoInput').click());
    $('#schoolPhotoInput').addEventListener('change', event => {
      const file = event.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast('اختار ملف صورة صالح.');
        return;
      }
      if (file.size > 8 * 1048576) {
        toast('حجم الصورة لازم يكون أقل من ٨ ميجابايت.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        state.photo = reader.result;
        save();
        $('#schoolPhoto').style.backgroundImage = `linear-gradient(0deg,#101a32d9,#101a321c 75%),url("${state.photo}")`;
        $('#schoolPhoto').classList.add('custom-photo');
        toast('اتحدّثت صورة المدرسة بنجاح.');
      };
      reader.readAsDataURL(file);
      event.target.value = '';
    });

    $('#logoutButton').addEventListener('click', () => {
      if (!confirm('تسجيل الخروج؟ بيانات جدولك وخطة مذاكرتك محفوظة على جهازك.')) return;
      $('#appShell').classList.add('hidden');
      $('#loginScreen').classList.remove('hidden');
      $('#studentName').value = state.name || '';
      $('#schoolName').value = state.school || '';
    });
    $('#profileAvatar').addEventListener('click', () => toast(`${state.name} · ${state.school}`));
    $('#menuToggle').addEventListener('click', () => {
      $('#sidebar').classList.add('open');
      $('#sidebarBackdrop').classList.add('show');
    });
    $('#sidebarBackdrop').addEventListener('click', () => {
      $('#sidebar').classList.remove('open');
      $('#sidebarBackdrop').classList.remove('show');
    });
    window.addEventListener('hashchange', () => setPage(location.hash.slice(1) || 'home'));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
