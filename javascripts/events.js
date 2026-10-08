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

  if (!container || !progressBar) return;

  container.addEventListener('scroll', () => {
    const maxScroll = container.scrollHeight - container.clientHeight;
    const progress = maxScroll > 0 ? (container.scrollTop / maxScroll) * 100 : 0;
    progressBar.style.width = progress + '%';
  });

})
