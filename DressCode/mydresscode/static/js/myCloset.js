const filterButtons = document.querySelectorAll(".filters button");

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});


const fotos = [
  "https://static.zara.net/assets/public/e218/c5ed/9efd489bb074/fd16d145f166/02756705622-e2/02756705622-e2.jpg?ts=1757406850313",
  "https://static.zara.net/assets/public/2533/e495/fb5a4a95a640/3ecda7c8f778/02756710681-e1/02756710681-e1.jpg?ts=1757416553485&w=744&f=auto",
  "https://static.zara.net/assets/public/4297/c7f0/f1164804bc31/599a2417d5bc/02582529052-e1/02582529052-e1.jpg?ts=1747752852016&w=744&f=auto",
  "https://static.zara.net/assets/public/0134/c8dc/f1d94a2eb2ca/5540cc541343/02582442725-e1/02582442725-e1.jpg?ts=1755687440632&w=744&f=auto",
  "https://static.zara.net/assets/public/7e4a/0bcd/36f94912b3f7/f1bec5b3f7a0/01473529620-e1/01473529620-e1.jpg?ts=1759247165484&w=744&f=auto"
];

// Genera la galería automáticamente
const grid = document.getElementById('photoGrid');

fotos.forEach(src => {
  const item = document.createElement('div');
  item.classList.add('photo-item');

  const img = document.createElement('img');
  img.src = src;
  img.alt = 'Foto de prenda';

  const heart = document.createElement('span');
  heart.classList.add('heart');

  item.appendChild(img);
  item.appendChild(heart);
  grid.appendChild(item);
});

// Activar corazones (favoritos)
grid.addEventListener('click', (e) => {
  if (e.target.classList.contains('heart')) {
    e.target.classList.toggle('active');
  }
});
