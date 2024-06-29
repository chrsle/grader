'use client';
import React, { useRef, useCallback, useEffect, useState } from 'react';
import Webcam from 'react-webcam';

const WebcamCapture = ({ onCapture, setStatus }) => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      onCapture(imageSrc);
      setStatus('Processing image...');
    } else {
      console.error("Error capturing image");
      setStatus('Error capturing image');
    }
  }, [webcamRef, onCapture, setStatus]);

  useEffect(() => {
    const interval = setInterval(capture, 3000); // Capture every 3 seconds
    return () => clearInterval(interval);
  }, [capture]);

  return (
    <>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width="100%"
        height="auto"
        videoConstraints={{ facingMode: "environment" }} // Use the rear camera on mobile devices
      />
      {capturedImage && (
        <div style={{ position: 'relative', width: '100%', height: 'auto' }}>
          <img src={capturedImage} alt="Captured" style={{ width: '100%' }} />
          <div
            style={{
              border: '2px solid red',
              position: 'absolute',
              top: '10%',
              left: '10%',
              width: '80%',
              height: '80%',
            }}
          />
        </div>
      )}
    </>
  );
};

export default WebcamCapture;
