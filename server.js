const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const RANKINGS_FILE = './rankings.json';

// 랭킹 파일 초기화
if (!fs.existsSync(RANKINGS_FILE)) {
  fs.writeFileSync(RANKINGS_FILE, JSON.stringify([]));
}

// 30개 랜덤 문제 가져오기
app.get('/api/questions', (req, res) => {
  const questions = JSON.parse(fs.readFileSync('./questions.json', 'utf8'));
  const shuffled = questions.sort(() => 0.5 - Math.random()).slice(0, 30);
  res.json(shuffled);
});

// 랭킹 조회 (TOP 10)
app.get('/api/rankings', (req, res) => {
  const rankings = JSON.parse(fs.readFileSync(RANKINGS_FILE, 'utf8'));
  rankings.sort((a, b) => b.score !== a.score ? b.score - a.score : a.time - b.time);
  res.json(rankings.slice(0, 10));
});

// 랭킹 등록
app.post('/api/rankings', (req, res) => {
  const { nickname, score, correct, time } = req.body;
  
  const rankings = JSON.parse(fs.readFileSync(RANKINGS_FILE, 'utf8'));
  rankings.push({ nickname, score, correct, time, date: new Date().toISOString() });
  fs.writeFileSync(RANKINGS_FILE, JSON.stringify(rankings, null, 2));
  
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
