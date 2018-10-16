let express = require('express');

let app = express();
app.get('/', (req, res) => {
    console.log(req);
    res.send("<h2>Что-то пошло не так о_0</h2>");
});

app.listen(3000);

