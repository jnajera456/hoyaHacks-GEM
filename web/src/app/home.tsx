"use client";
import { Upload, Divider, Input, message, Tag } from "antd";
import { UploadOutlined, FilePdfOutlined, VideoCameraOutlined, FileTextOutlined, CloseOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { FileParser, FileParseResult } from '@/utils/fileParser';

const { TextArea } = Input;

interface UploadedFile {
  file: File;
  parsedContent?: FileParseResult;
  status: 'uploading' | 'parsing' | 'ready' | 'error';
}

export default function Home() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [generatedDeck, setGeneratedDeck] = useState<any>(null);
  const [savedDeckId, setSavedDeckId] = useState<string | null>(null);
  const router = useRouter();

  const getFileIcon = (fileType: string) => {
    const normalized = fileType.toLowerCase();
    if (normalized.includes('pdf')) return <FilePdfOutlined style={{ color: '#fa541c' }} />;
    if (normalized.includes('video')) return <VideoCameraOutlined style={{ color: '#fa8c16' }} />;
    if (normalized.includes('audio')) return <VideoCameraOutlined style={{ color: '#faad14' }} />;
    return <FileTextOutlined style={{ color: '#fa541c' }} />;
  };

  const removeFile = (file: File) => {
    setUploadedFiles((prev) => {
      const next = prev.filter((f) => f.file !== file);
      if (prev.length === 1) {
        setText('');
      }
      return next;
    });
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      message.error('File size must be less than 10MB');
      return Upload.LIST_IGNORE;
    }

    setUploadedFiles([{ file, status: 'parsing' }]);

    try {
      const parsed = await FileParser.parseFile(file);
      setUploadedFiles([{ file, status: 'ready', parsedContent: parsed }]);
      message.success('File uploaded and parsed');
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadedFiles([{ file, status: 'error' }]);
      message.error(error?.message || 'Failed to parse file');
    }

    return Upload.LIST_IGNORE;
  };

  const handleGenerate = async () => {
    const sourceText = text.trim() || uploadedFiles[0]?.parsedContent?.text || '';
    if (!sourceText || sourceText.length < 50) {
      message.error('Provide at least 50 characters via upload or pasted text.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          fileName: uploadedFiles[0]?.file.name,
          fileType: uploadedFiles[0]?.file.type,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate study materials');
      }

      setGeneratedDeck(data.deck);
      setSavedDeckId(data.savedDeckId || null);

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('currentDeck', JSON.stringify(data.deck));
        if (data.savedDeckId) {
          sessionStorage.setItem('currentDeckId', data.savedDeckId);
        }
      }

      message.success(data.message || 'Deck generated!');
    } catch (error: any) {
      console.error('Generate error:', error);
      message.error(error?.message || 'Failed to generate deck');
    } finally {
      setLoading(false);
    }
  };



  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 py-10 space-y-8">
          {/* Hero */}
          <div
            className="overflow-hidden rounded-2xl shadow-lg"
            style={{
              backgroundImage: 'linear-gradient(90deg, #fa541c 0%, #fb6a1f 68%, #ffd166 96%)'
            }}
          >
            <div className="flex flex-col gap-4 px-6 py-8 lg:px-10 lg:py-10">
              <p className="text-sm font-semibold uppercase tracking-wide text-white/80">ReelStudy</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Upload or paste, then generate study decks fast.
              </h1>
              <p className="text-white/90 text-lg max-w-3xl">
                Turn PDFs, videos, or text into flashcards, quizzes, and visuals in seconds—then save and study.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
            {/* Left: Input Card */}
            <div className="rounded-2xl bg-white shadow-sm border border-orange-100/60 p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#303545]">Upload file</h2>
                <p className="text-sm text-[#646975]">PDF, TXT, MP4, MP3 (max 10MB). We'll parse and clean it.</p>
              </div>

              <Upload
                beforeUpload={handleFileUpload}
                maxCount={1}
                accept=".pdf,.txt,.mp4,.mov,.mp3,.wav"
                showUploadList={false}
              >
                <div className="border-2 border-dashed border-orange-200 rounded-xl p-6 text-center cursor-pointer bg-orange-50/50 hover:bg-orange-50 transition">
                  <UploadOutlined style={{ fontSize: 32, color: '#fa541c', marginBottom: 8 }} />
                  <div className="text-[#303545] font-semibold">Click to upload file</div>
                  <p className="text-sm text-[#646975] mt-1">We support PDF, TXT, MP4, MP3 up to 10MB</p>
                </div>
              </Upload>

              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-[#303545]">Uploaded File</p>
                  {uploadedFiles.map((uploadedFile, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-lg border border-orange-100 bg-orange-50/60 px-4 py-3"
                    >
                      <div className="text-xl">
                        {getFileIcon(uploadedFile.file.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#303545] truncate">{uploadedFile.file.name}</span>
                          <Tag color={
                            uploadedFile.status === 'ready' ? 'success' :
                            uploadedFile.status === 'error' ? 'error' :
                            'processing'
                          }>
                            {uploadedFile.status}
                          </Tag>
                        </div>
                        {uploadedFile.parsedContent?.metadata?.pages && (
                          <p className="text-xs text-[#646975]">{uploadedFile.parsedContent.metadata.pages} pages detected</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {uploadedFile.status === 'ready' && (
                          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                        )}
                        <button
                          onClick={() => removeFile(uploadedFile.file)}
                          className="text-[#646975] hover:text-[#303545]"
                          aria-label="Remove file"
                        >
                          <CloseOutlined />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Divider />

              <div>
                <h3 className="text-lg font-bold text-[#303545]">Paste text</h3>
                <p className="text-sm text-[#646975]">Minimum 50 characters. We normalize formatting automatically.</p>
              </div>

              <TextArea
                id="paste-text-area"
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste text here..."
                style={{ backgroundColor: '#f6f7fb', borderRadius: 10, border: '1px solid #edf0f5' }}
              />

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={() => {
                    if (generatedDeck && savedDeckId) {
                      router.push(`/results?id=${encodeURIComponent(savedDeckId)}`);
                    } else if (generatedDeck) {
                      // Fallback if no saved ID - go to account page
                      router.push('/account');
                    } else {
                      handleGenerate();
                    }
                  }}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#fa541c] px-5 py-3 text-white font-semibold shadow-sm transition hover:bg-[#ff7a45] disabled:opacity-60"
                >
                  {loading ? 'Generating...' : generatedDeck ? 'Study Deck →' : 'Generate Deck'}
                </button>
                {generatedDeck && (
                  <p className="text-sm text-green-600 font-medium">Deck saved! Click above to study.</p>
                )}
              </div>
            </div>

            {/* Right: How it works / Tips */}
            <div className="rounded-2xl bg-white shadow-sm border border-orange-100/60 p-6 space-y-5">
              <div>
                <h3 className="text-lg font-bold text-[#303545]">How it works</h3>
              </div>
              <div className="space-y-4">
                {[
                  {
                    title: 'Upload or paste',
                    desc: 'We parse PDFs, TXT, and media transcripts; or normalize your pasted text.',
                  },
                  {
                    title: 'Generate with Gemini',
                    desc: 'We send cleaned content to Gemini to build flashcards, concepts, and quizzes.',
                  },
                  {
                    title: 'Save & study',
                    desc: 'Your deck is saved in session; save to account and open the Results page to study.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="mt-1 h-8 w-8 rounded-full bg-orange-100 text-[#fa541c] flex items-center justify-center font-semibold">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-[#303545]">{item.title}</div>
                      <p className="text-sm text-[#646975]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Divider />

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-[#303545]">Quick tips</h4>
                <ul className="space-y-2 text-sm text-[#646975] list-disc list-inside">
                  <li>For PDFs, prefer text-based (not scanned) for best accuracy.</li>
                  <li>Keep pasted text concise (under 10k characters) for faster results.</li>
                  <li>Use the Results page to review, augment, and export decks.</li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}