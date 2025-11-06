const path = require('path');
const multer = require('multer');
const cors = require('cors');
const express = require('express');


const app = express();
const PORT = 3000;

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, './uploads/'),
//   filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
// });

storage = multer.memoryStorage();

const upload = multer({ storage: storage });

app.use(cors());

app.get('/',  (req, res) => res.sendFile(path.join(__dirname, '/index.html')));

app.post('/', upload.single('file') , async function(req, res) {
  // diskStorage -> file saved on disk: req.file.path
  // memoryStorage -> file buffer available: req.file.buffer
  
  console.log(req.file);
  console.log('Now uploading', req.url, ': ', req.get('content-length'), 'bytes');

  // Cancela la llamada upstream si el cliente cierra la conexión
  const controller = new AbortController();
  const onClose = () => controller.abort();
  res.on("close", onClose);

  // Timeout prudente para no colgar la request indefinidamente
  const timeoutMs = 300000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  ////////////////////////////
  //ENVIAR PETICION A TIKA
  //
  const upstream =  await fetch("http://127.0.0.1:9998/tika", {
            method: "PUT",
            signal: controller.signal,
            headers: { 
              "content-type": "application/pdf",
              "accept": "text/plain"
              },
            body: req.file.buffer
        });    

  if (!upstream.ok) {
      // Mapear estado del tercero a tu API
      return res.status(502).json({
        error: "Bad Gateway",
        detalle: `Fallo del tercero (${upstream.status})`
      });
    }

  const data = await upstream.text();
  //
  //
  //////////////////////////////////
  return res.status(200).type("text/plain").send(data);;
 
});

app.listen(PORT, () => console.log(`Started on :${PORT}`));
