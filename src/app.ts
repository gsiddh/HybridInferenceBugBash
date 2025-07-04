import {
    getAI,
    getGenerativeModel,
    GenerateContentRequest,
    VertexAIBackend,
    GoogleAIBackend
} from "firebase/ai";


import { initializeApp } from "firebase/app";


const firebaseConfig = {
    apiKey: "*",
    authDomain: "vertexaiinfirebase-test.firebaseapp.com",
    projectId: "vertexaiinfirebase-test",
    storageBucket: "vertexaiinfirebase-test.firebasestorage.app",
    messagingSenderId: "857620473716",
    appId: "1:857620473716:web:8c803ada68ede9b2bb6e21"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize the Vertex AI service
// const vertexAI = getVertexAI(app);
const vertexAI = getAI(app, { backend: new VertexAIBackend() });

// Instantiate a Firebase Generative Model object with Vertex AI backend
// Default cloud model: gemini-2.0-flash-lite-001
const vertexAiHybridModel = getGenerativeModel(vertexAI, {
    mode: 'prefer_on_device',
});

// TEST: Try different modes:
// 
// 'prefer_on_device': Does hybrid inference. If on-device model is available, 
//                     then use it else, fallback to cloud.
//
// 'only_on_device':   Does on-device inference only. If on-device is not available, 
//                     the inference should fail.
//
// 'ony_in_cloud':     Does in-cloud inference only. No on-device inference, even if 
//                     available.


// TEST: Try different cloud models. Supported models: http://shortn/_OZTOSktZze.
// const vertexAiHybridModel = getGenerativeModel(vertexAI, {
//     mode: 'prefer_on_device',
//     inCloudParams: {
//         model: 'gemini-2.0-flash-001',
//     }
// });

// Initialize the Google AI (a.k.a. Developer API) service
const googleAI = getAI(app, { backend: new GoogleAIBackend() });

// Instantiate a Firebase Generative Model object with Google AI backend
const googleAiHybridModel = getGenerativeModel(googleAI, {
    mode: 'prefer_on_device',
});


// Main logic of doing text only inference
async function doTextOnlyInference(prompt: string, outputField: HTMLInputElement) {
    console.log("inference running for: ", prompt);

    // TEST: Try with vertexAiHybridModel and googleAiHybridModel
    const inferenceRes = await googleAiHybridModel.generateContentStream(prompt);

    for await (const chunk of inferenceRes.stream) {
        outputField.value += chunk.text();
        outputField.scrollTop = outputField.scrollHeight;   
    } 
    const outputLen = outputField.value.length;
    

    // TEST: Try with non-streaming inference using this code
    // const inferenceRes = await googleAiHybridModel.generateContent(prompt);
    // const outputLen = inferenceRes.response.text().length;
    // outputField.value = inferenceRes.response.text();
    // outputField.scrollTop = outputField.scrollHeight;
}


// Main logic of doing text and image inference
async function doTextAndImageInference(prompt: string, imageFile: Blob, outputField: HTMLInputElement) {
    console.log("inference running w/ image for: ", prompt);

    const inlineImageData = await fileToGenerativePart(imageFile);
    
    // Construct GenerateContentRequest to pass to VinF SDK
    const request = { contents: [{ role: 'user', parts: [{ text: prompt }, inlineImageData] }] } as GenerateContentRequest

    // TEST: Try with vertexAiHybridModel and googleAiHybridModel
    const inferenceRes = await googleAiHybridModel.generateContentStream(request);
    
    for await (const chunk of inferenceRes.stream) {
        outputField.value += chunk.text();
        outputField.scrollTop = outputField.scrollHeight;   
    }
    const outputLen = outputField.value.length;

    // TEST: Try with non-streaming inference using this code
    // const inferenceRes = await googleAiHybridModel.generateContent(request);
    // const outputLen = inferenceRes.response.text().length;
    // outputField.value = inferenceRes.response.text();
    // outputField.scrollTop = outputField.scrollHeight;
}




// ----------------------------------------------------------------
// ----------------------------------------------------------------
// Ignore all the code below this - it is all boiler plate code.---
// ----------------------------------------------------------------
// ----------------------------------------------------------------

async function textOnlyInference() {
    const inputField = document.getElementById('textOnlyInputField') as HTMLInputElement;
    const outputField = document.getElementById('textOnlyOutputArea') as HTMLInputElement;
    const timeLabel = document.getElementById('textOnlytimeLabel') as HTMLParagraphElement;
    const wordCount = document.getElementById('textOnlyWordCount') as HTMLParagraphElement;
    const wordsPerSecond = document.getElementById('textOnlyWordsPerSecond') as HTMLParagraphElement;

    timeLabel.textContent =`Time Taken ... ?`;
    wordCount.textContent = `Word Count ... ?`;
    wordsPerSecond.textContent = `Words per second ... ?`;
    outputField.value = "";


    const prompt = inputField.value;

    const start = performance.now();
    await doTextOnlyInference(prompt, outputField)
    const end = performance.now();

    const words = outputField.value.trim().split(/\s+/);
    const numWords = words.length;
    const duration = (end - start) / 1000;
    const wps = numWords / duration;
    timeLabel.textContent = `Inference took ${duration.toFixed(2)} seconds`;
    wordCount.textContent = `Num words is ${numWords}`;
    wordsPerSecond.textContent = `Words per second are ${wps.toFixed(2)}`
}


async function textAndImageInference() {
    const inputField = document.getElementById('textAndImageInputField') as HTMLInputElement;
    const outputField = document.getElementById('textAndImageOutputArea') as HTMLInputElement;
    const timeLabel = document.getElementById('textAndImageTimeLabel') as HTMLParagraphElement;
    const wordCount = document.getElementById('textAndImageWordCount') as HTMLParagraphElement;
    const wordsPerSecond = document.getElementById('textAndImageWordsPerSecond') as HTMLParagraphElement;

    timeLabel.textContent =`Time Taken ... ?`;
    wordCount.textContent = `Word Count ... ?`;
    wordsPerSecond.textContent = `Words per second ... ?`;
    outputField.value = ""

    // Load prompt
    const prompt = inputField.value;

    // Load image
    const fileInputEl = document.querySelector('input[type=file]') as HTMLInputElement;
    if (!fileInputEl || !fileInputEl.files) {
        console.error("Failed to load image file");
        return;
    }

    const start = performance.now();
    await doTextAndImageInference(prompt, fileInputEl.files[0], outputField)
    const end = performance.now();

    const words = outputField.value.trim().split(/\s+/);
    const numWords = words.length;
    const duration = (end - start) / 1000;
    const wps = numWords / duration;
    timeLabel.textContent = `Inference took ${duration.toFixed(2)} seconds`;
    wordCount.textContent = `Num words is ${numWords}`;
    wordsPerSecond.textContent = `Words per second are ${wps.toFixed(2)}`
}


// Converts a File object to a Part object.
async function fileToGenerativePart(file: Blob) {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      //reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            return resolve(reader.result.split(',')[1]);
        } else {
            throw new Error ("failed to read image file");
        }
      }
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  }


// --- Event Listener Setup ---
document.addEventListener('DOMContentLoaded', () => {
    const bTextOnlyInference = document.getElementById('bTextOnlyInference') as HTMLButtonElement;
    const bTextAndImageInference = document.getElementById('bTextAndImageInference') as HTMLButtonElement;

    bTextOnlyInference.addEventListener('click', () => {
        textOnlyInference();
    });

    bTextAndImageInference.addEventListener('click', () => {
        textAndImageInference();
    });
});