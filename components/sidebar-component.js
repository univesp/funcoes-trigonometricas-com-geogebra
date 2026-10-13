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

  // 5. Ativa os comportamentos
  attachAccordionBehavior();
  attachSidebarClose();
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