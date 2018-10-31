/**
 * Запуск процесса должен происходить от имени администратора директум
 *
 */

const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const DirectumServices = require('./modules/directumServices');
const nodeSSPI = require('node-sspi');
const morgan = require('morgan');


// создаем парсер для данных application/x-www-form-urlencoded
let urlencodedParser = bodyParser.urlencoded({extended: false});

console.log('Настраиваем окружение');
app.set('views', './views');
app.set('view engine', 'pug');

//подключаем логгер

app.use(morgan('short'));

//настраиваем пути
console.log('Настраиваем пути');
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.use('/img', express.static(__dirname + '/img')); // redirect images
app.use('/css', express.static(__dirname + '/CSS')); // redirect our css

console.log('Подключаем функционал');
let ds = new DirectumServices();

//добавляем в запрос информацию об аутентификации(req.connection.user = 'GT\...')
app.use(function (req, res, next) {
    let nodeSSPIObj = new nodeSSPI();
    nodeSSPIObj.authenticate(req, res, function(err){
        res.finished || next();
    })
});


/**
 * метод возвращает результат поиска задания по ИД
 */
app.get('/job/:jobID', (req, res) => {
    let curUser;
    let jobInfo;
    try{
        curUser = req.connection.user.toLowerCase().replace('gt\\',''); //логин пользователя
        //let curUser = 'revenkov_kyu';
        curUser = ds.getUserByName(curUser);

        //получаем информацию о задании
        jobInfo = ds.getJobInfo(req.params['jobID']);
        // console.log(jobInfo.AccessRights.UserCanRead(curUser));
        // console.log(jobInfo.AccessRights.UserCanWrite(curUser));
        // console.log(jobInfo.AccessRights.UserCanManage(curUser));
        // console.log(jobInfo.AccessRights.UserCanModify(curUser));

        if (jobInfo.AccessRights.UserCanRead(curUser)) {
            jobInfo.job.MarkAsRead;
            //TODO нужно проверить вид задания. если только инфо, то не отображать поле ввода
            let showAnswerField = jobInfo.AccessRights.UserCanWrite(curUser);
            res.render('index', {jobInfo: jobInfo, showAnswerField});
        } else {
            throw Error('У Вас нет прав нв просмотр данного задания.');
        }
    } catch (e) {
        res.render('information', {id : req.params['jobID'], e});
        console.log('Ошибка ' + e);
    }
});


/*app.get('/performJob',(req, res) =>
{
    console.log('Нажата кнопка');
    console.log(urlencodedParser);
});*/

//Обрабатываем полученные данные
app.post('/performJob', urlencodedParser, (req, res) => {
    if (!req.body) return res.status(400);
    res.send(`${req.body.ActiveText}`);
    let text = req.body.ActiveText.trim();
    text = text !== '' ? text : 'Выполнено';
    let jobInfo = ds.getJobInfo(req.body.id);
    if (jobInfo){
        jobInfo.job.MarkAsRead;
        jobInfo.job.PerformWithResult(text);
    }
});

//перехватываем favicon
app.get('/favicon.ico', (req, res) => res.status(204));


app.get('/*', (req, res) => {
    //\res.render(404);
    throw new Error('Возникла непредвиденная ошибка');
});


app.use((err, req, res, next) => {
    // логирование ошибки, пока просто console.log
    console.log(`При работе приложения возникла ошибка ${err}`);
    //res.status(500).send('Что-то пошло не так!');
    res.render('error');
});


let port = 3000;
app.listen(port);
console.log(`Запуск сервера. Порт: ${port}`);

