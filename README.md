# 🌿 Serenity | AI Mental Health Companion

A premium, modern AI-powered mental health journaling experience built with Streamlit.

[![Streamlit App](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://share.streamlit.io/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/kamakshi12singh/-AI-Mental-Health-journal)

## ✨ Features
- **Premium UI**: Modern, responsive design with custom CSS and Inter typography.
- **AI Mood Analysis**: Real-time sentiment analysis using VADER.
- **Personal Insights**: Weekly mood tracking and data visualization.
- **Healing Streak**: Track your consistency in mindfulness.
- **Privacy-First**: Simple SQLite database to keep your reflections organized.

## 🚀 Deployment Guide

### Option 1: Streamlit Community Cloud (Recommended)
1. Fork this repository to your GitHub account.
2. Go to [share.streamlit.io](https://share.streamlit.io/).
3. Click **New app**, select this repository and `app.py` as the main file.
4. Click **Deploy**!

### Option 2: Render.com
1. Create a new **Web Service** on Render.
2. Connect this GitHub repository.
3. Render will automatically detect the `render.yaml` and configure the build/start commands.
4. Set the `PYTHON_VERSION` environment variable to `3.9.0` (included in `render.yaml`).

## 🛠️ Local Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/kamakshi12singh/-AI-Mental-Health-journal.git
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Launch the app:
   ```bash
   streamlit run app.py
   ```

---
*Created for clarity and peace of mind.*
