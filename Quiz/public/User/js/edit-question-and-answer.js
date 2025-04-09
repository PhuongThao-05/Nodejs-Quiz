let questionCount = 0; // Đếm số câu hỏi
let macauhoi=null;//Lưu trữ mã câu hỏi khi sửa và xóa

function initializeSummernote() {
    $('.summernote').each(function() {
        var $this = $(this);
        var placeholderText = $this.attr('data-placeholder'); // Lấy đúng placeholder cho từng phần tử

        $this.summernote({
            height: 100,
            toolbar: [
                ['heading', ['style', 'h1', 'h2', 'h3']],
                ['style', ['bold', 'italic', 'underline', 'clear']],
                ['font', ['fontname', 'fontsize']],
                ['color', ['forecolor']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['insert', ['link']]
            ],
            fontNames: ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'],
            fontNamesIgnoreCheck: ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'],
            fontSize: 14,
            callbacks: {
                onInit: function() {
                    var $placeholder = $('<div class="note-placeholder">' + placeholderText + '</div>');
                    $this.parent().find('.note-editor').append($placeholder);

                    if ($this.summernote('isEmpty')) {
                        $placeholder.show();
                    } else {
                        $placeholder.hide();
                    }

                    $placeholder.on('click', function() {
                        $this.summernote('focus');
                        $placeholder.hide();
                    });

                    $this.on('summernote.change', function() {
                        if ($this.summernote('isEmpty')) {
                            $placeholder.show();
                        } else {
                            $placeholder.hide();
                        }
                    });
                }
            }
        });
    });
}

// Gọi hàm khi tài liệu đã tải xong
$(document).ready(function() {
    initializeSummernote();
});

//Cập nhật lại số thứ tự đáp án
function updateAnswerNumbers() {
    const answerItems = document.querySelectorAll('.answer-item');
    answerItems.forEach((item, index) => {
        const label = item.querySelector('label');
        if (label) {
            label.textContent = `Đáp án ${index + 1}`;
        }
    });
}
// Gán sự kiện cho nút xóa đáp án thông qua delegation
document.addEventListener('click', async function(event) {
    if (event.target.classList.contains('del-answer')) {
        const answerItem = event.target.closest('.answer-item');
        if (answerItem) {
            const textarea = answerItem.querySelector('.answer-content');
            const answerId = textarea ? textarea.getAttribute('data-id-answer') : null;
            if (typeof macauhoi !== 'undefined' && macauhoi !== null) {
            const token = localStorage.getItem('token');
            try {
            const response = await fetch(`/api/answer/lstans/${answerId}`, {
            method: 'DELETE',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
            }
        });
            const data = await response.json();
            if (data.success) {
                showNotification('Xóa đáp án thành công',true);
                document.getElementById('deleteQuestionButton').disabled =false;
                document.getElementById('saveQuestionButton').style.display = 'none';
                document.getElementById('updateQuestionButton').style.display = 'block';
                clearQuestions();
                loadQuestionData(macauhoi); 
                } else {
                    showNotification('Lỗi khi xóa thông tin câu hỏi: ' + data.message,false);
                }
            } catch (error) {
                console.error('Error fetching question data:', error);
                showNotification('Đã xảy ra lỗi khi tải thông tin câu hỏi.',false);
            }
        } else {
            // Nếu chưa chọn câu hỏi, chỉ xóa trên giao diện
            answerItem.remove();
            updateAnswerNumbers(); // Cập nhật số thứ tự sau khi xóa
        }
    }
}});

//Thêm nút câu hỏi
document.querySelector(".btn-createnewques").addEventListener("click", function () {
const form = document.querySelector("#form-ques-ans");
const answerCount = form.querySelectorAll(".form-group.answer-item").length + 1;// Đếm số lượng đáp án hiện có
const newAnswerHTML = `
    <div class="form-group answer-item">
        <div class="form-addans">
            <div class="form-check">
                <input type="radio" class="form-check-input" style="margin-left: auto;" name="dapan" id="answer${answerCount}">
                <label class="form-check-label text-editques" for="answer${answerCount}">Đáp án ${answerCount}</label>
            </div>
            <button type="button" class="del-answer">Xoá đáp án</button>
        </div>
        <textarea class="summernote answer-content" name="data" data-placeholder="Nhập nội dung đáp án" required></textarea>
    </div>
`;
const addsaveButton = form.querySelector("#createnewques");
addsaveButton.insertAdjacentHTML("beforebegin", newAnswerHTML);
initializeSummernote();
});

// Hàm để sinh ra các đáp án
function generateAnswers(answerCount) {
const form = document.querySelector("#form-ques-ans");
// Xóa tất cả đáp án cũ
const existingAnswers = form.querySelectorAll(".form-group.answer-item");
existingAnswers.forEach(answer => answer.remove());
// Tạo đáp án mới
for (let i = 1; i <= answerCount; i++) {
    const newAnswerHTML = `
        <div class="form-group answer-item">
        <div class="form-addans">
            <div class="form-check">
                <input type="radio" class="form-check-input" style="margin-left: auto;" name="dapan" id="answer${i}">
                <label class="form-check-label text-editques" for="answer${i}">Đáp án ${i}</label>
            </div>
            <button type="button" class="del-answer">Xoá đáp án</button>
        </div>
        <textarea class="summernote answer-content" name="data" data-placeholder="Nhập nội dung đáp án" required></textarea>
    </div>
    `;

    const addsaveButton = form.querySelector("#createnewques");
    addsaveButton.insertAdjacentHTML("beforebegin", newAnswerHTML);
}
// Áp dụng Summernote cho các textarea mới
initializeSummernote();
}
//Xóa dữ liệu hiển tại để thực hiện chức năng thêm
function ResetData(){
    $(document.querySelector('textarea[name="data-question"]')).summernote('code','');

    let answerElements = document.querySelectorAll('.answer-content');
    let radios = document.querySelectorAll('input[name="dapan"]'); 
            // Reset đáp án
    answerElements.forEach((element, index) => {
        element.value = ''; // Xóa giá trị cũ
        radios[index].checked = false; // Bỏ chọn tất cả radio
    });
    generateAnswers(4);
    const buttons = document.querySelectorAll('.btn-activeques');
    buttons.forEach(button => button.classList.remove('btn-activeques'));
    document.getElementById('deleteQuestionButton').disabled =true;
    document.getElementById('saveQuestionButton').style.display = 'block';
    document.getElementById('updateQuestionButton').style.display = 'none';
}
//Xóa giao diện hiện có của các nút và reset lại từ đầu
function clearQuestions() {
    const container = document.getElementById('question-container');
    container.innerHTML = ''; // Xóa tất cả nội dung trong container
    questionCount = 0; // Đặt lại bộ đếm câu hỏi
    localStorage.removeItem('questions');
    loadQuestions();
}
            // Hàm để lưu câu hỏi vào local storage
            function saveQuestion(id) {
                let questions = JSON.parse(localStorage.getItem('questions')) || [];
                questions.push({id});
                localStorage.setItem('questions', JSON.stringify(questions));
            }
            function addQuestion(questionId) {
                questionCount++;               
                // Tạo HTML cho nút câu hỏi
                const buttonHtml = `
                        <button class="btn btn-question" data-questionId="${questionId}">
                            ${questionCount}
                        </button>`;
                // Thêm nút vào container
                document.getElementById('question-container').insertAdjacentHTML('beforeend', buttonHtml);               
            }
            //Nếu sửa câu hỏi từ nút sửa câu hỏi ở trang topic
            function getTopicIdFromUrl() {
            const pathSegments = window.location.pathname.split('/');
            return pathSegments[pathSegments.length - 1]; // lấy ID là phần cuối của URL
            }

            // Hàm để tải lại các câu hỏi từ local storage
            async function loadQuestions() {
                const questions = JSON.parse(localStorage.getItem('questions')) || [];
                if (questions.length > 0) {
                    questions.forEach((question) => {
                    // Gọi hàm để thêm câu hỏi
                    addQuestion(question.id);
                });
                } 
                else {
                // Nếu không có, tải từ server
                const token = localStorage.getItem('token');
                let topicId=null;
                topicId = getTopicIdFromUrl();
                console.log("Giá trị trả về từ URL:", topicId);

                // Kiểm tra xem giá trị trả về có phải là số không
                let topicIdNumber = Number(topicId); // chuyển thành số

                if (isNaN(topicIdNumber)) {
                    if (localStorage.getItem('createdExamId')) {
                        topicIdNumber = localStorage.getItem('createdExamId');
                    } else {
                        return;
                    }
                } else if (!Number.isInteger(topicIdNumber)) {
                    console.log("Giá trị là số nhưng không phải số nguyên:", topicId);
                } else {
                    console.log("Giá trị là số nguyên:", topicIdNumber);
                }
               
                try {
                const response = await fetch(`/api/de/topicwithques/${topicIdNumber}`, {
                                                    method: 'GET',
                                                    headers: { 
                                                        'Content-Type': 'application/json',
                                                    'Authorization': 'Bearer ' + token
                                                    }
                                                });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            const questions = data.data.codequestion; // Thay đổi theo cấu trúc của dữ liệu bạn nhận được
            // Lưu vào localStorage
            localStorage.setItem('questions', JSON.stringify(questions));
            // Thêm câu hỏi
            questions.forEach((question) => {
                console.log(question.id);
                addQuestion(question.id);
            });
        } catch (error) {
            console.error('Error loading questions from server:', error);
        }
    }
}
//Load lại khi trang được load
            window.addEventListener('load', () => {
            loadQuestions();
            });
//Thêm câu hỏi và đáp án của câu hỏi đó
document.getElementById('saveQuestionButton').addEventListener('click', async function () {
    const textareaContent = document.querySelector('textarea[name="data-question"]').value;
    const questionContent = textareaContent.replace(/<\/?[^>]+(>|$)/g, "");
    if (!questionContent.trim()) {
        showNotification("Vui lòng nhập nội dung câu hỏi",false);
        return;
    }
        // Thêm các đáp án
        const answerElements = document.querySelectorAll('.answer-content');
        const selectedAnswer = document.querySelector("input[type='radio']:checked");
        let isAnswerEmpty = false;
        answerElements.forEach((answer) => {
            if (!answer.value.trim()) {
                isAnswerEmpty = true;
            }
        });

        if (isAnswerEmpty) {
            showNotification("Vui lòng nhập đầy đủ nội dung các đáp án",false);
            return;
        }
        if (!selectedAnswer) {
            showNotification("Vui lòng chọn đáp án đúng cho câu hỏi",false);
            return;
        }
    const token = localStorage.getItem('token');
    let deId=null;
    if(localStorage.getItem('createdExamId'))
    {
        deId = localStorage.getItem('createdExamId');//thêm nếu khi vừa tạo đề xong
    }
    else
    {
        deId=getTopicIdFromUrl();//thêm khi chỉnh sửa đề
    }
    try {
    // Thêm câu hỏi mới
    const questionResponse = await fetch(`/api/question/addques/${deId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ cauhoi: questionContent })
    });

    const questionData = await questionResponse.json();
    
    if (questionData.success) {
        const questionId = questionData.data.macauhoi; // Lấy `id` của câu hỏi mới
        addQuestion(questionId);
        saveQuestion(questionId);
        //thêm đáp án cho câu hỏi      
        for (let answerElement of answerElements) {
            const answerContent = answerElement.value.replace(/<\/?[^>]+(>|$)/g, "");
            const checkAnswer = answerElement.previousElementSibling.querySelector('input[type="radio"]').checked;

            await fetch(`/api/answer/addans/${questionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ noidung: answerContent, checkdapan: checkAnswer })
            });
        }
        showNotification('Câu hỏi và đáp án đã được lưu thành công!',true);
        ResetData();
    } else {
        showNotification('Lỗi khi thêm câu hỏi: ' + questionData.message,false);
    }
} catch (error) {
    console.error('Error:', error);
    showNotification('Đã xảy ra lỗi khi lưu câu hỏi và đáp án.',false);
}
});

// Hàm để lấy thông tin câu hỏi và đáp án
async function loadQuestionData(questionId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/question/singleques/${questionId}`, {
            method: 'GET',
            headers: {
                 'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.success) {
            // Điền dữ liệu vào form
            const question = data.data; 
            $(document.querySelector('textarea[name="data-question"]')).summernote('code', question.cauhoi);

            // Gán các đáp án
            let answerElements = document.querySelectorAll('.answer-content');
            let radios = document.querySelectorAll('input[name="dapan"]'); 

            // Reset đáp án
                answerElements.forEach((element, index) => {
                    element.value = ''; // Xóa giá trị cũ
                    radios[index].checked = false; // Bỏ chọn tất cả radio
                });

            // Kiểm tra số lượng đáp án và sinh thêm nếu cần
            const totalAnswers = question.dapan.length;
            if (totalAnswers > answerElements.length||totalAnswers < answerElements.length) {
                generateAnswers(totalAnswers);
            }
            // Lấy lại danh sách các ô đáp án và radio sau khi đã thêm/xóa
            answerElements = document.querySelectorAll('.answer-content');
            radios = document.querySelectorAll('input[name="dapan"]');

            // Gán lại giá trị cho đáp án
            question.dapan.forEach((answer, index) => {
                if (index < answerElements.length) { // Đảm bảo không vượt quá số lượng đáp án hiện có
                    $(answerElements[index]).attr('data-id-answer', answer.madapan); // Thêm thuộc tính data-id-answer với madapan của đáp án
                    $(answerElements[index]).summernote('code', answer.noidung);
                    if (answer.checkdapan) {
                        radios[index].checked = true; // Đánh dấu đáp án đúng
                    }
                }
            });
        } else {
            showNotification('Lỗi khi tải thông tin câu hỏi: ' + data.message,false);
        }
    } catch (error) {
        console.error('Error fetching question data:', error);
        showNotification('Đã xảy ra lỗi khi tải thông tin câu hỏi.',false);
    }
}

// Thêm sự kiện lắng nghe cho các nút câu hỏi
document.getElementById('question-container').addEventListener('click', function (event) {
    if (event.target.classList.contains('btn-question')) {
        const questionId = event.target.getAttribute('data-questionid');
        macauhoi=questionId;//gán mã câu hỏi để sử dụng cho sửa và xóa
        loadQuestionData(questionId); // Gọi hàm để tải dữ liệu câu hỏi
         // Xóa class 'btn-active' khỏi tất cả nút
        const buttons = document.querySelectorAll('.btn-activeques');
        buttons.forEach(button => button.classList.remove('btn-activeques'));

        // Thêm class cho nút được bấm
        event.target.classList.add('btn-activeques');
        document.getElementById('saveQuestionButton').style.display = 'none';
        document.getElementById('updateQuestionButton').style.display = 'block';
        document.getElementById('deleteQuestionButton').disabled = false;
    }
});
//Sự kiện xóa câu hỏi
document.getElementById('deleteQuestionButton').addEventListener('click', async function () {
    const token = localStorage.getItem('token');
    if(macauhoi.length===0)
    {
      console.log('Không tồn tại mã câu hỏi');
      return;      
    }
    try {
        const response = await fetch(`/api/question/delques/${macauhoi}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.success) {
            showNotification('Xóa câu hỏi thành công',true);
            ResetData();
           // Lấy mảng questions từ localStorage và parse thành mảng JavaScript
            let questions = JSON.parse(localStorage.getItem('questions'));
            // ID của câu hỏi bạn muốn xóa
            const questionIdToRemove = macauhoi;
            // Lọc bỏ phần tử có ID là questionIdToRemove
            questions = questions.filter(question => question.id !== questionIdToRemove);

            // Ghi đè lại mảng đã cập nhật vào localStorage
            localStorage.setItem('questions', JSON.stringify(questions));
            clearQuestions();
       
            macauhoi=null;
        } else {
            showNotification('Lỗi khi xóa thông tin câu hỏi: ' + data.message,false);
        }
    } catch (error) {
        console.error('Error fetching question data:', error);
        showNotification('Đã xảy ra lỗi khi tải thông tin câu hỏi.',false);
    }
});
//Sự kiện cập nhật lại câu hỏi và đáp án
document.getElementById('updateQuestionButton').addEventListener('click', async function() {
    const questionId = macauhoi; // ID của câu hỏi hiện tại
    const answers = document.querySelectorAll('.answer-item'); // Tất cả các ô đáp án

    const answersToUpdate = [];
    const answersToAdd = [];
    let isChecked = false;
    // Đảm bảo rằng chỉ có một radio button được chọn trong toàn bộ nhóm radio
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
        // Dừng trạng thái checked của tất cả các radio buttons khác
        if (radio.checked) {
            isChecked = true;
            // Set lại checked cho tất cả các radio button khác thành false
            radioButtons.forEach(btn => {
                if (btn !== radio) {
                    btn.checked = false;
                }
            });
        }
    });
    // Kiểm tra nếu không có radio button nào được chọn
    if (!isChecked) {
        showNotification("Vui lòng chọn một đáp án đúng.",false);
        return;
    }
    answers.forEach(answerItem => {
        const answerId = answerItem.querySelector('.answer-content').getAttribute('data-id-answer');
        const answerContent = answerItem.querySelector('.answer-content').value.replace(/<\/?[^>]+(>|$)/g, "");
    
        // Kiểm tra xem radio nào được chọn
        const radioButton = answerItem.querySelector('input[type="radio"]:checked');
        const checkAnswer = radioButton ? true : false; // Nếu có radio được chọn, check = true, nếu không thì false
            
        // Nếu có ID đáp án (đã có trong cơ sở dữ liệu), thì thêm vào mảng cập nhật
        if (answerId) {
            answersToUpdate.push({ answerId, content: answerContent, check: checkAnswer });
        } 
        // Nếu không có ID đáp án, thì nó là đáp án mới, cần thêm
        else {
            answersToAdd.push({ content: answerContent, check:checkAnswer });
        }
    });
    const token = localStorage.getItem('token');
    // Cập nhật câu hỏi và đáp án
    try {
        const questionContent = document.querySelector('textarea[name="data-question"]').value.replace(/<\/?[^>]+(>|$)/g, "");
        console.log(questionContent); // Kiểm tra giá trị questionContent
        // Cập nhật câu hỏi (nếu có)
        const updateResponse = await fetch(`/api/question/updateques/${questionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ cauhoi: questionContent })
        });
        if (updateResponse.ok) {
            for (let answerElement of answersToUpdate) {
                await fetch(`/api/answer/updateans/${answerElement.answerId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ noidung: answerElement.content, checkdapan: answerElement.check })
                });
            }
        }
        else{
            throw new Error('Error updating question');
        }
        // Thêm các đáp án mới vào cơ sở dữ liệu nếu có
        for (const newAnswer of answersToAdd) {
            const addResponse = await fetch(`/api/answer/addans/${questionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ noidung: newAnswer.content,checkdapan:newAnswer.check })
            });
            if (!addResponse.ok) {
                throw new Error('Error adding new answer');
            }
        }
        clearQuestions();
       
        ResetData();
        showNotification('Cập nhật câu hỏi thành công',true);
    } catch (error) {
        console.error('Lỗi khi cập nhật câu hỏi:', error);
        showNotification('Có lỗi khi cập nhật câu hỏi, vui lòng thử lại',false);
    }
});