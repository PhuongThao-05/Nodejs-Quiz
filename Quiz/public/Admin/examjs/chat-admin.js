const socket = io();
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('admin-message-input');
const sendButton = document.getElementById('admin-send-button');
const username = "Admin";
const role = "admin"; 

// Tham gia vào phòng admin
socket.emit('joinChat', { username: username, role: role });

// Gửi tin nhắn từ admin
function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('sendMessage', message);
        messageInput.value = '';
    }
}

// Gửi tin nhắn
sendButton.addEventListener('click', sendMessage);

// Gửi tin nhắn khi nhấn Enter (trừ khi nhấn Shift + Enter để xuống dòng)
messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { 
        event.preventDefault(); 
        sendMessage(); 
    }
});

// Nhận tin nhắn từ phòng user
socket.on('receiveMessage', ({ sender, message, timestamp }) => {
    const isSenderAdmin = sender === "Admin"; 
    const messageClass = isSenderAdmin ? 'admin' : 'user';

    const messageElement = document.createElement('div');
    messageElement.classList.add('message', messageClass);
    messageElement.innerHTML = `
          <div class="message-box" style="display: flex;flex-direction: row;gap: 5px;align-items: flex-start;">
            <div class="bubble">
            ${message}
            <div style="font-size: 10px; text-align: right; color: #888;">${timestamp}</div>
            </div>
            <img class="message-image" data-bs-toggle="tooltip" title="${sender}" alt="profile" style="border: 1px solid #948e8e57;width: 35px;height: 36px;border-radius: 50%;" />
            </div>
    `;
    chatBox.appendChild(messageElement);
    const messageBox = messageElement.querySelector('.message-box');
    const messageImage = messageElement.querySelector('.message-image');
    if (messageClass === "admin") {
        messageBox.style.flexDirection = 'row';
        messageImage.src = '/Admin/images/customer-support.png';
    } else {
        messageBox.style.flexDirection = 'row-reverse';
        messageImage.src = '/User/images/cute-little-schoolboy-graduation.png';
    }
    chatBox.scrollTop = chatBox.scrollHeight; 
});

// Nhận tất cả tin nhắn đã lưu khi trang được tải lại
socket.on('previousMessages', (messages) => {
    messages.forEach(({ sender, message, timestamp }) => {
        const isSenderAdmin = sender === "Admin"; 
        const messageClass = isSenderAdmin ? 'admin' : 'user';
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', messageClass);
        messageElement.innerHTML = `
        <div class="message-box" style="display: flex;flex-direction: row;gap: 5px;align-items: flex-start;">
        <div class="bubble">
        ${message}
        <div style="font-size: 10px; text-align: right; color: #888;">${timestamp}</div>
        </div>
        <img class="message-image" data-bs-toggle="tooltip" title="${sender}" alt="profile" style="border: 1px solid #948e8e57;width: 35px;height: 36px;border-radius: 50%;" />
        </div>
        `;
        chatBox.appendChild(messageElement);
        const messageBox = messageElement.querySelector('.message-box');
        const messageImage = messageElement.querySelector('.message-image');
        if (messageClass === "admin") {
            messageBox.style.flexDirection = 'row';
            messageImage.src = '/Admin/images/customer-support.png';
        } else {
            messageBox.style.flexDirection = 'row-reverse';
            messageImage.src = '/User/images/cute-little-schoolboy-graduation.png';
        }
    });
    chatBox.scrollTop = chatBox.scrollHeight;
});
