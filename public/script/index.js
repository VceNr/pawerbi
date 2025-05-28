document.getElementById('juegoForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const formData = new FormData(this);
  const datos = {};
  formData.forEach((value, key) => datos[key] = value);

  try {
    const res = await fetch('/api/juegos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const json = await res.json();
    alert(json.mensaje || json.error);
    this.reset();
  } catch (err) {
    alert('❌ Error al enviar los datos');
    console.error(err);
  }
});
