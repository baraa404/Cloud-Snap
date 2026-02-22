'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Clock, Copy, ExternalLink, Trash2, CheckCircle, Zap } from 'lucide-react';
import { getHistory, clearHistory, type UploadHistory } from '@/utils/storage';

interface UploadHistoryProps { onNewUpload?: () => void; }

export default function UploadHistoryComponent({ onNewUpload }: UploadHistoryProps) {
    const [history, setHistory] = useState<UploadHistory[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => { setHistory(getHistory()); }, [onNewUpload]);

    const copyToClipboard = async (text: string, id: string) => {
        try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); }
        catch (err) { console.error('Failed to copy:', err); }
    };

    const handleClearHistory = () => {
        if (confirm('Clear all upload history?')) { clearHistory(); setHistory([]); }
    };

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getBestUrl = (upload: UploadHistory) =>
        upload.urls?.jsdelivr_commit || upload.urls?.jsdelivr || upload.url;

    if (history.length === 0) return null;

    return (
        <div className="brutal-card p-6 md:p-8">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '3px solid var(--black)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 40, height: 40, background: 'var(--yellow)', border: '3px solid var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Clock size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>HISTORY</h2>
                        <p className="mono" style={{ fontSize: '0.7rem', color: '#666', letterSpacing: '0.05em' }}>{history.length} UPLOAD{history.length !== 1 ? 'S' : ''}</p>
                    </div>
                </div>
                <button onClick={handleClearHistory} className="brutal-btn-red brutal-btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Trash2 size={13} /> CLEAR ALL
                </button>
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {history.map((upload) => {
                    const bestUrl = getBestUrl(upload);
                    const isCDN = bestUrl.includes('jsdelivr.net');
                    const isPermanent = !!(upload.urls?.jsdelivr_commit || upload.urls?.raw_commit);

                    return (
                        <div key={upload.id}
                            style={{ border: '3px solid var(--black)', background: 'var(--white)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.1s ease' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; }}
                        >
                            {/* Preview */}
                            <div style={{ aspectRatio: '16/9', background: 'var(--surface2)', borderBottom: '3px solid var(--black)', overflow: 'hidden', position: 'relative' }}>
                                <Image src={bestUrl} alt={upload.filename} fill className="object-cover" unoptimized />
                                {/* Badges */}
                                <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', gap: '4px', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    {isCDN && (
                                        <span className="brutal-badge brutal-badge-blue" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <Zap size={8} /> CDN
                                        </span>
                                    )}
                                    {isPermanent && (
                                        <span className="brutal-badge brutal-badge-lime">PERM</span>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div style={{ padding: '8px 10px' }}>
                                <p className="mono" style={{ fontSize: '0.7rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                                    {upload.filename}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span className="mono" style={{ fontSize: '0.6rem', color: '#666' }}>{formatFileSize(upload.size)}</span>
                                    <span className="mono" style={{ fontSize: '0.6rem', color: '#666' }}>{formatDate(upload.uploadDate)}</span>
                                </div>

                                {/* Primary cdn URL */}
                                {upload.urls?.jsdelivr_commit && (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <div style={{ flex: 1, background: 'var(--black)', border: '2px solid var(--black)', padding: '4px 6px', overflow: 'hidden' }}>
                                            <span className="mono" style={{ fontSize: '0.55rem', color: 'var(--lime)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
                                                <Zap size={8} /> CDN URL
                                            </span>
                                            <p className="mono" style={{ fontSize: '0.6rem', color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {upload.urls.jsdelivr_commit}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(upload.urls!.jsdelivr_commit, `${upload.id}-cdn`)}
                                            style={{ cursor: 'pointer', background: copiedId === `${upload.id}-cdn` ? 'var(--lime)' : 'var(--yellow)', border: '2px solid var(--black)', padding: '4px 8px', display: 'flex', alignItems: 'center' }}
                                            title="Copy CDN URL"
                                        >
                                            {copiedId === `${upload.id}-cdn` ? <CheckCircle size={12} /> : <Copy size={12} />}
                                        </button>
                                        <a href={upload.urls.jsdelivr_commit} target="_blank" rel="noopener noreferrer"
                                            style={{ background: 'var(--surface2)', border: '2px solid var(--black)', padding: '4px 6px', display: 'flex', alignItems: 'center' }}>
                                            <ExternalLink size={12} />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
