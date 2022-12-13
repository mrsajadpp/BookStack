let express = require('express');
let app = express();
let port = 3030;
app.use(express.json());

app.listen(port, () => {
    console.log('Server i running on http://localhost:' + port)
});

app.post('/createuser/:usedata', (req, res) => {
    res.status(200).send({
        "id": "1234"
    });
});