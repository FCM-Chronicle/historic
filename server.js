const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const RANKINGS_FILE = path.join(__dirname, 'rankings.json');
const QUESTIONS_FILE = path.join(__dirname, 'questions.json');

// rankings.json 초기화
if (!fs.existsSync(RANKINGS_FILE)) {
  fs.writeFileSync(RANKINGS_FILE, JSON.stringify([]));
  console.log('Created rankings.json');
}

app.get('/api/questions', (req, res) => {
  try {
    const questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf8'));
    const shuffled = questions.sort(() => 0.5 - Math.random()).slice(0, 15);
    res.json(shuffled);
  } catch (error) {
    console.error('Error loading questions:', error);
    res.status(500).json({ error: 'Failed to load questions' });
  }
});

app.get('/api/rankings', (req, res) => {
  try {
    const rankings = JSON.parse(fs.readFileSync(RANKINGS_FILE, 'utf8'));
    rankings.sort((a, b) => b.score !== a.score ? b.score - a.score : a.time - b.time);
    res.json(rankings.slice(0, 10));
  } catch (error) {
    console.error('Error loading rankings:', error);
    res.status(500).json({ error: 'Failed to load rankings' });
  }
});

app.post('/api/rankings', (req, res) => {
  try {
    const { nickname, score, correct, time } = req.body;
    const rankings = JSON.parse(fs.readFileSync(RANKINGS_FILE, 'utf8'));
    rankings.push({ nickname, score, correct, time, date: new Date().toISOString() });
    fs.writeFileSync(RANKINGS_FILE, JSON.stringify(rankings, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving ranking:', error);
    res.status(500).json({ error: 'Failed to save ranking' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
