import vader from 'https://esm.sh/vader-sentiment@1.1.3';

// --- Database Logic (localStorage) ---
const DB_KEY = 'serenity_diary_entries';

function getEntries() {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : [];
}

function saveEntry(text, score, mood) {
    const entries = getEntries();
    const entry = {
        id: Date.now(),
        date: new Date().toISOString(),
        text: text,
        score: score,
        mood: mood
    };
    entries.push(entry);
    localStorage.setItem(DB_KEY, JSON.stringify(entries));
    return entry;
}

function getStreak() {
    const entries = getEntries();
    if (entries.length === 0) return 0;

    // Group by unique days
    const days = [...new Set(entries.map(e => new Date(e.date).toDateString()))].sort((a, b) => new Date(b) - new Date(a));
    
    let streak = 0;
    let expectedDate = new Date(); // Today
    expectedDate.setHours(0,0,0,0);

    const firstDate = new Date(days[0]);
    firstDate.setHours(0,0,0,0);
    
    // Check if the most recent entry was today or yesterday
    const diffTime = Math.abs(expectedDate - firstDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays <= 1) {
        streak++;
        expectedDate = new Date(firstDate);
        expectedDate.setDate(expectedDate.getDate() - 1);
        
        for (let i = 1; i < days.length; i++) {
            const currentDate = new Date(days[i]);
            currentDate.setHours(0,0,0,0);
            
            if (currentDate.getTime() === expectedDate.getTime()) {
                streak++;
                expectedDate.setDate(expectedDate.getDate() - 1);
            } else {
                break;
            }
        }
    }
    return streak;
}

// --- AI Logic ---
function analyzeMood(text) {
    const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(text);
    const compound = intensity.compound;
    let mood = "Neutral";
    if (compound >= 0.05) mood = "Positive";
    else if (compound <= -0.05) mood = "Negative";
    
    return { score: compound, mood: mood };
}

function getAdvice(mood) {
    if (mood === "Positive") {
        return "You're having a great day! Keep up the positive energy and maybe share your joy with someone around you. Let's keep the streak going! 🌟";
    } else if (mood === "Neutral") {
        return "It sounds like you had a balanced day. This is a good time to clear your mind, read a book, or go for a relaxing walk. 🌱";
    } else {
        return "It's completely okay to have a tough day. Take a deep breath. Try to engage in some self-care, listen to calming music, or talk to a friend. You've got this! 💙";
    }
}

// --- UI Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const streakCount = document.getElementById('streakCount');
    const tabWrite = document.getElementById('tabWrite');
    const tabInsights = document.getElementById('tabInsights');
    const tabBreathe = document.getElementById('tabBreathe');
    const writeSection = document.getElementById('writeSection');
    const insightsSection = document.getElementById('insightsSection');
    const breatheSection = document.getElementById('breatheSection');
    
    // New UI Elements
    const moodTags = document.querySelectorAll('.mood-tag');
    let selectedTags = [];
    const micBtn = document.getElementById('micBtn');
    const startBreatheBtn = document.getElementById('startBreatheBtn');
    const breatheCircle = document.getElementById('breatheCircle');
    const breatheText = document.getElementById('breatheText');
    const affirmationText = document.getElementById('affirmationText');
    
    const diaryForm = document.getElementById('diaryForm');
    const diaryInput = document.getElementById('diaryInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultContainer = document.getElementById('resultContainer');
    const moodBadge = document.getElementById('moodBadge');
    const aiAdvice = document.getElementById('aiAdvice');
    
    let chartInstance = null;

    // Update Streak
    streakCount.innerText = getStreak();

    // Tab Switching
    function resetTabs() {
        [tabWrite, tabInsights, tabBreathe].forEach(tab => {
            tab.classList.remove('active');
            tab.style.background = 'rgba(255,255,255,0.1)';
            tab.style.borderColor = 'var(--border-color)';
        });
        writeSection.style.display = 'none';
        insightsSection.style.display = 'none';
        breatheSection.style.display = 'none';
    }

    tabWrite.addEventListener('click', () => {
        resetTabs();
        tabWrite.classList.add('active');
        tabWrite.style.background = 'rgba(255,255,255,0.15)';
        tabWrite.style.borderColor = 'var(--primary-color)';
        writeSection.style.display = 'block';
    });

    tabInsights.addEventListener('click', () => {
        resetTabs();
        tabInsights.classList.add('active');
        tabInsights.style.background = 'rgba(255,255,255,0.15)';
        tabInsights.style.borderColor = 'var(--primary-color)';
        insightsSection.style.display = 'block';
        renderInsights();
    });

    tabBreathe.addEventListener('click', () => {
        resetTabs();
        tabBreathe.classList.add('active');
        tabBreathe.style.background = 'rgba(255,255,255,0.15)';
        tabBreathe.style.borderColor = 'var(--primary-color)';
        breatheSection.style.display = 'block';
    });

    // --- New Features Logic ---
    
    // 1. Daily Affirmation
    const affirmations = [
        "You are worthy of all the good things that happen to you.",
        "Take a deep breath. You are doing the best you can.",
        "Every day is a fresh start. Let go of yesterday.",
        "Your feelings are valid, and it's okay to feel them.",
        "You are stronger than you think. Keep going."
    ];
    affirmationText.innerText = `"${affirmations[Math.floor(Math.random() * affirmations.length)]}"`;

    // 2. Mood Tags
    moodTags.forEach(tag => {
        tag.addEventListener('click', () => {
            const tagValue = tag.getAttribute('data-tag');
            if (selectedTags.includes(tagValue)) {
                selectedTags = selectedTags.filter(t => t !== tagValue);
                tag.classList.remove('selected');
            } else {
                selectedTags.push(tagValue);
                tag.classList.add('selected');
            }
        });
    });

    // 3. Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        
        let isRecording = false;

        micBtn.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });

        recognition.onstart = () => {
            isRecording = true;
            micBtn.classList.add('recording');
            micBtn.innerText = '🛑 Stop';
        };

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            diaryInput.value = transcript;
        };

        recognition.onend = () => {
            isRecording = false;
            micBtn.classList.remove('recording');
            micBtn.innerText = '🎤 Speak';
        };
    } else {
        micBtn.style.display = 'none'; // Hide if unsupported
    }

    // 4. Breathing Exercise Logic
    let breatheInterval;
    startBreatheBtn.addEventListener('click', () => {
        if (startBreatheBtn.innerText === 'Stop Exercise') {
            clearInterval(breatheInterval);
            breatheCircle.className = 'breathe-circle';
            breatheText.innerText = 'Ready?';
            startBreatheBtn.innerText = 'Start Exercise';
            return;
        }

        startBreatheBtn.innerText = 'Stop Exercise';
        
        function cycle() {
            breatheCircle.className = 'breathe-circle inhale';
            breatheText.innerText = 'Inhale...';
            
            setTimeout(() => {
                breatheCircle.className = 'breathe-circle hold';
                breatheText.innerText = 'Hold...';
                
                setTimeout(() => {
                    breatheCircle.className = 'breathe-circle exhale';
                    breatheText.innerText = 'Exhale...';
                }, 4000); // Hold for 4s
            }, 4000); // Inhale for 4s
        }

        cycle();
        breatheInterval = setInterval(cycle, 14000); // Total cycle: 4 + 4 + 6 = 14s
    });

    // Form Submission
    diaryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = diaryInput.value.trim();
        if (!text) return;

        analyzeBtn.innerText = 'Analyzing...';
        analyzeBtn.disabled = true;

        setTimeout(() => {
            let finalContext = text;
            if (selectedTags.length > 0) {
                finalContext = `[Tags: ${selectedTags.join(', ')}] ` + text;
            }
            
            const { score, mood } = analyzeMood(finalContext);
            saveEntry(finalContext, score, mood);
            
            // Clear tags after submission
            selectedTags = [];
            moodTags.forEach(t => t.classList.remove('selected'));
            
            // Update Streak
            streakCount.innerText = getStreak();
            
            // Show Results
            const advice = getAdvice(mood);
            let emoji = "😐";
            let badgeClass = "badge neutral";
            
            if (mood === "Positive") { emoji = "😊"; badgeClass = "badge success"; }
            else if (mood === "Negative") { emoji = "😔"; badgeClass = "badge error"; }

            moodBadge.className = badgeClass;
            moodBadge.innerHTML = `<strong>Detected Mood:</strong> ${mood} ${emoji}`;
            aiAdvice.innerText = `"${advice}"`;
            
            resultContainer.style.display = 'block';
            diaryInput.value = '';
            
            analyzeBtn.innerText = 'Analyze Mood ✨';
            analyzeBtn.disabled = false;
        }, 800); // Small artificial delay for effect
    });

    // Render Insights
    function renderInsights() {
        const entries = getEntries().slice(-7).reverse(); // Last 7 entries
        const historyContainer = document.getElementById('historyContainer');
        historyContainer.innerHTML = '';

        if (entries.length === 0) {
            historyContainer.innerHTML = '<p style="color: var(--text-muted);">No entries yet! Please write a new entry first to see insights.</p>';
            return;
        }

        // Populate History
        entries.forEach(entry => {
            const d = new Date(entry.date);
            const dateStr = d.toLocaleDateString();
            
            let emoji = "😐";
            if (entry.mood === "Positive") emoji = "😊";
            else if (entry.mood === "Negative") emoji = "😔";

            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
                    <strong>${dateStr} - Mood: ${entry.mood} ${emoji}</strong>
                    <span style="color: var(--text-muted); font-size: 0.8rem;">Score: ${entry.score.toFixed(2)} ▼</span>
                </div>
                <div class="gsap-reveal-stagger history-item" style="display: none; margin-top: 1rem; padding: 2rem; background: var(--bg-main); border-radius: 20px; border: 2px solid var(--border-color);">
                    <p style="color: var(--text-main); font-family: 'Playfair Display', serif; font-size: 1.3rem; font-style: italic;">"${entry.text}"</p>
                </div>
            `;
            historyContainer.appendChild(div);
        });

        // Render Chart
        const ctx = document.getElementById('moodChart').getContext('2d');
        const labels = entries.slice().reverse().map(e => new Date(e.date).toLocaleDateString());
        const data = entries.slice().reverse().map(e => e.score);

        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Vibe Score',
                    data: data,
                    borderColor: '#8C52FF',
                    backgroundColor: 'rgba(140, 82, 255, 0.1)',
                    borderWidth: 4,
                    pointBackgroundColor: '#FF5A36',
                    pointBorderColor: '#FDFBF7',
                    pointRadius: 6,
                    fill: true,
                    tension: 0.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: -1,
                        max: 1,
                        grid: { display: false },
                        ticks: { color: '#737373', font: { family: "'Outfit', sans-serif", size: 14, weight: 600 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#737373', font: { family: "'Outfit', sans-serif", size: 14, weight: 600 } }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
});
