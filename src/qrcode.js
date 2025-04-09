const qrcode = require('qrcode');

// rappresentazione in testo di testo
qrcode.toString('Hello World', (err, qrstring) => {
    // console.log(qrstring);
})

// rappresentazione testuale di immagine
qrcode.toDataURL('Hello World', (err, qrstring) => {
    console.log(qrstring);
})

qrcode.toFile('data/qrcode.png', 'Hello world', {
    errorCorrectionLevel: 'H'
})