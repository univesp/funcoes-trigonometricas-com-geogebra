async function inicializarCarrosseis() {
  try {
    const response = await fetch('data/carrosseis-data.json');
    if (!response.ok) throw new Error('Erro ao carregar carrosseis-data.json');
    const dadosJSON = await response.json();

    document.querySelectorAll('[data-carrossel-id]').forEach((container) => {
      if (container.dataset.inicializado) return;

      const carrosselData = dadosJSON.find(
        (carrossel) => carrossel.carrosselId === container.dataset.carrosselId,
      );
      if (!carrosselData || !carrosselData.items || carrosselData.items.length === 0) return;

      container.dataset.inicializado = 'true';
      const dados = carrosselData.items;
      const legendaEl = container.parentElement.querySelector('.carrossel-legenda');
      const bolinhasContainer = container.parentElement.querySelector('[data-carrossel-bolinhas]');
      const mostrarIndicadores = carrosselData.showIndicators !== false;
      const midiaContainer = document.createElement('div');
      midiaContainer.className = 'carrossel-midia';
      container.appendChild(midiaContainer);

      let slideAtual = 0;
      let midiaAtual; // Pode ser um <img> ou um <div> (wrapper do vídeo)
      let videoElement = null; // Referência direta ao <video> atual

      // ============================================================
      // OBSERVADOR DE VISIBILIDADE (SCROLL)
      // ============================================================
      const observadorVideo = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!videoElement) return;
          
          if (entry.isIntersecting) {
            videoElement.play().catch(e => console.log('Autoplay bloqueado:', e));
          } else {
            videoElement.pause();
          }
        });
      }, { threshold: 0.3 });

      function renderizarMidia() {
        // Limpa o vídeo anterior
        if (videoElement) {
          observadorVideo.unobserve(videoElement);
          videoElement.pause();
          videoElement = null;
        }

        const item = dados[slideAtual];
        
        if (item.type === 'video') {
          // 1. Cria o vídeo
          videoElement = document.createElement('video');
          videoElement.className = 'carrossel-video';
          
          videoElement.controls = false;    // Esconde a barra de controles
          videoElement.autoplay = true;     // Dá play no vídeo automaticamente
          videoElement.loop = true;         // Fica em looping infinito
          videoElement.muted = true;        // Obrigatório para o autoplay funcionar
          videoElement.playsInline = true;  // Impede tela cheia automática no iOS
          videoElement.preload = 'auto';
          
          videoElement.setAttribute('aria-label', item.alt || '');
          videoElement.style.width = '100%';
          videoElement.style.maxHeight = '65vh';
          videoElement.style.objectFit = 'contain';
          videoElement.style.pointerEvents = 'none';  // Impede cliques acidentais que travariam o carrossel
          videoElement.src = item.src;

          // 2. Cria a barra de progresso
          const barraProgressoContainer = document.createElement('div');
          barraProgressoContainer.className = 'carrossel-barra-container';
          
          const barraProgressoFill = document.createElement('div');
          barraProgressoFill.className = 'carrossel-barra-fill';
          barraProgressoContainer.appendChild(barraProgressoFill);

          // 3. Escuta o tempo do vídeo e preenche a barra
          videoElement.addEventListener('timeupdate', () => {
            if (videoElement.duration) {
              const progresso = (videoElement.currentTime / videoElement.duration) * 100;
              barraProgressoFill.style.width = `${progresso}%`;
            }
          });

          // 4. Agrupa o vídeo e a barra num wrapper
          midiaAtual = document.createElement('div');
          midiaAtual.className = 'carrossel-video-wrapper';
          midiaAtual.appendChild(videoElement);
          midiaAtual.appendChild(barraProgressoContainer);
          
          // 5. Manda o observador vigiar o vídeo
          observadorVideo.observe(videoElement);
          
        } else if (item.type === 'text') {
          midiaAtual = document.createElement('p');
          midiaAtual.textContent = item.legenda || item.alt || '';
          midiaAtual.style.padding = '2rem';
          midiaAtual.style.textAlign = 'center';
        } else {
          midiaAtual = document.createElement('img');
          midiaAtual.className = 'carrossel-img';
          midiaAtual.src = item.src;
          midiaAtual.alt = item.alt || '';
        }

        midiaContainer.replaceChildren(midiaAtual);
        if (legendaEl) legendaEl.innerHTML = item.legenda || '';
      }

      renderizarMidia();

      if (dados.length <= 1) {
        if (bolinhasContainer) bolinhasContainer.style.display = 'none';
        return;
      }

      if (bolinhasContainer && !mostrarIndicadores) bolinhasContainer.style.display = 'none';

      const btnPrev = document.createElement('button');
      btnPrev.className = 'carrossel-seta carrossel-seta-prev';
      btnPrev.innerHTML = '<img src="assets/icone_carrossel_seta_esquerda.svg" alt="Anterior">';

      const btnNext = document.createElement('button');
      btnNext.className = 'carrossel-seta carrossel-seta-next';
      btnNext.innerHTML = '<img src="assets/icone_carrossel_seta_direita.svg" alt="Próxima">';

      btnPrev.style.display = slideAtual === 0 ? 'none' : 'flex';
      btnNext.style.display = slideAtual === dados.length - 1 ? 'none' : 'flex';

      container.appendChild(btnPrev);
      container.appendChild(btnNext);

      const bolinhas = [];
      if (bolinhasContainer && mostrarIndicadores) {
        dados.forEach((_, index) => {
          const bolinha = document.createElement('button');
          bolinha.className = 'carrossel-indicador';
          if (index === 0) bolinha.classList.add('ativo');
          bolinha.addEventListener('click', () => {
            slideAtual = index;
            atualizar();
          });
          bolinhasContainer.appendChild(bolinha);
          bolinhas.push(bolinha);
        });
      }

      function atualizar() {
        renderizarMidia();
        btnPrev.style.display = slideAtual === 0 ? 'none' : 'flex';
        btnNext.style.display = slideAtual === dados.length - 1 ? 'none' : 'flex';
        bolinhas.forEach((bolinha, index) => {
          bolinha.classList.toggle('ativo', index === slideAtual);
        });
      }

      btnPrev.addEventListener('click', () => {
        if (slideAtual > 0) {
          slideAtual--;
          atualizar();
        }
      });
      btnNext.addEventListener('click', () => {
        if (slideAtual < dados.length - 1) {
          slideAtual++;
          atualizar();
        }
      });
    });
  } catch (erro) {
    console.error('Erro no carrossel:', erro);
  }
}