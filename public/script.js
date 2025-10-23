let nickname = '';
let questions = [];
let currentIndex = 0;
let userAnswers = [];
let startTime = 0;
let timerInterval = null;

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(screenId).classList.remove('hidden');
}

async function loadRankings() {
  try {
    const res = await fetch('/api/rankings');
    if (!res.ok) throw new Error('Failed to fetch rankings');
    const rankings = await res.json();
    
    const list = document.getElementById('rankingList');
    if (!list) return;
    
    list.innerHTML = rankings.length === 0 
      ? '<div class="no-data">아직 기록이 없습니다</div>'
      : rankings.map((r, i) => `
          <div class="ranking-row">
            <div>${i + 1}위</div>
            <div>${r.nickname}</div>
            <div class="score">${r.score}점</div>
            <div>${r.correct}/15</div>
            <div>${r.time}초</div>
          </div>
        `).join('');
  } catch (err) {
    console.error('랭킹 로드 실패:', err);
    const list = document.getElementById('rankingList');
    if (list) list.innerHTML = '<div class="no-data">랭킹을 불러올 수 없습니다</div>';
  }
}

async function startQuiz() {
  nickname = document.getElementById('nicknameInput').value.trim();
  if (!nickname) {
    alert('닉네임을 입력하세요!');
    return;
  }
  
  try {
    const res = await fetch('/api/questions');
    questions = await res.json();
    userAnswers = new Array(15).fill(null);
    currentIndex = 0;
    startTime = Date.now();
    
    showScreen('quizScreen');
    displayQuestion();
    startTimer();
  } catch (err) {
    alert('문제 로드 실패!');
    console.error(err);
  }
}

function startTimer() {
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    document.getElementById('timer').textContent = 
      `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, 1000);
}

function displayQuestion() {
  if (!questions[currentIndex]) {
    console.error('No question at index:', currentIndex);
    return;
  }
  
  const q = questions[currentIndex];
  document.getElementById('current').textContent = currentIndex + 1;
  document.getElementById('question').textContent = q.question;
  
  const optionsEl = document.getElementById('options');
  optionsEl.innerHTML = q.options.map((opt, i) => `
    <div class="option ${userAnswers[currentIndex] === opt ? 'selected' : ''}" 
         onclick="selectOption(${i})">
      ${opt}
    </div>
  `).join('');
  
  updateButtons();
}

function selectOption(index) {
  userAnswers[currentIndex] = questions[currentIndex].options[index];
  displayQuestion();
}

function updateButtons() {
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');
  
  if (userAnswers[currentIndex] !== null) {
    if (currentIndex === 14) {
      nextBtn.classList.add('hidden');
      submitBtn.classList.remove('hidden');
    } else {
      nextBtn.classList.remove('hidden');
      submitBtn.classList.add('hidden');
    }
  } else {
    nextBtn.classList.add('hidden');
    submitBtn.classList.add('hidden');
  }
}

function nextQuestion() {
  if (currentIndex < 14) {
    currentIndex++;
    displayQuestion();
  }
}

function submitQuiz() {
  const unanswered = userAnswers.filter(a => a === null).length;
  if (unanswered > 0 && !confirm(`${unanswered}개 미응답. 제출할까요?`)) {
    return;
  }
  
  clearInterval(timerInterval);
  
  const correct = questions.filter((q, i) => userAnswers[i] === q.answer).length;
  const time = Math.floor((Date.now() - startTime) / 1000);
  const score = calculateScore(correct, time);
  
  document.getElementById('correctResult').textContent = `${correct} / 15`;
  document.getElementById('timeResult').textContent = `${Math.floor(time/60)}분 ${time%60}초`;
  document.getElementById('scoreResult').textContent = `${score}점`;
  
  window.quizResult = { correct, time, score };
  showScreen('resultScreen');
}

// 점수 계산 (5분 기준, 15문제)
function calculateScore(correct, time) {
  const baseScore = correct * 100;  // 정답당 100점
  const timeBonus = Math.max(0, 300 - time);  // 5분(300초) 기준 보너스
  return baseScore + timeBonus;
}

async function saveRanking() {
  const { correct, time, score } = window.quizResult;
  
  try {
    await fetch('/api/rankings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, score, correct, time })
    });
    alert('랭킹 등록 완료! 🎉');
    goHome();
  } catch (err) {
    alert('랭킹 저장 실패!');
    console.error(err);
  }
}

function goHome() {
  showScreen('loginScreen');
  loadRankings();
}

document.getElementById('nicknameInput')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') startQuiz();
});

loadRankings();
setInterval(loadRankings, 5000);
