const path = require('path');
const multer = require('multer');
const cors = require('cors');
const express = require('express');

const app = express();
const PORT = 3000;
app.use(express.static('public'));

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, './uploads/'),
//   filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
// });

storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//middleware habilitando cors
app.use(cors());

app.get('/ai', (req, res)=> {

    let salida = `
  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>proxyTika</title>
    <script src='/callStreamingAPI.js'></script>
</head>
<body> 
    <div id='output'>
    </div>
    <script>callStreamingAPI('${req.query.t}')</script>
</body>
</html>
`;

res.status(200).type("text/html").send(salida);

});

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

  let tokens = data.split(/\s+/)                  
                      .sort()
                      .flatMap(e => e.split(/\W+/))
                      .filter(Boolean)
                      .filter((value, index, self) => {
                          return self.indexOf(value) === index;
                        }
                      )
                      .map(t => "<a href='ai?t="+t+"'>"+t+"</a><br/>")
                      .join('\n');

  let salida = `
  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>proxyTika</title>
</head>
<body> 
    <div>
        ${tokens}
    </div>
    
</body>
</html>
  `

  //
  //
  //////////////////////////////////
  return res.status(200).type("text/html").send(salida);
 
});

app.get('/',  (req, res) => res.sendFile(path.join(__dirname, '/index.html')));

app.listen(PORT, () => console.log(`Started on :${PORT}`));
