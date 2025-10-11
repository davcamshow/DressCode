document.querySelector('.btn-continue').addEventListener('click', function() {
    window.location.href = "{% url 'login' %}";
});