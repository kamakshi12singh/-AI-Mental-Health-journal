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
    const days = [...new Set(entries.map(e => new Date(e.date).toDateString()))].sort((a, b) => new Date(b) - new Date(a));
    let streak = 0;
    let expectedDate = new Date();
    expectedDate.setHours(0,0,0,0);
    const firstDate = new Date(days[0]);
    firstDate.setHours(0,0,0,0);
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
            } else { break; }
        }
    }
    return streak;
}

// --- AI & Sentiment Logic ---
function analyzeMood(text) {
    const lowerText = text.toLowerCase();
    const positiveWords = ['happy', 'great', 'good', 'joy', 'excited', 'calm', 'grateful', 'awesome', 'amazing', 'love', 'peace', 'nice', 'better', 'productive', 'blessed'];
    const negativeWords = ['sad', 'bad', 'angry', 'anxious', 'stressed', 'tired', 'terrible', 'awful', 'hate', 'depressed', 'overwhelmed', 'frustrated', 'worst', 'lonely'];
    
    let score = 0;
    positiveWords.forEach(word => { if (lowerText.includes(word)) score += 0.4; });
    negativeWords.forEach(word => { if (lowerText.includes(word)) score -= 0.4; });
    
    score = Math.max(-1, Math.min(1, score));
    let mood = "Neutral";
    if (score >= 0.2) mood = "Positive";
    else if (score <= -0.2) mood = "Negative";
    
    return { score: score, mood: mood };
}

function getAdvice(mood) {
    const advice = {
        Positive: "You're radiating incredible energy today! 🌟 This is a perfect moment to set a new goal or simply share this light with someone else. What's one thing you want to achieve while feeling this good?",
        Neutral: "You're in a steady, observational state. 🌱 It's a great time for deep focus or a quiet walk. How can you use this calm to prepare for your next big move?",
        Negative: "It's brave of you to acknowledge these feelings. 💙 Remember, even the stormiest clouds eventually pass. Treat yourself with extreme kindness today—maybe a favorite drink or five minutes of absolute silence?"
    };
    return advice[mood];
}

// --- UI Framework ---
document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    const links = {
        scribble: document.getElementById('linkScribble'),
        insights: document.getElementById('linkInsights'),
        practice: document.getElementById('linkPractice')
    };
    const sections = {
        scribble: document.getElementById('sectionScribble'),
        insights: document.getElementById('sectionInsights'),
        practice: document.getElementById('sectionPractice')
    };

    function switchSection(target) {
        Object.values(sections).forEach(s => s.style.display = 'none');
        Object.values(links).forEach(l => l.classList.remove('active'));
        
        sections[target].style.display = 'block';
        links[target].classList.add('active');
        
        // Re-render chart if insights
        if (target === 'insights') renderInsights();
    }

    links.scribble.addEventListener('click', (e) => { e.preventDefault(); switchSection('scribble'); });
    links.insights.addEventListener('click', (e) => { e.preventDefault(); switchSection('insights'); });
    links.practice.addEventListener('click', (e) => { e.preventDefault(); switchSection('practice'); });

    // Journal Logic
    const diaryForm = document.getElementById('diaryForm');
    const diaryInput = document.getElementById('diaryInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const moodBtns = document.querySelectorAll('.mood-btn');
    const streakCount = document.getElementById('streakCount');
    const resultContainer = document.getElementById('resultContainer');
    
    let selectedMood = "";
    moodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            moodBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedMood = btn.getAttribute('data-tag');
        });
    });

    streakCount.innerText = getStreak();

    diaryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = diaryInput.value.trim();
        if (!text) return;

        analyzeBtn.innerText = 'Reflecting...';
        analyzeBtn.disabled = true;

        setTimeout(() => {
            const contextText = selectedMood ? `[Feeling: ${selectedMood}] ${text}` : text;
            const { score, mood } = analyzeMood(contextText);
            saveEntry(contextText, score, mood);
            
            // Show Results
            document.getElementById('moodBadge').innerText = `Mood Detected: ${mood}`;
            document.getElementById('aiAdvice').innerText = getAdvice(mood);
            resultContainer.style.display = 'block';
            
            // Reset
            diaryInput.value = '';
            moodBtns.forEach(b => b.classList.remove('selected'));
            selectedMood = "";
            streakCount.innerText = getStreak();
            analyzeBtn.innerText = 'Save Reflection ✨';
            analyzeBtn.disabled = false;
        }, 1000);
    });

    // Breathing Logic
    const startBreatheBtn = document.getElementById('startBreatheBtn');
    const breatheCircle = document.getElementById('breatheCircle');
    const breatheText = document.getElementById('breatheText');
    let breatheActive = false;

    startBreatheBtn.addEventListener('click', () => {
        if (breatheActive) {
            breatheActive = false;
            startBreatheBtn.innerText = 'Start Session';
            breatheText.innerText = 'Ready';
            breatheCircle.style.transform = 'scale(1)';
            return;
        }
        breatheActive = true;
        startBreatheBtn.innerText = 'End Session';
        runBreatheCycle();
    });

    function runBreatheCycle() {
        if (!breatheActive) return;
        breatheText.innerText = 'Inhale';
        breatheCircle.style.transform = 'scale(1.5)';
        setTimeout(() => {
            if (!breatheActive) return;
            breatheText.innerText = 'Hold';
            setTimeout(() => {
                if (!breatheActive) return;
                breatheText.innerText = 'Exhale';
                breatheCircle.style.transform = 'scale(1)';
                setTimeout(runBreatheCycle, 4000);
            }, 2000);
        }, 4000);
    }

    // Insights Chart
    let chartInstance = null;
    function renderInsights() {
        const entries = getEntries().slice(-7);
        const ctx = document.getElementById('moodChart').getContext('2d');
        const labels = entries.map(e => new Date(e.date).toLocaleDateString());
        const data = entries.map(e => e.score);

        if (chartInstance) chartInstance.destroy();
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Vibe',
                    data: data,
                    borderColor: '#58A6FF',
                    tension: 0.4,
                    fill: false,
                    pointRadius: 6,
                    pointBackgroundColor: '#BC8CFF'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { min: -1, max: 1, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });

        // History
        const historyContainer = document.getElementById('historyContainer');
        historyContainer.innerHTML = '<h3>Recent Spills</h3>';
        entries.reverse().forEach(e => {
            const div = document.createElement('div');
            div.className = 'glass-card';
            div.style.marginBottom = '1rem';
            div.innerHTML = `<p style="color: var(--primary); font-size: 0.9rem;">${new Date(e.date).toLocaleString()}</p><p>"${e.text}"</p>`;
            historyContainer.appendChild(div);
        });
    }
});
