document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("favoritos-container");

  fetch("/api/outfits/favoritos/")
    .then((r) => r.json())
    .then((data) => {
      if (data.success && data.outfits.length > 0) {
        container.innerHTML = "";

        data.outfits.forEach((outfit) => {
          const outfitDiv = document.createElement("div");
          outfitDiv.className = "outfit";

          let prendasHTML = "";
          if (outfit.prendas && outfit.prendas.length > 0) {
            prendasHTML = `
              <div class="prendas-grid">
                ${outfit.prendas
                  .map(
                    (prenda) => `
                      <div class="prenda-card">
                        <img src="${prenda.imagen_url}" alt="${prenda.tipo}">
                        <div><strong>${prenda.tipo}</strong></div>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            `;
          }

          outfitDiv.innerHTML = `
            <h2>${outfit.estilo}</h2>
            <p>📅 ${outfit.fecha} | 🌤️ ${outfit.clima} | 👕 ${outfit.prendas_count} prendas</p>
            ${prendasHTML}
          `;

          container.appendChild(outfitDiv);
        });
      } else {
        container.innerHTML = `
          <div class="outfit-empty">
            Upps!! No tienes outfits guardados favoritos aún
          </div>
        `;
      }
    })
    .catch((error) => {
      container.innerHTML =
        "<p>Error al cargar los favoritos: " + error + "</p>";
    });
});