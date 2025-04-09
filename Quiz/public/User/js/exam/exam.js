let timer;
let elapsedSeconds = 0;
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = [];  // Lưu câu trả lời của người dùng
let allAnswersDisabled = [];  // Lưu trạng thái disabled của tất cả các đáp án trong mỗi câu
let correctAnswersCount = 0;  // Biến lưu số câu đúng
let isNavigation=false;
//Lấy thông tin câu hỏi và đáp án
async function fetchQuestions() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Token không tồn tại. Vui lòng đăng nhập.');
            return;
        }
        const topicId = document.getElementById('topic-name-exam').getAttribute('data-topic-id');
        const response = await fetch(`/api/question/quesintest/${topicId}`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
        const result = await response.json();
        if (result.success && result.data.length > 0) { // Kiểm tra có dữ liệu
            console.log(result.data); // Debug
            questions = result.data;
            updateQuestion(); // Load câu hỏi đầu tiên
            createQuestionButtons(); // Tạo danh sách nút số
            updateNavButtons(); // Cập nhật nút điều hướng
        } else {
            console.error('Không có câu hỏi nào:', result.message);
        }   
    } catch (error) {
        console.error('Lỗi khi tải câu hỏi:', error);
    }
}
//Hiển thị thông tin từng câu hỏi theo chỉ số
function updateQuestion() {
    const currentQuestion = questions[currentQuestionIndex];
    document.getElementById('topic-name-exam').textContent = `${currentQuestion.de.tende}`;
    document.getElementById('question-number').textContent = `Câu ${currentQuestionIndex + 1}:`;
    document.getElementById('question-text').innerHTML = `<p style="margin:0;">${currentQuestion.cauhoi}</p>`;
    
    const optionsHtml = currentQuestion.answers
        .map((answer, index) => 
            `<label>
                <input type="radio" name="answer" value="${index}" data-check="${answer.checkdapan}">
                ${answer.noidung}
            </label>`
        ).join('');
    document.getElementById('answer-options').innerHTML = optionsHtml;
    
    updateQuestionList(); // Highlight nút số tương ứng
    updateNavButtons(); // Cập nhật nút điều hướng
    updateUserChoice(); // Gắn lại sự kiện cho câu hỏi mới
    applySavedAnswer();
    applyAllAnswersDisabled(); // Vô hiệu hóa tất cả các đáp án đã chọn
}
//tạo các nút câu hỏi
function createQuestionButtons() {
    const questionList = document.getElementById('question-list');
    questionList.innerHTML = ''; // Xóa các nút cũ

    questions.forEach((_, index) => {
        const button = document.createElement('button');
        button.textContent = index + 1;
        button.classList.toggle('active', index === currentQuestionIndex);
        button.addEventListener('click', () => {
            currentQuestionIndex = index;
            updateQuestion();
        });
        questionList.appendChild(button);
    });
}
//highlight nút câu hỏi hiện tại
function updateQuestionList() {
    const buttons = document.querySelectorAll('.question-list button');
    buttons.forEach((button, index) => {
        button.classList.toggle('active', index === currentQuestionIndex);
    });
}
//kiểm tra trạng thái disabled của 2 nút chuyển
function updateNavButtons() {
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');

    prevButton.disabled = currentQuestionIndex === 0;
    nextButton.disabled = currentQuestionIndex === questions.length - 1;
}

document.getElementById('prev-button').addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        updateQuestion();
    }
});

document.getElementById('next-button').addEventListener('click', () => {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        updateQuestion();
    }
});
//lấy thông tin chế độ trên url
const mode= new URLSearchParams(window.location.search).get('chedo');
// Hàm khởi tạo chế độ và bắt đầu đồng hồ
function startTimer() {
    clearInterval(timer); // Xóa bất kỳ timer nào trước đó
    if (mode === 'practice') {
        // Chế độ ôn tập (thời gian tự tăng)
        document.getElementById('mode-test').innerHTML = `<strong>Chế độ:</strong> Ôn thi`;
        elapsedSeconds = 0; // Khởi tạo lại
        updateTimerDisplay(elapsedSeconds);
        timer = setInterval(() => {
            elapsedSeconds++;
            updateTimerDisplay(elapsedSeconds);
        }, 1000);
    } else if (mode === 'exam') {
        // Chế độ thi thử (đếm ngược)
        document.getElementById('mode-test').innerHTML = `<strong>Chế độ:</strong> Thi thử`;
        elapsedSeconds = 3600; // Đặt thời gian đếm ngược
        updateTimerDisplay(elapsedSeconds);
        timer = setInterval(() => {
            if (elapsedSeconds <= 0) {
                updateTimerDisplay(0);
                showResult(mode,10);
            } else{
                elapsedSeconds--;
                updateTimerDisplay(elapsedSeconds);
            }
        }, 1000);
    }
}
// Hàm hiển thị thời gian
function updateTimerDisplay(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    document.getElementById('time-display').textContent = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
//Lưu trữ đáp án người dùng chọn và thêm hiệu ứng đúng sai,không được phép chọn lại nữa
function updateUserChoice() {
    const answerOptions = document.querySelectorAll('input[name="answer"]');

    // Đảm bảo trạng thái disabled chỉ được đặt nếu chưa áp dụng từ trước
    if (!allAnswersDisabled[currentQuestionIndex]) {
        answerOptions.forEach(option => {
            option.addEventListener('change', (event) => {
                const selectedAnswer = event.target;
                const isCorrect = selectedAnswer.getAttribute('data-check') === 'true';

                // Lưu đáp án đã chọn
                userAnswers[currentQuestionIndex] = {
                    answer: selectedAnswer.value,
                    isCorrect: isCorrect,
                    correctAnswer: Array.from(answerOptions).find(opt => opt.getAttribute('data-check') === 'true').value
                };

                if (isCorrect) {
                    correctAnswersCount++;
                }

                // Đặt trạng thái disabled và màu nền
                answerOptions.forEach(option => {
                    const label = option.parentElement;
                    option.disabled = true;

                    if (option === selectedAnswer) {
                        label.classList.add(isCorrect ? 'correct-answer' : 'incorrect-answer');
                    } else if (!isCorrect && option.getAttribute('data-check') === 'true') {
                        label.classList.add('correct-answer');
                    }
                });

                // Đánh dấu trạng thái disabled
                allAnswersDisabled[currentQuestionIndex] = true;
            });
        });
    }
}

// Áp dụng câu trả lời đã lưu khi chuyển câu hỏi
function applySavedAnswer() {
    const savedAnswer = userAnswers[currentQuestionIndex];
    if (savedAnswer) {
        const answerOptions = document.querySelectorAll('input[name="answer"]');
        answerOptions.forEach(option => {
            const label = option.parentElement;

            // Đánh dấu đáp án đã chọn
            if (option.value === savedAnswer.answer) {
                option.checked = true;
                const isCorrect = savedAnswer.isCorrect;

                if (isCorrect) {
                    label.classList.add('correct-answer');
                } else {
                    label.classList.add('incorrect-answer');
                }
                option.disabled = true;
            }

            // Đánh dấu đáp án đúng nếu đáp án đã chọn sai
            if (!savedAnswer.isCorrect && option.value === savedAnswer.correctAnswer) {
                label.classList.add('correct-answer');
            }
        });
    }
}

// Áp dụng trạng thái disabled cho tất cả các đáp án trong câu hỏi
function applyAllAnswersDisabled() {
    const answerOptions = document.querySelectorAll('input[name="answer"]');
    const isDisabled = allAnswersDisabled[currentQuestionIndex];

    // Vô hiệu hóa tất cả các đáp án nếu trạng thái disabled đã được lưu
    if (isDisabled) {
        answerOptions.forEach(option => {
            option.disabled = true;
        });
    }
}
// Hàm chuyển đổi thời gian sang định dạng giờ, phút, giây
function convertTime(elapsedSeconds) {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    // Tạo mảng để lưu các phần giờ, phút, giây
    const timeParts = [];
    // Nếu có giờ, thêm vào mảng
    if (hours > 0) {
        timeParts.push(`${hours} giờ`);
    }
    // Nếu có phút, thêm vào mảng
    if (minutes > 0) {
        timeParts.push(`${minutes} phút`);
    }
    // Thêm giây vào mảng (luôn có nếu elapsedSeconds > 0)
    if (seconds > 0 || (hours === 0 && minutes === 0)) {
        timeParts.push(`${seconds} giây`);
    }
    // Kết hợp các phần với dấu cách
    return timeParts.join(' ');
}
//Thêm và hiển thị kết quả ra màn hình
async function showResult(mode, time) {
    // Tính điểm theo công thức
    const totalQuestions = questions.length;
    const score = (10 / totalQuestions) * correctAnswersCount;
    // Lưu giá trị thời gian hiện tại
    const finalTime = elapsedSeconds;
    // Chuyển đổi thời gian và hiển thị theo chế độ
    let timeSpent;
    if (mode === 'practice') {
        // Chế độ ôn thi: hiển thị tổng thời gian đã làm
        timeSpent = convertTime(finalTime);
    } else if (mode === 'exam') {
        // Chế độ thi thử: tính thời gian làm bài = thời gian gốc - thời gian hiện tại
        timeSpent = convertTime(time - finalTime);
    }
    clearInterval(timer);
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Token không tồn tại. Vui lòng đăng nhập.');
            return;
        }
        const topicId = document.getElementById('topic-name-exam').getAttribute('data-topic-id');
        const response = await fetch(`/api/result/addres/${topicId}`, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + token
                            },
                            body: JSON.stringify({ diemso: score, socaudung: correctAnswersCount, socausai:totalQuestions-correctAnswersCount,
                            thoigianlambai:timeSpent})
            });
        const result = await response.json();
        console.log(result.success);
        console.log(result.data);
        if (result.success && result.data) { 
        // Cập nhật nội dung modal
        const resultMessage = `
        Bạn đã hoàn thành bài thi ngày ${result.data.thoigianhoanthanhbaithi}.<br>
        <br>Thời gian hoàn thành bài thi là: ${timeSpent}.<br>
        <br>Bạn đã trả lời đúng: ${correctAnswersCount}/${totalQuestions} câu.<br>
        <br>Điểm của bạn là: ${score.toFixed(2)}.<br>
        <br>Xếp loại: ${result.data.xeploai}.
         `;
        document.getElementById('result-message').innerHTML = resultMessage;
        // Hiển thị modal
        const modal = document.getElementById('resultModal');
         modal.style.display = 'block';
        }
    } catch (error) {
        console.error('Lỗi khi thêm kết quả:', error);
    }
}
// Thực hiện khi người dùng nhấn "Nộp bài"
document.getElementById('submit-button').addEventListener('click', () => {
    const Timeexam = 3600;
    showResult(mode,Timeexam);  // Tính điểm khi người dùng nhấn "Nộp bài"
});

document.getElementById('test-again-button').addEventListener('click', () => {
    isNavigation=true;
    window.location.href=`/user/exam?chedo=${mode}`;
});
document.getElementById('complete-button').addEventListener('click', () => {
        isNavigation=true;
        const topicId = document.getElementById('topic-name-exam').getAttribute('data-topic-id');
        window.location.href=`/user/detailtopic/${topicId}`;
});
document.getElementById('back-button').addEventListener('click', () => {
    isNavigation=false;
    const topicId = document.getElementById('topic-name-exam').getAttribute('data-topic-id');
    window.location.href=`/user/detailtopic/${topicId}`;
});

// Khi trang tải xong, gọi API và bắt đầu đồng hồ
fetchQuestions();
startTimer();

// Ngăn không cho trang tải lại
window.addEventListener('beforeunload', (event) => {
    if(!isNavigation){
    event.preventDefault();
    }
});
// Ngăn sao chép và chọn văn bản
// Ngăn chọn văn bản
document.addEventListener('selectstart', (e) => {
    e.preventDefault(); // Chặn hành động chọn
  });
  
  // Ngăn chuột phải
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Chặn menu chuột phải
  });
  
  // Ngăn sao chép
  document.addEventListener('copy', (e) => {
    e.preventDefault(); // Chặn sao chép
    alert('Sao chép bị vô hiệu hóa!');
  });