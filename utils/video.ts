export const extractFramesFromVideo = (videoFile: File, framesToExtract: number): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(videoFile);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      return reject(new Error('Contexto do Canvas 2D não está disponível.'));
    }

    const frames: string[] = [];

    video.onloadedmetadata = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;
      
      if (duration === 0 || !isFinite(duration)) {
          URL.revokeObjectURL(video.src);
          return reject(new Error("Não foi possível determinar a duração do vídeo. O arquivo pode estar corrompido."));
      }

      const interval = duration / (framesToExtract + 1);

      for (let i = 1; i <= framesToExtract; i++) {
        const time = interval * i;
        await seekToTime(video, time);
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        frames.push(canvas.toDataURL('image/jpeg', 0.8));
      }

      URL.revokeObjectURL(video.src);
      resolve(frames);
    };

    video.onerror = (e) => {
      URL.revokeObjectURL(video.src);
      reject(new Error(`Erro ao carregar o vídeo: ${e}`));
    };
  });
};

const seekToTime = (video: HTMLVideoElement, time: number): Promise<void> => {
    return new Promise((resolve) => {
        const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            resolve();
        };
        video.addEventListener('seeked', onSeeked);
        video.currentTime = time;
    });
};
