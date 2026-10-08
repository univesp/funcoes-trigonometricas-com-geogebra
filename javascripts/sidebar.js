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