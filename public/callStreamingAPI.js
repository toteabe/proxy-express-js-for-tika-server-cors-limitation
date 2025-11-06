
async function callStreamingAPI(input_user) {

    //let input_user = prompt("Ask AI: ")

      try {
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'qwen3:8b',
            prompt: 'You are a IT specialist with a huge knowledge of Development Environments, can you explain shrtly the term: ' + input_user
          })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        const outputElement = document.getElementById('output');

        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;

          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const parts = chunk.split('\n').filter(Boolean);
            

            parts.forEach(part => {
              try {
                const json = JSON.parse(part);
                outputElement.innerHTML += json.response;
              } catch (err) {
                console.error('Error parsing chunk:', err);
              }
            });
          }
        }
      } catch (error) {
        console.error('Error calling the API:', error);
      }
    }