const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const QUESTIONS_FILE = path.join(__dirname, 'questions.json');

// Supabase 설정
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// Supabase에서 랭킹 가져오기
async function getRankings() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('Supabase not configured');
    return [];
  }
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rankings?select=*&order=score.desc,time.asc&limit=10`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch rankings');
    return await response.json();
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return [];
  }
}

// Supabase에 랭킹 저장
async function saveRanking(data) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('Supabase not configured');
    return false;
  }
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rankings`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error saving ranking:', error);
    return false;
  }
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

app.get('/api/rankings', async (req, res) => {
  try {
    const rankings = await getRankings();
    res.json(rankings);
  } catch (error) {
    console.error('Error loading rankings:', error);
    res.status(500).json({ error: 'Failed to load rankings' });
  }
});

app.post('/api/rankings', async (req, res) => {
  try {
    const { nickname, score, correct, time } = req.body;
    const saved = await saveRanking({
      nickname,
      score,
      correct,
      time,
      created_at: new Date().toISOString()
    });
    
    if (saved) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to save ranking' });
    }
  } catch (error) {
    console.error('Error saving ranking:', error);
    res.status(500).json({ error: 'Failed to save ranking' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('⚠️ Supabase not configured. Rankings will not persist!');
  } else {
    console.log('✅ Supabase configured');
  }
});
