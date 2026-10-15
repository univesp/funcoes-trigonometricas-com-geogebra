// ============================================================
// AULA LOADER
// Carrega as aulas sob demanda, com cache e spinner
// ============================================================

const AULA_PADRAO = 'aula-1';
const STORAGE_KEY = 'aulaAtual';
const TEMPO_MINIMO_SPINNER = 1000; // spinner fica visível no mínimo esse tempo

// Cache em memória (evita refetch ao voltar pra uma aula já visitada)
const cacheAulas = {};

/**
 * Carrega uma aula no #aula-container.
 * @param {string} aulaId - Ex: "aula-1"
 * @param {object} options - { scrollTo: "#secao" (opcional) }
 */
async function carregarAula(aulaId, options = {}) {
  const container = document.getElementById('aula-container');
  if (!container) return;

  // Já está carregada? Só garante que está visível e faz scroll
  if (container.dataset.aulaAtual === aulaId) {
    if (options.scrollTo) scrollParaSecao(options.scrollTo);
    return;
  }

  // Ativa o modo "carregando"
  document.body.classList.add('carregando-aula');

  // Título provisório enquanto carrega
  document.title = 'Carregando...';

  // Mostra spinner
  container.innerHTML = `
    <div class="aula-loading">
      <div class="spinner"></div>
      <p>Carregando aula...</p>
    </div>
  `;

  // Marca o tempo de início (pra garantir tempo mínimo de spinner)
  const tempoInicio = Date.now();

  try {
    // Cache?
    let html = cacheAulas[aulaId];
    if (!html) {
      const response = await fetch(`aulas/${aulaId}.html`);
      if (!response.ok) throw new Error(`Erro ${response.status} ao carregar ${aulaId}`);
      html = await response.text();
      cacheAulas[aulaId] = html;
    }

    // Garante que o spinner fique visível pelo menos TEMPO_MINIMO_SPINNER
    const tempoDecorrido = Date.now() - tempoInicio;
    const tempoRestante = TEMPO_MINIMO_SPINNER - tempoDecorrido;
    if (tempoRestante > 0) {
      await new Promise((resolve) => setTimeout(resolve, tempoRestante));
    }

    // Injeta
    container.innerHTML = html;
    container.dataset.aulaAtual = aulaId;

    // Persiste no localStorage
    try {
      localStorage.setItem(STORAGE_KEY, aulaId);
    } catch (e) { /* localStorage pode falhar em modo privado */ }

    // Atualiza o título da página
    atualizarTituloPagina(aulaId);

    // Volta o scroll pro topo
    const scrollContainer = document.querySelector('#conteudoPrincipal > .container');
    if (scrollContainer) scrollContainer.scrollTop = 0;

    // Reprocessa MathJax (se disponível)
    if (window.MathJax && MathJax.Hub) {
      MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
    }

    // Reinicializa comportamentos que dependem do DOM da aula
    reinicializarComportamentos();

    // Se um scroll específico foi pedido, executa após renderizar
    if (options.scrollTo) {
      setTimeout(() => scrollParaSecao(options.scrollTo), 100);
    }

  } catch (erro) {
    console.error('[aula-loader]', erro);
    container.innerHTML = `
      <div class="aula-erro">
        <p>Não foi possível carregar a aula. Tente novamente.</p>
      </div>
    `;

    // Em caso de erro, também atualiza o título pra indicar
    document.title = 'Erro ao carregar';
  } finally {
    // Desativa o modo "carregando"
    document.body.classList.remove('carregando-aula');
  }
}

function atualizarTituloPagina(aulaId) {
  // Procura o heading da aula no sidebar (que já está renderizado)
  const heading = document.querySelector(`.sidebar-heading[data-aula="${aulaId}"] span`);
  if (heading) {
    document.title = heading.textContent.trim();
    return;
  }

  // Fallback: usa o ID formatado (ex: "aula-1" → "Aula 1")
  document.title = aulaId.replace('aula-', 'Aula ');
}

/**
 * Rola suavemente até uma seção específica dentro do container rolável.
 */
function scrollParaSecao(hash) {
  const scrollContainer = document.querySelector('#conteudoPrincipal > .container');
  const target = document.querySelector(hash);
  if (!scrollContainer || !target) return;

  const OFFSET = 60;
  scrollContainer.scrollTo({
    top: target.offsetTop - OFFSET,
    behavior: 'smooth',
  });
}

/**
 * Reinicializa scroll spy e smooth scroll depois de carregar nova aula.
 * Essas funções vivem no sidebar-component.js e são re-chamáveis
 * (usam AbortController pra evitar acumular listeners).
 */
function reinicializarComportamentos() {
  if (typeof attachScrollSpy === 'function') {
    attachScrollSpy();
  }
  if (typeof attachSmoothScroll === 'function') {
    attachSmoothScroll();
  }
}

/**
 * Decide qual aula carregar no boot:
 * usa a última visitada (localStorage) ou a padrão.
 */
function aulaInicial() {
  try {
    const salva = localStorage.getItem(STORAGE_KEY);
    if (salva) return salva;
  } catch (e) { /* ignore */ }
  return AULA_PADRAO;
}

// Expõe globalmente (usado pela sidebar)
window.carregarAula = carregarAula;