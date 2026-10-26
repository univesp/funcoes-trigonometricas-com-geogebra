async function inicializarCarrosseis() {
  // Busca os dados do JSON apenas uma vez
  try {
    const response = await fetch('data/carrosseis-data.json');
    if (!response.ok) throw new Error('Erro ao carregar carrosseis-data.json');
    const dadosJSON = await response.json();

    document.querySelectorAll('[data-carrossel-id]').forEach((container) => {
      if (container.dataset.inicializado) return;
      container.dataset.inicializado = 'true';

      const idCarrossel = container.dataset.carrosselId;
      
      // Encontra o carrossel no JSON pelo ID
      const carrosselData = dadosJSON.find(c => c.carrosselId === idCarrossel);
      if (!carrosselData || !carrosselData.items || carrosselData.items.length === 0) return;

      const dados = carrosselData.items;
      
      // Elementos de legenda e bolinhas
      const legendaEl = container.parentElement.querySelector('.carrossel-legenda');
      const bolinhasContainer = container.parentElement.querySelector('[data-carrossel-bolinhas]');
      
      let slideAtual = 0;

      // Cria a imagem
      const img = document.createElement('img');
      img.className = 'carrossel-img';
      img.src = dados[0].src;
      img.alt = dados[0].alt || '';
      container.appendChild(img);

      // Preenche a primeira legenda (usando innerHTML para renderizar as tags span)
      if (legendaEl) legendaEl.innerHTML = dados[0].legenda || '';

      // Se tiver só 1 imagem, esconde bolinhas e não cria setas
      if (dados.length <= 1) {
        if (bolinhasContainer) bolinhasContainer.style.display = 'none';
        return;
      }

      // Cria as setas
      const btnPrev = document.createElement('button');
      btnPrev.className = 'carrossel-seta carrossel-seta-prev';
      btnPrev.innerHTML = '<img src="assets/icone_carrossel_seta_esquerda.svg" alt="Anterior">';
      
      const btnNext = document.createElement('button');
      btnNext.className = 'carrossel-seta carrossel-seta-next';
      btnNext.innerHTML = '<img src="assets/icone_carrossel_seta_direita.svg" alt="Próxima">';

      container.appendChild(btnPrev);
      container.appendChild(btnNext);

      // Cria as bolinhas
      const bolinhas = [];
      if (bolinhasContainer) {
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

      // Função de atualização
      function atualizar() {
        img.style.opacity = '0';

        setTimeout(() => {
          img.src = dados[slideAtual].src;
          img.alt = dados[slideAtual].alt || '';
          
          // Atualiza a legenda
          if (legendaEl) legendaEl.innerHTML = dados[slideAtual].legenda || '';
          
          img.style.opacity = '1';
        }, 200);

        btnPrev.style.display = slideAtual === 0 ? 'none' : 'flex';
        btnNext.style.display = slideAtual === dados.length - 1 ? 'none' : 'flex';

        bolinhas.forEach((b, i) => {
          b.classList.toggle('ativo', i === slideAtual);
        });
      }

      // Eventos
      btnPrev.addEventListener('click', () => { if (slideAtual > 0) { slideAtual--; atualizar(); } });
      btnNext.addEventListener('click', () => { if (slideAtual < dados.length - 1) { slideAtual++; atualizar(); } });

      atualizar();
    });

  } catch (erro) {
    console.error('Erro no carrossel:', erro);
  }
}