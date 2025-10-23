let nickname = '';
let questions = [];
let currentIndex = 0;
let userAnswers = [];
let startTime = 0;
let timerInterval = null;

// 화면 전환
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(screenId).classList.remove('hidden');
}

// 랭킹 로드
async function loadRankings() {
  try {
    const res = await fetch('/api/rankings');
    const rankings = await res.json();
    
    const list = document.getElementById('rankingList');
    list.innerHTML = rankings.length === 0 
      ? '<div class="no-data">아직 기록이 없습니다</div>'
      : rankings.map((r, i) => `
          <div class="ranking-row">
            <div>${i + 1}위</div>
            <div>${r.nickname}</div>
            <div class="score">${r.score}점</div>
            <div>${r.correct}/30</div>
            <div>${r.time}초</div>
          </div>
        `).join('');
  } catch (err) {
    console.error('랭킹 로드 실패:', err);
  }
}

// 퀴즈 시작
async function startQuiz() {
  nickname = document.getElementById('nicknameInput').value.trim();
  if (!nickname) {
    alert('닉네임을 입력하세요!');
    return;
  }
  
  try {
    const res = await fetch('/api/questions');
    questions = await res.json();
    userAnswers = new Array(30).fill(null);
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

// 타이머
function startTimer() {
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    document.getElementById('timer').textContent = 
      `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, 1000);
}

// 문제 표시
function displayQuestion() {
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

// 선택지 선택
function selectOption(index) {
  userAnswers[currentIndex] = questions[currentIndex].options[index];
  displayQuestion();
}

// 버튼 상태
function updateButtons() {
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');
  
  if (userAnswers[currentIndex] !== null) {
    if (currentIndex === 29) {
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

// 다음 문제
function nextQuestion() {
  if (currentIndex < 29) {
    currentIndex++;
    displayQuestion();
  }
}

// 제출
function submitQuiz() {
  const unanswered = userAnswers.filter(a => a === null).length;
  if (unanswered > 0 && !confirm(`${unanswered}개 미응답. 제출할까요?`)) {
    return;
  }
  
  clearInterval(timerInterval);
  
  // 정답 계산
  const correct = questions.filter((q, i) => userAnswers[i] === q.answer).length;
  const time = Math.floor((Date.now() - startTime) / 1000);
  const score = calculateScore(correct, time);
  
  // 결과 표시
  document.getElementById('correctResult').textContent = `${correct} / 30`;
  document.getElementById('timeResult').textContent = `${Math.floor(time/60)}분 ${time%60}초`;
  document.getElementById('scoreResult').textContent = `${score}점`;
  
  window.quizResult = { correct, time, score };
  showScreen('resultScreen');
}

// 점수 계산 (무한 상승 가능)
function calculateScore(correct, time) {
  const baseScore = correct * 100;  // 정답당 100점
  const timeBonus = Math.max(0, 1800 - time);  // 30분 기준 보너스
  return baseScore + timeBonus;
}

// 랭킹 저장
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

// 홈으로
function goHome() {
  showScreen('loginScreen');
  loadRankings();
}

// Enter 키로 시작
document.getElementById('nicknameInput')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') startQuiz();
});

// 초기화
loadRankings();
setInterval(loadRankings, 5000);
