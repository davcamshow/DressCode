function descartarOutfit() {
  if (confirm("¿Seguro que quieres descartar este outfit?")) {
    document.getElementById("outfitGrid").innerHTML = "";
  }
}