console.log("script.js loaded");

const modelURL = "./model/model.json";
const metadataURL = "./model/metadata.json";

let model;
let video;
let canvas;
let ctx;
let isRunning = false;
let videoTrack;
const CONFIDENCE_THRESHOLD = 0.75;

// Tool configuration
const toolConfig = {
    "Mirror": {
        region: "All quadrants (visual inspection)",
        diagram: "./mouth-diagrams/mirror.png"
    },
    "Explorer": {
        region: "Occlusal surfaces",
        diagram: "./mouth-diagrams/explorer.png"
    },
    "Scaler": {
        region: "Gingival margin",
        diagram: "./mouth-diagrams/scaler.png"
    },
    "Drill": {
        region: "Enamel & dentin",
        diagram: "./mouth-diagrams/drill.png"
    }
};

// Status message helper
function showStatus(message, isError = false) {
    const statusEl = document.getElementById("statusMessage");
    statusEl.innerText = message;
    statusEl.style.color = isError ? "#b00020" : "#333";
    console.log(message);
}

// Load Teachable Machine model
async function loadModel() {
    console.log("Loading Teachable Machine model...");
    
    // Check if tmImage is available
    if (typeof tmImage === 'undefined') {
        throw new Error("Teachable Machine library not loaded");
    }
    
    showStatus("Loading AI model...");
    
    try {
        model = await tmImage.load(modelURL, metadataURL);
        console.log("Model loaded successfully");
        showStatus("Model loaded successfully!");
        return true;
    } catch (err) {
        console.error("Model load error:", err);
        showStatus("Failed to load model: " + err.message, true);
        throw err;
    }
}

// Start camera with iOS-compatible settings
async function startCamera() {
    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    showStatus("Requesting camera access...");

    try {
        // iOS Safari compatible constraints - use 'ideal' instead of 'exact'
        const constraints = {
            video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 224 },
                height: { ideal: 224 }
            },
            audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        video.srcObject = stream;
        videoTrack = stream.getVideoTracks()[0];
        
        showStatus("Camera started!");

        // Try to enable flashlight (optional - may not work on all devices)
        try {
            const capabilities = videoTrack.getCapabilities();
            if (capabilities.torch) {
                await videoTrack.applyConstraints({ 
                    advanced: [{ torch: true }] 
                });
                console.log("✓ Torch enabled");
                showStatus("Camera started with flash!");
            } else {
                console.log("ℹ Torch not supported on this device");
            }
        } catch (torchErr) {
            console.log("Torch activation failed (non-critical):", torchErr);
            // Don't show error - torch is optional
        }

        // Wait for video to be ready
        return new Promise((resolve, reject) => {
            video.onloadedmetadata = () => {
                video.play()
                    .then(() => {
                        showStatus("Ready to detect tools!");
                        resolve();
                    })
                    .catch(reject);
            };
            
            // Timeout after 10 seconds
            setTimeout(() => reject(new Error("Video load timeout")), 10000);
        });

    } catch (err) {
        console.error("Camera error:", err);
        showStatus("Camera error: " + err.message, true);
        throw err;
    }
}

// Prediction loop
async function predictLoop() {
    if (!isRunning) return;

    try {
        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, 224, 224);
        
        // Get prediction
        const prediction = await model.predict(canvas);

        // Find best prediction
        let best = prediction[0];
        for (let p of prediction) {
            if (p.probability > best.probability) {
                best = p;
            }
        }

        const confidence = best.probability;
        const toolName = best.className;

        // Update confidence display
        document.getElementById("confidence").innerText =
            (confidence * 100).toFixed(1) + "%";

        // Check if confidence is high enough
        if (confidence >= CONFIDENCE_THRESHOLD && toolConfig[toolName]) {
            // High confidence - show tool info
            document.getElementById("toolName").innerText = toolName;
            document.getElementById("mouthRegion").innerText =
                toolConfig[toolName].region;

            const img = document.getElementById("mouthDiagram");
            img.src = toolConfig[toolName].diagram;
            img.style.display = "block";

            document.getElementById("lowConfidenceWarning").innerText = "";
        } else {
            // Low confidence or unknown tool
            document.getElementById("toolName").innerText = "Uncertain";
            document.getElementById("mouthRegion").innerText = "-";

            document.getElementById("mouthDiagram").style.display = "none";
            document.getElementById("lowConfidenceWarning").innerText =
                "Low confidence. Adjust tool position and lighting.";
        }

    } catch (err) {
        console.error("Prediction error:", err);
        showStatus("Prediction error: " + err.message, true);
    }

    // Continue loop
    setTimeout(() => requestAnimationFrame(predictLoop), 150);
}

// Button click handler - wrapped in DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM ready, attaching button listener");
    
    const button = document.getElementById("startButton");
    
    if (!button) {
        console.error("Start button not found!");
        return;
    }

    button.addEventListener("click", async () => {
        console.log("Button clicked!");
        
        // Prevent multiple clicks
        if (isRunning) {
            console.log("Already running, ignoring click");
            return;
        }

        button.disabled = true;
        button.innerText = "Starting...";
        
        try {
            // Step 1: Load model
            await loadModel();

            // Step 2: Start camera
            await startCamera();

            // Step 3: Begin prediction loop
            isRunning = true;
            button.innerText = "Camera Running ✓";
            button.style.backgroundColor = "#4CAF50";
            predictLoop();

        } catch (err) {
            console.error("Startup error:", err);
            showStatus("Error: " + err.message, true);
            alert("Failed to start: " + err.message);
            
            // Reset button
            button.disabled = false;
            button.innerText = "Start Camera";
            button.style.backgroundColor = "";
        }
    });
    
    console.log("Button listener attached successfully");
});
