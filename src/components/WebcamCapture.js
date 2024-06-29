// 'use client';
// import React, { useRef, useCallback, useEffect, useState } from 'react';
// import Webcam from 'react-webcam';

// const WebcamCapture = ({ onCapture, setStatus }) => {
//   const webcamRef = useRef(null);
//   const [capturedImage, setCapturedImage] = useState(null);
//   const [boundingBox, setBoundingBox] = useState({ top: 0, left: 0, width: 0, height: 0 });

//   const capture = useCallback(() => {
//     const imageSrc = webcamRef.current.getScreenshot();
//     if (imageSrc) {
//       setCapturedImage(imageSrc);
//       onCapture(imageSrc);
//       setStatus('Processing image...');
//     } else {
//       console.error("Error capturing image");
//       setStatus('Error capturing image');
//     }
//   }, [webcamRef, onCapture, setStatus]);

//   useEffect(() => {
//     const interval = setInterval(capture, 3000); // Capture every 3 seconds
//     return () => clearInterval(interval);
//   }, [capture]);

//   const handleImageLoad = (e) => {
//     const img = e.target;
//     const box = {
//       top: img.naturalHeight * 0.1,
//       left: img.naturalWidth * 0.1,
//       width: img.naturalWidth * 0.8,
//       height: img.naturalHeight * 0.8,
//     };
//     setBoundingBox(box);
//   };

//   return (
//     <>
//       <Webcam
//         audio={false}
//         ref={webcamRef}
//         screenshotFormat="image/jpeg"
//         width="100%"
//         height="auto"
//         videoConstraints={{ facingMode: "environment" }} // Use the rear camera on mobile devices
//       />
//       {capturedImage && (
//         <div style={{ position: 'relative', width: '100%', height: 'auto' }}>
//           <img
//             src={capturedImage}
//             alt="Captured"
//             style={{ width: '100%' }}
//             onLoad={handleImageLoad}
//           />
//           <div
//             style={{
//               border: '2px solid red',
//               position: 'absolute',
//               top: `${boundingBox.top}px`,
//               left: `${boundingBox.left}px`,
//               width: `${boundingBox.width}px`,
//               height: `${boundingBox.height}px`,
//             }}
//           />
//         </div>
//       )}
//     </>
//   );
// };

// export default WebcamCapture;
