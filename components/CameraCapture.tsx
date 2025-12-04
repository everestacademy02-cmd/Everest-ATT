import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, Timer } from 'lucide-react';
import { CameraStatus } from '../types';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  show: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose, show }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<CameraStatus>(CameraStatus.IDLE);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      // Note: Status will be set to ACTIVE in onLoadedMetadata
    } catch (err) {
      console.error("Camera access error:", err);
      setStatus(CameraStatus.DENIED);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus(CameraStatus.IDLE);
    setCountdown(null);
  }, [stream]);

  useEffect(() => {
    if (show) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      setStatus(CameraStatus.CAPTURING);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flip horizontally for mirror effect
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Small delay for visual feedback
        setTimeout(() => {
           onCapture(imageData);
           stopCamera();
        }, 300);
      }
    }
  }, [onCapture, stopCamera]);

  // Countdown Logic
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (status === CameraStatus.ACTIVE && countdown === null) {
      // Start countdown when camera becomes active
      setCountdown(3);
    }

    if (status === CameraStatus.ACTIVE && countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (status === CameraStatus.ACTIVE && countdown === 0) {
      handleCapture();
    }

    return () => clearTimeout(timer);
  }, [status, countdown, handleCapture]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-600" />
            Face Identification
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative bg-black aspect-[4/3] w-full overflow-hidden group">
          {status === CameraStatus.DENIED ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
              <div className="bg-red-500/20 p-4 rounded-full mb-4">
                <Camera className="w-8 h-8 text-red-400" />
              </div>
              <p className="font-medium">Camera access denied</p>
              <p className="text-sm text-slate-400 mt-2">Please allow camera access in your browser settings to mark attendance.</p>
              <button 
                onClick={startCamera}
                className="mt-6 px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Retry Access
              </button>
            </div>
          ) : (
            <>
               {/* Video Element */}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover transform -scale-x-100"
                onLoadedMetadata={() => {
                    if (status !== CameraStatus.CAPTURING) {
                         setStatus(CameraStatus.ACTIVE);
                    }
                }}
              />
              
              {/* Hidden Canvas for Capture */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Overlay Guide */}
              <div className="absolute inset-0 border-[40px] border-black/30 pointer-events-none">
                <div className="w-full h-full border-2 border-white/20 rounded-lg relative">
                   <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 -mt-1 -ml-1"></div>
                   <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 -mt-1 -mr-1"></div>
                   <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 -mb-1 -ml-1"></div>
                   <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 -mb-1 -mr-1"></div>
                </div>
              </div>

              {/* Countdown Overlay */}
              {status === CameraStatus.ACTIVE && countdown !== null && countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                   <div className="w-24 h-24 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-6xl font-bold text-white">{countdown}</span>
                   </div>
                </div>
              )}
              
              {/* Flash Effect */}
              {status === CameraStatus.CAPTURING && (
                <div className="absolute inset-0 bg-white animate-out fade-out duration-300 z-30"></div>
              )}
            </>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-6 bg-white flex flex-col items-center gap-4">
            <p className="text-sm text-slate-500">
                {status === CameraStatus.ACTIVE && countdown !== null 
                  ? `Auto-capturing in ${countdown} seconds...` 
                  : "Hold still for verification"}
            </p>
            <div className="flex gap-4 w-full justify-center">
                {status === CameraStatus.ACTIVE && (
                    <button
                        onClick={handleCapture}
                        className="group relative flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-md shadow-indigo-200"
                    >
                        <Camera className="w-5 h-5" />
                        Capture Now
                    </button>
                )}
                {status === CameraStatus.ERROR && (
                     <button 
                     onClick={startCamera}
                     className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
                   >
                     <RefreshCw className="w-4 h-4" />
                     Restart Camera
                   </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};