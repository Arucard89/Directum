const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const DirectumServices = require('./directumServices');

// создаем парсер для данных application/x-www-form-urlencoded
var urlencodedParser = bodyParser.urlencoded({extended: false});

app.set('views', './views');
app.set('view engine', 'pug')

//настраиваем пути для бутстрапа
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.use('/img', express.static(__dirname + '/img')); // redirect images
app.use('/css', express.static(__dirname + '/CSS')); // redirect our css

let ds = new DirectumServices();
app.get('/', (req, res) => {
    res.render('index', {jobInfo: ds.getJobInfo(178384)});
});

app.listen(3000);

