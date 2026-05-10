// --- Storage Engine ---
const DB_KEY = 'serenity_vault_entries';

function getEntries() {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : [];
}

function saveEntry(text, score, mood) {
    const entries = getEntries();
    const entry = { id: Date.now(), date: new Date().toISOString(), text: text, score: score, mood: mood };
    entries.push(entry);
    localStorage.setItem(DB_KEY, JSON.stringify(entries));
    return entry;
}

function getStreak() {
    const entries = getEntries();
    if (entries.length === 0) return 0;
    const days = [...new Set(entries.map(e => new Date(e.date).toDateString()))].sort((a, b) => new Date(b) - new Date(a));
    let streak = 0;
    let expected = new Date(); expected.setHours(0,0,0,0);
    const last = new Date(days[0]); last.setHours(0,0,0,0);
    if (Math.ceil(Math.abs(expected - last) / (1000*60*60*24)) <= 1) {
        streak++;
        expected = new Date(last); expected.setDate(expected.getDate() - 1);
        for (let i = 1; i < days.length; i++) {
            const current = new Date(days[i]); current.setHours(0,0,0,0);
            if (current.getTime() === expected.getTime()) { streak++; expected.setDate(expected.getDate() - 1); }
            else break;
        }
    }
    return streak;
}

// --- Intelligence ---
function analyzeSentiment(text) {
    const lower = text.toLowerCase();
    const pos = ['vibrant', 'steady', 'grateful', 'peace', 'joy', 'clear', 'better', 'good', 'happy', 'productive', 'calm'];
    const neg = ['heavy', 'low', 'stuck', 'anxious', 'tired', 'sad', 'hard', 'stressed', 'overwhelmed', 'lost', 'lonely'];
    let score = 0;
    pos.forEach(w => { if (lower.includes(w)) score += 0.35; });
    neg.forEach(w => { if (lower.includes(w)) score -= 0.35; });
    score = Math.max(-1, Math.min(1, score));
    let mood = "Steady";
    if (score >= 0.2) mood = "Vibrant";
    else if (score <= -0.2) mood = "Low";
    return { score, mood };
}

function getInsightAdvice(mood) {
    const map = {
        Vibrant: "Your mental clarity is exceptional today. 💎 Capture this momentum. What's one project or thought you can push forward while your energy is this high?",
        Steady: "You're in a state of sustainable equilibrium. 🌊 This is the perfect time for deep work or meaningful connection. How can you nurture this balance?",
        Low: "It's a quiet day for the soul. ☁️ There's no pressure to be 'on.' Allow yourself the grace of a slow pace. What's one small act of comfort you can offer yourself?"
    };
    return map[mood];
}

// --- Interaction Core ---
document.addEventListener('DOMContentLoaded', () => {
    // Nav
    const navs = { scribble: document.getElementById('navScribble'), insights: document.getElementById('navInsights'), practice: document.getElementById('navPractice') };
    const views = { scribble: document.getElementById('viewScribble'), insights: document.getElementById('viewInsights'), practice: document.getElementById('viewPractice') };

    function switchView(target) {
        Object.values(views).forEach(v => v.style.display = 'none');
        Object.values(navs).forEach(n => n.classList.remove('active'));
        views[target].style.display = 'block';
        navs[target].classList.add('active');
        if (target === 'insights') renderInsights();
    }

    navs.scribble.addEventListener('click', (e) => { e.preventDefault(); switchView('scribble'); });
    navs.insights.addEventListener('click', (e) => { e.preventDefault(); switchView('insights'); });
    navs.practice.addEventListener('click', (e) => { e.preventDefault(); switchView('practice'); });

    // Journal
    const diaryForm = document.getElementById('diaryForm');
    const diaryInput = document.getElementById('diaryInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const moodChips = document.querySelectorAll('.mood-chip');
    const streakEl = document.getElementById('streakCount');
    const resultBox = document.getElementById('resultContainer');
    
    let activeMood = "";
    moodChips.forEach(chip => {
        chip.addEventListener('click', () => {
            moodChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeMood = chip.getAttribute('data-tag');
        });
    });

    streakEl.innerText = getStreak();

    diaryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = diaryInput.value.trim();
        if (!text) return;

        analyzeBtn.innerText = 'Preserving...';
        analyzeBtn.disabled = true;

        setTimeout(() => {
            const context = activeMood ? `[State: ${activeMood}] ${text}` : text;
            const { score, mood } = analyzeSentiment(context);
            saveEntry(context, score, mood);
            
            document.getElementById('moodBadge').innerText = `State: ${mood}`;
            document.getElementById('aiAdvice').innerText = getInsightAdvice(mood);
            resultBox.style.display = 'block';
            
            diaryInput.value = '';
            moodChips.forEach(c => c.classList.remove('active'));
            activeMood = "";
            streakEl.innerText = getStreak();
            analyzeBtn.innerText = 'Preserve Reflection';
            analyzeBtn.disabled = false;
        }, 1200);
    });

    // Zen
    const startBtn = document.getElementById('startBreatheBtn');
    const circle = document.getElementById('breatheCircle');
    const txt = document.getElementById('breatheText');
    let zenMode = false;

    startBtn.addEventListener('click', () => {
        if (zenMode) { zenMode = false; startBtn.innerText = 'Begin Breathing'; txt.innerText = 'Ready'; circle.style.transform = 'scale(1)'; return; }
        zenMode = true; startBtn.innerText = 'Stop Session'; cycleZen();
    });

    function cycleZen() {
        if (!zenMode) return;
        txt.innerText = 'Inhale'; circle.style.transform = 'scale(1.4)';
        setTimeout(() => {
            if (!zenMode) return;
            txt.innerText = 'Hold';
            setTimeout(() => {
                if (!zenMode) return;
                txt.innerText = 'Exhale'; circle.style.transform = 'scale(1)';
                setTimeout(cycleZen, 4000);
            }, 2000);
        }, 4000);
    }

    // Chart
    let chart = null;
    function renderInsights() {
        const entries = getEntries().slice(-7);
        const ctx = document.getElementById('moodChart').getContext('2d');
        if (chart) chart.destroy();
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: entries.map(e => new Date(e.date).toLocaleDateString()),
                datasets: [{ data: entries.map(e => e.score), borderColor: '#A78BFF', tension: 0.4, fill: false, pointRadius: 4 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { min: -1, max: 1, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { display: false } },
                    x: { grid: { display: false }, ticks: { color: '#666' } }
                },
                plugins: { legend: { display: false } }
            }
        });

        const history = document.getElementById('historyContainer');
        history.innerHTML = '<h2 class="serif-italic" style="margin-top: 4rem; margin-bottom: 2rem;">Archives</h2>';
        entries.reverse().forEach(e => {
            const card = document.createElement('div');
            card.className = 'bento-card'; card.style.marginBottom = '1.5rem'; card.style.padding = '2rem';
            card.innerHTML = `<p style="color: var(--primary); font-size: 0.8rem; margin-bottom: 0.5rem;">${new Date(e.date).toLocaleString()}</p><p style="opacity: 0.7;">"${e.text}"</p>`;
            history.appendChild(card);
        });
    }
});
