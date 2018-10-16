let express = require('express');

let app = express();

//настраиваем пути для бутстрапа
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap


app.get('/', (req, res) => {
    console.log(req);
    res.send("<h2>Что-то пошло не так о_0</h2>");
});

app.listen(3000);

