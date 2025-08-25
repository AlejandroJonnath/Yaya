async function trackClick(type, target, meta){
  try{
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, target, meta })
    });
  }catch(err){
    console.warn('No se pudo enviar el clic', err);
  }
}
