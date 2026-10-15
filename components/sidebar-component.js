// ============================================================
// SIDEBAR
// ============================================================

// Guarda referência aos listeners atuais pra poder removê-los depois
let _scrollSpyAbortController = null;
let _smoothScrollAbortController = null;

async function renderSidebar(targetSelector) {
  const container = document.querySelector(targetSelector);
  if (!container) return;

  // Busca os dados do JSON
  const response = await fetch('data/sidebar-data.json');
  const lessons = await response.json();

  // Guarda as aulas no window (usado pelos cliques)
  window._sidebarAulas = lessons.map((l) => l.aula);

  // Cabeçalho fixo no topo da sidebar
  const headerHTML = `
    <div class="sidebar-header">
      <span class="sidebar-header-title">Conteúdo</span>
      <button class="sidebar-close" type="button" aria-label="Fechar menu">
        <i class="material-icons">close</i>
      </button>
    </div>
  `;

  // Monta o HTML de cada grupo
  const groupsHTML = lessons.map((lesson) => {
    const itemsHTML = lesson.items.length
      ? lesson.items
          .map((item) => {
            // Cada item guarda a qual aula pertence
            return `<li><a href="${item.href}" data-aula="${lesson.aula}">${item.label}</a></li>`;
          })
          .join('')
      : '';

    return `
      <div class="sidebar-group" data-aula="${lesson.aula}">
        <button class="sidebar-heading" type="button" aria-expanded="false" data-aula="${lesson.aula}">
          <span>${lesson.title}</span>
          <i class="material-icons sidebar-arrow">arrow_drop_down</i>
        </button>
        <nav class="sidebar-itens">
          <ul class="page-nav-list">
            ${itemsHTML}
          </ul>
        </nav>
      </div>
    `;
  }).join('');

  // Injeta cabeçalho + body (grupos) no aside
  container.innerHTML = `
    ${headerHTML}
    <div class="sidebar-body">
      ${groupsHTML}
    </div>
  `;

  // Abre o grupo da aula atual (padrão: Aula 1)
  const aulaAtual = (window.carregarAula && getAulaAtualSalva()) || 'aula-1';
  const grupoAtual = container.querySelector(`.sidebar-group[data-aula="${aulaAtual}"]`) 
                     || container.querySelector('.sidebar-group');
  if (grupoAtual) {
    grupoAtual.classList.add('open');
    grupoAtual.querySelector('.sidebar-heading').setAttribute('aria-expanded', 'true');

    // Rola a sidebar pra mostrar o grupo aberto
    // Usa setTimeout pra garantir que o layout já está pronto
    setTimeout(() => scrollGrupoIntoView(grupoAtual), 150);
  }

  // Sidebar fechada por padrão em telas < 1400px
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebar-toggle');
  const isLargeScreen = window.innerWidth >= 1400;

  if (sidebar && toggle && !isLargeScreen) {
    sidebar.classList.add('sidebar-hidden');
    toggle.classList.add('sidebar-toggle-visible');
    toggle.setAttribute('aria-expanded', 'false');
  }

  // Ativa os comportamentos
  attachAccordionBehavior();
  attachSidebarClose();
  attachSidebarInteractions();
  attachHeadingTitleUpdate();
  attachResponsiveSidebar();
  attachAulaClickHandlers();
}

function getAulaAtualSalva() {
  try {
    return localStorage.getItem('aulaAtual');
  } catch (e) {
    return null;
  }
}

function attachAccordionBehavior() {
  document.querySelectorAll('.sidebar-heading').forEach((heading) => {
    heading.addEventListener('click', () => {
      const group = heading.closest('.sidebar-group');
      const wasOpen = group.classList.contains('open');

      document.querySelectorAll('.sidebar-group').forEach((g) => {
        g.classList.remove('open');
        g.querySelector('.sidebar-heading').setAttribute('aria-expanded', 'false');
      });

      if (!wasOpen) {
        group.classList.add('open');
        heading.setAttribute('aria-expanded', 'true');

        // Rola a sidebar pra deixar o grupo visível
        scrollGrupoIntoView(group);
      }
    });
  });
}

function attachSidebarClose() {
  const closeBtn = document.querySelector('.sidebar-close');
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebar-toggle');

  if (!closeBtn || !sidebar || !toggle) return;

  closeBtn.addEventListener('click', () => {
    sidebar.classList.add('sidebar-hidden');
    toggle.classList.add('sidebar-toggle-visible');
    toggle.setAttribute('aria-expanded', 'false');
  });
}

function setActiveLink(link) {
  document.querySelectorAll('.page-nav-list a').forEach((a) => {
    a.classList.remove('ativo');
  });
  if (link) link.classList.add('ativo');
}

function attachHeadingTitleUpdate() {
  document.querySelectorAll('.sidebar-heading').forEach((heading) => {
    heading.addEventListener('click', () => {
      const titleEl = heading.querySelector('span');
      if (!titleEl) return;
      document.title = titleEl.textContent.trim();
    });
  });
}

// ============================================================
// CLIQUE EM ITENS / HEADINGS -> CARREGA AULA
// ============================================================

function attachAulaClickHandlers() {

  // Clique em um ITEM do menu (ex: "1.1 Objetivo de aula")
  document.querySelectorAll('.page-nav-list a').forEach((link) => {
    link.addEventListener('click', (e) => {
      const aulaId = link.dataset.aula;
      const href = link.getAttribute('href');

      // Se a aula do item não é a atual, precisa carregar primeiro
      const aulaAtual = document.getElementById('aula-container')?.dataset.aulaAtual;
      if (aulaId && aulaId !== aulaAtual) {
        e.preventDefault();
        carregarAula(aulaId, { scrollTo: href });
      }
      // Se já é a aula atual, o attachSmoothScroll cuida de rolar
    });
  });

  // Clique no TÍTULO do grupo (ex: "Aula 2") -> carrega a aula
  document.querySelectorAll('.sidebar-heading').forEach((heading) => {
    heading.addEventListener('click', () => {
      const aulaId = heading.dataset.aula;
      if (!aulaId) return;
      const aulaAtual = document.getElementById('aula-container')?.dataset.aulaAtual;
      if (aulaId !== aulaAtual) {
        carregarAula(aulaId);
      }
    });
  });
}

// ============================================================
// SMOOTH SCROLL (re-chamável sem acumular listeners)
// ============================================================

function attachSmoothScroll() {
  // Cancela listeners anteriores, se houver
  if (_smoothScrollAbortController) _smoothScrollAbortController.abort();
  _smoothScrollAbortController = new AbortController();
  const signal = _smoothScrollAbortController.signal;

  const scrollContainer = document.querySelector('#conteudoPrincipal > .container');
  if (!scrollContainer) return;

  const OFFSET = 60;

  document.querySelectorAll('.page-nav-list a').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      scrollContainer.scrollTo({
        top: target.offsetTop - OFFSET,
        behavior: 'smooth',
      });

      setActiveLink(link);
    }, { signal });
  });
}

// ============================================================
// SCROLL SPY (re-chamável)
// ============================================================

function attachScrollSpy() {
  if (_scrollSpyAbortController) _scrollSpyAbortController.abort();
  _scrollSpyAbortController = new AbortController();
  const signal = _scrollSpyAbortController.signal;

  const scrollContainer = document.querySelector('#conteudoPrincipal > .container');
  if (!scrollContainer) return;

  const links = Array.from(document.querySelectorAll('.page-nav-list a'));
  const sections = links
    .map((link) => {
      const href = link.getAttribute('href');
      return href && href !== '#' ? document.querySelector(href) : null;
    })
    .filter(Boolean);

  if (!sections.length) return;

  const updateActive = () => {
    const containerTop = scrollContainer.getBoundingClientRect().top;
    const referenceLine = containerTop + scrollContainer.clientHeight * 0.3;

    const passed = sections.filter((s) => s.getBoundingClientRect().top <= referenceLine);

    if (!passed.length) {
      setActiveLink(null);
      return;
    }

    const current = passed[passed.length - 1];
    const currentLink = links.find(
      (l) => l.getAttribute('href') === `#${current.id}`
    );
    setActiveLink(currentLink);
  };

  let rafId = null;
  scrollContainer.addEventListener('scroll', () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      updateActive();
      rafId = null;
    });
  }, { signal });

  // Executa com um pequeno atraso pra dar tempo do layout assentar
setTimeout(updateActive, 500);
}

// ============================================================
// RESPONSIVE SIDEBAR (auto abre/fecha ao cruzar 1400px)
// ============================================================

function attachResponsiveSidebar() {
  const BREAKPOINT = 1400;
  let wasLarge = window.innerWidth >= BREAKPOINT;

  window.addEventListener('resize', () => {
    const isLarge = window.innerWidth >= BREAKPOINT;
    if (isLarge === wasLarge) return;
    wasLarge = isLarge;

    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    if (!sidebar || !toggle) return;

    if (isLarge) {
      sidebar.classList.remove('sidebar-hidden');
      toggle.classList.remove('sidebar-toggle-visible');
      toggle.setAttribute('aria-expanded', 'true');
    } else {
      sidebar.classList.add('sidebar-hidden');
      toggle.classList.add('sidebar-toggle-visible');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/**
 * Rola o sidebar-body pra deixar o grupo clicado visível.
 */
function scrollGrupoIntoView(group) {
  if (!group) return;

  const body = group.closest('.sidebar-body');
  if (!body) return;

  // Adia a medição até o navegador ter aplicado o .open e recalculado o layout
  requestAnimationFrame(() => {
    const RESP = 20;
    const bodyRect = body.getBoundingClientRect();
    const groupRect = group.getBoundingClientRect();

    // Se ainda mediu 0, tenta de novo no próximo frame
    if (groupRect.height === 0 || bodyRect.height === 0) {
      requestAnimationFrame(() => scrollGrupoIntoView(group));
      return;
    }

    // Se o grupo está acima do topo visível
    if (groupRect.top < bodyRect.top + RESP) {
      const diferenca = groupRect.top - bodyRect.top - RESP;
      body.scrollTo({
        top: body.scrollTop + diferenca,
        behavior: 'smooth',
      });
      return;
    }

    // Se o grupo está abaixo do fundo visível
    if (groupRect.bottom > bodyRect.bottom - RESP) {
      const diferenca = groupRect.top - bodyRect.top - RESP;
      body.scrollTo({
        top: body.scrollTop + diferenca,
        behavior: 'smooth',
      });
    }
  });
}

function attachSidebarInteractions() {
  attachSmoothScroll();
  attachScrollSpy();
}

// ============================================================
// EXPÕE PARA O LOADER
// ============================================================

window.attachScrollSpy = attachScrollSpy;
window.attachSmoothScroll = attachSmoothScroll;