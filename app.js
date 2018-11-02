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
const favicon = require('serve-favicon');
const path = require('path');


// создаем парсер для данных application/x-www-form-urlencoded
let jsonParser = bodyParser.json();

console.log('Настраиваем окружение');
app.set('views', './views');
app.set('view engine', 'pug');

//подключаем логгер
app.use(morgan('short'));

//настраиваем пути
console.log('Настраиваем пути');
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/js', express.static(__dirname + '/src')); // redirect js files
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.use('/img', express.static(__dirname + '/img')); // redirect images
app.use('/css', express.static(__dirname + '/CSS')); // redirect our css

console.log('Подключаем функционал');

app.use(favicon(path.join(__dirname,'img','favicon.ico')));
const ds = new DirectumServices();

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
        let id = req.params['jobID'];

        //проверяем, есть ли в коллекции такое задание
        if (!ds.jobsCollection[id]){
            ds.getJobInfo(id);
        }
        jobInfo = ds.jobsCollection[id];
        //освобождаем блокировку объекта
        ds.unlockObject(jobInfo.job);

        if (jobInfo.AccessRights.UserCanRead(curUser)) {
            jobInfo.job.MarkAsReaded();
            //проверяем тип задания(не уведомление), права пользователя и состояние задания отображения текстовой информации
            let showAnswerField = jobInfo.JobKind !== 1 && jobInfo.AccessRights.UserCanWrite(curUser) && jobInfo.State === 'В работе';
            res.render('index', {jobInfo: jobInfo, showAnswerField});
        } else {
            throw Error('У Вас нет прав на просмотр данного задания.');
        }
    } catch (e) {
        res.render('information', {id : req.params['jobID'], e});
        console.log('Ошибка ' + e);
    }
});

//Обрабатываем полученные данные
app.post('/performJob', jsonParser, (req, res) => {

    if (!req.body) return res.status(400);

    //получаем данные от формы
    let text = req.body.activeText.trim();
    let id = req.body.id;
    let subject = req.body.subject;
    text = text !== '' ? text : 'Выполнено';
    let jobInfo = ds.jobsCollection[id];
    //еще одна проверка задания по совпадению темы
    try {
        if (jobInfo && jobInfo.Subject === subject) {
            //выполняем задание
            jobInfo.job.ActiveText = text;
            //console.log(jobInfo.job.GlobalLock.Locked);
            jobInfo.job.MarkAsReaded();
            jobInfo.job.Perform();

            //снимаем блокировку
            ds.unlockObject(jobInfo.job);

            delete ds.jobsCollection[id];
            res.json({success:'Задание выполено.'});
        } else {
            //снимаем блокировку
            ds.unlockObject(jobInfo.job);

            delete ds.jobsCollection[id];
            res.json({error:'Ошибка проверки ИД задания. Обновите страницу и попробуйте еще раз.'})
        }
    } catch (e) {
        console.log(e.description);
        //снимаем блокировку
        ds.unlockObject(jobInfo.job);
        res.json({error: e.description.indexOf('^') > -1 ? e.description.replace(/\^/g,' ') : e.description});
    }
});


//перехватываем favicon
app.get('/favicon.ico', (req, res) => res.status(204));


app.get('/*', (req, res) => {
    throw new Error('Возникла непредвиденная ошибка');
});


app.use((err, req, res, next) => {
    // логирование ошибки, пока просто console.log
    console.log(`При работе приложения возникла ошибка ${err}`);
    console.log(err);
    //res.status(500).send('Что-то пошло не так!');
    res.render('error');
});


let port = 3000;
app.listen(port);
console.log(`Запуск сервера. Порт: ${port}`);

