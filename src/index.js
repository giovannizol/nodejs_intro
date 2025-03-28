const express = require('express');

const server = express();
const port = 3000;

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
