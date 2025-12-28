console.log("script.js loaded - FIXED VERSION");

const modelURL = "./model/model.json";
const metadataURL = "./model/metadata.json";

let model;
let video;
let canvas;
let ctx;
let isRunning = false;
let videoTrack;
const CONFIDENCE_THRESHOLD = 0.60; // Lowered to 60% since you're getting 50-100%

// CORRECTED: Map YOUR actual class names to tools and mouth regions
const toolConfig = {
    "red_1": {
        region: "Upper right quadrant (Maxillary right)",
        diagram: "./mouth-diagrams/mirror.png",  // Change to appropriate tool
        toolType: "Red Tool 1"
    },
    "red_2": {
        region: "Upper left quadrant (Maxillary left)",
        diagram: "./mouth-diagrams/explorer.png",  // Change to appropriate tool
        toolType: "Red Tool 2"
    },
    "blue_1": {
        region: "Lower right quadrant (Mandibular right)",
        diagram: "./mouth-diagrams/scaler.png",  // Change to appropriate tool
        toolType: "Blue Tool 1"
    },
    "blue_2": {
        region: "Lower left quadrant (Mandibular left)",
        diagram: "./mouth-diagrams/drill.png",  // Change to appropriate tool
        toolType: "Blue Tool 2"
    },
    "Nothing": {
        region: "No tool detected",
        diagram: "",
        toolType: "No Tool"
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
    
    if (typeof tmImage === 'undefined') {
        throw new Error("Teachable Machine library not loaded");
    }
    
    showStatus("Loading AI model...");
    
    try {
        model = await tmImage.load(modelURL, metadataURL);
        console.log("Model loaded successfully");
        console.log("Available classes:", model.getClassLabels().join(", "));
        
        showStatus("Model loaded! Ready to detect tools.");
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

        try {
            const capabilities = videoTrack.getCapabilities();
            if (capabilities.torch) {
                await videoTrack.applyConstraints({ 
                    advanced: [{ torch: true }] 
                });
                console.log("✓ Torch enabled");
                showStatus("Camera started with flash!");
            }
        } catch (torchErr) {
            console.log("Torch not available");
        }

        return new Promise((resolve, reject) => {
            video.onloadedmetadata = () => {
                video.play()
                    .then(() => {
                        showStatus("Ready to detect tools!");
                        resolve();
                    })
                    .catch(reject);
            };
            
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
        ctx.drawImage(video, 0, 0, 224, 224);
        const prediction = await model.predict(canvas);

        // Find best prediction
        let best = prediction[0];
        for (let p of prediction) {
            if (p.probability > best.probability) {
                best = p;
            }
        }

        const confidence = best.probability;
        const detectedClass = best.className;

        // Update confidence display
        document.getElementById("confidence").innerText =
            (confidence * 100).toFixed(1) + "%";

        console.log("Detected:", detectedClass, "at", (confidence * 100).toFixed(1) + "%");

        // Check if we have config for this class AND confidence is high enough
        if (toolConfig.hasOwnProperty(detectedClass) && confidence >= CONFIDENCE_THRESHOLD) {
            
            // Don't show info for "Nothing" class
            if (detectedClass === "Nothing") {
                document.getElementById("toolName").innerText = "No tool detected";
                document.getElementById("mouthRegion").innerText = "-";
                document.getElementById("mouthDiagram").style.display = "none";
                document.getElementById("lowConfidenceWarning").innerText = "";
            } else {
                // Show tool information
                document.getElementById("toolName").innerText = toolConfig[detectedClass].toolType;
                document.getElementById("mouthRegion").innerText = toolConfig[detectedClass].region;

                const img = document.getElementById("mouthDiagram");
                img.src = toolConfig[detectedClass].diagram;
                img.style.display = "block";

                document.getElementById("lowConfidenceWarning").innerText = "";
                
                showStatus("✓ " + toolConfig[detectedClass].toolType + " detected!");
            }

        } else {
            // Low confidence or unknown class
            document.getElementById("toolName").innerText = detectedClass || "Uncertain";
            document.getElementById("mouthRegion").innerText = "-";
            document.getElementById("mouthDiagram").style.display = "none";
            
            if (confidence < CONFIDENCE_THRESHOLD) {
                document.getElementById("lowConfidenceWarning").innerText =
                    "Confidence: " + (confidence * 100).toFixed(1) + "% (need " + (CONFIDENCE_THRESHOLD * 100) + "%+). Adjust lighting.";
            } else {
                document.getElementById("lowConfidenceWarning").innerText =
                    "Unknown class: " + detectedClass;
            }
        }

    } catch (err) {
        console.error("Prediction error:", err);
        showStatus("Prediction error: " + err.message, true);
    }

    setTimeout(() => requestAnimationFrame(predictLoop), 150);
}

// Button click handler
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM ready");
    
    const button = document.getElementById("startButton");
    
    if (!button) {
        console.error("Start button not found!");
        return;
    }

    button.addEventListener("click", async () => {
        console.log("Button clicked!");
        
        if (isRunning) {
            console.log("Already running");
            return;
        }

        button.disabled = true;
        button.innerText = "Starting...";
        
        try {
            await loadModel();
            await startCamera();

            isRunning = true;
            button.innerText = "Camera Running ✓";
            button.style.backgroundColor = "#4CAF50";
            predictLoop();

        } catch (err) {
            console.error("Startup error:", err);
            showStatus("Error: " + err.message, true);
            alert("Failed to start: " + err.message);
            
            button.disabled = false;
            button.innerText = "Start Camera";
            button.style.backgroundColor = "";
        }
    });
});
