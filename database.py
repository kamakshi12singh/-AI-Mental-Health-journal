import sqlite3
from datetime import datetime, date

DB_NAME = 'mood_diary.db'

def init_db():
    """Initializes the SQLite database with the diary_entries table if it doesn't exist."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS diary_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            entry_text TEXT NOT NULL,
            sentiment_score REAL NOT NULL,
            mood_label TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

def add_entry(entry_text, sentiment_score, mood_label):
    """Inserts a new diary entry into the database."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute('''
        INSERT INTO diary_entries (date, entry_text, sentiment_score, mood_label)
        VALUES (?, ?, ?, ?)
    ''', (date_str, entry_text, sentiment_score, mood_label))
    conn.commit()
    conn.close()

def get_last_week_entries():
    """Fetches up to 7 of the most recent diary entries."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT date, entry_text, sentiment_score, mood_label 
        FROM diary_entries 
        ORDER BY date DESC LIMIT 7
    ''')
    rows = cursor.fetchall()
    conn.close()
    return rows

def get_streak():
    """Calculates consecutive days the user has made entries (simple check)."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    # Distinct dates sorted descending
    cursor.execute('''
        SELECT DISTINCT substr(date, 1, 10) as day_date 
        FROM diary_entries 
        ORDER BY day_date DESC
    ''')
    dates = cursor.fetchall()
    conn.close()
    
    if not dates:
        return 0
        
    streak = 0
    current_date = date.today()
    
    # Simple streak logic: check if today or yesterday exists in DB, then go backward continuously.
    from datetime import timedelta
    
    first_db_day = datetime.strptime(dates[0][0], "%Y-%m-%d").date()
    if first_db_day == current_date or first_db_day == current_date - timedelta(days=1):
        streak += 1
        expected_next = first_db_day - timedelta(days=1)
        
        for p_date in dates[1:]:
            db_date = datetime.strptime(p_date[0], "%Y-%m-%d").date()
            if db_date == expected_next:
                streak += 1
                expected_next -= timedelta(days=1)
            else:
                break
    return streak
