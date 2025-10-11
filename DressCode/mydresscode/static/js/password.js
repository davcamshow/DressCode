const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const reqLength = document.getElementById('req-length');
const reqUppercase = document.getElementById('req-uppercase');
const reqNumber = document.getElementById('req-number');
const reqSpecial = document.getElementById('req-special');

function validatePassword(password) {
    reqLength.classList.toggle('valid', password.length >= 8);
    reqUppercase.classList.toggle('valid', /[A-Z]/.test(password));
    reqNumber.classList.toggle('valid', /[0-9]/.test(password));
    reqSpecial.classList.toggle('valid', /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password));
}

passwordInput.addEventListener('input', function() {
    validatePassword(this.value);
});

document.getElementById('passwordForm').addEventListener('submit', function(e) {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        e.preventDefault();
        return;
    }

    if (
        password.length < 8 ||
        !/[A-Z]/.test(password) ||
        !/[0-9]/.test(password) ||
        !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    ) {
        alert('La contraseña no cumple con los requisitos');
        e.preventDefault();
        return;
    }
});