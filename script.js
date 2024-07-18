// Initialiser l'API Web Audio
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let isKeyPressed = {};

// Fréquences des notes de la gamme chromatique de C4 à C5
const notes = {
    'q': { frequency: 261.63, note: 'c' }, // C4
    'z': { frequency: 277.18, note: 'c#' }, // C#4
    's': { frequency: 293.66, note: 'd' }, // D4
    'e': { frequency: 311.13, note: 'd#' }, // D#4
    'd': { frequency: 329.63, note: 'e' }, // E4
    'f': { frequency: 349.23, note: 'f' }, // F4
    't': { frequency: 369.99, note: 'f#' }, // F#4
    'g': { frequency: 392.00, note: 'g' }, // G4
    'y': { frequency: 415.30, note: 'g#' }, // G#4
    'h': { frequency: 440.00, note: 'a' }, // A4
    'u': { frequency: 466.16, note: 'a#' }, // A#4
    'j': { frequency: 493.88, note: 'b' }, // B4
    'k': { frequency: 523.25, note: 'c' }  // C5
};

let exercises = {};
let currentExerciseIndex = 0;
let notesList = [];
let currentNoteIndex = 0;

// Charger les exercices depuis le fichier JSON
fetch('exercises.json')
    .then(response => response.json())
    .then(data => {
        exercises = data.songs;
        loadRandomExercise();
    });

function loadRandomExercise() {
    currentExerciseIndex = Math.floor(Math.random() * exercises.length);
    loadExercise();
}

function loadExercise() {
    const exercise = exercises[currentExerciseIndex];
    notesList = exercise.notesList.map(note => ({ key: note, status: '' }));
    const consigne = exercise.consigne;
    const image = exercise.image;

    document.getElementById('exercise-image').src = 'assets/' + image;
    document.getElementById('exercise-image').style.display = 'block';

    document.getElementById('exercise-title').style.display = 'block';
    document.getElementById('sequence-display').style.display = 'block';
    document.getElementById('controls').style.display = 'none';

    currentNoteIndex = 0;
    updateSequenceDisplay();
}

function updateSequenceDisplay() {
    const sequenceDisplay = document.getElementById('sequence-display');
    sequenceDisplay.innerHTML = notesList.map((note, index) => {
        let className = 'note';
        if (note.status === 'correct') {
            className += ' correct';
        } else if (note.status === 'wrong') {
            className += ' wrong';
        } else if (index === currentNoteIndex) {
            className += ' current';
        }
        return `<span class="${className}">.</span>`;
    }).join(' ');
}

function checkAnswer(key) {
    const currentNote = notesList[currentNoteIndex];
    if (notes[key].note === currentNote.key) {
        playPianoNote(notes[key].frequency);
        document.querySelector(`.key[data-key="${key}"]`).classList.add('correct');
        notesList[currentNoteIndex].status = 'correct';
        currentNoteIndex++;
        if (currentNoteIndex >= notesList.length) {
            showCompletionMessage();
        } else {
            updateSequenceDisplay();
        }
    } else {
        notesList[currentNoteIndex].status = 'wrong';
        currentNoteIndex++;
        if (currentNoteIndex >= notesList.length) {
            showCompletionMessage();
        } else {
            updateSequenceDisplay();
        }
    }
}

function showCompletionMessage() {
    document.getElementById('message').innerText = `Bravo, vous avez joué ${exercises[currentExerciseIndex].titre}`;
    document.getElementById('message').style.display = 'block';
    document.getElementById('controls').style.display = 'block';
    if (currentExerciseIndex >= exercises.length - 1) {
        document.getElementById('controls').innerHTML = `
            <button onclick="restartExercise()">Recommencer</button>
            <button onclick="loadRandomExercise()">Nouvelle mélodie</button>
        `;
    } else {
        document.getElementById('controls').innerHTML = `
            <button onclick="restartExercise()">Recommencer</button>
            <button onclick="nextExercise()">Mélodie suivante</button>
        `;
    }
}

function restartExercise() {
    loadExercise();
}

function nextExercise() {
    currentExerciseIndex = (currentExerciseIndex + 1) % exercises.length;
    loadExercise();
}

function playPianoNote(frequency) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    oscillator.start();

    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 2);
    oscillator.stop(audioContext.currentTime + 1);
}

document.addEventListener('keydown', function(event) {
    const key = event.key.toLowerCase();
    if (notes[key] && !isKeyPressed[key]) {
        isKeyPressed[key] = true;
        playPianoNote(notes[key].frequency);
        checkAnswer(key);

        const pianoKey = document.querySelector(`.key[data-key="${key}"]`);
        if (pianoKey) {
            pianoKey.classList.add('active');
            setTimeout(() => {
                pianoKey.classList.remove('active');
            }, 100);
        }
    }
});

document.addEventListener('keyup', function(event) {
    const key = event.key.toLowerCase();
    if (notes[key]) {
        isKeyPressed[key] = false;
    }
});

document.querySelectorAll('.key').forEach(key => {
    key.addEventListener('click', function() {
        const noteKey = this.getAttribute('data-key');
        playPianoNote(notes[noteKey].frequency);
        checkAnswer(noteKey);

        this.classList.add('active');
        setTimeout(() => {
            this.classList.remove('active');
        }, 100);
    });
});
