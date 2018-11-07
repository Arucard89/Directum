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
const moment = require('moment');
const rfs = require('rotating-file-stream');
const fs = require('fs');

const ATTACHMENT_PATH = '/att/';
const JOBS_PATH = '/job/';

moment.locale('ru');

// create a rotating write stream
let accessLogStream = rfs('access.log', {
    interval: '1d', // rotate daily
    path: path.join(__dirname, 'log')
});

// создаем парсер для данных application/x-www-form-urlencoded
let jsonParser = bodyParser.json();

console.log('Настраиваем окружение');
app.set('views', './views');
app.set('view engine', 'pug');

//подключаем логгер
app.use(morgan('combined', { stream: accessLogStream }));

//настраиваем пути
console.log('Настраиваем пути');
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/js', express.static(__dirname + '/src')); // redirect js files
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.use('/img', express.static(__dirname + '/img')); // redirect images
app.use('/css', express.static(__dirname + '/CSS')); // redirect our css
app.use('/fonts', express.static(__dirname + '/node_modules/bootstrap/fonts')); // redirect our css

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
    //todo получать список файлов, вложенных в задание
    let jobInfo;
    try{
        let curUserName = req.connection.user.toLowerCase().replace('gt\\',''); //логин пользователя
        //let a = ds.checkUserInGroup(curUser,'DirectumUsers');
        //let curUser = 'revenkov_kyu';
        let curUser = ds.getUserByName(curUserName);
        //получаем информацию о задании
        let id = req.params['jobID'];

        //проверяем, есть ли в коллекции такое задание
        if (!ds.jobsCollection[id]){
            ds.getJobInfo(id);
        }
        jobInfo = ds.jobsCollection[id];

        //освобождаем блокировку объекта
        ds.unlockObject(jobInfo.job);
        //проверка прав
        if (jobInfo.AccessRights.UserCanRead(curUser)) {
            if (jobInfo.AccessRights.UserCanWrite(curUser)) {
                jobInfo.job.MarkAsReaded();
            }
            //проверяем тип задания(не уведомление), права пользователя и состояние задания отображения текстовой информации
            let showAnswerField = jobInfo.JobKind !== 1 && jobInfo.AccessRights.UserCanWrite(curUser) && jobInfo.State === 'В работе';

            //получаем список вложений и их свойства для отображения на странице
            let atts = ds.getAttachmentListForUser(jobInfo.job, curUserName);
            let attachments = [];
            for (let att of atts) {
                let docProp = ds.getDocumentPropertiesByInfo(att);
                if (docProp) {
                    //добавляем в свойства ссылку
                    docProp.href = ATTACHMENT_PATH + docProp.docInfo.ID;
                    //добавляем имя файла
                    docProp.fullName = `${docProp.docName}.${docProp.fileExtension}(${docProp.docInfo.ID})`;
                    attachments.push(docProp);
                }
            }
            res.render('index', {jobInfo: jobInfo, attachments, showAnswerField});
        } else {
            throw Error('У Вас нет прав на просмотр данного задания.');
        }
    } catch (e) {

        res.render('information', {id : req.params['jobID'], message: getMessageFromError(e)});
        console.log('Ошибка ' + e);
        console.log(e);
    }
});




/**
 *  Обрабатываем полученные данные о выполнении
 */
app.post('/performJob', jsonParser, (req, res) => {

    let curUser = req.connection.user.toLowerCase().replace('gt\\',''); //логин пользователя

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
            //todo перед выполнением задания нужно проверить не просрочено ли оно и нет ли связанных с ним заданий на указание причины
            //если пользователь в группе делопроизводителей или в группе польхзователей директума, то пусть пользуется приложением
            if (ds.checkUserInGroup(curUser, 'DirectumUsers') || ds.checkUserInGroup(curUser, 'СЕКР')){
                res.json({error:'Вы входите в группу пользователей директума или в группу делопроизодителей. Установите приложение через корпоративный портал и используйте полную версию.'});
                ds.unlockObject(jobInfo.job);
                return;
            }
            //проверяем не просрочено ли задание
            if (jobInfo.JobFinalDate !== '' && jobInfo.JobFinalDate < moment()){

            }
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
        console.log(getMessageFromError(e));
        //снимаем блокировку
        ds.unlockObject(jobInfo.job);
        res.json({error: getMessageFromError(e)});
    }
});

/**
 * загружаем файл с сервера
 */
app.get(`${ATTACHMENT_PATH}:fileID`, (req, res) => {
    let fileID = req.params['fileID'];
    let curUser = getUserName(req);
    sendFileToClient(ds.downloadDocument(fileID, curUser), res);
});

/*//перехватываем favicon
app.get('/favicon.ico', (req, res) => res.status(204));
*/
/*
app.get('/*', (req, res) => {
    throw new Error('Возникла непредвиденная ошибка');
});
*/

app.get('/file/:id', (req, res) => {
    console.log('Здесь будет загрузка файлов');
});

/**
 * вход на главную страницу
 */
app.get('/*', (req, res) => {
    res.render('index',{mainPage: true});
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

/**
 * получаем сообщение из ошибки для вывода на страницу
 * @param e
 * @returns {*}
 */
function getMessageFromError(e) {
    let mes = e.description ? e.description : e.toString();
    mes = mes.replace(/\^/g,' ');
    return mes;
}

/**
 * передать файл клиенту
 * @param filePath
 * @param res
 * @returns {boolean}
 */
function sendFileToClient(filePath, res) {
    try {
        //res.writeHead(200);
        res.setHeader('Content-disposition', 'attachment; filename='+ path.basename(filePath));
        res.status(200);
        fs.createReadStream(filePath).pipe(res);
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}

/**
 * получаем имя пользователя из входящего запроса
 * @param req
 * @returns {string}
 */
function getUserName(req){
    return req.connection.user.toLowerCase().replace('gt\\',''); //логин пользователя
}