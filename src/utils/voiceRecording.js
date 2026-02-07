import { getItem, setItem } from './storageUtils.js';

const MEMO_KEY = 'life.voiceMemos.v1';

export function loadMemos() {
  return getItem(MEMO_KEY, []);
}

export function saveMemos(list) {
  setItem(MEMO_KEY, Array.isArray(list) ? list : []);
}

export const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        const memo = {
          id: Date.now(),
          createdAt: new Date().toISOString(),
          audio: base64,
          audioUrl,
          transcript: null
        };
        const memos = loadMemos();
        saveMemos([memo, ...memos].slice(0, 100));
      };
      reader.readAsDataURL(blob);
    };

    mediaRecorder.start();
    return mediaRecorder;
  } catch (error) {
    console.error('Recording failed:', error);
    return null;
  }
};

export const stopRecording = (mediaRecorder) => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach((track) => track.stop());
  }
};

export function deleteMemo(id) {
  const memos = loadMemos();
  saveMemos(memos.filter((m) => m.id !== id));
}

