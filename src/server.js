const express = require('express');

const port = 3001;
const server = express();

// GET /timeline
server.get('/timeline', (req, res) => {
    const dataTimeline=require("../data/notizie.json")
    res.send(dataTimeline);
})

// GET /timeline/:id
server.get('/timeline/:id', (req, res) => {
    let jsonData=require("../data/notizie.json")

    console.log(jsonData);

    const item = jsonData.find(item => item.id === parseInt(req.params.id));

    if (!item) {
        return res.status(404).send();
    }

    res.send(item);
})

// POST /timeline
server.post('/timeline', (req, res) => {
    const dataTimeline=require("../data/notizie.json")
    console.log("POST ok");
    res.send(dataTimeline);
})

// PUT /timeline/:id
server.put('/timeline/:id', (req, res) => {
    const dataTimeline=require("../data/notizie.json")
    console.log(`PUT ok in ${req.params.id}`); 
    res.send(dataTimeline);
})

// PATCH /timeline/:id
server.patch('/timeline/:id', (req, res) => {
    const dataTimeline=require("../data/notizie.json")
    console.log(`PATCH ok in ${req.params.id}`); 
    res.send(dataTimeline);
})

// DELETE /timeline/:id
server.delete('/timeline/:id', (req, res) => {
    const dataTimeline=require("../data/notizie.json")
    console.log(`DELETE ok in ${req.params.id}`); 
    res.send(dataTimeline);
})

