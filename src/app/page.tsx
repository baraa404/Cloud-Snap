'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Shield, Globe, BookOpen, Upload, Github } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import UploadHistory from '@/components/UploadHistory';
import FileBrowser from '@/components/FileBrowser';

export default function Home() {
  const [refreshHistory, setRefreshHistory] = useState(0);
  const handleNewUpload = () => setRefreshHistory(prev => prev + 1);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>

      {/* NAV */}
      <nav style={{ background: 'var(--black)', borderBottom: '3px solid var(--black)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 36, height: 36, background: 'var(--yellow)', border: '3px solid var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1 }}>
              CS
            </div>
            <span style={{ color: 'var(--white)', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>CLOUDSNAP</span>
            <span className="mono" style={{ color: '#666', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginLeft: '4px' }}>v2</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a href="https://github.com/baraa404/Colud-Snap" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#aaa', textDecoration: 'none', fontFamily: 'Space Mono, monospace', fontSize: '0.7rem', padding: '0.4rem 0.75rem', border: '2px solid #333' }}>
              <Github size={13} /> GitHub
            </a>
            <Link href="/api-docs" className="brutal-btn" style={{ fontSize: '0.75rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={13} /> API DOCS
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO BANNER */}
      <section style={{ background: 'var(--yellow)', borderBottom: '3px solid var(--black)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem 2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <div className="mono" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem', opacity: 0.6 }}>
                Free Image &amp; Video Hosting
              </div>
              <h1 style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
                YOUR FILES.<br />NO NONSENSE.
              </h1>
              <p className="mono" style={{ fontSize: '0.875rem', maxWidth: '420px', lineHeight: 1.6 }}>
                Upload images &amp; videos → GitHub repository → instant jsDelivr CDN URLs. Permanent. Fast. Free.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
              {[
                { icon: <Zap size={14} />, label: 'jsDelivr CDN' },
                { icon: <Shield size={14} />, label: 'Permanent URLs' },
                { icon: <Globe size={14} />, label: 'API Access' },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--black)', color: 'var(--white)', border: '3px solid var(--black)', padding: '6px 12px', boxShadow: '3px 3px 0 rgba(0,0,0,0.2)' }}>
                  {icon}
                  <span className="mono" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick scroll CTA */}
          <div style={{ marginTop: '2rem' }}>
            <a href="#upload" className="brutal-btn-black" style={{ padding: '0.875rem 2rem', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={16} /> START UPLOADING →
            </a>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <div style={{ background: 'var(--black)', borderBottom: '3px solid var(--black)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', overflowX: 'auto', gap: '0' }}>
            {[
              { n: '100MB', label: 'Max image size' },
              { n: '500MB', label: 'Max video size' },
              { n: '∞', label: 'Permanent URLs' },
              { n: 'CDN', label: 'jsDelivr powered' },
              { n: 'FREE', label: 'Forever' },
            ].map(({ n, label }, i) => (
              <div key={i} style={{
                flex: '1 0 auto', padding: '1rem 1.5rem', borderRight: i < 4 ? '3px solid #333' : 'none', textAlign: 'center'
              }}>
                <p style={{ color: 'var(--yellow)', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', lineHeight: 1 }}>{n}</p>
                <p className="mono" style={{ color: '#666', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '4px' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div id="upload" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <ImageUploader onUpload={handleNewUpload} />
        <FileBrowser refreshTrigger={refreshHistory} />
        <UploadHistory key={refreshHistory} onNewUpload={() => setRefreshHistory(prev => prev + 1)} />
      </div>

      {/* FOOTER */}
      <footer style={{ background: 'var(--black)', borderTop: '3px solid var(--black)', marginTop: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 28, height: 28, background: 'var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>CS</div>
            <span style={{ color: 'var(--white)', fontWeight: 800 }}>CLOUDSNAP</span>
          </div>
          <nav style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/api-docs" className="mono" style={{ color: '#666', fontSize: '0.75rem', letterSpacing: '0.05em', textDecoration: 'none' }}>API DOCS</Link>
            <a href="https://jsdelivr.com" target="_blank" rel="noopener noreferrer" className="mono" style={{ color: '#666', fontSize: '0.75rem', letterSpacing: '0.05em', textDecoration: 'none' }}>JSDELIVR CDN</a>
          </nav>
          <p className="mono" style={{ color: '#444', fontSize: '0.7rem' }}>CLOUDSNAP © 2026 · MADE BY <a href="https://github.com/baraa404" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--yellow)', textDecoration: 'none', fontWeight: 700 }}>BARAA</a></p>
        </div>
      </footer>
    </div>
  );
}
