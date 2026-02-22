'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Upload, Copy, ExternalLink, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { saveToHistory } from '@/utils/storage';

interface UploadResult {
    success: boolean;
    url: string;
    urls?: {
        github: string;
        raw: string;
        jsdelivr: string;
        github_commit: string;
        raw_commit: string;
        jsdelivr_commit: string;
    };
    filename: string;
    size: number;
    type: string;
    commit_sha?: string;
    github_url?: string;
    error?: string;
}

interface SelectedFile {
    id: string;
    file: File;
    url: string;
    name: string;
    status: 'pending' | 'uploading' | 'done' | 'error';
    error?: string;
}

interface ImageUploaderProps {
    onUpload?: () => void;
}

export default function ImageUploader({ onUpload }: ImageUploaderProps = {}) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [currentFolder, setCurrentFolder] = useState<string>('uploads');
    const [repoFolders, setRepoFolders] = useState<string[]>([]);
    const [foldersLoading, setFoldersLoading] = useState(false);

    const fetchFolderPaths = useCallback(async (path: string, depth: number): Promise<string[]> => {
        if (depth < 0) return [];
        const response = await fetch(`/api/list-files?path=${encodeURIComponent(path)}`);
        const data = await response.json();
        if (!data.success || !Array.isArray(data.items)) return [];
        const dirs = data.items.filter((item: { type: string }) => item.type === 'dir');
        let results: string[] = dirs.map((dir: { path: string }) => dir.path);
        if (depth > 0) {
            for (const dir of dirs) {
                const nested = await fetchFolderPaths(dir.path, depth - 1);
                results = results.concat(nested);
            }
        }
        return results;
    }, []);

    const loadRepoFolders = useCallback(async () => {
        setFoldersLoading(true);
        try {
            const folders = await fetchFolderPaths('', 2);
            const unique = Array.from(new Set(['uploads', ...folders])).sort();
            setRepoFolders(unique);
            if (!unique.includes(currentFolder)) setCurrentFolder('uploads');
        } catch { /* silent */ }
        finally { setFoldersLoading(false); }
    }, [currentFolder, fetchFolderPaths]);

    useEffect(() => { loadRepoFolders(); }, [loadRepoFolders]);

    const uploadSingleFile = useCallback(async (file: File, customName: string) => {
        const formData = new FormData();
        formData.append('file', file);
        const trimmed = customName.trim();
        if (trimmed) {
            const baseName = trimmed.replace(/\.[^/.]+$/, '');
            if (baseName) formData.append('custom_filename', baseName);
        }
        formData.append('folder', currentFolder || 'uploads');
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        return response.json();
    }, [currentFolder]);

    const handleDrag = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDragIn = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
    const handleDragOut = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);

    const isMediaFile = (file: File) => file.type.startsWith('image/') || file.type.startsWith('video/');

    const addFilesToQueue = useCallback((files: FileList | File[]) => {
        const list = Array.from(files);
        const mediaFiles = list.filter(isMediaFile);
        if (mediaFiles.length === 0) { setError('Select image or video files only.'); return; }
        setError(null);
        setSelectedFiles(prev => {
            const next = [...prev];
            for (const file of mediaFiles) {
                const url = URL.createObjectURL(file);
                const baseName = file.name.replace(/\.[^/.]+$/, '');
                next.push({
                    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
                    file, url, name: baseName, status: 'pending',
                });
            }
            return next;
        });
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) addFilesToQueue(files);
    }, [addFilesToQueue]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) { addFilesToQueue(files); e.target.value = ''; }
    }, [addFilesToQueue]);

    const handleRemoveSelected = (id: string) => setSelectedFiles(prev => prev.filter(item => item.id !== id));
    const handleRenameSelected = (id: string, name: string) =>
        setSelectedFiles(prev => prev.map(item => item.id === id ? { ...item, name } : item));

    const handleUploadSelected = async () => {
        if (selectedFiles.length === 0) return;
        setUploading(true); setError(null); setUploadResult(null);
        for (const item of selectedFiles) {
            setSelectedFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'uploading', error: undefined } : f));
            try {
                const result = await uploadSingleFile(item.file, item.name);
                if (result.success) {
                    setUploadResult(result);
                    saveToHistory({ filename: result.filename, url: result.urls?.jsdelivr_commit || result.url, github_url: result.github_url, size: result.size, type: result.type, urls: result.urls });
                    onUpload?.();
                    setSelectedFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'done' } : f));
                } else {
                    setSelectedFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error', error: result.error || 'Upload failed' } : f));
                }
            } catch (err) {
                setSelectedFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error', error: err instanceof Error ? err.message : 'Upload failed' } : f));
            }
        }
        setUploading(false);
    };

    const copyToClipboard = async (text: string) => {
        try { await navigator.clipboard.writeText(text); setCopiedUrl(text); setTimeout(() => setCopiedUrl(null), 2000); }
        catch (err) { console.error('Failed to copy:', err); }
    };

    const resetUpload = () => { setUploadResult(null); setError(null); setCopiedUrl(null); setSelectedFiles([]); };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="w-full">
            {/* Upload Result */}
            {uploadResult ? (
                <div className="brutal-card p-6 md:p-8 fade-up">
                    {/* Done header */}
                    <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: '3px solid var(--black)' }}>
                        <span className="brutal-badge brutal-badge-lime" style={{ fontSize: '0.7rem', padding: '4px 10px' }}>✓ UPLOADED</span>
                        <p className="mono text-sm font-bold">{uploadResult.filename}</p>
                        <span className="mono text-xs" style={{ color: '#666', marginLeft: 'auto' }}>{formatFileSize(uploadResult.size)}</span>
                    </div>

                    {/* Image preview */}
                    {uploadResult.type?.startsWith('image/') && (
                        <div className="mb-6" style={{ border: '3px solid var(--black)', display: 'inline-block' }}>
                            <Image
                                src={uploadResult.urls?.jsdelivr_commit || uploadResult.url}
                                alt="Uploaded"
                                width={340} height={200}
                                className="block object-contain"
                                style={{ maxHeight: '220px', width: 'auto' }}
                                unoptimized
                            />
                        </div>
                    )}

                    {/* Primary URL */}
                    {uploadResult.urls?.jsdelivr_commit && (
                        <div className="mb-4" style={{ background: 'var(--yellow)', border: '3px solid var(--black)', padding: '1rem' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <Zap size={14} />
                                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>jsDelivr CDN (Recommended)</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                                <input
                                    type="text"
                                    value={uploadResult.urls.jsdelivr_commit}
                                    readOnly
                                    className="brutal-input mono"
                                    style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem', flex: 1 }}
                                />
                                <button onClick={() => copyToClipboard(uploadResult.urls!.jsdelivr_commit)} className="brutal-btn-black brutal-btn-sm" style={{ padding: '0.5rem 1rem' }}>
                                    {copiedUrl === uploadResult.urls.jsdelivr_commit ? <CheckCircle size={14} /> : <Copy size={14} />}
                                </button>
                                <a href={uploadResult.urls.jsdelivr_commit} target="_blank" rel="noopener noreferrer" className="brutal-btn brutal-btn-sm" style={{ padding: '0.5rem 0.75rem' }}>
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Alt URLs */}
                    {uploadResult.urls && (
                        <div style={{ display: 'grid', gap: '8px', marginBottom: '1.5rem' }}>
                            {[
                                { label: 'RAW GITHUB', url: uploadResult.urls.raw_commit },
                                { label: 'JSDELIVR BRANCH', url: uploadResult.urls.jsdelivr },
                                { label: 'GITHUB SOURCE', url: uploadResult.urls.github_commit },
                            ].filter(u => u.url).map(({ label, url }) => (
                                <div key={label} style={{ border: '2px solid var(--black)', display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 0.75rem', background: 'var(--white)' }}>
                                    <span className="mono" style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', color: '#666', minWidth: '110px', textTransform: 'uppercase' }}>{label}</span>
                                    <span className="mono" style={{ fontSize: '0.7rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
                                    <button onClick={() => copyToClipboard(url)} style={{ cursor: 'pointer', background: 'none', border: 'none', padding: '2px' }}>
                                        {copiedUrl === url ? <CheckCircle size={13} color="green" /> : <Copy size={13} />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button onClick={resetUpload} className="brutal-btn-black w-full" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
                        ↑ UPLOAD ANOTHER
                    </button>
                </div>
            ) : (
                <div className="brutal-card p-6 md:p-8">
                    {/* Header */}
                    <div className="mb-6" style={{ borderBottom: '3px solid var(--black)', paddingBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1, marginBottom: '4px' }}>UPLOAD FILES</h2>
                        <p className="mono" style={{ fontSize: '0.75rem', color: '#666', letterSpacing: '0.05em' }}>Images & videos → GitHub → jsDelivr CDN</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="shake mb-4" style={{ background: '#FF3535', color: 'white', border: '3px solid var(--black)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow)' }}>
                            <AlertCircle size={16} />
                            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{error}</span>
                        </div>
                    )}

                    {/* Folder select */}
                    <div className="mb-5" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <label className="mono" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>FOLDER:</label>
                        <select
                            value={currentFolder}
                            onChange={(e) => setCurrentFolder(e.target.value)}
                            className="brutal-input"
                            style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                            disabled={uploading || foldersLoading}
                        >
                            {repoFolders.map(folder => <option key={folder} value={folder}>{folder}</option>)}
                        </select>
                        <button onClick={loadRepoFolders} className="brutal-btn-black brutal-btn-sm" disabled={uploading || foldersLoading} style={{ whiteSpace: 'nowrap' }}>
                            {foldersLoading ? '...' : '↻ SYNC'}
                        </button>
                    </div>

                    {/* Selected files queue */}
                    {selectedFiles.length > 0 && (
                        <div className="mb-5">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span className="mono" style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    {selectedFiles.length} FILE{selectedFiles.length > 1 ? 'S' : ''} QUEUED
                                </span>
                                <button onClick={() => setSelectedFiles([])} className="brutal-btn-red brutal-btn-sm" disabled={uploading}>CLEAR</button>
                            </div>
                            <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                                {selectedFiles.map(item => {
                                    const ext = item.file.name.split('.').pop() || '';
                                    const isImage = item.file.type.startsWith('image/');
                                    const isVideo = item.file.type.startsWith('video/');
                                    const statusColor = item.status === 'done' ? '#AAFF00' : item.status === 'error' ? '#FF3535' : item.status === 'uploading' ? '#FFE500' : 'var(--white)';
                                    return (
                                        <div key={item.id} style={{ border: '3px solid var(--black)', background: statusColor, boxShadow: 'var(--shadow-sm)' }}>
                                            <div style={{ aspectRatio: '16/9', background: 'var(--surface2)', overflow: 'hidden', borderBottom: '2px solid var(--black)' }}>
                                                {isImage ? (
                                                    <Image src={item.url} alt={item.file.name} width={160} height={90} className="w-full h-full object-cover" unoptimized />
                                                ) : isVideo ? (
                                                    <video src={item.url} className="w-full h-full object-cover" muted preload="metadata" />
                                                ) : null}
                                            </div>
                                            <div style={{ padding: '6px 8px' }}>
                                                <input
                                                    type="text" value={item.name}
                                                    onChange={(e) => handleRenameSelected(item.id, e.target.value)}
                                                    className="mono" style={{ width: '100%', fontSize: '0.7rem', border: '2px solid var(--black)', padding: '2px 4px', background: 'transparent', outline: 'none' }}
                                                    disabled={uploading}
                                                />
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                                    <span className="mono" style={{ fontSize: '0.6rem', opacity: 0.7 }}>.{ext} · {formatFileSize(item.file.size)}</span>
                                                    {!uploading && <button onClick={() => handleRemoveSelected(item.id)} style={{ fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none', color: 'var(--black)' }}>✕</button>}
                                                </div>
                                                {item.status === 'error' && <p className="mono" style={{ fontSize: '0.6rem', color: 'white', marginTop: '2px' }}>{item.error}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                                <button onClick={handleUploadSelected} disabled={uploading} className="brutal-btn-black" style={{ padding: '0.75rem 2rem' }}>
                                    {uploading ? '⟳ UPLOADING...' : `↑ UPLOAD ${selectedFiles.length} FILE${selectedFiles.length > 1 ? 'S' : ''}`}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Drop zone */}
                    <div
                        className={`brutal-dropzone ${isDragging ? 'dragging' : ''}`}
                        style={{ padding: '3rem 2rem', textAlign: 'center', position: 'relative', opacity: uploading ? 0.5 : 1, pointerEvents: uploading ? 'none' : 'auto' }}
                        onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
                    >
                        <input
                            type="file" accept="image/*,video/*" onChange={handleFileSelect} multiple
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                            disabled={uploading}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: 56, height: 56, background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Upload size={28} color="var(--yellow)" />
                            </div>
                            <div>
                                <p style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                                    {isDragging ? 'DROP IT HERE →' : 'DRAG & DROP'}
                                </p>
                                <p className="mono" style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                                    or click to browse · Images up to 100MB · Videos up to 500MB
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
