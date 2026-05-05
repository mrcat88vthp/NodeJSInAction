export default class Chat {
  constructor(socket){
    this.socket = socket;
  }

  //Gửi tin nhắn tới server
  sendMessage(room, text){
    const message = {
      room,
      text
    };

    this.socket.emit('message', message);
  }

  //Đổi phòng
  changeRoom(room){
    this.socket.emit('join', { newRoom: room });
  }

  //Xử lý lệnh /nick và /join
  processCommand(command){
    const words = command.split(' ');
    const commandName = words[0].substring(1).toLowerCase();//bỏ đấu '/'

    let message = false;

    switch (commandName){
      case 'join':
        //Bỏ phần tử đầu tiên
        words.shift();
        const room = words.join(" ");
        this.changeRoom(room);
        break;

      case 'nick':
        //Bỏ phần tử đầu tiên
        words.shift();
        const name = words.join(" ");
        this.socket.emit("nameAttempt", name);
        break;        

      default: 
        message = "Unrecognized command.";
        break;
    }
    return message;
  }
}