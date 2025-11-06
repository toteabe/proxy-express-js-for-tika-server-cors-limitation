
function callExtractTextAPI() {

    const form = document.querySelector('form');
    form.addEventListener('submit', handleSubmit);
    
}

function handleSubmit(event) {
        event.preventDefault();
        
        uploadFiles(event.target);
}

async function uploadFiles(form) {
        
    const response = await fetch('http://localhost:3000', {
        method: 'put',
         headers: {
            'Accept': 'text/plain',            
            'Content-Type': 'application/pdf',            
          },
        body: new FormData(form)
    });
    
    const outputElement = document.getElementById('output');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    

    let done = false;
    while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
        const chunk = decoder.decode(value, { stream: true });
        console.log(chunk);
        outputElement.innerHTML += chunk;

        }
    }

}