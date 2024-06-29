// src/components/WebcamCapture.js
'use client';
import React, { useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';

const WebcamCapture = ({ onCapture }) => {
  const webcamRef = useRef(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
    } else {
      console.error("Error capturing image");
    }
  }, [webcamRef, onCapture]);

  useEffect(() => {
    const interval = setInterval(capture, 1000); // Capture every second
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
    </>
  );
};

export default WebcamCapture;
