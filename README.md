

node proxyTika.js

docker run -d --name tika  -p 9998:9998 -v $(pwd)/tika-config.xml:/tika-config.xml:ro   apache/tika:latest-full --config /tika-config.xml

docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama

docker exec -it ollama bash

ollama run qwen3:8b

Browser: GET http://localhost:3000

PDF or Image PDF to text



