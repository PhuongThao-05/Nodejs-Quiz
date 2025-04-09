const express = require('express')
const app = express()
const port = 3000
var bodyParser=require("body-parser")
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;
const session = require('express-session');
const MongoStore = require('connect-mongo');
const {requireRegister}=require('./config/authentication')
app.use(
  session({
    secret: SECRET_KEY, 
    resave: false,                        // Không lưu session nếu không thay đổi
    saveUninitialized: false,             // Không lưu session trống
    store: MongoStore.create({
      mongoUrl: 'mongodb://localhost:27017/session-quiz',  // Thay URL này bằng URL MongoDB của bạn
      ttl:1 * 24 * 60 * 60  // Thời gian lưu session (1 ngày)
    }) 
  })
);

const server = http.createServer(app);
const io = new Server(server);
// Mảng lưu tin nhắn
let messages = []; // Lưu trữ tất cả tin nhắn trong bộ nhớ
// Tạo một mảng để lưu thông tin người dùng theo socket ID
const chatRooms = {}; 
// Sự kiện khi một client kết nối
io.on('connection', (socket) => {
console.log(`User connected: ${socket.id}`);
  // Khi user tham gia chat
  socket.on('joinChat', ({ username, role }) => {
      if (!username || !role) {
          console.error('Missing username or role in joinChat');
          return;
      }
      // Xác định phòng dựa trên vai trò
      const room = role === 'admin' ? 'adminRoom' : 'userRoom';
      socket.join(room);
      // Lưu thông tin người dùng
      chatRooms[socket.id] = { username, role };

      // Gửi lại tất cả tin nhắn đã lưu cho người dùng mới tham gia
      socket.emit('systemMessage', `Welcome to the chat, ${username}!`);
      socket.emit('previousMessages', messages);  // Gửi lại tin nhắn đã lưu

      console.log(`${username} (${role}) joined ${room}`);
  });

  // Xử lý tin nhắn từ client
  socket.on('sendMessage', (message) => {
      const user = chatRooms[socket.id];
      if (!user) {
          console.error(`User data not found for socket ID: ${socket.id}`);
          return;
      }

      const messageData = {
          sender: user.username,
          message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Lưu tin nhắn vào bộ nhớ
      messages.push(messageData);

      // Phát tin nhắn tới phòng đối tượng (admin hoặc user)
      const targetRoom = user.role === 'admin' ? 'userRoom' : 'adminRoom';
      io.to(targetRoom).emit('receiveMessage', messageData);

      // Phản hồi lại chính người gửi
      socket.emit('receiveMessage', messageData);
  });

  // Khi user ngắt kết nối
  socket.on('disconnect', () => {
      const user = chatRooms[socket.id];
      if (user) {
          console.log(`${user.username} disconnected: ${socket.id}`);
          delete chatRooms[socket.id];
      } else {
          console.log(`User disconnected: ${socket.id} (no user data)`);
      }
  });
});

// Lắng nghe trên cổng 3000
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

var account_router=require("./routers/account_router")
var de_router=require('./routers/de_router')
var user_router=require("./routers/user_router")
var typeacc_router=require('./routers/typeacc_router')
var question_router=require("./routers/questions_router")
var answer_router=require('./routers/answer_router')
var result_router=require('./routers/result_router')
var upgrade_router=require('./routers/upgrade_router')
var figure_router=require('./routers/figure_router')
const zalo_pay_router=require('./routers/zalo_pay_router')
const check_auth_router=require('./routers/check_token_router');
const { title } = require('process');
app.use('/api',account_router);
app.use('/api/de',de_router);
app.use("/api/user",user_router)
app.use("/api/typeacc",typeacc_router)
app.use("/api/question",question_router)
app.use("/api/answer",answer_router)
app.use("/api/result",result_router)
app.use("/api/upgrade",upgrade_router)
app.use("/api/figure",figure_router)
app.use("/api/payment",zalo_pay_router)
app.use("/api/auth",check_auth_router)
// Thiết lập thư mục công khai để phục vụ các tệp tĩnh
app.use(express.static(path.join(__dirname, 'public')));
// Thiết lập thư mục chứa các file EJS
app.set('views', path.join(__dirname, 'views'));
// Cấu hình EJS làm template engine
app.set('view engine', 'ejs');
//////////////--------------------Giao diện cá nhân quản lý---------------------------//////////////
app.get('/user/login', (req, res) => {
  const username = req.session.username || '';
  res.render('user/loginuser',{username}); 
});
app.get('/user/register', (req, res) => {
  res.render('user/register'); 
});
app.get('/user/createprofile',requireRegister, (req, res) => {
  const username = req.session.username || '';
  res.render('user/createprofile',{username}); 
});
///------------   ----------------///
app.get('/user/profile', (req, res) => {
    res.render('user/layout', { body: '../user/profile',title:"EduQuiz Studio-Profile"}); 
});
app.get('/user/index', (req, res) => {
  res.render('user/layout', { body: '../user/index',title:"EduQuiz Studio"}); 
});
app.get('/user/topic', (req, res) => {
  res.render('user/layout', { body: '../user/topic',title:"EduQuiz Studio-Topic"}); 
});
app.get('/user/createtopic', (req, res) => {
  res.render('user/layout', { body: '../user/createtopic',title:"EduQuiz Studio-Create Topic"}); 
});

app.get('/user/edittopic/:topicId', (req, res) => {
  const topicId = req.params.topicId;
  if (topicId) {
      res.render('user/layout', { body: '../user/edittopic',title:"EduQuiz Studio-Edit Topic"}); 
  } else {
      res.status(400).send('Không thể truy cập.');
  }
});
app.get('/user/editquestion', (req, res) => {
  res.render('user/layout', { body: '../user/editquestion'}); 
});
app.get('/user/account', (req, res) => {
  res.render('user/layout', { body: '../user/account',title:"EduQuiz Studio-My account"});
});
app.get('/user/upgrade', (req, res) => {
  res.render('user/layout', { body: '../user/upgrade',title:"EduQuiz Studio-Upgrade"}); 
});
app.get('/user/order', (req, res) => {
  const order = req.session.package || { selectedPackage: [] }; // Đảm bảo order luôn có selectedPackage
  console.log('order:',order);
  res.render('user/layout', { body: '../user/order',order,title:"EduQuiz Studio-Order"});
});
app.get('/user/myresult', (req, res) => {
  res.render('user/layout', { body: '../user/myresult',title:"EduQuiz Studio-My result"});
});

app.get('/user/contact', (req, res) => {
  res.render('user/layout', { body: '../user/contact',title:"EduQuiz Studio-Contact"});
});
//////////////-----------------------------Giao diện thi trắc nghiệm--------------------------////////////////
app.get('/user/home', (req, res) => {
  res.render('user/home'); 
});
app.get('/user/lsttopic', (req, res) => {
  res.render('user/list_topics'); 
});

app.get('/user/detailtopic/:topicId', (req, res) => {
  const topicId = req.params.topicId;
  if (topicId) {
      req.session.deId=topicId;
      res.render('user/detail_topic'); 
  } else {
      res.status(400).send('Không thể truy cập.');
  }
});
app.get('/user/exam', (req, res) => {
  const topicId = req.session.deId;
  if (topicId) {
      res.render('user/exam',{topicId}); 
  } else {
      res.status(400).send('Không thể truy cập.');
  }
});
app.get('/user/price', (req, res) => {
  res.render('user/price'); 
});
app.get('/user/return', (req, res) => {
  res.render('user/return_payment'); 
});
/////////----------------------------Admin page------------------//////////////
app.get('/admin/login', (req, res) => {
  res.render('admin/loginadmin');
});
app.get('/admin/signup', (req, res) => {
  res.render('admin/signupadmin');
});
app.get('/admin/home', (req, res) => {
  res.render('admin/layout', { body: '../admin/home',title:"EduQuiz-Admin Home"});
});
app.get('/admin/order', (req, res) => {
  res.render('admin/layout', { body: '../admin/order',title:"EduQuiz-Order"});
});
app.get('/admin/confirm/:upgrId', (req, res) => {
  const upgrId = req.params.upgrId;
  if(upgrId){
  res.render('admin/layout', { body: '../admin/confirmupgrade',title:"EduQuiz-Confirm Order"});
  } else{
    res.status(400).send('Không thể truy cập.');
  }
});
app.get('/admin/income', (req, res) => {
  res.render('admin/layout', { body: '../admin/income',title:"EduQuiz-Income"});
});
app.get('/admin/support', (req, res) => {
  res.render('admin/layout', { body: '../admin/support',title:"EduQuiz-Support customer"});
});
// app.listen(port, () => {
//   console.log(`App listening on port ${port}`)
// })