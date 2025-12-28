console.log("Basic JS test");

document.getElementById("startButton").addEventListener("click", () => {
    alert("Button works without ML");
});



/*
console.log("script.js loaded");
alert("script.js loaded");

const modelURL = "model/model.json";
const metadataURL = "model/metadata.json";

let model;
let video;
let canvas;
let ctx;
let isRunning = false;
let videoTrack;
const CONFIDENCE_THRESHOLD = 0.75;



const toolToMouthRegion = {
    "Red_1": "Red 1 right",
    "Red_2": "Red 2 left",
    "Blue_1": "Blue 1 right",
    "Blue_2": "Blue 2 left",
    "Nothing": "Nothing here"
};


const toolConfig = {
    "Mirror": {
        region: "All quadrants (visual inspection)",
        diagram: "mouth-diagrams/mirror.png"
    },
    "Explorer": {
        region: "Occlusal surfaces",
        diagram: "mouth-diagrams/explorer.png"
    },
    "Scaler": {
        region: "Gingival margin",
        diagram: "mouth-diagrams/scaler.png"
    },
    "Drill": {
        region: "Enamel & dentin",
        diagram: "mouth-diagrams/drill.png"
    }
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
            facingMode: { exact: "environment" },
            width: 224,
            height: 224
        },
        audio: false
    });

    video.srcObject = stream;
    videoTrack = stream.getVideoTracks()[0];

    // TRY to enable flashlight (torch)
    try {
        const capabilities = videoTrack.getCapabilities();
        if (capabilities.torch) {
            await videoTrack.applyConstraints({
                advanced: [{ torch: true }]
            });
            console.log("Torch enabled");
        } else {
            console.log("Torch not supported on this device");
        }
    } catch (err) {
        console.log("Torch activation failed:", err);
    }

    return new Promise(resolve => {
        video.onloadedmetadata = () => {
            video.play();
            resolve();
        };
    });
}




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

    ctx.drawImage(video, 0, 0, 224, 224);
    const prediction = await model.predict(canvas);

    let best = prediction[0];
    for (let p of prediction) {
        if (p.probability > best.probability) {
            best = p;
        }
    }

    const confidence = best.probability;
    const toolName = best.className;

    document.getElementById("confidence").innerText =
        (confidence * 100).toFixed(1) + "%";

    if (confidence >= CONFIDENCE_THRESHOLD && toolConfig[toolName]) {
        document.getElementById("toolName").innerText = toolName;
        document.getElementById("mouthRegion").innerText =
            toolConfig[toolName].region;

        const img = document.getElementById("mouthDiagram");
        img.src = toolConfig[toolName].diagram;
        img.style.display = "block";

        document.getElementById("lowConfidenceWarning").innerText = "";
    } else {
        document.getElementById("toolName").innerText = "Uncertain";
        document.getElementById("mouthRegion").innerText = "-";

        document.getElementById("mouthDiagram").style.display = "none";
        document.getElementById("lowConfidenceWarning").innerText =
            "Low confidence. Adjust tool position and lighting.";
    }

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

*/



