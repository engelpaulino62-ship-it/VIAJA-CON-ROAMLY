let indice = 0;

function moverCarrusel() {
  const carrusel = document.getElementById("carrusel");

  if (!carrusel) return;

  const total = carrusel.children.length;

  indice++;

  if (indice >= total) {
    indice = 0;
  }

  carrusel.style.transform = `translateX(-${indice * 100}%)`;
}

setInterval(moverCarrusel, 3000);

// suscripción por correo
function initNewsletter() {
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = newsletterForm.querySelector('input[type=email]').value;
      if (email) {
        alert(`Gracias por suscribirte, ${email}!`);
        newsletterForm.reset();
      }
    });
  }
}

// buscador en index
function initCountrySearch() {
  const input = document.getElementById('countrySearch');
  const suggestions = document.getElementById('suggestions');
  if (!input || !suggestions) return;

  const cards = document.querySelectorAll('.destination-card');
  const countries = Array.from(cards).map(c=>c.dataset.pais);

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    suggestions.innerHTML = '';
    if (!q) {
      suggestions.style.display = 'none';
      clearFilter();
      return;
    }
    // match only countries starting with query to avoid distintos
    const matches = countries.filter(c=>c.toLowerCase().startsWith(q));
    if (matches.length === 0) {
      suggestions.style.display = 'none';
    } else {
      suggestions.style.display = 'block';
      matches.forEach(m=>{
        const div = document.createElement('div');
        div.textContent = m;
        div.addEventListener('click', () => {
          input.value = m;
          applyFilter(m);
          suggestions.innerHTML = '';
          suggestions.style.display = 'none';
        });
        suggestions.appendChild(div);
      });
    }
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyFilter(input.value.trim());
      suggestions.innerHTML = '';
      suggestions.style.display = 'none';
    }
  });

  function applyFilter(q) {
    const query = q.toLowerCase();
    let found = false;
    let sectionWithCard = null;
    
    // Ocultar carrusel
    const carrusel = document.querySelector('.carrusel');
    if (carrusel) carrusel.style.display = 'none';
    
    // Encontrar la sección que contiene la tarjeta buscada
    const sections = document.querySelectorAll('main.main-content > section');
    sections.forEach(s => {
      const cards_in_section = s.querySelectorAll('.destination-card');
      cards_in_section.forEach(card => {
        if (card.dataset.pais.toLowerCase().startsWith(query)) {
          sectionWithCard = s;
          found = true;
        }
      });
    });
    
    // Ocultar todas las secciones
    sections.forEach(s => {
      s.style.display = 'none';
    });
    
    // Mostrar solo la sección con la tarjeta encontrada
    if (sectionWithCard) {
      sectionWithCard.style.display = 'block';
      // Ocultar el título y descripción de la sección
      const title = sectionWithCard.querySelector('h2');
      const desc = sectionWithCard.querySelector('.section-description');
      if (title) title.style.display = 'none';
      if (desc) desc.style.display = 'none';
    }
    
    // Filtrar tarjetas
    cards.forEach(card => {
      if (card.dataset.pais.toLowerCase().startsWith(query)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
    
    if (found) {
      // si estamos en index, redirigir a destinos
      if (window.location.pathname.includes('Index.html')) {
        window.location.href = 'Destinos.html';
      }
    } else if (query !== '') {
      alert('No se encontró ' + q);
    }
  }

  function clearFilter() {
    cards.forEach(c=>c.style.display='block');
    // Restaurar carrusel
    const carrusel = document.querySelector('.carrusel');
    if (carrusel) carrusel.style.display = 'block';
    
    // Restaurar secciones
    const sections = document.querySelectorAll('main.main-content > section');
    sections.forEach(s => {
      s.style.display = 'block';
      const title = s.querySelector('h2');
      const desc = s.querySelector('.section-description');
      if (title) title.style.display = 'block';
      if (desc) desc.style.display = 'block';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initNewsletter();
  initCountrySearch();
});
