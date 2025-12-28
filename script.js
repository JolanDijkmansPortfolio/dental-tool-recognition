const modelURL = "model/model.json";
const metadataURL = "model/metadata.json";

let model;
let video;
let canvas;
let ctx;
let isRunning = false;


const toolToMouthRegion = {
    "Red_1": "Red 1 right",
    "Red_2": "Red 2 left",
    "Blue_1": "Blue 1 right",
    "Blue_2": "Blue 2 left",
    "Nothing": "Nothing here"
};


async function loadModel() {
    model = await tmImage.load(modelURL, metadataURL);
    console.log("Model loaded");
}



async function startCamera() {
    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    const stream = await navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: "environment",
            width: 224,
            height: 224
        },
        audio: false
    });

    video.srcObject = stream;

    return new Promise(resolve => {
        video.onloadedmetadata = () => {
            video.play();
            resolve();
        };
    });
}


async function predictLoop() {
    if (!isRunning) return;

    // Draw video frame to canvas at 224x224
    ctx.drawImage(video, 0, 0, 224, 224);

    // Run prediction
    const prediction = await model.predict(canvas);

    // Get highest probability
    let best = prediction[0];
    for (let p of prediction) {
        if (p.probability > best.probability) {
            best = p;
        }
    }

    // Update UI
    document.getElementById("toolName").innerText = best.className;
    document.getElementById("confidence").innerText =
        (best.probability * 100).toFixed(1) + "%";

    document.getElementById("mouthRegion").innerText =
        toolToMouthRegion[best.className] || "Unknown";

    // Control prediction rate (important for iPhone)
    setTimeout(() => requestAnimationFrame(predictLoop), 150);
}


document.getElementById("startButton").addEventListener("click", async () => {
    if (isRunning) return;

    isRunning = true;
    document.getElementById("startButton").innerText = "Camera Running";

    await loadModel();
    await startCamera();
    predictLoop();
});




