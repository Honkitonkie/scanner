import React, { useEffect, useRef, useState } from 'react';
import { Group, Stack, Text, Image, Progress, Button } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { createWorker } from 'tesseract.js';
import Webcam from "react-webcam";

const Home = () => {
  const [imageData, setImageData] = useState<null | string>(null);
  const loadFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageDataUri = reader.result;
      setImageData(imageDataUri as string);
    };
    reader.readAsDataURL(file);
  };


      const [image,setImage]=useState('');
    const webcamRef = React.useRef(null);

    
    const capture = React.useCallback(
        () => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImage(imageSrc)
        });



  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('idle');
  const [ocrResult, setOcrResult] = useState('');

  const workerRef = useRef<Tesseract.Worker | null>(null);
  useEffect(() => {
    workerRef.current = createWorker({
      logger: message => {
        if ('progress' in message) {
          setProgress(message.progress);
          setProgressLabel(message.progress == 1 ? 'Done' : message.status);
        }
      }
    });
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    }
  }, []);

  const handleExtract = async () => {
    setProgress(0);
    setProgressLabel('starting');

    const worker = workerRef.current!;
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    const response = await worker.recognize(imageData!);
    setOcrResult(response.data.text);
    console.log(response.data);
  };

  return (<>
    <Group align='initial' style={{ padding: '10px' }}>
      <Stack style={{ flex: '1' }}>
        <Dropzone
          onDrop={(files) => loadFile(files[0])}
          accept={IMAGE_MIME_TYPE}
          multiple={false}
        >{() => (
          <Text size="xl" inline>
            Drag image here or click to select file
          </Text>
        )}</Dropzone>

                 <div className="webcam-container">
            
            <div className="webcam-img">
                {/* {image == '' ? <Webcam
              audio={false}
              height={200}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width={220}
              videoConstraints={{
                width: 220,
                height: 200,
                facingMode: "user"
              }} */}
              <input type="file" accept="image/*" capture="environment"></input>
                {image == '' ? <Webcam
              audio={false}
              height={200}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width={220}
              videoConstraints={{
                width: 220,
                height: 200,
                facingMode: "user"
              }}
                /> : <img src={image} />}
            </div>
            <div>
                {image != '' ?
                    <div>
                    <button onClick={(e) => {
                        e.preventDefault();
                        setImage('')
                    }}
                        className="webcam-btn">
                            Retake Image</button>
                        {/* USE THIS PICTURE BUTTON */}
                    <button onClick={(e) => {
                        e.preventDefault();
                        setImageData(image as string);
                    }}
                        className="webcam-btn">
                            Use</button>
                    </div> :
                    <button onClick={(e) => {
                        e.preventDefault();
                        capture();
                    }}
                        className="webcam-btn">Capture</button>
                }
            </div>
        </div>
        
        
        {!!imageData && <Image src={imageData} style={{ width: '100%' }} />}
      </Stack>

      <Stack style={{ flex: '1' }}>
        <Button disabled={!imageData || !workerRef.current} onClick={handleExtract}>Extract</Button>
        <Text>{progressLabel.toUpperCase()}</Text>
        <Progress value={progress * 100} />

        {!!ocrResult && <Stack>
          <Text size='xl'>RESULT</Text>
          <Text style={{ fontFamily: 'monospace', background: 'black', padding: '10px' }}>{ocrResult}</Text>
        </Stack>}
      </Stack>
    </Group>
  </>);
}

export default Home;