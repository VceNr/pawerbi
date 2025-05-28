async function cargarColecciones() {
  const select = document.getElementById('coleccion');
  try {
    const res = await fetch('/api/colecciones');
    const colecciones = await res.json();

    select.innerHTML = '<option value="">-- Selecciona una colección --</option>';
    colecciones.forEach(nombre => {
      const option = document.createElement('option');
      option.value = nombre;
      option.textContent = nombre;
      select.appendChild(option);
    });
  } catch (error) {
    select.innerHTML = '<option value="">-- Error al cargar colecciones --</option>';
    console.error('Error al cargar colecciones:', error);
  }
}

async function cargarJuegos(coleccion) {
  const thead = document.querySelector('#tablaJuegos thead');
  const tbody = document.querySelector('#tablaJuegos tbody');

  if (!coleccion) {
    thead.innerHTML = '';
    tbody.innerHTML = '';
    return;
  }

  try {
    const res = await fetch(`/api/juegos-coleccion?coleccion=${encodeURIComponent(coleccion)}`);
    const juegos = await res.json();

    if (!juegos.length) {
      thead.innerHTML = '<tr><th>No hay datos en esta colección</th></tr>';
      tbody.innerHTML = '';
      return;
    }

    const campos = new Set();
    juegos.forEach(juego => {
      Object.keys(juego).forEach(key => {
        if (key !== '_id') campos.add(key);
      });
    });

    thead.innerHTML = '';
    const trHead = document.createElement('tr');
    campos.forEach(campo => {
      const th = document.createElement('th');
      th.textContent = campo;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    tbody.innerHTML = '';
    juegos.forEach(juego => {
      const tr = document.createElement('tr');
      campos.forEach(campo => {
        const td = document.createElement('td');
        td.textContent = juego[campo] !== undefined ? juego[campo] : '';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error('Error al cargar los juegos:', error);
    thead.innerHTML = '<tr><th>Error al cargar datos</th></tr>';
    tbody.innerHTML = '';
  }
}

document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'coleccion') {
    cargarJuegos(e.target.value);
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById('coleccion')) {
    await cargarColecciones();
  }
});
