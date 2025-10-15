document.addEventListener('DOMContentLoaded', function() {
            var messageContainer = document.querySelector('.message-container');
            if (messageContainer) {
                setTimeout(function() {
                    messageContainer.style.display = 'none';
                }, 3000); // El mensaje desaparece 
            }
        });