async function renderSidebar(targetSelector) {
  const container = document.querySelector(targetSelector);
  if (!container) return;

  // 1. Busca os dados do JSON
  const response = await fetch('data/sidebar-data.json');
  const lessons = await response.json();

  // 2. Cabeçalho fixo no topo da sidebar
  const headerHTML = `
    <div class="sidebar-header">
      <span class="sidebar-header-title">Conteúdo</span>
      <button class="sidebar-close" type="button" aria-label="Fechar menu">
        <i class="material-icons">close</i>
      </button>
    </div>
  `;

  // 3. Monta o HTML de cada grupo
  const groupsHTML = lessons.map((lesson) => {
    const itemsHTML = lesson.items.length
      ? lesson.items
          .map((item) => `<li><a href="${item.href}">${item.label}</a></li>`)
          .join('')
      : '';

    return `
      <div class="sidebar-group">
        <button class="sidebar-heading" type="button" aria-expanded="false">
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

  // 4. Injeta cabeçalho + body (grupos) no aside
  container.innerHTML = `
    ${headerHTML}
    <div class="sidebar-body">
      ${groupsHTML}
    </div>
  `;

  // 5. Abre o primeiro grupo por padrão (Aula 1)
  const firstGroup = container.querySelector('.sidebar-group');
  if (firstGroup) {
    firstGroup.classList.add('open');
    firstGroup.querySelector('.sidebar-heading').setAttribute('aria-expanded', 'true');
  }

  // 5.1 — Sidebar fechada por padrão em telas < 1400px
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebar-toggle');
  const isLargeScreen = window.innerWidth >= 1400;

  if (sidebar && toggle && !isLargeScreen) {
    sidebar.classList.add('sidebar-hidden');
    toggle.classList.add('sidebar-toggle-visible');
    toggle.setAttribute('aria-expanded', 'false');
  }

  // 6. Ativa os comportamentos
  attachAccordionBehavior();
  attachSidebarClose();
  attachSidebarInteractions();
  attachHeadingTitleUpdate();
  attachResponsiveSidebar();
}

function attachAccordionBehavior() {
  document.querySelectorAll('.sidebar-heading').forEach((heading) => {
    heading.addEventListener('click', () => {
      const group = heading.closest('.sidebar-group');
      const wasOpen = group.classList.contains('open');

      // Fecha todos
      document.querySelectorAll('.sidebar-group').forEach((g) => {
        g.classList.remove('open');
        g.querySelector('.sidebar-heading').setAttribute('aria-expanded', 'false');
      });

      // Abre só o clicado (se não estava aberto)
      if (!wasOpen) {
        group.classList.add('open');
        heading.setAttribute('aria-expanded', 'true');
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

// ============================================================
// ATIVO: aplica a classe .ativo no item do menu correspondente
// ============================================================

function setActiveLink(link) {
  // Remove de todos
  document.querySelectorAll('.page-nav-list a').forEach((a) => {
    a.classList.remove('ativo');
  });
  // Aplica no passado
  if (link) link.classList.add('ativo');
}

// Atualiza Título da Página
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
// SCROLL: quando clica em um item, rola até a seção
// ============================================================

function attachSmoothScroll() {
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

      // Rola suavemente dentro do container rolável
      scrollContainer.scrollTo({
        top: target.offsetTop - OFFSET,
        behavior: 'smooth',
      });

      setActiveLink(link);

    });
  });
}

// ============================================================
// SCROLL SPY: observa as seções e marca o item correspondente
// ============================================================

function attachScrollSpy() {
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

  // Recalcula o "ativo" toda vez que algo muda
  const updateActive = () => {
    const containerTop = scrollContainer.getBoundingClientRect().top;
    // Linha de referência: 30% do topo da tela
    const referenceLine = containerTop + scrollContainer.clientHeight * 0.3;

    // Pega todas as seções com link cujo topo já passou da linha de referência
    const passed = sections.filter((s) => s.getBoundingClientRect().top <= referenceLine);

    if (!passed.length) {
      // Nenhuma seção com link foi alcançada → remove todos os ativos
      setActiveLink(null);
      return;
    }

    // A última (mais próxima do topo) é a ativa
    const current = passed[passed.length - 1];
    const currentLink = links.find(
      (l) => l.getAttribute('href') === `#${current.id}`
    );
    setActiveLink(currentLink);
  };

   // Throttle com requestAnimationFrame — roda no máximo 1x por frame
   let rafId = null;
   scrollContainer.addEventListener('scroll', () => {
     if (rafId) return;
     rafId = requestAnimationFrame(() => {
       updateActive();
       rafId = null;
     });
   });

  updateActive(); // roda uma vez ao carregar
}

// Fecha/abre a sidebar automaticamente quando cruza o breakpoint de 1400px
function attachResponsiveSidebar() {
  const BREAKPOINT = 1400;
  let wasLarge = window.innerWidth >= BREAKPOINT;

  window.addEventListener('resize', () => {
    const isLarge = window.innerWidth >= BREAKPOINT;

    // Só age quando CRUZA a linha (evita forçar estado a cada resize)
    if (isLarge === wasLarge) return;
    wasLarge = isLarge;

    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    if (!sidebar || !toggle) return;

    if (isLarge) {
      // Passou pra tela grande → abre
      sidebar.classList.remove('sidebar-hidden');
      toggle.classList.remove('sidebar-toggle-visible');
      toggle.setAttribute('aria-expanded', 'true');
    } else {
      // Passou pra tela pequena → fecha
      sidebar.classList.add('sidebar-hidden');
      toggle.classList.add('sidebar-toggle-visible');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ============================================================
// Chama as funções depois de renderizar a sidebar
// ============================================================

function attachSidebarInteractions() {
  attachSmoothScroll();
  attachScrollSpy();
}