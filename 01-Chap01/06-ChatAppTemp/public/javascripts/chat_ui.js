import Chat from "./chat.js";

const socket = io();
const chatApp = new Chat(socket);

//Tạo tag div chứa text đã loại bỏ ký tự HTML.
function divEscapedContentElement(message){
  return $('<div></div>').text(message);
}

//Tạo tag div chứa thông báo hệ thống in nghiêng.
function divSystemContentElement(message){
  return $('<div></div>').html('<i>' + message + '</i>');
}

//Hàm xử lý input
function processInput(chatApp, socket){
  //Lấy dữ liệu message nhập trên textbox
  const message = $('#send-message').val();
  let systemMessage;

  if(message.charAt(0) === '/') {
    systemMessage = chatApp.processCommand(message);
    if (systemMessage) {
      $('#messages').append(divSystemContentElement(systemMessage));
    }    
  }
  else {
      chatApp.sendMessage($('#room').text(), message);
      $('#messages').append(divEscapedContentElement(message));
      $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    }
  $('#send-message').val('');
}

$(document).ready(function() {
  //Đăng ký sự kiện kết quả đổi tên, chờ nhận phản hồi từ server.
  socket.on('nameResult', function (result) {
    let message;
    if (result.success) {
      message = 'You are known as ' + result.name + '.';
    }
    else {
      message = result.message;
    }
    $('#messages').append(divSystemContentElement(message));
  });

  //Đăng ký sự kiện kết quả join room, chờ nhận phản hồi từ server.
  socket.on('joinResult', function(result){
    $('#room').text(result.room);
    $('#messages').append(divSystemContentElement('Room changed.'));
  });

  //Đăng ký sự kiến tin nhắn
  socket.on('message', function (message) {
    const newElement = $('<div></div>').text(message.text);
    $('#messages').append(newElement);
  });

  //Đăng ký sự kiến nhận kết quả danh sách rooms
  socket.on('rooms', function(rooms){
    $('#room-list').empty();
    for (let roomId in rooms){
      rooms[roomId].forEach(room => {
        if (room !== ''){
          $('#room-list').append(divEscapedContentElement(room));
        }
      });
    }

    //join phòng
    $('#room-list div').click(function (){
      chatApp.processCommand('/join ' + $(this).text());
      $('#send-message').focus();
    });
  });

  //Đồng bộ danh sách phòng. Cứ 1s là client y/c server gửi danh sách room để room-list luôn mới nhất.
  setInterval(() => {
    socket.emit('rooms');
  }, 1000);

  $('#send-form').submit(function (){
    processInput(chatApp, socket);
    return false;
  });
});
