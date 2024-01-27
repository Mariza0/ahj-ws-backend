const fs = require('fs');
const http = require('http');
const Koa = require('koa');
const { koaBody } = require('koa-body');
const path = require('path');
const uuid = require('uuid');

const app = new Koa();

let subscriptions = [];

app.use(koaBody({
    urlencoded: true,
    multipart: true,
}));


app.use((ctx, next) => {
    if (ctx.request.method !== 'OPTIONS') {
        next();
        return;
    }
    ctx.response.set('Access-Control-Allow-Origin', '*');
    ctx.response.set('Access-Control-Allow-Methods', 'DELETE, PUT, PATCH, GET, POST');
    ctx.response.status = 204;
});

// // добавление файла
app.use((ctx,  next) => {

    console.log(ctx.request.url,'ctx.request.url');

    if (ctx.request.method === 'POST' && ctx.request.url === '/upload') {

        console.log('это загрузка файла')
        ctx.response.set('Access-Control-Allow-Origin', '*');
        console.log(ctx.request.files, 'ctx.request.files');
        let fileName;
    
        try {    
            const public = path.join(__dirname, '/public');
    
            const { file } = ctx.request.files;

            const subfolder = uuid.v4();

            const uploadFolder = public + '/' + subfolder;

            fs.mkdirSync(uploadFolder);
    
            fs.copyFileSync(file.filepath, uploadFolder + '/' + file.originalFilename);
            
            
        } catch (error) {
            ctx.response.status = 500;
    
            return;
        }
        ctx.response.body = 'ok';
         
    } else {

        next();
        return;
    
}});

// добавление данных. если номер уже есть то записи нет
app.use((ctx,  next) => {
    if (ctx.request.method !== 'POST') {
        next();
        return;
    }
    console.log(ctx.request.body, 'ctx.request.body');

    const { name, phone } = ctx.request.body;

    ctx.response.set('Access-Control-Allow-Origin', '*');

    if (subscriptions.some(sub => sub.phone === phone)) {
        ctx.response.status = 400;
        ctx.response.body = 'subscription exists';
        return;
    }
    subscriptions.push({ name, phone });
    
    ctx.response.body = 'ok, добавили';

    next();
});

// удаление данных. если номера нет то не удалит
app.use((ctx,  next) => {
    if (ctx.request.method !== 'DELETE') {
        next();
        return;
    }
    console.log(ctx.request.body, 'ctx.request.body');

    const { phone } = ctx.request.query;
    console.log(phone,'phone');

    ctx.response.set('Access-Control-Allow-Origin', '*');

    if (subscriptions.every(sub => sub.phone !== phone)) {
        ctx.response.status = 400;
        ctx.response.body = 'subscription doesn`t exists';
        return;
    }
    subscriptions = subscriptions.filter(sub => sub.phone !== phone);
    
    ctx.response.body = 'ok, удалили';

    next();
});


app.use((ctx) => {
    console.log('second midleware');
})

const server = http.createServer(app.callback());

const port = 7070;

server.listen(port, (err) => {
    if (err) {
        console.log(err);
        return;
    }
    console.log('server is listening to port ' + port);
})
