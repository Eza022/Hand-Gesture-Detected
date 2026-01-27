

# Hand Gesture Detection Web App

This project is a **web-based hand gesture detection app** built using **MediaPipe Tasks (HandLandmarker)** and **Vite**. It detects hand gestures from a **live webcam feed**, **snapshot captures**, and **uploaded images**. Detected gestures are displayed on a canvas and in a sidebar.

---

## Features

* Real-time **hand detection** via webcam
* **Snapshot capture** detection
* **Image upload** detection
* Hand landmarks visualization on canvas
* Gesture recognition for multiple gestures:

  * Thumbs Up
  * Peace Sign ✌️
  * Fist ✊
  * Open Hand 🖐️
  * OK Sign 👌
  * Rock Sign 🤘
* Sidebar displays recognized gestures and confidence

---

## Demo

![Gesture Detection Screenshot](screenshot.png) *(Optional: add a screenshot of your app here)*

---

## Technologies Used

* [MediaPipe Tasks - Vision](https://developers.google.com/mediapipe/solutions/vision)
* [Vite](https://vitejs.dev/) for fast web development
* JavaScript (ES Modules)
* HTML5 & CSS3

---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/hand-gesture-detection.git
cd hand-gesture-detection
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open the URL provided by Vite (e.g., `http://localhost:5173`) in **Chrome or Safari**.

---

## Usage

* **Webcam Detection:** Grant camera permission. The app detects hands and gestures in real-time.
* **Capture Snapshot:** Click the "Capture Snapshot" button to detect gestures from the current video frame.
* **Upload Image:** Select an image to detect hand gestures in uploaded pictures.
* Detected hand landmarks are drawn in red, and gestures are listed in the sidebar.

---

## Gesture Recognition Logic

The app recognizes gestures using **hand landmarks** (21 points per hand). Current supported gestures:

| Gesture       | Description                                  |
| ------------- | -------------------------------------------- |
| Thumbs Up     | Thumb extended, other fingers curled         |
| Peace Sign ✌️ | Index + Middle extended, others curled       |
| Fist ✊        | All fingers curled                           |
| Open Hand 🖐️ | All fingers extended                         |
| OK Sign 👌    | Index extended, thumb curled                 |
| Rock Sign 🤘  | Index + Pinky extended, Middle + Ring curled |

---

## Project Structure

```
my-gesture-detection-app/
├─ index.html        # Main HTML page
├─ main.js           # JavaScript logic for hand detection
├─ style.css         # App styling
├─ package.json      # Node project dependencies
├─ vite.config.js    # Vite configuration
└─ public/           # Static assets (optional, e.g., model files)
```

---

## Notes

* The project uses **MediaPipe HandLandmarker**, which requires a **pre-trained `.task` model**. Make sure the model file is **accessible** in your project (`public/` folder or CDN).
* Currently works best in **Chrome or Safari**. Other browsers may have limited support.
* To add more gestures, modify the `recognizeGesture` function in `main.js`.

---

## License

This project is **MIT licensed**.



