const form = document.getElementById('loginForm');
const msg = document.getElementById('msg');
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = '';
  const data = Object.fromEntries(new FormData(form).entries());
  try{
    const r = await fetch('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'Error de acceso');
    window.location.href = '/dashboard.html';
  }catch(err){
    msg.textContent = err.message;
  }
});
