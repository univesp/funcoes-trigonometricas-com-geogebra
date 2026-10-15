$(document).ready(function(){

  //////////////////////////////////////////////////////////////////
  // HEADER DINÂMICO
  // Mostra header somente no início da página.
  // Descomentar caso utilizada a classe .header-dinamico. Caso contrário, deletar.

    $(window).scroll(function(){
      var nav = $(".header-dinamico .container");
      var scroll = $(window).scrollTop();
      if(scroll == 0){
        nav.fadeIn();
      } else {
        nav.fadeOut();
      }
    });

    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

  //////////////////////////////////////////////////////////////////

  // Seu código abaixo
  // Função para inicializar os botões de compartilhamento
  function initSharing() {
    if (typeof $.fn.jsSocials !== 'undefined') {
      $(".sharing").jsSocials({
        shares: [
          {
            share: "facebook",
            logo: "fab fa-facebook-f",
          },
          {
            share: "twitter",
            logo: "fab fa-twitter",
          },
          {
            share: "whatsapp",
            logo: "fab fa-whatsapp",
          },
        ],
        url: window.location.href,
        text: 'Confira o REA ' + $(document).attr('title') + '.',
        showLabel: false,
        showCount: false,
        shareIn: "popup",
      });
    }
  }

  const creditosContainer = document.querySelector('#creditos');
  creditosContainer.innerHTML = creditosContent;

  // Inicializa os botões de compartilhamento APÓS inserir o footer
  initSharing();


  //Barra de Progresso
  const container = document.querySelector('#conteudoPrincipal > .container');
  const progressBar = document.querySelector('.progress-bar');

  if (container && progressBar) {
    container.addEventListener('scroll', () => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      const progress = maxScroll > 0 ? (container.scrollTop / maxScroll) * 100 : 0;
      progressBar.style.width = progress + '%';
    });
  }


  //Sidebar — Botão hambúrguer (reabrir menu)
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarEl = document.getElementById('sidebar');

  if (sidebarToggle && sidebarEl) {
    sidebarToggle.addEventListener('click', () => {
      sidebarEl.classList.remove('sidebar-hidden');
      sidebarToggle.classList.remove('sidebar-toggle-visible');
      sidebarToggle.setAttribute('aria-expanded', 'true');
    });
  }

  // ============================================================
  // SIDEBAR MOBILE — Overlay + clicar fora pra fechar
  // ============================================================

  // Cria o overlay (só uma vez)
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);

  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebar-toggle');

  // Sincroniza o overlay com o estado da sidebar
  function syncOverlay() {
    if (!sidebar) return;
    const isHidden = sidebar.classList.contains('sidebar-hidden');
    if (isHidden) {
      overlay.classList.remove('sidebar-overlay-visible');
    } else {
      overlay.classList.add('sidebar-overlay-visible');
    }
  }

  // Toda vez que a sidebar muda de estado, sincroniza
  if (sidebar && toggle) {
    const observer = new MutationObserver(syncOverlay);
    observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    syncOverlay(); // estado inicial
  }

  // Clicar no overlay fecha a sidebar
  overlay.addEventListener('click', () => {
    if (!sidebar || !toggle) return;
    sidebar.classList.add('sidebar-hidden');
    toggle.classList.add('sidebar-toggle-visible');
    toggle.setAttribute('aria-expanded', 'false');
  });

});