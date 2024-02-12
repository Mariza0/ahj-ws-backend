const http = require('http');
const Koa = require('koa');
const app = new Koa();

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());

function getCurrentDateTime() {
    const currentDate = new Date();
  
    // Получение времени в формате hh:mm
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;
  
    // Получение даты в формате dd.mm.yyyy
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Месяцы начинаются с 0
    const year = currentDate.getFullYear();
  
    const date = `${day}.${month}.${year}`;
  
    return `${time} ${date}`;
  }
  
const WebSocket = require('ws');
let activeUsers = [];

let users = {};

const wss = new WebSocket.Server({ server });

const nicknames = new Map();

wss.on('connection', function connection(ws) {

  ws.on('message', function incoming(message) {

    const data = JSON.parse(message);
    console.log(data,'сообщение от клиента')
    // если приоединяется участник
    if (data.type === 'joinChat') {

        activeUsers.push(data.nickname);

        users[ws] = data.nickname;
    
        console.log(activeUsers,'activeUsers')
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) { 
      
              client.send(JSON.stringify({ type: 'joinChat', activeUsers: `${activeUsers}` }));
            };
          });     
    }

    if (data.type === 'checkNickname') {

      if (!nicknames.has(data.nickname)) {

        nicknames.set(data.nickname, ws);

        ws.send(JSON.stringify({ type: 'nicknameStatus', isAvailable: true, nickname: `${data.nickname}` }));

      } else {
        ws.send(JSON.stringify({ type: 'nicknameStatus', isAvailable: false }));
      }
    } else if (data.type === 'sendMessage') {

      const nickname = data.nickname;
      console.log(nickname,'nickname')

      const message = data.message;

      wss.clients.forEach(function each(client) {

        if (client.readyState === WebSocket.OPEN) {

          const currentTime = getCurrentDateTime(); 
          const messageToClient = JSON.stringify({ type: 'message', message: {nickname: `${nickname}`, currentTime: `${currentTime}`, message: `${message}`} });
          client.send(messageToClient);

        }
      });
    }
  });

  ws.on('close', () => {
    
    // Удаляем отключенного клиента из массива
    const deletedUser = users[ws];
    console.log(`Клиент отключился ${deletedUser}`);

    // Удаляем пользователя из объекта users
    delete users[ws];
    activeUsers = activeUsers.filter(client => client !== deletedUser);

    wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) { 
  
          client.send(JSON.stringify({ type: 'leaveChat', activeUsers: `${activeUsers}` }));
        };
      });
   });
});

server.listen(7070, function listening() {
  console.log('WebSocket server is running on port 7070');

});
