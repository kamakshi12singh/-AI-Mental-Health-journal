from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

def analyze_mood(text):
    """
    Analyzes the sentiment of a given text using VADER.
    Returns a tuple of (sentiment_score, mood_label).
    """
    analyzer = SentimentIntensityAnalyzer()
    vs = analyzer.polarity_scores(text)
    score = vs['compound']
    
    if score >= 0.05:
        mood = "Positive"
    elif score <= -0.05:
        mood = "Negative"
    else:
        mood = "Neutral"
        
    return score, mood

def get_advice(mood):
    """
    Provides a simple rule-based advice based on the detected mood.
    """
    if mood == "Positive":
        return "That's wonderful! Keep up the great energy and try to spread some of that positivity around today."
    elif mood == "Negative":
        return "I'm sorry to hear you're feeling this way. Remember to be kind to yourself. Maybe try a short walk or some deep breathing?"
    else:
        return "Neutral is a good place to be. It's a steady base for your day. Take a moment to appreciate the calm."
