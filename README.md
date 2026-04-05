# Street Light Base

Street Light Base is a web application developed to help the agency proactively detect and document damaged streetlight bases to support the DOT’s mission of maintaining public safety. Currently, detection of damage relies on 311 reports of missing damages. To address those issues, Street Systems will gamify the data collection of streetlight base damage, transforming the reporting process into an engaging experience through leaderboards and challenges. By providing rewards for the process of collecting data, more people will be inclined to report damaged street light bases.  

## Features
- User Registration and Login
- Home Page
- Report Submission
- View Personal Reports
- Leaderboard 
- Challenges and Achievements
- DOT analytics Dashboard 
- View All Reports (DOT ONLY)

## Tech Stack
- Frontend: React.JS , Vanilla CSS
- Backend: Python (Flask)
- Database: PostgreSql

## Architecture
Frontend (React) → Backend (Flask) → Database (PostgreSQL)

## Getting Started

## Environment Variables

This project uses environment variables for configuration (e.g., database connection, API keys).  

A `.env` file is required but is not included in the repository for security reasons.  
The `.env` file will be provided separately.

### Run this project
```bash
cd Frontend 
npm install 
npm run dev

cd Backend
python app.py
