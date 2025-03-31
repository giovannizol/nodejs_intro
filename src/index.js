const express = require('express');
const qrcode = require('qrcode');

const server = express();
const port = 3000;

// visualizzare json metodo 1
server.use('/data/qrcode.png', express.static('data'));

// visualizzare json metodo 2
server.get('/tecnologie', (req, res) => {
    let data=require("../data/home.json")
    res.status(200).json(data);
  })



server.get('/', (req, res) => {
  res.send('Hello world');
});

server.get('/json', (req, res) => {
  const rispostaJson = {"nome": "pippo"};

  res.send(rispostaJson);
})

server.listen(port, () => {
  console.log('server in ascolto!')
})
