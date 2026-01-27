import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const snapshotBtn = document.getElementById("snapshot-btn");
const uploadInput = document.getElementById("upload-image");
const gestureList = document.getElementById("gesture-list");

async function init() {
  // Load MediaPipe vision WASM files
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
  );

  const MODEL_URL = "/hand_landmarker.task";

  // VIDEO detector
  const videoDetector = await HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    runningMode: "VIDEO",
    numHands: 2,
  });

  // IMAGE detector
  const imageDetector = await HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    runningMode: "IMAGE",
    numHands: 2,
  });

  // Start webcam
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  video.onloadeddata = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Real-time webcam detection
    function detectVideo() {
      const results = videoDetector.detectForVideo(video, performance.now());
      drawHands(results);
      requestAnimationFrame(detectVideo);
    }
    detectVideo();
  };

  // Snapshot detection
  snapshotBtn.addEventListener("click", async () => {
    const snapshotCanvas = document.createElement("canvas");
    snapshotCanvas.width = video.videoWidth;
    snapshotCanvas.height = video.videoHeight;
    const snapshotCtx = snapshotCanvas.getContext("2d");
    snapshotCtx.drawImage(video, 0, 0);

    const bitmap = await createImageBitmap(snapshotCanvas);
    const results = imageDetector.detect(bitmap);
    drawHands(results);
  });

  // Upload image detection
  uploadInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = async () => {
      canvas.width = img.width;
      canvas.height = img.height;

      const bitmap = await createImageBitmap(img);
      const results = imageDetector.detect(bitmap);
      drawHands(results);
    };
    img.src = URL.createObjectURL(file);
  });
}

// Draw hand landmarks & recognize gestures
function drawHands(results) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0);

  gestureList.innerHTML = "";

  if (!results.handednesses) return;

  results.handednesses.forEach((hand, index) => {
    const landmarks = results.landmarks[index];
    drawLandmarks(landmarks);

    const gesture = recognizeGesture(landmarks);
    const div = document.createElement("div");
    div.className = "gesture-item";
    div.textContent = `Hand ${index + 1}: ${gesture}`;
    gestureList.appendChild(div);
  });
}

// Draw landmarks
function drawLandmarks(landmarks) {
  ctx.fillStyle = "red";
  landmarks.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x * canvas.width, point.y * canvas.height, 5, 0, 2 * Math.PI);
    ctx.fill();
  });
}

// Recognize simple gestures
function recognizeGesture(landmarks) {
  const fingerExtended = (tip, pip) => landmarks[tip].y < landmarks[pip].y;

  const thumbUp = landmarks[4].y < landmarks[3].y && !fingerExtended(8,6) && !fingerExtended(12,10);
  const peace = fingerExtended(8,6) && fingerExtended(12,10) && !fingerExtended(16,14) && !fingerExtended(20,18);
  const fist = !fingerExtended(8,6) && !fingerExtended(12,10) && !fingerExtended(16,14) && !fingerExtended(20,18);
  const openHand = fingerExtended(8,6) && fingerExtended(12,10) && fingerExtended(16,14) && fingerExtended(20,18);
  const okSign = fingerExtended(8,6) && landmarks[4].y > landmarks[3].y; // index extended, thumb curled
  const rockSign = fingerExtended(8,6) && !fingerExtended(12,10) && !fingerExtended(16,14) && fingerExtended(20,18); // index+pinkie

  if (thumbUp) return "Thumbs Up";
  if (peace) return "Peace Sign ✌️";
  if (fist) return "Fist ✊";
  if (openHand) return "Open Hand 🖐️";
  if (okSign) return "OK Sign 👌";
  if (rockSign) return "Rock Sign 🤘";

  return "Unknown Gesture";
}


init();
