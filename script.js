// ===================================================================================
// INICIO DEL SCRIPT PARA LA API DE YOUTUBE (DEBE ESTAR EN ÁMBITO GLOBAL)
// ===================================================================================

// 1. Carga la API de YouTube IFrame Player de forma asíncrona.
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api"; // URL oficial y segura de la API
var firstScriptTag = document.getElementsByTagName('script')[0];
if (firstScriptTag) {
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
} else {
    // Si no hay otros scripts, lo añade al final del head o body
    // Document.head puede ser más apropiado para scripts de API
    (document.head || document.body).appendChild(tag);
}

// 2. Esta variable global contendrá el objeto del reproductor.
var ytPlayer;
// ***** CONFIGURA AQUÍ EL ID DE TU VIDEO DE YOUTUBE *****
var videoIdGlobal = 'qVveeynmzok'; // Este es el ID que habías puesto. Cámbialo si es otro.

// 3. Esta función se llama automáticamente por la API cuando el código de YouTube está listo.
// DEBE SER GLOBAL (no dentro de DOMContentLoaded).
function onYouTubeIframeAPIReady() {
    if (!videoIdGlobal || videoIdGlobal === 'TU_VIDEO_ID_AQUI') { // Compara con el placeholder original
        console.warn("YouTube Video ID no está configurado (aún es 'TU_VIDEO_ID_AQUI'). La música de fondo no se cargará.");
        return;
    }
    console.log("onYouTubeIframeAPIReady: Intentando crear reproductor para video ID:", videoIdGlobal);
    try {
        ytPlayer = new YT.Player('youtube-audio-player', { // Asegúrate de tener <div id="youtube-audio-player"></div> en tu HTML
            height: '1', // Dimensiones mínimas, ya está oculto por CSS
            width: '1',
            videoId: videoIdGlobal,
            playerVars: {
                'autoplay': 1,       // 1 = Intenta reproducir automáticamente
                'controls': 0,       // 0 = Sin controles del reproductor
                'showinfo': 0,       // No mostrar información del video
                'loop': 1,           // 1 = Reproducir en bucle
                'playlist': videoIdGlobal, // Para que 'loop' funcione, se necesita el ID del video aquí también
                'modestbranding': 1, // Logo de YouTube más pequeño
                'fs': 0,             // Sin botón de pantalla completa
                'iv_load_policy': 3, // No mostrar anotaciones
                'rel': 0,            // No mostrar videos relacionados al final
                'origin': window.location.origin // Puede ser necesario para algunos navegadores/entornos
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });
    } catch (e) {
        console.error("Error al crear YT.Player:", e);
    }
}

// 4. Esta función se llama cuando el reproductor está listo.
// DEBE SER GLOBAL.
function onPlayerReady(event) {
    console.log("Reproductor de YouTube listo (onPlayerReady). Video:", event.target.getVideoData().title);
    
    // NO vamos a llamar a event.target.mute() aquí.
    // Intentamos reproducir el video directamente con sonido.
    event.target.playVideo(); 

    console.log("Música de fondo intentando reproducirse CON SONIDO (esto puede ser bloqueado por el navegador hasta la interacción del usuario).");

    // Lógica para el botón de control de sonido
    const soundButtonContainer = document.getElementById('toggleSoundButtonContainer');
    if (soundButtonContainer) {
        soundButtonContainer.innerHTML = ''; // Limpiar por si acaso
        let soundButton = document.createElement('button');
        soundButton.id = 'toggleSoundButton';
        // El estado inicial del botón debe asumir que podría no estar sonando o estar silenciado por el navegador
        soundButton.textContent = '🔊 Activar Música'; 
        soundButton.setAttribute('aria-label', 'Activar, pausar o silenciar música de fondo');
        soundButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 15px;
            z-index: 10000;
            cursor: pointer;
            background-color: var(--color-primario, #8B5A2B);
            color: var(--color-blanco, white);
            border: none;
            border-radius: 5px;
            font-family: var(--fuente-texto, sans-serif);
            font-size: 0.9em;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;

        soundButton.addEventListener('click', function() {
            if (ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
                const playerState = ytPlayer.getPlayerState();
                
                if (playerState === YT.PlayerState.PLAYING) {
                    if (ytPlayer.isMuted()) {
                        ytPlayer.unMute();
                        this.textContent = '🔇 Silenciar';
                        console.log("Sonido activado por el usuario.");
                    } else {
                        ytPlayer.mute();
                        this.textContent = '🔊 Activar Música';
                        console.log("Sonido silenciado por el usuario.");
                    }
                } else {
                    // Si no se está reproduciendo (pausado, terminado, sin iniciar, en buffer),
                    // intenta reproducir y activar el sonido.
                    ytPlayer.playVideo(); // Intenta (re)iniciar la reproducción
                    ytPlayer.unMute();    // Asegúrate de que el sonido esté activo
                    this.textContent = '🔇 Silenciar';
                    console.log("Intentando reproducir y activar sonido.");
                }
            }
        });
        soundButtonContainer.appendChild(soundButton);

        // Después de que el reproductor está listo, podrías añadir un listener para la primera interacción
        // del usuario en cualquier parte de la página para intentar asegurar que la música se active.
        // Esto es una medida adicional si el autoplay directo no funciona.
        function handleFirstUserInteraction() {
            if (ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
                // Solo intentar si no se está reproduciendo o si está silenciado
                const playerState = ytPlayer.getPlayerState();
                if (playerState !== YT.PlayerState.PLAYING || ytPlayer.isMuted()) {
                    ytPlayer.playVideo(); // Asegura que esté reproduciendo
                    ytPlayer.unMute();    // Intenta activar el sonido
                    console.log("Sonido (re)intentado por interacción del usuario con la página.");
                }
                // Remover el listener después de la primera interacción para no repetirlo
                document.body.removeEventListener('click', handleFirstUserInteraction, true);
                document.body.removeEventListener('touchstart', handleFirstUserInteraction, true);
            }
        }
        // Usar `capture: true` para que se ejecute antes que otros listeners si es necesario
        document.body.addEventListener('click', handleFirstUserInteraction, { once: true, capture: true });
        document.body.addEventListener('touchstart', handleFirstUserInteraction, { once: true, capture: true });


    } else {
        console.warn("El div con id 'toggleSoundButtonContainer' no se encontró en el HTML. No se mostrará el botón de sonido y la activación del sonido dependerá completamente del navegador y la primera interacción.");
         // Si no hay botón, al menos intentar activar sonido en la primera interacción general
        function handleFirstUserInteractionNoButton() {
            if (ytPlayer && typeof ytPlayer.isMuted === 'function' && ytPlayer.isMuted()) {
                 ytPlayer.playVideo(); // Asegurar que esté reproduciendo
                 ytPlayer.unMute();
                 console.log("Sonido activado por interacción del usuario con la página (sin botón).");
            }
        }
        document.body.addEventListener('click', handleFirstUserInteractionNoButton, { once: true });
        document.body.addEventListener('touchstart', handleFirstUserInteractionNoButton, { once: true });
    }
}

// 5. Esta función se llama cuando el estado del reproductor cambia.
// DEBE SER GLOBAL.
function onPlayerStateChange(event) {
    console.log("Estado del reproductor de YouTube: ", event.data, "(Ver YT.PlayerState para significado)");
    // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)

    const soundButton = document.getElementById('toggleSoundButton');

    if (event.data === YT.PlayerState.PLAYING) {
        console.log("Música de fondo reproduciéndose.");
        if (soundButton && ytPlayer && typeof ytPlayer.isMuted === 'function') {
            soundButton.textContent = ytPlayer.isMuted() ? '🔊 Activar Música' : '🔇 Silenciar';
        }
    } else if (event.data === YT.PlayerState.PAUSED) {
        console.log("Música de fondo pausada.");
        if (soundButton && ytPlayer && typeof ytPlayer.isMuted === 'function' && !ytPlayer.isMuted()) {
             // Si no está silenciado y se pausa, ofrecer reanudar
            soundButton.textContent = '▶️ Reanudar Música';
        }
    } else if (event.data === YT.PlayerState.ENDED) {
        console.log("Video de fondo terminado (bucle debería reiniciarlo).");
        // La combinación de 'loop': 1 y 'playlist': videoId debería manejar el bucle.
    }
}

// 6. Esta función se llama si hay un error en el reproductor.
// DEBE SER GLOBAL.
function onPlayerError(event) {
    console.error("Error en el reproductor de YouTube. Código de error:", event.data);
    let errorMsg = "Error desconocido con el reproductor de YouTube.";
    switch(event.data) {
        case 2: errorMsg = "La solicitud contiene un valor de parámetro no válido (ej. ID de video incorrecto)."; break;
        case 5: errorMsg = "Se ha producido un error en el reproductor HTML5."; break;
        case 100: errorMsg = "El video solicitado no se ha encontrado. Puede ser privado o haber sido eliminado."; break;
        case 101: case 150: errorMsg = "El propietario del video solicitado no permite su reproducción en reproductores insertados."; break;
        default: errorMsg = `Error código ${event.data}. Consulta la documentación de la API de YouTube.`; break;
    }
    console.error("Mensaje detallado del error:", errorMsg);

    // Mostrar un mensaje al usuario podría ser útil
    const rsvpMsgEl = document.getElementById('rsvp-mensaje'); // Reutilizar un elemento existente para mensajes
    if(rsvpMsgEl) {
        rsvpMsgEl.textContent = "No se pudo cargar la música de fondo. " + errorMsg;
        rsvpMsgEl.style.color = 'red';
        rsvpMsgEl.style.backgroundColor = '#ffebee';
        rsvpMsgEl.style.padding = '10px';
        rsvpMsgEl.style.textAlign = 'center';
    }
}

document.addEventListener('DOMContentLoaded', function () {

    // =============================
    // CONTADOR REGRESIVO
    // =============================
    const fechaEvento = new Date("May 30, 2025 18:00:00").getTime(); // ***** CAMBIA ESTA FECHA Y HORA *****

    const elDias = document.getElementById("dias");
    const elHoras = document.getElementById("horas");
    const elMinutos = document.getElementById("minutos");
    const elSegundos = document.getElementById("segundos");
    const elTiempoContenedor = document.getElementById("tiempo");

    if (elDias && elHoras && elMinutos && elSegundos && elTiempoContenedor) {
        const actualizarContador = setInterval(function () {
            const ahora = new Date().getTime();
            const distancia = fechaEvento - ahora;

            const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
            const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
            const segundos = Math.floor((distancia % (1000 * 60)) / 1000);

            elDias.innerText = dias < 10 ? '0' + dias : dias;
            elHoras.innerText = horas < 10 ? '0' + horas : horas;
            elMinutos.innerText = minutos < 10 ? '0' + minutos : minutos;
            elSegundos.innerText = segundos < 10 ? '0' + segundos : segundos;

            if (distancia < 0) {
                clearInterval(actualizarContador);
                elTiempoContenedor.innerHTML = "<p style='font-size:1.5em; color:var(--color-primario);'>¡El gran día ha llegado!</p>";
            }
        }, 1000);
    } else {
        console.warn("Elementos del contador no encontrados en el DOM.");
    }
    // =============================
    // GALERÍA DE FOTOS (SLIDER)
    // =============================
    const sliderContainer = document.querySelector('.slider');
    if (sliderContainer) {
        const imagenes = sliderContainer.getElementsByTagName('img');
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        let imagenActualIdx = 0;

        function mostrarImagen(index) {
            for (let i = 0; i < imagenes.length; i++) {
                imagenes[i].classList.remove('active');
            }
            if (imagenes[index]) {
                imagenes[index].classList.add('active');
            }
        }

        if (imagenes.length > 0) {
            mostrarImagen(imagenActualIdx); // Mostrar la primera imagen

            if (nextBtn) {
                nextBtn.addEventListener('click', function () {
                    imagenActualIdx = (imagenActualIdx + 1) % imagenes.length;
                    mostrarImagen(imagenActualIdx);
                });
            }

            if (prevBtn) {
                prevBtn.addEventListener('click', function () {
                    imagenActualIdx = (imagenActualIdx - 1 + imagenes.length) % imagenes.length;
                    mostrarImagen(imagenActualIdx);
                });
            }
        } else {
            console.warn("No se encontraron imágenes para el slider.");
            if (nextBtn) nextBtn.style.display = 'none';
            if (prevBtn) prevBtn.style.display = 'none';
        }
    } else {
        console.warn("Contenedor del slider no encontrado.");
    }
    // =============================
    // FORMULARIO RSVP (CON WHATSAPP)
    // =============================
    // const rsvpForm = document.getElementById('rsvp-form');
    // const rsvpMensajeEl = document.getElementById('rsvp-mensaje');

    // if (rsvpForm && rsvpMensajeEl) {
    //     rsvpForm.addEventListener('submit', function (e) {
    //         e.preventDefault(); // Previene el envío normal del formulario

    //         // --- RECOGE LOS DATOS DEL FORMULARIO ---
    //         const nombre = document.getElementById('nombre-invitado').value;
    //         const asistentes = document.getElementById('asistentes').value;
    //         // let alergias = document.getElementById('alergias').value;
    //         // let mensajeExtra = document.getElementById('mensaje-extra').value;

    //         // --- VALIDACIÓN BÁSICA ---
    //         if (nombre.trim() === '' || asistentes.trim() === '') {
    //             rsvpMensajeEl.textContent = 'Por favor, completa tu nombre y número de asistentes.';
    //             rsvpMensajeEl.style.color = 'red';
    //             rsvpMensajeEl.style.backgroundColor = '#ffebee';
    //             return;
    //         }

    //         // --- CONFIGURA EL NÚMERO DE WHATSAPP Y EL MENSAJE ---
    //         const numeroWhatsapp = "5560596560"; // ***** ¡REEMPLAZA CON TU NÚMERO DE WHATSAPP! *****
    //         // Formato internacional, ej: 521 para México + tu número de 10 dígitos.
    //         // Por ejemplo, si tu número es 55 1234 5678, sería 5215512345678

    //         // Nombres de los novios (puedes obtenerlos de otra parte o escribirlos aquí)
    //         const nombreNovia = "YIRMARY"; // Reemplaza si es necesario
    //         const nombreNovio = "EVERT"; // Reemplaza si es necesario

    //         // Asegurarse de que los campos opcionales vacíos se muestren como "Ninguno" o similar
    //         // if (alergias.trim() === '') {
    //         //     alergias = 'Ninguna';
    //         // }
    //         // if (mensajeExtra.trim() === '') {
    //         //     mensajeExtra = 'Ninguno';
    //         // }

    //         let mensajeWA = `¡Hola! Quiero confirmar mi asistencia para la boda de ${nombreNovia} & ${nombreNovio}.\n\n`;
    //         mensajeWA += `*Nombre:* ${nombre}\n`;
    //         mensajeWA += `*Número de asistentes:* ${asistentes}\n`;
    //         // mensajeWA += `🍽️ *Alergias/Requerimientos:* ${alergias}\n`;
    //         // mensajeWA += `💬 *Mensaje adicional:* ${mensajeExtra}\n\n`;
    //         mensajeWA += `¡Gracias! Esperamos con ansias.`;

    //         // --- CODIFICA EL MENSAJE PARA LA URL ---
    //         const mensajeCodificado = encodeURIComponent(mensajeWA);

    //         // --- CREA LA URL DE WHATSAPP ---
    //         const urlWhatsapp = `https://wa.me/${numeroWhatsapp}?text=${mensajeCodificado}`;

    //         // --- MUESTRA UN MENSAJE AL USUARIO Y REDIRIGE ---
    //         rsvpMensajeEl.innerHTML = `Serás redirigido a WhatsApp para enviar tu confirmación...`;
    //         rsvpMensajeEl.style.color = '#333'; // Un color neutral
    //         rsvpMensajeEl.style.backgroundColor = '#e0e0e0'; // Un fondo neutral

    //         // Abre WhatsApp en una nueva pestaña/app
    //         window.open(urlWhatsapp, '_blank');

    //         // Opcional: Limpiar el formulario después de un breve retraso
    //         setTimeout(() => {
    //             rsvpForm.reset();
    //             rsvpMensajeEl.textContent = 'Puedes cerrar esta ventana o seguir navegando.';
    //             rsvpMensajeEl.style.backgroundColor = '#e8f5e9'; // Verde claro para indicar éxito
    //             rsvpMensajeEl.style.color = 'green';
    //         }, 3000); // 3 segundos de retraso

    //     });
    // } else {
    //     console.warn("Formulario RSVP o elemento de mensaje no encontrado.");
    // }
    // =============================
    // FORMULARIO DE MÚSICA
    // =============================
    const musicaForm = document.getElementById('musica-form');
    const musicaMensajeEl = document.getElementById('musica-mensaje');

    if (musicaForm && musicaMensajeEl) {
        musicaForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const cancion = document.getElementById('cancion').value;

            if (cancion.trim() === '') {
                musicaMensajeEl.textContent = 'Por favor, escribe el nombre de la canción.';
                musicaMensajeEl.style.color = 'red';
                musicaMensajeEl.style.backgroundColor = '#ffebee';
                return;
            }

            console.log('Sugerencia Musical:', { cancion });
            musicaMensajeEl.innerHTML = `¡Gracias por tu sugerencia: "<strong>${cancion}</strong>"!`;
            musicaMensajeEl.style.color = 'green';
            musicaMensajeEl.style.backgroundColor = '#e8f5e9';
            musicaForm.reset();

            // Similar al RSVP, aquí enviarías la sugerencia a un backend.
        });
    } else {
        console.warn("Formulario de música o elemento de mensaje no encontrado.");
    }
    // =====================================
    // ANIMACIÓN DE ENTRADA PARA SECCIONES
    // =====================================
    const todasLasSecciones = document.querySelectorAll('.seccion');

    const observerOptions = {
        root: null, // Relativo al viewport
        rootMargin: '0px',
        threshold: 0.1 // Se activa cuando el 10% de la sección es visible
    };

    const observer = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observerInstance.unobserve(entry.target); // Deja de observar una vez animado
            }
        });
    }, observerOptions);

    todasLasSecciones.forEach(seccion => {
        observer.observe(seccion);
    });

}); // Fin del DOMContentLoaded