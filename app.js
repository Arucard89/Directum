const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const DirectumServices = require('./directumServices');

// создаем парсер для данных application/x-www-form-urlencoded
var urlencodedParser = bodyParser.urlencoded({extended: false});

console.log('Настраиваем окружение');
app.set('views', './views');
app.set('view engine', 'pug');

//настраиваем пути
console.log('Настраиваем пути');
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.use('/img', express.static(__dirname + '/img')); // redirect images
app.use('/css', express.static(__dirname + '/CSS')); // redirect our css

console.log('Подключаем функционал');
let ds = new DirectumServices();

app.get('/:jobID', (req, res) => {
    res.render('index', {jobInfo: ds.getJobInfo(req.params['jobID'])});
});

app.get('/*', (req, res) => {
    res.render(404);
});

app.use((err, request, response, next) => {
    // логирование ошибки, пока просто console.log
    console.log(err);
    response.status(500).send('Something broke!');
});

let port = 3000;
app.listen(port);
console.log(`Запуск сервера. Порт: ${port}`);

