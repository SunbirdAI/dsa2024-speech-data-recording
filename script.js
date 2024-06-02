let mediaRecorder;
let audioChunks = [];
let currentIndex = 0;
let lines = [];
let recordings = {};

document.getElementById('loadTextButton').addEventListener('click', () => {
    const textAreaValue = document.getElementById('inputTextArea').value;
    const languageCode = document.getElementById('languageCode').value.trim();
    if (!languageCode) {
        alert("Please enter a language code.");
        return;
    }

    lines = textAreaValue.split('\n').map(line => {
        const [id, text] = line.split('\t');
        return { id, text };
    }).filter(line => line.id && line.text); // Filter out invalid lines

    if (lines.length > 0) {
        currentIndex = 0;
        updateTextToRead();
        document.getElementById('recordButton').disabled = false;
        document.getElementById('prevButton').disabled = true;
        document.getElementById('nextButton').disabled = false;
        updateProgressIndicator(); // Initial progress update
    }
});

document.getElementById('recordButton').addEventListener('click', async () => {
    let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
        let id = lines[currentIndex].id;
        let languageCode = document.getElementById('languageCode').value.trim();
        let timestamp = new Date().toISOString().replace(/[-:.]/g, "");
        let filename = `${id}_${languageCode}_${timestamp}.wav`;

        let audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        audioChunks = [];
        recordings[filename] = audioBlob;

        // Check if all recordings are completed
        if (Object.keys(recordings).length === lines.length) {
            document.getElementById('downloadAllButton').style.display = 'inline-block';
        }

        // Auto advance to next prompt
        if (currentIndex < lines.length - 1) {
            currentIndex++;
        }
        updateTextToRead();
        updateProgressIndicator();
    };

    mediaRecorder.start();
    document.getElementById('recordButton').disabled = true;
    document.getElementById('stopButton').disabled = false;
});

document.getElementById('stopButton').addEventListener('click', () => {
    mediaRecorder.stop();
    document.getElementById('recordButton').disabled = false;
    document.getElementById('stopButton').disabled = true;
});

document.getElementById('prevButton').addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateTextToRead();
        updateProgressIndicator();
    }
});

document.getElementById('nextButton').addEventListener('click', () => {
    if (currentIndex < lines.length - 1) {
        currentIndex++;
        updateTextToRead();
        updateProgressIndicator();
    }
});

document.getElementById('downloadAllButton').addEventListener('click', () => {
    let zip = new JSZip();
    let folder = zip.folder("recordings");
    
    for (let filename in recordings) {
        folder.file(filename, recordings[filename]);
    }

    zip.generateAsync({ type: "blob" })
        .then(function (content) {
            let link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = "recordings.zip";
            link.click();
        });
});

function updateTextToRead() {
    document.getElementById('textToRead').textContent = lines[currentIndex].text;
    document.getElementById('prevButton').disabled = currentIndex === 0;
    document.getElementById('nextButton').disabled = currentIndex === lines.length - 1;
}

function updateProgressIndicator() {
    document.getElementById('progressIndicator').textContent = `Example ${currentIndex + 1} of ${lines.length}`;
}