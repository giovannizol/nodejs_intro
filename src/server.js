const dotenv = require('dotenv');
dotenv.config();
dotenv.config({path: '.env.local', override: true});

// carico il modulo express
const express = require('express');

const { Telegraf } = require('telegraf')
const { message } = require('telegraf/filters')

console.log("process.env: ", process.env)
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => ctx.reply('Welcome'))

bot.on('message', (ctx, next) => {
    const photoArray = ctx.message.photo;

    if (!photoArray) {
        next();
    }

    const largestPhoto = photoArray[photoArray.length - 1];

    console.log(largestPhoto);
})

bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on(message('sticker'), (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => {
    console.log(ctx.update.message.chat);
    ctx.reply('Hey there')
})
bot.launch()

// carico il modulo per sqlite
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/notizie.db');

// creo una costante "port" dove imposto la porta che userò con "server.lister" per avviare il server
const port = 3001;

// creo un server, lo devo poi configurare e avviare
const server = express();

// indico che voglio decodificare i contenuti che ricevo come JSON
server.use(express.json());


// nuovo endpoint per il contatto
// deve gestire correttamente il metodo
// mostra in console il contenuto, il corpo del messaggio
// risponde con solo ok

server.post('/contact', (req, res) => {
    console.log(req.body)
    bot.telegram.sendMessage(process.env.BOT_CHAT_ID, `Contatto\nNome: ${req.body.nome}\nEmail: ${req.body.email}\n\nTesto: ${req.body.testo}`)
    res.send('ok')
})


// creo la tabella nel database se già non esiste
db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS notizie (titolo TEXT, testo TEXT, data INTEGER, autore TEXT)');
});

// inizio la configurazione, poi dovrò avviarlo

// rispondo con il contenuto di "../data/notizie.json" a chi richiede la rotta "/notizie"
server.get('/notizie', (req, res) => {
    // usare db per pescare tutte le righe presenti nella tabella notizie
    // e inviarle al client
    db.all(
        "SELECT rowid AS id, * FROM notizie", 
        function(err, rows){
            if (err) {
                console.error(err);
                return res.status(400).send();
            }

            return res.send(rows);
        }
    );
});

// chiamata con metodo "GET" su "/notizie/:id", ad esempio "/notizie/4"
// attenzione che ogni elemento del URL è una stringa, 4 in questo caso è una stringa
// rispondo con il singolo elemento, se presente, dentro il json indicato
server.get('/notizie/:id', (req, res) => {
    db.get(
        "SELECT rowid AS id, * FROM notizie WHERE rowid = $id",
        {
            $id: parseInt(req.params.id)
        },
        function(err, row){
            if (err) {
                console.error(err);
                return res.status(400).send();
            }

            return res
                .status(row ? 200 : 404)
                .send(row);
        }
    )
}); 


// rispondo con "ok POST" alle chiamate con metodo "POST" che ricevo su "/notizie"
server.post('/notizie', (req, res) => {
    db.serialize(() => {
        // preparo uno statement, un istruzione di inserimento da eseguire
        const stmt = db.prepare(
            "INSERT INTO notizie VALUES ($titolo, $testo, $data, $autore)",
            {
                $titolo: req.body.titolo,
                $testo: req.body.testo,
                $data: req.body.data,
                $autore: req.body.autore
            }
        );

        // eseguo l'istruzione (lo statement)
        // accedo a this, per farlo non posso usare le 
        // arrow function, ma devo usare la forma classica
        // esempio `function(){}`

        stmt.run(function() {

            // inserimento ok, leggo l'ultima riga inserita che dovrò mandare al client
            db.get(
                "SELECT rowid AS id, * FROM notizie WHERE rowid = $id", // query
                {
                    $id: this.lastID
                }, // parametri per la query 
                function(err, row) { // callback da eseguire quando ho terminato la query
                    // se c'è un errore `err` è valorizzato, altrimenti no
                    if (err) {
                        // c'è un errore, termino l'esecuzione e mando un messaggio in console e al client
                        console.error(err);
                        return res.send(400).send('Inserimento completato, errore nella lettura dei dati')
                    }
        
                    // err non è valorizzato, quindi invio i dati che ricevo su `row` 
                    // al client
                    return res.send(row);
                }
            );

        });

        // termino lo statement
        stmt.finalize();    
    });
});

// rispondo con "ok PUT con id..." alle chiamate con metodo "PUT" che ricevo su "/notizie/:id"
// esempio di query da eseguire
// `UPDATE notizie SET year = 2025, company = "Bianchi" WHERE rowid = 75;`
server.put('/notizie/:id', (req, res) => {
    db.serialize(() => {
        const stmt = db.prepare(
            "UPDATE notizie SET data = $data, titolo = $titolo, testo = $testo, autore = $autore WHERE rowid = $id",
            {
                $id: parseInt(req.params.id),
                $data: req.body.data,
                $titolo: req.body.titolo,
                $testo: req.body.testo,
                $autore: req.body.autore,
            }
        );

        stmt.run(function() {
            if (this.changes === 0) {
                console.log('Non ho trovato quel id')
                return res.status(404).send()
            }

            db.get(
                "SELECT rowid AS id, * FROM notizie WHERE rowid = $id",
                {
                    $id: parseInt(req.params.id)
                },
                function(err, row) {
                    if (err) {
                        console.error(err);
                        return res.status(400).send('Aggiornamento riuscito, ma query di lettura fallita');
                    }

                    return res.send(row);
                }
            )
        })
    })
});

// rispondo con "ok PATCH con id..." alle chiamate con metodo "PATCH" che ricevo su "/notizie/:id"
// possiamo usare la PUT, creiamo la PATCH solo per completezza
server.patch('/notizie/:id', (req, res) => {
    db.serialize(() => {
        const campiDaAggiornare = [];
        const variabiliDaUtilizzare = {
            $id: parseInt(req.params.id)
        }

        const objectKeys = Object.keys(req.body);

        objectKeys.forEach((k) => {
            campiDaAggiornare.push(`${k} = $${k}`);
            variabiliDaUtilizzare[`$${k}`] = req.body[k];
        });

        const stmt = db.prepare(
            `UPDATE notizie SET ${campiDaAggiornare.join(', ')} WHERE rowid = $id`,
            variabiliDaUtilizzare
        );

        stmt.run(function() {
            if (this.changes === 0) {
                console.log('Non ho trovato quel id')
                return res.status(404).send()
            }

            db.get(
                "SELECT rowid AS id, * FROM notizie WHERE rowid = $id",
                {
                    $id: parseInt(req.params.id)
                },
                function(err, row) {
                    if (err) {
                        console.error(err);
                        return res.status(400).send('Aggiornamento riuscito, ma query di lettura fallita');
                    }

                    return res.send(row);
                }
            )
        })
    })
});

// rispondo con "ok DELETE con id..." alle chiamate con metodo "DELETE" che ricevo su "/notizie/:id"
server.delete('/notizie/:id', (req, res) => {
    db.serialize(() => {
        db.run(
            "DELETE FROM notizie WHERE rowid = $id",
            {
                $id: parseInt(req.params.id)
            },
            function(){
                console.log('cancellazione', this)

                return res
                    .status(this.changes === 0 ? 406 : 204)
                    .send();
            }
        );
    });
});

server.delete('/notizie', (req, res) => {
    db.serialize(() => {
        db.run("DELETE FROM notizie", function() {
            console.log("svuotato il DB")

            return res.status(200).send();
        })
    })
})

// configurazione terminata

// ora lo avvio sulla porta indicata da "port"
server.listen(port, () => {
    console.log('server in ascolto!')
});
  