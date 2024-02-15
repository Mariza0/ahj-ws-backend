const http = require('http');
const Koa = require('koa');
const app = new Koa();

app.use((ctx, next) => {  

    if (ctx.request.url === '/') {

        ctx.response.set('Access-Control-Allow-Origin', '*');
        ctx.response.body = 'Hello, World!';
        return;
      }
});

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "https://mariza0.github.io/ahj-ws-frontend/");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

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

let users = new Map();

const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {

  ws.on('message', function incoming(message) {

    const data = JSON.parse(message);
    console.log(data,'сообщение от клиента')

    if (data.type === 'leaveChat') {

        // находим отключенного клиента из массива
        const deletedUser = users.get(ws);//users[ws];
        console.log(`Клиент отключился ${deletedUser}`);

        // и Удаляем пользователя из объекта активных users
        activeUsers = activeUsers.filter(client => client !== deletedUser);
        console.log(`список пользователей после удаления ${activeUsers}`);

        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) { 
  
            client.send(JSON.stringify({ type: 'leaveChat', activeUsers: `${activeUsers}` }));
            };
        });    
    }

    // если приоединяется участник
    if (data.type === 'joinChat') {

        // Добавляем нового пользователя в список пользователей
        users.set(ws, data.nickname);

        activeUsers.push(data.nickname);
    
        console.log(activeUsers,'activeUsers')
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) { 
      
              client.send(JSON.stringify({ type: 'joinChat', activeUsers: `${activeUsers}` }));
            };
          });     
    }

    if (data.type === 'checkNickname') {

      if (!users.has(data.nickname)) {
        // if (!users.has(ws)) {
            // users[ws] = data.nickname;

        users.set(ws, data.nickname);

        ws.send(JSON.stringify({ type: 'nicknameStatus', isAvailable: true}));//, nickname: `${data.nickname}` }));

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
    
    // Удаляем отключенного клиента из списка пользователей
    const deletedUser = users.get(ws);
    console.log(`Клиент отключился ${deletedUser}`);

    // фильтруем список активных пользователей
    activeUsers = activeUsers.filter(client => client !== deletedUser);
    console.log(`список после удаления ${activeUsers}`)

    wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) { 
  
          client.send(JSON.stringify({ type: 'leaveChat', activeUsers: `${activeUsers}` }));
        };
      });
   });
});

server.listen(port, function listening() {
  console.log(`WebSocket server is running on port ${port}`);

});
