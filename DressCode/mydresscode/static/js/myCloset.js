const filterButtons = document.querySelectorAll(".filters button");
const grid = document.getElementById('photoGrid');


filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    //aqui para filtrar
  });
});



// Activar corazones (favoritos)
grid.addEventListener('click', (e) => {
  if (e.target.classList.contains('heart')) {
    e.target.classList.toggle('active');
    //aquí para agregar el cambio de fav es verddadero cuando se presiona el corazon 
  }
});




