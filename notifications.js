// Script para mostrar notificación en el icono del avión

// Ejecuta una función tan pronto como el DOM esté listo (compatible si el script carga tarde)
function runOnReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}

function highlightActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop().toLowerCase();
    const links = document.querySelectorAll('.site-nav ul li a');
    links.forEach(link => {
        const target = link.getAttribute('href')?.split('/').pop().toLowerCase();
        if (!target) return;
        if (target === currentPage || (target === 'index.html' && currentPage === '')) {
            link.classList.add('active');
            const parentLi = link.closest('li');
            if (parentLi && parentLi.classList.contains('nav-trips')) {
                parentLi.classList.add('active');
            }
        }
    });
}

runOnReady(function() {
    updateNotificationDot();
    highlightActiveNavLink();
});

// --- price calculator ------------------------------------------------
// base prices approximating distance/country
const basePrices = {
    "Francia": 800,
    "Italia": 750,
    "República Dominicana": 400,
    "Emiratos Árabes Unidos": 1200,
    "Grecia": 700,
    "Japón": 1300,
    "México": 600,
    "Canadá": 900,
    "Alemania": 850,
    "Brasil": 700,
    "Tailandia": 950,
    "Australia": 1400,
    "Sudáfrica": 1100,
    "Colombia": 550,
    "Estados Unidos": 1000,
    "China": 1200,
    "India": 800,
    "España": 650,
    "Turquía": 800,
    "Jordania": 750,
    "Portugal": 650,
    "Polonia": 700,
    "Países Bajos": 800,
    "Sudáfrica": 1100
    // ... puedes añadir más si deseas
};

function calculateTripPrice(destination, people, date) {
    // destination comes as "Ciudad, País"; extraer país
    let country = destination.split(',')[1] ? destination.split(',')[1].trim() : '';
    const base = basePrices[country] || 500;
    const now = new Date();
    const tripDate = new Date(date);
    let days = Math.floor((tripDate - now) / (1000 * 60 * 60 * 24));
    if (days < 0) days = 0;
    const dateFactor = 1 + days / 365; // viajes más lejanos en el tiempo cuestan un poco más
    let price = base * dateFactor * people;
    // aplicar variación aleatoria del ±10 % usando semilla simple para que sea distinta cada vez
    const randomFactor = 0.9 + Math.random() * 0.2;
    price *= randomFactor;
    return Math.round(price);
}

// --- preview dentro del modal ---
function initPricePreview() {
    const dest = document.getElementById('destination');
    const date = document.getElementById('date');
    const people = document.getElementById('people');
    const priceEl = document.getElementById('pricePreview');
    if (!priceEl || !dest || !date || !people) return;

    function update() {
        const dval = dest.value;
        const tval = date.value;
        const pval = parseInt(people.value, 10) || 1;
        if (dval && tval) {
            priceEl.textContent = '$' + calculateTripPrice(dval, pval, tval);
        } else {
            priceEl.textContent = '';
        }
    }

    [dest, date, people].forEach(el => {
        el.addEventListener('input', update);
        el.addEventListener('change', update);
    });
}

runOnReady(initPricePreview);

function updateNotificationDot() {
    const notificationDot = document.getElementById('notificationDot');
    const trips = JSON.parse(localStorage.getItem('trips')) || [];
    const tripsViewed = JSON.parse(localStorage.getItem('tripsViewed')) || true;
    
    if (notificationDot) {
        if (trips.length > 0 && !tripsViewed) {
            notificationDot.style.display = 'block';
        } else {
            notificationDot.style.display = 'none';
        }
    }

    // after adjusting the dot we also update the small preview panel
    renderTripsPreview();
}

// --- Modal de selección de viaje ---
runOnReady(function() { bindDestinationCards(); });

// Mapa de países -> ciudades (si la página ya define `window.paisesConCiudades` la respetamos)
if (typeof window.paisesConCiudades === 'undefined') {
    window.paisesConCiudades = {
        "Francia": ["París","Lyon","Marsella","Toulouse","Niza","Burdeos"],
        "Italia": ["Roma","Milán","Venecia","Florencia","Nápoles","Génova"],
        "Grecia": ["Atenas","Salónica","Rodas","Creta","Santorini","Miconos"],
        "Japón": ["Tokio","Kioto","Osaka","Hiroshima","Yokohama","Nagoya"],
        "Tailandia": ["Bangkok","Phuket","Chiang Mai","Pattaya","Krabi","Ayutthaya"],
        "Turquía": ["Estambul","Esmirna","Ankara","Antalya","Capadocia"],
        "México": ["Ciudad de México","Cancún","Playa del Carmen","Guadalajara","Monterrey","Oaxaca"],
        "República Dominicana": ["Santo Domingo","Punta Cana","Santiago","La Romana","Puerto Plata","Higüey"],
        "Emiratos Árabes Unidos": ["Dubái","Abu Dabi","Sharjah","Ajmán","Ras Al Jaimah","Fujairah"],
        "Canadá": ["Toronto","Vancouver","Montreal","Calgary","Ottawa","Banff"]
    };
}

// Crear y abrir modal de ciudades compartido (solo si la página no lo provee)
function openSharedCitiesModal(pais) {
    let shared = document.getElementById('sharedCitiesModal');
    if (!shared) {
        shared = document.createElement('div');
        shared.id = 'sharedCitiesModal';
        shared.className = 'modal';
        shared.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="sharedModalTitle">Ciudades</h2>
                    <span class="close" id="sharedClose">&times;</span>
                </div>
                <div class="modal-body">
                    <div id="sharedCitiesList" class="cities-list"></div>
                </div>
            </div>`;
        document.body.appendChild(shared);

        // cerrar al click en X o fuera
        document.getElementById('sharedClose').addEventListener('click', () => { shared.style.display = 'none'; });
        shared.addEventListener('click', (e) => { if (e.target === shared) shared.style.display = 'none'; });
    }

    const title = document.getElementById('sharedModalTitle');
    const list = document.getElementById('sharedCitiesList');
    title.textContent = pais;
    list.innerHTML = '';
    const ciudades = (typeof window.paisesConCiudades !== 'undefined' ? window.paisesConCiudades[pais] : paisesConCiudades[pais]) || [];
    ciudades.forEach(ciudad => {
        const div = document.createElement('div');
        div.className = 'city-item';
        div.innerHTML = `
            <div class="city-info">
                <h3>${ciudad}</h3>
                <p>${pais}</p>
            </div>
            <button class="btn-select">Seleccionar</button>
        `;
        const btn = div.querySelector('.btn-select');
        btn.addEventListener('click', () => {
            shared.style.display = 'none';
            // si existe una función global selectTrip, usarla (por ejemplo en Destinos.html)
            if (typeof window.selectTrip === 'function') {
                window.selectTrip(pais, ciudad);
            } else {
                // abrir modal detallado con destino
                openModalWithDestination(`${ciudad}, ${pais}`);
            }
        });
        list.appendChild(div);
    });

    shared.style.display = 'block';
}

function bindDestinationCards() {
    const cards = document.querySelectorAll('.destination-card');
    const modal = document.getElementById('cityModal');
    const modalClose = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('cancelTrip');
    const confirmBtn = document.getElementById('confirmTrip');

    if (!cards) return;

    // Si la página ya define `openCitiesModal`, dejamos que ella maneje la lista de ciudades (evita doble-binding)
    const pageProvidesCities = (typeof window.openCitiesModal === 'function');

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const pais = card.getAttribute('data-pais') || '';
            if (pageProvidesCities) {
                // dejar comportamiento nativo de la página
                if (typeof window.openCitiesModal === 'function') window.openCitiesModal(pais);
            } else {
                // usar modal compartido para seleccionar ciudad primero
                openSharedCitiesModal(pais);
            }
        });
    });

    modalClose.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // cerrar al hacer click fuera del contenido
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    confirmBtn.addEventListener('click', () => {
        const destination = document.getElementById('destination').value;
        const origin = document.getElementById('origin').value.trim();
        const date = document.getElementById('date').value;
        const people = parseInt(document.getElementById('people').value, 10) || 1;

        if (!origin) {
            alert('Por favor indica tu ciudad de origen.');
            return;
        }
        if (!date) {
            alert('Por favor selecciona una fecha.');
            return;
        }

        const trips = JSON.parse(localStorage.getItem('trips')) || [];
        if (trips.length === 0) {
            preview.innerHTML = '<div class="empty-preview">No hay viajes</div>';
            return;
        }
        const price = calculateTripPrice(destination, people, date);
        trips.push({ destination, origin, date, people, price, createdAt: Date.now() });
        localStorage.setItem('trips', JSON.stringify(trips));
        localStorage.setItem('tripsViewed', JSON.stringify(false));
        updateNotificationDot();
        closeModal();
        showConfirmation(`Viaje guardado: ${destination} — ${date} — ${people} persona(s) — $${price}`);
    });
}

function openModalWithDestination(pais) {
    const modal = document.getElementById('cityModal');
    if (!modal) return;
    const destEl = document.getElementById('destination');
    const dateEl = document.getElementById('date');
    const peopleEl = document.getElementById('people');
    const priceEl = document.getElementById('pricePreview');
    destEl.value = pais || '';
    if (dateEl) dateEl.value = '';
    if (peopleEl) peopleEl.value = '1';
    // actualizar precio inmediatamente
    if (priceEl) priceEl.textContent = '';
    if (destEl && dateEl && peopleEl && priceEl && destEl.value && dateEl.value) {
        priceEl.textContent = '$' + calculateTripPrice(destEl.value, parseInt(peopleEl.value,10)||1, dateEl.value);
    }
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
    const modal = document.getElementById('cityModal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
}

function showConfirmation(text) {
    const el = document.createElement('div');
    el.className = 'confirmation-message';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 400);
    }, 1800);
}

// --- tiny dropdown panel attached to the airplane icon ---
function ensurePreviewContainer() {
    const navTrips = document.querySelector('.nav-trips');
    if (!navTrips) return;
    if (!document.getElementById('tripsPreview')) {
        const preview = document.createElement('div');
        preview.id = 'tripsPreview';
        preview.className = 'trips-preview';
        preview.style.display = 'none';
        navTrips.appendChild(preview);

        // show panel on hover or focus
        navTrips.addEventListener('mouseenter', () => { preview.style.display = 'block'; });
        navTrips.addEventListener('mouseleave', () => { preview.style.display = 'none'; });
        // also toggle on click for touch devices
        navTrips.addEventListener('click', () => {
            if (preview.style.display === 'block') preview.style.display = 'none';
            else preview.style.display = 'block';
        });
    }
}

function renderTripsPreview() {
    ensurePreviewContainer();
    const preview = document.getElementById('tripsPreview');
    if (!preview) return;
    const trips = JSON.parse(localStorage.getItem('trips')) || [];

    if (trips.length === 0) {
        preview.innerHTML = '<div class="empty-preview">No hay viajes</div>';
        return;
    }

    preview.innerHTML = '';
    trips.forEach(trip => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        // support both older structure and newer fields
        const dest = trip.destination || `${trip.ciudad || ''}`;
        const orig = trip.origin || trip.origen || '';
        const date = trip.date || trip.fecha || '';
        const people = trip.people || trip.personas || '';
        div.innerHTML = `
            <strong>${dest}</strong><br>
            ${orig} · ${date} · ${people} persona(s)
        `;
        preview.appendChild(div);
    });
}

// --- Autocompletado para campo `origin` ---
function setupOriginAutocomplete() {
    const originInputs = document.querySelectorAll('#origin');
    if (!originInputs || originInputs.length === 0) return;

    // Construir lista de sugerencias: empezar por países y ciudades globales para asegurar cobertura
    const itemsSet = new Set();

    // Añadir lista global extensa de países
    const worldCountries = [
        "Afganistán","Albania","Argelia","Andorra","Angola","Antigua y Barbuda","Argentina","Armenia","Australia","Austria",
        "Azerbaiyán","Bahamas","Baréin","Bangladés","Barbados","Bielorrusia","Bélgica","Belice","Benín","Bután",
        "Bolivia","Bosnia y Herzegovina","Botsuana","Brasil","Brunéi","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Camboya",
        "Camerún","Canadá","República Centroafricana","Chad","Chile","China","Colombia","Comoras","Congo","Costa Rica",
        "Costa de Marfil","Croacia","Cuba","Chipre","República Checa","Dinamarca","Yibuti","Dominica","República Dominicana","Timor Oriental",
        "Ecuador","Egipto","El Salvador","Guinea Ecuatorial","Eritrea","Estonia","Eswatini","Etiopía","Fiyi","Finlandia",
        "Francia","Gabón","Gambia","Georgia","Alemania","Ghana","Grecia","Granada","Guatemala","Guinea",
        "Guinea-Bisáu","Guyana","Haití","Honduras","Hungría","Islandia","India","Indonesia","Irán","Iraq",
        "Irlanda","Israel","Italia","Jamaica","Japón","Jordania","Kazajistán","Kenia","Kiribati","Corea del Norte",
        "Corea del Sur","Kuwait","Kirguistán","Laos","Letonia","Líbano","Lesoto","Liberia","Libia","Liechtenstein",
        "Lituania","Luxemburgo","Madagascar","Malaui","Malasia","Maldivas","Malí","Malta","Islas Marshall","Mauritania",
        "Mauricio","México","Micronesia","Moldavia","Mónaco","Mongolia","Montenegro","Marruecos","Mozambique","Myanmar",
        "Namibia","Nauru","Nepal","Países Bajos","Nueva Zelanda","Nicaragua","Níger","Nigeria","Noruega","Omán",
        "Pakistán","Palaos","Panamá","Papúa Nueva Guinea","Paraguay","Perú","Filipinas","Polonia","Portugal","Catar",
        "Rumanía","Rusia","Ruanda","San Cristóbal y Nieves","Santa Lucía","San Vicente y las Granadinas","Samoa","San Marino","Santo Tomé y Príncipe","Arabia Saudita",
        "Senegal","Serbia","Seychelles","Sierra Leona","Singapur","Eslovaquia","Eslovenia","Islas Salomón","Somalia","Sudáfrica",
        "Sudán del Sur","España","Sri Lanka","Sudán","Surinam","Suecia","Suiza","Siria","Tayikistán","Tanzania",
        "Tailandia","Togo","Tonga","Trinidad y Tobago","Túnez","Turquía","Turkmenistán","Tuvalu","Uganda","Ucrania",
        "Emiratos Árabes Unidos","Reino Unido","Estados Unidos","Uruguay","Uzbekistán","Vanuatu","Vaticano","Venezuela","Vietnam","Yemen",
        "Zambia","Zimbabue"
    ];

    worldCountries.forEach(c => itemsSet.add(c));
    // Añadir lista global de ciudades grandes y comunes
    const worldCities = [
        "Kabul","Tirana","Argel","Andorra la Vella","Luanda","Buenos Aires","Yereván","Sídney","Melbourne","Brisbane",
        "Viena","Zagreb","La Habana","Bruselas","Sofia","Sofia","Praha","Copenhagen","Yibuti","Roseau",
        "Santo Domingo","Quito","El Cairo","San Salvador","Asmara","Tallin","Addis Abeba","Helsinki","París","Lyon",
        "Marsella","Niza","Berlín","Múnich","Hamburgo","Frankfurt","Athens","Thessaloniki","Budapest","Reikiavik",
        "Dublín","Roma","Milán","Venecia","Florencia","Nápoles","Tokio","Osaka","Kioto","Nagoya",
        "Seúl","Pionyang","Beijing","Shanghái","Guangzhou","Hong Kong","Taipei","Delhi","Mumbai","Bangalore",
        "Hyderabad","Chennai","Islamabad","Karachi","Lahore","Dhaka","Colombo","Jakarta","Surabaya","Bandung",
        "Kuala Lumpur","Singapur","Bangkok","Phuket","Hanoi","Ho Chi Minh City","Manila","Cebu","Iloilo","Kobe",
        "Oslo","Stockholm","Gotemburgo","Malmö","Zurich","Ginebra","Basel","Lisboa","Oporto","Madrid",
        "Barcelona","Valencia","Sevilla","Bilbao","Zaragoza","Lisboa","Porto","Monterrey","Guadalajara","Ciudad de México",
        "Cancún","Tijuana","Puebla","Bogotá","Medellín","Cali","Cartagena","Lima","Cusco","Arequipa",
        "Santiago","Valparaíso","Buenos Aires","Córdoba","Rosario","Montevideo","Asunción","Brasilia","Sao Paulo","Río de Janeiro",
        "Salvador","Recife","Fortaleza","Belo Horizonte","Manaos","Lisboa","Porto","Accra","Lagos","Abuja",
        "Nairobi","Mombasa","Kigali","Kampala","Dar es Salaam","Johannesburgo","Ciudad del Cabo","Durban","Cairo","Alexandria",
        "Casablanca","Rabat","Túnez","Argel","Algiers","Tripoli","Khartoum","Addis Ababa","Harare","Lusaka",
        "Lusaka","Maputo","Antananarivo","Bamako","Niamey","Nouakchott","Kigali","Kampala","Kigali","Yaoundé",
        "Douala","Accra","Kumasi","Kigali","Freetown","Monrovia","Conakry","Bissau","Windhoek","Maseru",
        "Port Louis","Victoria","Port Vila","Suva","Tarawa","Majuro","Palikir","Nuku'alofa","Apia","Honiara",
        "Wellington","Auckland","Christchurch","Hamilton","Sucre","La Paz","Santa Cruz","Montevideo","Papeete","Bridgetown",
        "Kingston","Port-au-Prince","Roseau","Castries","Basseterre","Saint John's","St. George's","Belmopan","Paramaribo","Georgetown",
        "Havana","Tegucigalpa","San José","Panamá","San Salvador","Quito","Guayaquil","Arequipa","Trujillo","Mendoza",
        "Salta","Mar del Plata","Neuquén","Bariloche","Ushuaia","Palermo","Catania","Bari","Genoa","Turín",
        "Bucharest","Sofia","Varna","Burgas","Zagreb","Split","Rijeka","Osijek","Ljubljana","Maribor",
        "Sarajevo","Mostar","Podgorica","Pristina","Skopje","Tirana","Prague","Brno","Ostrava","Plzen",
        "Krakow","Warsaw","Gdansk","Wroclaw","Poznan","Lodz","Lublin","Vilnius","Riga","Tallinn",
        "Luxembourg City","Valletta","Vaduz","San Marino","Monaco","Andorra la Vella","Tirana","Tirana","Baku","Yerevan"
    ];

    worldCities.forEach(c => itemsSet.add(c));

    // Añadir países y ciudades definidos en la página (si existen), evitando duplicados
    if (typeof window.paisesConCiudades !== 'undefined' && window.paisesConCiudades) {
        Object.keys(window.paisesConCiudades).forEach(country => {
            itemsSet.add(country);
            window.paisesConCiudades[country].forEach(city => itemsSet.add(city));
        });
    }
    document.querySelectorAll('.destination-card').forEach(card => {
        const p = card.dataset.pais;
        if (p) itemsSet.add(p);
    });

    const items = Array.from(itemsSet);

    // función para comparar sin acentos
    function stripAccents(str) {
        return str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    }

    originInputs.forEach(input => {
        // envolver input para posicionar la lista
        const wrapper = document.createElement('div');
        wrapper.className = 'autocomplete';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        const list = document.createElement('ul');
        list.className = 'autocomplete-list';
        list.style.display = 'none';
        wrapper.appendChild(list);

        let selectedIndex = -1;

        input.addEventListener('input', function () {
            const q = this.value.trim().toLowerCase();
            list.innerHTML = '';
            selectedIndex = -1;
            if (!q) { list.style.display = 'none'; return; }

            const qNorm = stripAccents(q);
            const matches = items.filter(it => stripAccents(it).includes(qNorm));
            if (matches.length === 0) { list.style.display = 'none'; return; }

            matches.forEach(m => {
                const li = document.createElement('li');
                li.className = 'autocomplete-item';
                li.textContent = m;
                li.addEventListener('click', () => { input.value = m; list.style.display = 'none'; });
                list.appendChild(li);
            });
            list.style.display = 'block';
        });

        input.addEventListener('keydown', function (e) {
            const elems = list.querySelectorAll('.autocomplete-item');
            if (list.style.display === 'none' || elems.length === 0) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); selectedIndex = Math.min(selectedIndex + 1, elems.length - 1); updateActive(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIndex = Math.max(selectedIndex - 1, 0); updateActive(); }
            else if (e.key === 'Enter') { e.preventDefault(); if (selectedIndex >= 0) elems[selectedIndex].click(); list.style.display = 'none'; selectedIndex = -1; }
        });

        document.addEventListener('click', (ev) => { if (!wrapper.contains(ev.target)) list.style.display = 'none'; });

        function updateActive() {
            const elems = list.querySelectorAll('.autocomplete-item');
            elems.forEach((el, idx) => el.classList.toggle('active', idx === selectedIndex));
            if (selectedIndex >= 0 && elems[selectedIndex]) elems[selectedIndex].scrollIntoView({ block: 'nearest' });
        }
    });
}

runOnReady(setupOriginAutocomplete);
