// Datos de obras con precio
const ARTWORKS = [
  {
    slug: 'canto-azul',
    titulo: 'Canto Azul',
    tecnica: 'Óleo sobre lino',
    medidas: '80 × 60 cm',
    precio: 1200,
    imagen: 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?q=80&w=1400&auto=format&fit=crop'
  },
  {
    slug: 'memoria-ocre',
    titulo: 'Memoria Ocre',
    tecnica: 'Acrílico y arena',
    medidas: '100 × 80 cm',
    precio: 1800,
    imagen: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1400&auto=format&fit=crop'
  },
  {
    slug: 'bruma-ritmica',
    titulo: 'Bruma Rítmica',
    tecnica: 'Mixta sobre madera',
    medidas: '90 × 70 cm',
    precio: 1500,
    imagen: 'https://images.unsplash.com/photo-1517007841685-8f19cf83bb0a?q=80&w=1400&auto=format&fit=crop'
  },
  {
    slug: 'trama-verde',
    titulo: 'Trama Verde',
    tecnica: 'Acrílico',
    medidas: '70 × 50 cm',
    precio: 950,
    imagen: 'https://images.unsplash.com/photo-1470093851219-69951fcbb533?q=80&w=1400&auto=format&fit=crop'
  },
  {
    slug: 'eco-carmesi',
    titulo: 'Eco Carmesí',
    tecnica: 'Óleo',
    medidas: '120 × 90 cm',
    precio: 2400,
    imagen: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1400&auto=format&fit=crop'
  },
  {
    slug: 'cauce-dorado',
    titulo: 'Cauce Dorado',
    tecnica: 'Mixta',
    medidas: '60 × 60 cm',
    precio: 1100,
    imagen: 'https://images.unsplash.com/photo-1515557705286-08fb7b6feab4?q=80&w=1400&auto=format&fit=crop'
  }
];

function money(n){ 
  try { 
    return new Intl.NumberFormat('es-EC', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(n); 
  } catch { 
    return '$' + (n||0).toLocaleString(); 
  }
}

function renderGallery(){
  const wrap = document.getElementById('gallery');
  if (!wrap) return;
  wrap.innerHTML = ARTWORKS.map(a => `
    <article class="card">
      <div class="thumb">
        <img src="${a.imagen}" alt="${a.titulo}">
      </div>
      <div class="content">
        <h3>${a.titulo}</h3>
        <div class="meta">${a.tecnica} · ${a.medidas}</div>
        <div class="actions">
          <button class="buy" data-artwork="${a.slug}">${money(a.precio)}</button>
          <button class="linklike" data-artwork-details="${a.slug}">Detalles</button>
        </div>
      </div>
    </article>
  `).join('');

  // Click en precio (tracking + scroll a contacto)
  wrap.querySelectorAll('[data-artwork]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const slug = e.currentTarget.getAttribute('data-artwork');
      const obra = ARTWORKS.find(x => x.slug === slug);
      await trackClick?.('artwork', slug, { action: 'ver-precio', precio: obra?.precio });
      document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Detalles (abre modal)
  wrap.querySelectorAll('[data-artwork-details]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const slug = e.currentTarget.getAttribute('data-artwork-details');
      const obra = ARTWORKS.find(x => x.slug === slug);
      if (obra) openModal(obra);
      await trackClick?.('artwork', slug, { action: 'ver-detalle' });
    });
  });
}

function navTracking(){
  document.querySelectorAll('[data-nav]').forEach(a => {
    a.addEventListener('click', () => {
      const key = a.getAttribute('data-nav');
      trackClick?.('nav', key);
    });
  });
}

function misc(){
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
}

/* ===== Modal de obra ===== */
const modal = {
  root: null, img: null, titulo: null, tecnica: null, medidas: null, precio: null, contact: null,
  closeBtn: null, closeBtn2: null, backdrop: null
};

function cacheModal(){
  modal.root    = document.getElementById('artModal');
  modal.img     = document.getElementById('m_img');
  modal.titulo  = document.getElementById('m_titulo');
  modal.tecnica = document.getElementById('m_tecnica');
  modal.medidas = document.getElementById('m_medidas');
  modal.precio  = document.getElementById('m_precio');
  modal.contact = document.getElementById('m_contact');
  modal.closeBtn= document.getElementById('modalClose');
  modal.closeBtn2= document.getElementById('m_cerrar');
  modal.backdrop= document.getElementById('modalBackdrop');

  modal.closeBtn?.addEventListener('click', closeModal);
  modal.closeBtn2?.addEventListener('click', closeModal);
  modal.backdrop?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function openModal(obra){
  if (!modal.root) cacheModal();
  if (!modal.root) return;

  modal.img.src = obra.imagen;
  modal.img.alt = obra.titulo;
  modal.titulo.textContent = obra.titulo;
  modal.tecnica.textContent = obra.tecnica;
  modal.medidas.textContent = obra.medidas;
  modal.precio.textContent = money(obra.precio);
  modal.contact.href = '#contacto';

  modal.root.setAttribute('aria-hidden','false');
  modal.root.classList.add('open');
}

function closeModal(){
  if (!modal.root) return;
  modal.root.classList.remove('open');
  modal.root.setAttribute('aria-hidden','true');
}

/* ===== Init ===== */
renderGallery();
navTracking();
misc();
cacheModal();
