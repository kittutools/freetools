// Kittutools - Advanced Text-To-Speech (TTS) Reader (js/tts-reader.js)

let ttsUtterance = null;
let ttsVoices = [];

function openTtsReaderModal() {
    openModal('tts-reader-modal');
    initTtsVoices();
}

function closeTtsReaderModal() {
    stopTtsAudio();
    closeModal('tts-reader-modal');
}

function initTtsVoices() {
    const voiceSelect = document.getElementById('tts-voice-select');
    if (!voiceSelect) return;

    if (!('speechSynthesis' in window)) {
        showToast('Web Speech API is not supported in this browser', 'info');
        return;
    }

    const populateVoiceList = () => {
        ttsVoices = window.speechSynthesis.getVoices();
        voiceSelect.innerHTML = '';

        if (ttsVoices.length === 0) {
            const opt = document.createElement('option');
            opt.textContent = 'Default System Voice';
            voiceSelect.appendChild(opt);
            return;
        }

        ttsVoices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.value = index;
            if (voice.default) {
                option.selected = true;
            }
            voiceSelect.appendChild(option);
        });
    };

    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
    }
}

function playTtsAudio() {
    const textInput = document.getElementById('tts-input-text');
    const voiceSelect = document.getElementById('tts-voice-select');
    const pitchSlider = document.getElementById('tts-pitch-slider');
    const rateSlider = document.getElementById('tts-rate-slider');
    const volumeSlider = document.getElementById('tts-volume-slider');

    if (!textInput || !textInput.value.trim()) {
        showToast('Please enter text to speak', 'info');
        return;
    }

    if (!('speechSynthesis' in window)) {
        showToast('Web Speech API not supported', 'info');
        return;
    }

    // Stop current speaking
    window.speechSynthesis.cancel();

    const text = textInput.value.trim();
    ttsUtterance = new SpeechSynthesisUtterance(text);

    if (voiceSelect && voiceSelect.value !== '') {
        const selectedVoiceIndex = parseInt(voiceSelect.value, 10);
        if (ttsVoices[selectedVoiceIndex]) {
            ttsUtterance.voice = ttsVoices[selectedVoiceIndex];
        }
    }

    if (pitchSlider) ttsUtterance.pitch = parseFloat(pitchSlider.value);
    if (rateSlider) ttsUtterance.rate = parseFloat(rateSlider.value);
    if (volumeSlider) ttsUtterance.volume = parseFloat(volumeSlider.value);

    ttsUtterance.onend = () => {
        showToast('Finished reading text', 'info');
    };

    ttsUtterance.onerror = (e) => {
        console.warn('TTS playback error:', e);
    };

    window.speechSynthesis.speak(ttsUtterance);
    showToast('Playing speech audio...', 'success');
}

function pauseTtsAudio() {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        showToast('Audio paused', 'info');
    }
}

function resumeTtsAudio() {
    if (window.speechSynthesis && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        showToast('Resuming audio speech...', 'success');
    }
}

function stopTtsAudio() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        showToast('Audio stopped', 'info');
    }
}

function updateTtsSliderLabel(id, val) {
    const label = document.getElementById(id);
    if (label) label.textContent = val;
}
