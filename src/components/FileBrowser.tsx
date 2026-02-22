'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Folder, File, Image as ImageIcon, Trash2, ExternalLink, ChevronRight, RefreshCw, Copy, CheckCircle, Zap, FolderPlus } from 'lucide-react';

interface FileItem {
    name: string;
    path: string;
    type: 'file' | 'dir';
    size?: number;
    sha: string;
    download_url?: string;
    html_url?: string;
    commit_sha?: string;
    jsdelivr_url?: string;
    raw_url?: string;
}

interface FileBrowserProps { refreshTrigger?: number; }

export default function FileBrowser({ refreshTrigger }: FileBrowserProps = {}) {
    const [currentPath, setCurrentPath] = useState<string>('');
    const [items, setItems] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingFile, setDeletingFile] = useState<string | null>(null);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [folderError, setFolderError] = useState<string | null>(null);
    const [deletingFolder, setDeletingFolder] = useState(false);

    const fetchFiles = async (path: string = '') => {
        setLoading(true); setError(null);
        try {
            const response = await fetch(`/api/list-files?path=${encodeURIComponent(path)}`);
            const data = await response.json();
            if (data.success) { setItems(data.items); setCurrentPath(path); }
            else setError(data.error || 'Failed to load files');
        } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load files'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchFiles(currentPath); }, [currentPath, refreshTrigger]);

    const handleDeleteFile = async (item: FileItem) => {
        if (!confirm(`Delete "${item.name}"?`)) return;
        setDeletingFile(item.path);
        try {
            const response = await fetch('/api/delete-file', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: item.path, sha: item.sha }) });
            const data = await response.json();
            if (data.success) await fetchFiles(currentPath);
            else alert(data.error || 'Failed to delete file');
        } catch (err) { alert(err instanceof Error ? err.message : 'Failed to delete file'); }
        finally { setDeletingFile(null); }
    };

    const handleCreateFolder = async () => {
        const trimmed = newFolderName.trim();
        if (!trimmed) return;
        setCreatingFolder(true); setFolderError(null);
        try {
            const fullPath = currentPath ? `${currentPath}/${trimmed}` : trimmed;
            const response = await fetch('/api/create-folder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: fullPath }) });
            const data = await response.json();
            if (!data.success) { setFolderError(data.error || 'Failed to create folder'); return; }
            setNewFolderName(''); setShowCreateFolder(false); await fetchFiles(currentPath);
        } catch (err) { setFolderError(err instanceof Error ? err.message : 'Failed to create folder'); }
        finally { setCreatingFolder(false); }
    };

    const handleDeleteFolder = async () => {
        if (!currentPath) return;
        const folderName = currentPath.split('/').filter(Boolean).pop() || '';
        const confirmation = prompt(`Type "${folderName}" to confirm deletion:`);
        if (confirmation !== folderName) return;
        setDeletingFolder(true); setFolderError(null);
        try {
            const response = await fetch('/api/delete-folder', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: currentPath }) });
            const data = await response.json();
            if (!data.success) { setFolderError(data.error || 'Failed to delete folder'); return; }
            const parentPath = currentPath.split('/').slice(0, -1).join('/');
            await fetchFiles(parentPath);
        } catch (err) { setFolderError(err instanceof Error ? err.message : 'Failed to delete folder'); }
        finally { setDeletingFolder(false); }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'N/A';
        const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const isImageFile = (filename: string) => ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'].some(ext => filename.toLowerCase().endsWith(ext));
    const isVideoFile = (filename: string) => ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'].some(ext => filename.toLowerCase().endsWith(ext));

    const getUrls = (item: FileItem) => ({ jsdelivr: item.jsdelivr_url || '', raw: item.raw_url || '', github: item.html_url || '' });

    const copyToClipboard = async (text: string) => {
        try { await navigator.clipboard.writeText(text); setCopiedUrl(text); setTimeout(() => setCopiedUrl(null), 2000); }
        catch (err) { console.error('Failed to copy:', err); }
    };

    const pathSegments = currentPath.split('/').filter(Boolean);
    const folders = items.filter(item => item.type === 'dir');
    const mediaFiles = items.filter(item => item.type === 'file' && (isImageFile(item.name) || isVideoFile(item.name)));

    return (
        <div className="brutal-card p-6 md:p-8">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '3px solid var(--black)' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1, marginBottom: '4px' }}>FILE GALLERY</h2>
                    <p className="mono" style={{ fontSize: '0.7rem', color: '#666', letterSpacing: '0.05em' }}>
                        /{currentPath || 'root'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => setShowCreateFolder(prev => !prev)} className="brutal-btn-black brutal-btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FolderPlus size={13} /> NEW FOLDER
                    </button>
                    {currentPath && (
                        <button onClick={handleDeleteFolder} disabled={deletingFolder} className="brutal-btn-red brutal-btn-sm">
                            {deletingFolder ? '...' : '✕ DEL FOLDER'}
                        </button>
                    )}
                    <button onClick={() => fetchFiles(currentPath)} disabled={loading} className="brutal-btn brutal-btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> REFRESH
                    </button>
                </div>
            </div>

            {/* Create folder form */}
            {showCreateFolder && (
                <div className="mb-5" style={{ background: 'var(--yellow)', border: '3px solid var(--black)', padding: '1rem', boxShadow: 'var(--shadow)' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <input
                            type="text" value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                            placeholder={currentPath ? `folder name inside ${currentPath}` : 'folder-name or path/to/folder'}
                            className="brutal-input mono" style={{ flex: 1, minWidth: '200px' }}
                        />
                        <button onClick={handleCreateFolder} disabled={creatingFolder} className="brutal-btn-black">
                            {creatingFolder ? '...' : 'CREATE →'}
                        </button>
                        <button onClick={() => { setShowCreateFolder(false); setNewFolderName(''); setFolderError(null); }} className="brutal-btn-white">
                            CANCEL
                        </button>
                    </div>
                    {folderError && <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--red)', fontWeight: 700, marginTop: '6px' }}>{folderError}</p>}
                </div>
            )}

            {/* Breadcrumb */}
            {pathSegments.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                    <button onClick={() => fetchFiles('')} className="brutal-badge brutal-badge-black" style={{ cursor: 'pointer', border: '2px solid var(--black)' }}>ROOT</button>
                    {pathSegments.map((segment, index) => {
                        const segmentPath = pathSegments.slice(0, index + 1).join('/');
                        return (
                            <div key={segmentPath} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ChevronRight size={12} />
                                <button onClick={() => fetchFiles(segmentPath)} className="brutal-badge brutal-badge-yellow" style={{ cursor: 'pointer' }}>{segment}</button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Error */}
            {error && (
                <div style={{ background: 'var(--red)', color: 'white', border: '3px solid var(--black)', padding: '0.75rem 1rem', fontWeight: 700, marginBottom: '1rem', boxShadow: 'var(--shadow)' }}>
                    {error}
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <div style={{ width: 48, height: 48, border: '4px solid var(--black)', borderTopColor: 'var(--yellow)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                    <p className="mono" style={{ fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.08em' }}>LOADING FILES...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', border: '3px dashed var(--black)' }}>
                    <Folder size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p className="mono" style={{ fontWeight: 700, letterSpacing: '0.08em' }}>NO FILES FOUND</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Folders */}
                    {folders.length > 0 && (
                        <div>
                            <div className="brutal-section-header">FOLDERS ({folders.length})</div>
                            <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                                {folders.map(item => (
                                    <button key={item.path} onClick={() => fetchFiles(item.path)}
                                        style={{ background: 'var(--yellow)', border: '3px solid var(--black)', boxShadow: 'var(--shadow-sm)', padding: '1rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.1s ease', fontFamily: 'inherit' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; }}
                                    >
                                        <Folder size={32} style={{ margin: '0 auto 8px' }} />
                                        <p className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Media Files */}
                    {mediaFiles.length > 0 && (
                        <div>
                            <div className="brutal-section-header">MEDIA FILES ({mediaFiles.length})</div>
                            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                                {mediaFiles.map(item => {
                                    const urls = getUrls(item);
                                    const isImage = isImageFile(item.name);
                                    const isVideo = isVideoFile(item.name);
                                    return (
                                        <div key={item.path} style={{ border: '3px solid var(--black)', background: 'var(--white)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.1s ease' }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; }}
                                        >
                                            {/* Preview */}
                                            <div style={{ aspectRatio: '16/9', background: 'var(--surface2)', borderBottom: '3px solid var(--black)', overflow: 'hidden', position: 'relative' }}>
                                                {isImage && item.download_url ? (
                                                    <Image src={item.download_url} alt={item.name} fill className="object-cover" unoptimized />
                                                ) : isVideo && item.download_url ? (
                                                    <video src={item.download_url} controls preload="metadata" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                                        <File size={32} style={{ opacity: 0.3 }} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Meta */}
                                            <div style={{ padding: '8px 10px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px', marginBottom: '8px' }}>
                                                    <div style={{ minWidth: 0 }}>
                                                        <p className="mono" style={{ fontSize: '0.7rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                                                        <p className="mono" style={{ fontSize: '0.6rem', color: '#666' }}>{formatFileSize(item.size)}</p>
                                                    </div>
                                                    <button onClick={() => handleDeleteFile(item)} disabled={deletingFile === item.path}
                                                        style={{ flexShrink: 0, cursor: 'pointer', background: 'var(--red)', border: '2px solid var(--black)', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deletingFile === item.path ? 0.5 : 1 }}>
                                                        <Trash2 size={11} color="white" className={deletingFile === item.path ? 'animate-pulse' : ''} />
                                                    </button>
                                                </div>

                                                {/* jsDelivr URL */}
                                                {urls.jsdelivr && (
                                                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                                                        <div style={{ flex: 1, background: 'var(--black)', border: '2px solid var(--black)', padding: '4px 6px', overflow: 'hidden' }}>
                                                            <span className="mono" style={{ fontSize: '0.55rem', color: 'var(--lime)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px', fontWeight: 700 }}>
                                                                <Zap size={9} /> CDN
                                                            </span>
                                                            <p className="mono" style={{ fontSize: '0.6rem', color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{urls.jsdelivr}</p>
                                                        </div>
                                                        <button onClick={() => copyToClipboard(urls.jsdelivr)} style={{ cursor: 'pointer', background: copiedUrl === urls.jsdelivr ? 'var(--lime)' : 'var(--yellow)', border: '2px solid var(--black)', padding: '4px 6px', display: 'flex', alignItems: 'center' }}>
                                                            {copiedUrl === urls.jsdelivr ? <CheckCircle size={12} /> : <Copy size={12} />}
                                                        </button>
                                                        <a href={urls.jsdelivr} target="_blank" rel="noopener noreferrer"
                                                            style={{ background: 'var(--surface2)', border: '2px solid var(--black)', padding: '4px 6px', display: 'flex', alignItems: 'center' }}>
                                                            <ExternalLink size={12} />
                                                        </a>
                                                    </div>
                                                )}

                                                {/* Raw URL */}
                                                {urls.raw && (
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <div style={{ flex: 1, background: 'var(--surface2)', border: '2px solid var(--black)', padding: '4px 6px', overflow: 'hidden' }}>
                                                            <span className="mono" style={{ fontSize: '0.55rem', color: '#666', display: 'block', marginBottom: '2px', fontWeight: 700 }}>RAW</span>
                                                            <p className="mono" style={{ fontSize: '0.6rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{urls.raw}</p>
                                                        </div>
                                                        <button onClick={() => copyToClipboard(urls.raw)} style={{ cursor: 'pointer', background: copiedUrl === urls.raw ? 'var(--lime)' : 'var(--surface)', border: '2px solid var(--black)', padding: '4px 6px', display: 'flex', alignItems: 'center' }}>
                                                            {copiedUrl === urls.raw ? <CheckCircle size={12} /> : <Copy size={12} />}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Non-media files hint */}
                    {items.filter(i => i.type === 'file').length > mediaFiles.length && (
                        <div style={{ textAlign: 'center', padding: '1rem', border: '2px dashed #ccc' }}>
                            <ImageIcon size={20} style={{ margin: '0 auto 4px', opacity: 0.4 }} />
                            <p className="mono" style={{ fontSize: '0.7rem', color: '#999' }}>{items.filter(i => i.type === 'file').length - mediaFiles.length} NON-MEDIA FILE(S) HIDDEN</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
