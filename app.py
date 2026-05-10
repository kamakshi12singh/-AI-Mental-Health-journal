import streamlit as st
import pandas as pd
import database as db
import sentiment as sent

# Set page configuration parameters
st.set_page_config(
    page_title="Serenity | AI Mental Health Companion",
    page_icon="🌿",
    layout="wide"
)

# Custom CSS for a Premium, Startup-like look
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }
    
    .main {
        background-color: #f8f9fa;
    }
    
    .stButton>button {
        width: 100%;
        border-radius: 12px;
        height: 3em;
        background-color: #4CAF50;
        color: white;
        font-weight: 600;
        border: none;
        transition: all 0.3s ease;
    }
    
    .stButton>button:hover {
        background-color: #45a049;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .stTextArea>div>div>textarea {
        border-radius: 12px;
        padding: 15px;
    }
    
    .sidebar .sidebar-content {
        background-image: linear-gradient(#2e7d32,#1b5e20);
        color: white;
    }
    
    .metric-container {
        background-color: white;
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        margin-bottom: 20px;
    }
    
    h1, h2, h3 {
        color: #1e293b;
    }
    
    .advice-box {
        background-color: #e8f5e9;
        border-left: 5px solid #4caf50;
        padding: 20px;
        border-radius: 8px;
        margin-top: 20px;
    }
    
    </style>
    """, unsafe_allow_html=True)

# Initialize database on app startup
db.init_db()

def render_sidebar():
    """Renders the consistent sidebar navigation."""
    with st.sidebar:
        st.markdown("<h1 style='text-align: center; color: #2e7d32;'>🌿 Serenity</h1>", unsafe_allow_html=True)
        st.markdown("<p style='text-align: center;'>Your AI-powered mental health space.</p>", unsafe_allow_html=True)
        st.write("---")
        
        mode = st.radio("Explore", ["📝 Daily Journal", "📊 Mood Insights", "🌱 Resources"])
        
        st.write("---")
        # Display Current Streak in Sidebar
        streak = db.get_streak()
        st.metric(label="Healing Streak 🔥", value=f"{streak} days")
        
        st.write("---")
        st.caption("Crafted with ❤️ for your well-being.")
        
        return mode

def write_entry_page():
    """Renders the Diary Input logic and UI."""
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.title("How are you, really? ✨")
        st.markdown("Writing down your thoughts is the first step toward clarity. Take your time.")
        
        # Form for text submission
        with st.form("diary_input_form", clear_on_submit=True):
            entry_text = st.text_area("Share your thoughts...", placeholder="Today I felt...", height=250)
            submitted = st.form_submit_button("Reflect & Analyze")
            
            if submitted:
                if entry_text.strip() == "":
                    st.warning("Please share a few words before we proceed.")
                else:
                    # 1. Analyze sentiment using VADER
                    score, mood = sent.analyze_mood(entry_text)
                    
                    # 2. Save to database
                    db.add_entry(entry_text, score, mood)
                    
                    # 3. Get advice based on mood
                    advice = sent.get_advice(mood)
                    
                    st.toast("Your reflection has been saved safely.", icon="✅")
                    
                    # Display Results
                    st.markdown("---")
                    mood_emoji = {"Positive": "😊", "Negative": "😔", "Neutral": "😐"}.get(mood, "🌱")
                    
                    st.subheader(f"Detected Vibe: {mood} {mood_emoji}")
                    
                    st.markdown(f"""
                    <div class="advice-box">
                        <strong>AI Reflection:</strong><br>
                        {advice}
                    </div>
                    """, unsafe_allow_html=True)

    with col2:
        st.markdown("<br><br>", unsafe_allow_html=True)
        st.image("https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", use_column_width=True, caption="Breathe in. Breathe out.")

def view_insights_page():
    """Renders the Data visualization part over past entries."""
    st.title("📊 Your Journey So Far")
    st.markdown("Visualizing your emotional landscape over time.")
    
    # Fetch Data
    entries = db.get_last_week_entries()
    
    if not entries:
        st.info("Your journey starts here. Write your first entry to see insights!")
        return
    
    # Convert DB rows to Pandas DataFrame
    df = pd.DataFrame(entries, columns=["Date", "Entry", "Sentiment_Score", "Mood"])
    df['Date'] = pd.to_datetime(df['Date'])
    df = df.sort_values(by="Date")
    
    # Metrics
    avg_score = df['Sentiment_Score'].mean()
    col1, col2, col3 = st.columns(3)
    col1.metric("Average Mood", f"{avg_score:.2f}")
    col2.metric("Entries this week", len(df))
    col3.metric("Primary Mood", df['Mood'].mode()[0])
    
    st.markdown("### Mood Trend")
    df.set_index('Date', inplace=True)
    st.line_chart(df[['Sentiment_Score']], use_container_width=True)
    
    st.markdown("### Reflection History")
    for date_idx, row in df.sort_values(by="Date", ascending=False).iterrows():
        with st.expander(f"{date_idx.date()} — {row['Mood']}"):
            st.write(f"**Vibe Score:** {row['Sentiment_Score']:.2f}")
            st.write(f"**What you wrote:** {row['Entry']}")

def resources_page():
    st.title("🌱 Gentle Reminders & Resources")
    st.markdown("""
    - **Mindfulness**: Try the 4-7-8 breathing technique.
    - **Connection**: Reach out to a friend today, even if it's just a text.
    - **Self-Care**: You deserve the same kindness you give to others.
    - **Professional Help**: If you're struggling, don't hesitate to reach out to a professional.
    """)

def main():
    mode = render_sidebar()
    if mode == "📝 Daily Journal":
        write_entry_page()
    elif mode == "📊 Mood Insights":
        view_insights_page()
    else:
        resources_page()

if __name__ == "__main__":
    main()
