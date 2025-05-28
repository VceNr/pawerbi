    async function cargarJuegoMasPopular() {
      const card = document.getElementById('juego-card');
      try {
        const respuesta = await fetch('http://localhost:3000/juego-mas-popular');
        if (!respuesta.ok) throw new Error('Error en la respuesta de la API');
        const juego = await respuesta.json();

        card.innerHTML = `
          <div class="nombre-juego">${juego["Nombre del Juego"] || 'Nombre no disponible'}</div>
          <div class="cantidad-usuarios">${juego["Cantidad de Usuarios"]?.toLocaleString() || '0'} usuarios</div>
        `;
      } catch (error) {
        card.innerHTML = `<div class="error">No se pudo cargar el juego más popular.</div>`;
        console.error('Error al cargar juego:', error);
      }
    }

    cargarJuegoMasPopular();
