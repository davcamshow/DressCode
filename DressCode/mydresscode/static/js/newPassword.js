const passwordInput = document.getElementById('password');
const reqLength = document.getElementById('req-length');
const reqUppercase = document.getElementById('req-uppercase');
const reqNumber = document.getElementById('req-number');
const reqSpecial = document.getElementById('req-special');

passwordInput.addEventListener('input', function() {
    const password = this.value;
    reqLength.classList.toggle('valid', password.length >= 8);
    reqUppercase.classList.toggle('valid', /[A-Z]/.test(password));
    reqNumber.classList.toggle('valid', /[0-9]/.test(password));
    reqSpecial.classList.toggle('valid', /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password));
});
