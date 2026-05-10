import streamlit as st
import pandas as pd
import database as db
import sentiment as sent

# Set page configuration parameters
st.set_page_config(
    page_title="AI Mental Health Companion",
    page_icon="🌱",
    layout="centered"
)

# Initialize database on app startup
db.init_db()

def render_sidebar():
    """Renders the consistent sidebar navigation."""
    with st.sidebar:
        st.title("🌱 Companion App")
        st.markdown("Your minimalist mental health assistant.")
        st.write("---")
        mode = st.radio("Navigation", ["📝 Write Entry", "📊 View Insights"])
        
        # Display Current Streak in Sidebar
        streak = db.get_streak()
        st.write("---")
        st.metric(label="Your Streak 🔥", value=f"{streak} days")
        
        return mode

def write_entry_page():
    """Renders the Diary Input logic and UI."""
    st.title("What's on your mind today?")
    st.markdown("Take a deep breath and tell me about your day. I am here to listen. 💙")
    
    # Form for text submission
    with st.form("diary_input_form"):
        entry_text = st.text_area("Write your diary entry here (try to be as detailed as you like):", height=200)
        submitted = st.form_submit_button("Analyze Mood ✨")
        
        if submitted:
            if entry_text.strip() == "":
                st.warning("Please write something before analyzing!")
            else:
                # 1. Analyze sentiment using VADER
                score, mood = sent.analyze_mood(entry_text)
                
                # 2. Save to database
                db.add_entry(entry_text, score, mood)
                
                # 3. Get advice based on mood
                advice = sent.get_advice(mood)
                
                st.success("Entry saved successfully!")
                
                # Display Results in a stylized container
                if mood == "Positive":
                    color = "success"
                    emoji = "😊"
                elif mood == "Negative":
                    color = "error"
                    emoji = "😔"
                else: # Neutral
                    color = "info"
                    emoji = "😐"
                
                # Using Streamlit callouts (success/error/info) to emulate colored containers
                if color == "success":
                    st.success(f"**Detected Mood:** Positive {emoji}")
                elif color == "error":
                    st.error(f"**Detected Mood:** Negative {emoji}")
                else:
                    st.info(f"**Detected Mood:** Neutral {emoji}")
                
                st.markdown("### Simple AI Advice 💡")
                st.markdown(f"> *{advice}*")


def view_insights_page():
    """Renders the Data visualization part over past entries."""
    st.title("📊 Your Weekly Mood Insights")
    st.markdown("Review your mood trends over the last few entries.")
    
    # Fetch Data
    entries = db.get_last_week_entries()
    
    if not entries:
        st.info("No entries yet! Please write a new entry first to see insights.")
        return
    
    # Convert DB rows to Pandas DataFrame for easier visualization
    df = pd.DataFrame(entries, columns=["Date", "Entry", "Sentiment_Score", "Mood"])
    
    # Ensure Date is simple datetime. We sort values to ensure chrono order plotting.
    df['Date'] = pd.to_datetime(df['Date'])
    df = df.sort_values(by="Date")
    
    # Plotting using native Streamlit line chart
    # Create an index with brief string representation for chart labels
    df.set_index('Date', inplace=True)
    st.markdown("### Mood Trend (Last 7 entries)")
    st.caption("Score scale: -1 (Negative) to +1 (Positive)")
    
    # We display a line chart mapping over the sentiment scores
    st.line_chart(df[['Sentiment_Score']], use_container_width=True)
    
    # Show history of recent raw text if they want to peek back
    st.markdown("### Recent Entries History")
    for date_idx, row in df.sort_values(by="Date", ascending=False).iterrows():
        with st.expander(f"{date_idx.date()} - Mood: {row['Mood']}"):
            st.write(f"**Score:** {row['Sentiment_Score']:.2f}")
            st.write(f"**Text:** {row['Entry']}")

def main():
    mode = render_sidebar()
    if mode == "📝 Write Entry":
        write_entry_page()
    else:
        view_insights_page()

if __name__ == "__main__":
    main()
