import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const snapshotBtn = document.getElementById("snapshot-btn");
const uploadInput = document.getElementById("upload-image");
const gestureList = document.getElementById("gesture-list");

// Update canvas size to match video container size
function resizeCanvas() {
  canvas.width = video.clientWidth;
  canvas.height = video.clientHeight;
}
window.addEventListener('resize', resizeCanvas);

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
    resizeCanvas();

    // Real-time webcam detection
    function detectVideo() {
      // Ensure canvas matches video size if it changes
      if (canvas.width !== video.clientWidth) {
          resizeCanvas();
      }
      const results = videoDetector.detectForVideo(video, performance.now());
      drawHands(results);
      requestAnimationFrame(detectVideo);
    }
    detectVideo();
  };

  // Snapshot detection
  snapshotBtn.addEventListener("click", async () => {
    // Capture from the original video stream resolution
    const snapshotCanvas = document.createElement("canvas");
    snapshotCanvas.width = video.videoWidth;
    snapshotCanvas.height = video.videoHeight;
    const snapshotCtx = snapshotCanvas.getContext("2d");
    snapshotCtx.drawImage(video, 0, 0);

    const bitmap = await createImageBitmap(snapshotCanvas);
    const results = imageDetector.detect(bitmap);
    
    // For snapshot, freeze the display to show the snapshot
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(snapshotCanvas, 0, 0, canvas.width, canvas.height);
    
    video.pause();
    drawHands(results, true);
    setTimeout(() => {
        video.play();
    }, 2000);
  });

  // Upload image detection
  uploadInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = async () => {
      // Pause live video to show uploaded image
      video.pause();
      
      const bitmap = await createImageBitmap(img);
      const results = imageDetector.detect(bitmap);
      
      // Clear and draw uploaded image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Keep aspect ratio
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width / 2) - (img.width / 2) * scale;
      const y = (canvas.height / 2) - (img.height / 2) * scale;
      
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      
      drawHands(results, true, {scale, x, y, origW: img.width, origH: img.height});
      
      // Resume video after 5 seconds
      setTimeout(() => {
          video.play();
      }, 5000);
    };
    img.src = URL.createObjectURL(file);
  });
}

// Draw hand landmarks & recognize gestures
function drawHands(results, isStaticImage = false, imgTransform = null) {
  if (!isStaticImage) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Only update list if we have handednesses or if it's currently empty
  if (!results.handednesses || results.handednesses.length === 0) {
    if (!isStaticImage) {
        gestureList.innerHTML = '<div class="empty-state">No hands detected...</div>';
    }
    return;
  }

  gestureList.innerHTML = "";

  results.handednesses.forEach((hand, index) => {
    const landmarks = results.landmarks[index];
    drawLandmarks(landmarks, imgTransform);

    const gesture = recognizeGesture(landmarks);
    
    // Create modern chip
    const div = document.createElement("div");
    div.className = "gesture-chip";
    
    const handIdSpan = document.createElement("span");
    handIdSpan.className = "hand-id";
    handIdSpan.textContent = `Hand ${index + 1}`;
    
    const gestureNameSpan = document.createElement("span");
    gestureNameSpan.className = "gesture-name";
    gestureNameSpan.textContent = gesture;
    
    div.appendChild(handIdSpan);
    div.appendChild(gestureNameSpan);
    gestureList.appendChild(div);
  });
}

// Draw landmarks with connections
function drawLandmarks(landmarks, imgTransform = null) {
  ctx.fillStyle = "#3b82f6"; // accent color
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;

  // Draw connections (bones)
  const connections = [
      [0,1], [1,2], [2,3], [3,4], // Thumb
      [0,5], [5,6], [6,7], [7,8], // Index
      [5,9], [9,10], [10,11], [11,12], // Middle
      [9,13], [13,14], [14,15], [15,16], // Ring
      [13,17], [0,17], [17,18], [18,19], [19,20] // Pinky
  ];
  
  ctx.save();
  ctx.strokeStyle = "rgba(59, 130, 246, 0.6)"; // semi-transparent accent
  ctx.lineWidth = 3;
  
  connections.forEach(([p1, p2]) => {
      const pt1 = landmarks[p1];
      const pt2 = landmarks[p2];
      
      let px1 = pt1.x * canvas.width;
      let py1 = pt1.y * canvas.height;
      let px2 = pt2.x * canvas.width;
      let py2 = pt2.y * canvas.height;
      
      if (imgTransform) {
          px1 = imgTransform.x + (pt1.x * imgTransform.origW * imgTransform.scale);
          py1 = imgTransform.y + (pt1.y * imgTransform.origH * imgTransform.scale);
          px2 = imgTransform.x + (pt2.x * imgTransform.origW * imgTransform.scale);
          py2 = imgTransform.y + (pt2.y * imgTransform.origH * imgTransform.scale);
      }
      
      ctx.beginPath();
      ctx.moveTo(px1, py1);
      ctx.lineTo(px2, py2);
      ctx.stroke();
  });
  ctx.restore();

  // Draw joints
  landmarks.forEach((point) => {
    let px = point.x * canvas.width;
    let py = point.y * canvas.height;

    // Adjust if we are drawing over a scaled uploaded image
    if (imgTransform) {
        px = imgTransform.x + (point.x * imgTransform.origW * imgTransform.scale);
        py = imgTransform.y + (point.y * imgTransform.origH * imgTransform.scale);
    }

    ctx.beginPath();
    ctx.arc(px, py, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  });
}

// Recognize simple gestures
function recognizeGesture(landmarks) {
  // Check if fingers are extended vertically
  const indexExt = landmarks[8].y < landmarks[6].y;
  const middleExt = landmarks[12].y < landmarks[10].y;
  const ringExt = landmarks[16].y < landmarks[14].y;
  const pinkyExt = landmarks[20].y < landmarks[18].y;

  // Combinations
  const fist = !indexExt && !middleExt && !ringExt && !pinkyExt;
  const openHand = indexExt && middleExt && ringExt && pinkyExt;
  const peace = indexExt && middleExt && !ringExt && !pinkyExt;
  const pointUp = indexExt && !middleExt && !ringExt && !pinkyExt;
  const rockSign = indexExt && !middleExt && !ringExt && pinkyExt;
  const middleFinger = !indexExt && middleExt && !ringExt && !pinkyExt;
  const threeFingers = indexExt && middleExt && ringExt && !pinkyExt;
  const pinkyOnly = !indexExt && !middleExt && !ringExt && pinkyExt;

  // Thumbs up: fist + thumb tip higher than index base
  const thumbUp = fist && landmarks[4].y < landmarks[5].y;
  // Thumbs down: fist + thumb tip lower than wrist
  const thumbDown = fist && landmarks[4].y > landmarks[0].y;

  // OK sign: index tip close to thumb tip, other fingers extended
  const dx = landmarks[8].x - landmarks[4].x;
  const dy = landmarks[8].y - landmarks[4].y;
  const thumbIndexDist = Math.sqrt(dx*dx + dy*dy);
  const okSign = thumbIndexDist < 0.05 && middleExt && ringExt && pinkyExt;

  if (okSign) return "OK Sign 👌";
  if (thumbUp) return "Thumbs Up 👍";
  if (thumbDown) return "Thumbs Down 👎";
  if (fist) return "Fist ✊";
  if (openHand) return "Open Hand 🖐️";
  if (peace) return "Peace Sign ✌️";
  if (pointUp) return "Pointing Up ☝️";
  if (rockSign) return "Rock / I Love You 🤘";
  if (middleFinger) return "Middle Finger 🖕";
  if (threeFingers) return "Three Fingers 3️⃣";
  if (pinkyOnly) return "Call Me / Pinky 🤙";

  return "Unknown Gesture";
}

init();
