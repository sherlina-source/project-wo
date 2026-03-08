// Settings page functionality
function initSettings() {
    setupSettingsNavigation();
    loadUserSettings();
    setupFormHandlers();
}

document.addEventListener("DOMContentLoaded", initSettings);

// ================// NAVIGATION // ================
function setupSettingsNavigation() {

    const navItems = document.querySelectorAll('.settings-nav-item');
    const sections = document.querySelectorAll('.settings-section');

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {

            e.preventDefault();

            navItems.forEach(n => n.classList.remove('active'));
            this.classList.add('active');

            const targetId = this.dataset.section;

            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });

            history.pushState(null, null, `#${targetId}`);
        });
    });

    const hash = window.location.hash.substring(1);
    if (hash) {
        const targetNav = document.querySelector(`[data-section="${hash}"]`);
        if (targetNav) targetNav.click();
    }
}

// ===============LOAD SETTINGS // ===============
function loadUserSettings() {
    const testBtn = document.getElementById("testSoundBtn");

    if (testBtn) {
        testBtn.addEventListener("click", function () {
    
            const selectedSound =
                localStorage.getItem("wo_selected_sound") ||
                document.getElementById("soundSelect").value;
    
            const volume =
                localStorage.getItem("wo_volume") || 80;
    
            const audio = new Audio(selectedSound);
            audio.volume = volume / 100;
            audio.play().catch(err => {
                console.log("Audio blocked:", err);
            });
        });
    }
    // ===== SOUND TOGGLE =====
    const soundToggle = document.getElementById('soundAlert');

    if (soundToggle) {

        const savedEnabled = localStorage.getItem("wo_sound_enabled");
        soundToggle.checked = savedEnabled === "true";

        soundToggle.addEventListener('change', function () {
            localStorage.setItem("wo_sound_enabled", this.checked);
            state.soundEnabled = this.checked;
        });
    }

    // ===== SOUND SELECT =====
    const soundSelect = document.getElementById('soundSelect');

    if (soundSelect) {

        const savedSound = localStorage.getItem("wo_selected_sound");

        if (savedSound) {
            soundSelect.value = savedSound;
        }

        soundSelect.addEventListener('change', function () {
            localStorage.setItem("wo_selected_sound", this.value);
        });
    }

    // ===== VOLUME =====
    const volumeRange = document.querySelector('.volume-range');

    if (volumeRange) {

        const savedVolume = localStorage.getItem("wo_volume");

        if (savedVolume) {
            volumeRange.value = savedVolume;
        }

        volumeRange.addEventListener('input', function () {
            localStorage.setItem("wo_volume", this.value);
            state.volume = this.value;
        });
    }
}

// ===============// FORM HANDLERS // ===============
function setupFormHandlers() {

    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.addEventListener('click', function () {
            themeOptions.forEach(o => o.classList.remove('active'));
            this.classList.add('active');

            const theme = this.dataset.theme;
            applyTheme(theme);
            localStorage.setItem("wo_theme", theme);
        });
    });

    const savedTheme = localStorage.getItem("wo_theme");
    if (savedTheme) applyTheme(savedTheme);
}


// ================// THEME// ==================
function applyTheme(theme) {

    switch (theme) {
        case 'dark':
            document.body.style.filter = 'invert(1) hue-rotate(180deg)';
            break;
        case 'light':
            document.body.style.filter = 'none';
            break;
    }
}