'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle, Home, Key, Github, Cloud, Code } from 'lucide-react';

export default function APIDocumentation() {
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'curl' | 'js' | 'python'>('curl');

    const copyToClipboard = async (text: string, id: string) => {
        try { await navigator.clipboard.writeText(text); setCopiedCode(id); setTimeout(() => setCopiedCode(null), 2000); }
        catch (err) { console.error('Failed to copy:', err); }
    };

    const codeSamples = {
        curl: `curl -X POST \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@/path/to/image.png" \\
  -F "github_token=ghp_xxxxxxxxxxxx" \\
  -F "github_owner=your-username" \\
  -F "github_repo=your-repo" \\
  -F "github_branch=main" \\
  -F "folder=default" \\
  https://your-domain/api/public-upload`,

        js: `const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('github_token', 'ghp_xxxxxxxxxxxx');
formData.append('github_owner', 'your-username');
formData.append('github_repo', 'your-repo');
formData.append('github_branch', 'main');
formData.append('folder', 'default');

const response = await fetch('/api/public-upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
// result.urls.jsdelivr_commit → your permanent CDN URL
console.log(result);`,

        python: `import requests

with open('/path/to/image.png', 'rb') as f:
    files = {'file': f}
    data = {
        'github_token': 'ghp_xxxxxxxxxxxx',
        'github_owner': 'your-username',
        'github_repo': 'your-repo',
        'github_branch': 'main',
        'folder': 'default'
    }
    response = requests.post(
        'https://your-domain/api/public-upload',
        files=files,
        data=data
    )
    result = response.json()
    print(result['urls']['jsdelivr_commit'])`,
    };

    const exampleResponse = `{
  "success": true,
  "filename": "image-1703123456789.png",
  "url": "https://cdn.jsdelivr.net/gh/user/repo@abc123/default/image.png",
  "urls": {
    "github": "https://github.com/user/repo/blob/main/default/image.png",
    "raw": "https://raw.githubusercontent.com/user/repo/main/default/image.png",
    "jsdelivr": "https://cdn.jsdelivr.net/gh/user/repo@main/default/image.png",
    "github_commit": "https://github.com/user/repo/blob/abc123/default/image.png",
    "raw_commit": "https://raw.githubusercontent.com/user/repo/abc123/default/image.png",
    "jsdelivr_commit": "https://cdn.jsdelivr.net/gh/user/repo@abc123/default/image.png"
  },
  "size": 142857,
  "type": "image/png",
  "commit_sha": "abc123d4e5f6"
}`;

    const CodeBlock = ({ code, id }: { code: string; id: string }) => (
        <div style={{ border: '3px solid var(--black)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1e1e1e', borderBottom: '3px solid var(--black)', padding: '0.625rem 1rem' }}>
                <span className="mono" style={{ color: '#888', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{id}</span>
                <button onClick={() => copyToClipboard(code, id)} className="brutal-btn" style={{ padding: '4px 12px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {copiedCode === id ? <><CheckCircle size={12} /> COPIED!</> : <><Copy size={12} /> COPY</>}
                </button>
            </div>
            <pre style={{ margin: 0, padding: '1.25rem', background: '#1a1a1a', fontSize: '0.8rem', lineHeight: 1.65, color: '#AAFF00', overflowX: 'auto', fontFamily: 'Space Mono, Fira Code, monospace', whiteSpace: 'pre' }}>
                <code>{code}</code>
            </pre>
        </div>
    );

    const Section = ({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) => (
        <section style={{ borderTop: '3px solid var(--black)', paddingTop: '2.5rem', marginTop: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h2>
                {badge && <span className="brutal-badge brutal-badge-yellow">{badge}</span>}
            </div>
            {children}
        </section>
    );

    const ParamRow = ({ name, type, required, desc }: { name: string; type: string; required: boolean; desc: string }) => (
        <tr>
            <td style={{ padding: '0.75rem 1rem', borderBottom: '2px solid var(--black)', fontFamily: 'Space Mono, monospace', fontSize: '0.8rem', fontWeight: 700, color: required ? 'var(--black)' : '#555' }}>
                {name}
            </td>
            <td style={{ padding: '0.75rem 1rem', borderBottom: '2px solid var(--black)', fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', color: '#555' }}>
                {type}
            </td>
            <td style={{ padding: '0.75rem 1rem', borderBottom: '2px solid var(--black)' }}>
                <span style={{ background: required ? 'var(--red)' : 'var(--surface2)', color: required ? 'white' : '#666', border: '2px solid var(--black)', padding: '2px 8px', fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', fontWeight: 700 }}>
                    {required ? 'REQUIRED' : 'OPTIONAL'}
                </span>
            </td>
            <td style={{ padding: '0.75rem 1rem', borderBottom: '2px solid var(--black)', fontSize: '0.85rem' }}>
                {desc}
            </td>
        </tr>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
            {/* NAV */}
            <nav style={{ background: 'var(--black)', borderBottom: '3px solid var(--black)', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--white)', textDecoration: 'none', fontWeight: 700 }}>
                        <Home size={16} color="var(--yellow)" />
                        <span className="mono" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>← CLOUDSNAP</span>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <a href="https://github.com/baraa404/Cloud-Snap" target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#aaa', textDecoration: 'none', fontFamily: 'Space Mono, monospace', fontSize: '0.7rem' }}>
                            <Github size={14} /> baraa404
                        </a>
                        <span className="brutal-badge brutal-badge-yellow">API DOCS</span>
                    </div>
                </div>
            </nav>

            <div style={{ maxWidth: '960px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

                {/* HERO */}
                <div style={{ background: 'var(--yellow)', border: '3px solid var(--black)', padding: '2.5rem', boxShadow: 'var(--shadow-lg)' }}>
                    <div className="brutal-section-header" style={{ marginBottom: '1rem' }}>REFERENCE</div>
                    <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '1rem' }}>
                        CLOUDSNAP<br />API DOCS
                    </h1>
                    <p className="mono" style={{ fontSize: '0.875rem', maxWidth: '500px', lineHeight: 1.7 }}>
                        Upload images & videos to GitHub repos and get permanent CDN URLs via jsDelivr. Provide your own GitHub token — nothing is stored server-side.
                    </p>
                    <a href="https://github.com/baraa404/Cloud-Snap" target="_blank" rel="noopener noreferrer" className="brutal-btn-black" style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <Github size={14} /> VIEW ON GITHUB
                    </a>
                </div>

                {/* —— SECTION 1: Authentication —— */}
                <Section title="AUTHENTICATION" badge="IMPORTANT">
                    <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                        <div style={{ background: 'var(--white)', border: '3px solid var(--black)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                                <Key size={16} />
                                <span style={{ fontWeight: 800, fontSize: '1rem' }}>API KEY (Private Routes)</span>
                            </div>
                            <p style={{ fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                                Routes like <code style={{ background: 'var(--surface2)', padding: '2px 6px', fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', border: '2px solid #ccc' }}>/api/upload</code>, <code style={{ background: 'var(--surface2)', padding: '2px 6px', fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', border: '2px solid #ccc' }}>/api/list-files</code>, <code style={{ background: 'var(--surface2)', padding: '2px 6px', fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', border: '2px solid #ccc' }}>/api/delete-file</code> require your server-configured API key.
                            </p>
                            <div style={{ background: 'var(--black)', border: '2px solid var(--black)', padding: '0.75rem 1rem' }}>
                                <p className="mono" style={{ color: 'var(--lime)', fontSize: '0.75rem' }}><span style={{ color: '#aaa' }}>x-api-key:</span> your-api-key</p>
                                <p className="mono" style={{ color: '#555', fontSize: '0.7rem', margin: '4px 0' }}># OR</p>
                                <p className="mono" style={{ color: 'var(--lime)', fontSize: '0.75rem' }}><span style={{ color: '#aaa' }}>Authorization:</span> Bearer your-api-key</p>
                            </div>
                            <p className="mono" style={{ fontSize: '0.65rem', color: '#888', marginTop: '0.75rem' }}>Set <strong>API_KEY</strong> env var on your server.</p>
                        </div>
                        <div style={{ background: 'var(--lime)', border: '3px solid var(--black)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                                <Github size={16} />
                                <span style={{ fontWeight: 800, fontSize: '1rem' }}>PUBLIC UPLOAD</span>
                            </div>
                            <p style={{ fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                                <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', border: '2px solid rgba(0,0,0,0.2)' }}>/api/public-upload</code> is open. You provide your GitHub token in the request body directly.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {['✔ No server API key needed', '✔ Your GitHub token is used', '✔ Nothing stored server-side', '✔ Unlimited uploads'].map(item => (
                                    <p key={item} className="mono" style={{ fontSize: '0.75rem', fontWeight: 700 }}>{item}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                </Section>

                {/* —— SECTION 2: GitHub Setup —— */}
                <Section title="STEP 1 — GITHUB REPO SETUP" badge="GUIDE">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { n: '01', title: 'Create a GitHub repository', body: 'Go to github.com → New repository. Set it to Public (required for jsDelivr CDN). Name it something like "cdn" or "media-storage".' },
                            { n: '02', title: 'Generate a Personal Access Token (PAT)', body: 'GitHub → Settings → Developer Settings → Personal Access Tokens (classic) → Generate new token.\n\nRequired scope: repo (full control of repositories). Copy the token — it starts with ghp_' },
                            { n: '03', title: 'Configure your env vars', body: 'Set the following environment variables in your deployment:\n\nGITHUB_OWNER=your-username\nGITHUB_REPO=your-repo\nGITHUB_BRANCH=main\nGITHUB_TOKEN=ghp_xxx' },
                        ].map(({ n, title, body }) => (
                            <div key={n} style={{ display: 'flex', gap: '0', border: '3px solid var(--black)', background: 'var(--white)', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ background: 'var(--black)', color: 'var(--yellow)', fontWeight: 800, fontSize: '1.25rem', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', minWidth: '64px', justifyContent: 'center', borderRight: '3px solid var(--black)', flexShrink: 0 }}>{n}</div>
                                <div style={{ padding: '1rem 1.25rem' }}>
                                    <p style={{ fontWeight: 700, marginBottom: '4px' }}>{title}</p>
                                    <p className="mono" style={{ fontSize: '0.78rem', color: '#555', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* —— SECTION 3: Cloudflare —— */}
                <Section title="STEP 2 — DEPLOY TO CLOUDFLARE PAGES" badge="HOSTING">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { n: '01', title: 'Fork the CloudSnap repository', body: 'Fork https://github.com/baraa404/Cloud-Snap to your GitHub account.' },
                            { n: '02', title: 'Create a Cloudflare Pages project', body: 'Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git → Select your fork.' },
                            { n: '03', title: 'Build configuration', body: 'Build command: npm run build\nBuild output directory: .next\nNode version: 18 (set NODE_VERSION=18 in env vars)' },
                            { n: '04', title: 'Set all 6 environment variables', body: 'Go to Settings → Environment Variables and add all 6 secrets:' },
                        ].map(({ n, title, body }) => (
                            <div key={n} style={{ display: 'flex', gap: '0', border: '3px solid var(--black)', background: 'var(--white)', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ background: 'var(--black)', color: 'var(--yellow)', fontWeight: 800, fontSize: '1.25rem', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', minWidth: '64px', justifyContent: 'center', borderRight: '3px solid var(--black)', flexShrink: 0 }}>{n}</div>
                                <div style={{ padding: '1rem 1.25rem' }}>
                                    <p style={{ fontWeight: 700, marginBottom: '4px' }}>{title}</p>
                                    <p className="mono" style={{ fontSize: '0.78rem', color: '#555', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{body}</p>
                                </div>
                            </div>
                        ))}

                        {/* Env vars table */}
                        <div style={{ border: '3px solid var(--black)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
                            <div style={{ background: 'var(--yellow)', borderBottom: '3px solid var(--black)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Cloud size={14} />
                                <span style={{ fontWeight: 800, fontSize: '0.875rem' }}>Cloudflare Pages — Environment Variables</span>
                                <span className="brutal-badge brutal-badge-black" style={{ marginLeft: 'auto' }}>6 REQUIRED</span>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--white)' }}>
                                <thead>
                                    <tr style={{ background: '#1a1a1a' }}>
                                        <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontFamily: 'Space Mono, monospace', fontSize: '0.7rem', color: 'var(--lime)', letterSpacing: '0.08em', borderRight: '2px solid #333' }}>NAME</th>
                                        <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontFamily: 'Space Mono, monospace', fontSize: '0.7rem', color: 'var(--lime)', letterSpacing: '0.08em', borderRight: '2px solid #333' }}>EXAMPLE VALUE</th>
                                        <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontFamily: 'Space Mono, monospace', fontSize: '0.7rem', color: 'var(--lime)', letterSpacing: '0.08em' }}>DESCRIPTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { name: 'PIN', example: 'yourPin123', desc: 'Password to access the CloudSnap web UI' },
                                        { name: 'API_KEY', example: 'your-secret-api-key', desc: 'Key for authenticating private API routes' },
                                        { name: 'GITHUB_TOKEN', example: 'ghp_xxxxxxxxxxxx', desc: 'GitHub personal access token (repo scope)' },
                                        { name: 'GITHUB_OWNER', example: 'baraa404', desc: 'Your GitHub username' },
                                        { name: 'GITHUB_REPO', example: 'my-cdn-repo', desc: 'Repository name to store files' },
                                        { name: 'GITHUB_BRANCH', example: 'main', desc: 'Branch to upload files to' },
                                    ].map((row, i) => (
                                        <tr key={row.name} style={{ background: i % 2 === 0 ? 'var(--white)' : 'var(--surface)' }}>
                                            <td style={{ padding: '0.7rem 1rem', borderBottom: '2px solid var(--black)', borderRight: '2px solid #ddd', fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '0.8rem' }}>{row.name}</td>
                                            <td style={{ padding: '0.7rem 1rem', borderBottom: '2px solid var(--black)', borderRight: '2px solid #ddd', fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', color: '#666' }}>{row.example}</td>
                                            <td style={{ padding: '0.7rem 1rem', borderBottom: '2px solid var(--black)', fontSize: '0.82rem' }}>{row.desc}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ border: '3px solid var(--black)', background: 'var(--black)', padding: '1rem 1.25rem', boxShadow: 'var(--shadow)' }}>
                            <p className="mono" style={{ color: '#aaa', fontSize: '0.78rem', lineHeight: 1.6 }}>
                                The repo already has a <code style={{ color: 'var(--lime)' }}>wrangler.toml</code> — no extra Cloudflare config needed. Just connect your fork via the dashboard and set the env vars above.
                            </p>
                        </div>
                    </div>
                </Section>

                {/* —— SECTION 4: API Reference —— */}
                <Section title="API REFERENCE" badge="ENDPOINTS">
                    <div className="brutal-card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
                        <div style={{ background: 'var(--lime)', borderBottom: '3px solid var(--black)', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ background: 'var(--black)', color: 'var(--white)', fontFamily: 'Space Mono, monospace', fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', border: '2px solid var(--black)' }}>POST</span>
                            <code style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700 }}>/api/public-upload</code>
                            <span className="brutal-badge brutal-badge-black" style={{ marginLeft: 'auto' }}>PUBLIC</span>
                        </div>
                        <div style={{ padding: '1.25rem' }}>
                            <p style={{ marginBottom: '1rem', fontSize: '0.875rem', lineHeight: 1.6 }}>Upload to your GitHub repo and get jsDelivr CDN URLs. No server API key required — you provide GitHub credentials in the request body.</p>
                            <div className="brutal-table-wrap">
                                <table className="brutal-table">
                                    <thead><tr><th>Parameter</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
                                    <tbody>
                                        <ParamRow name="file" type="File" required desc="Image or video file (JPG, PNG, GIF, WebP, MP4, WebM…)" />
                                        <ParamRow name="github_token" type="string" required desc="GitHub personal access token (ghp_xxx)" />
                                        <ParamRow name="github_owner" type="string" required desc="GitHub username or organization" />
                                        <ParamRow name="github_repo" type="string" required desc="Repository name" />
                                        <ParamRow name="github_branch" type="string" required={false} desc="Branch (default: main)" />
                                        <ParamRow name="folder" type="string" required={false} desc="Upload folder path (default: default)" />
                                        <ParamRow name="custom_filename" type="string" required={false} desc="Custom filename without extension" />
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                        {[
                            { method: 'POST', path: '/api/upload', auth: 'API KEY', color: '#0055FF', textColor: 'white', desc: 'Upload using server-configured GitHub credentials. Requires API key header.' },
                            { method: 'GET', path: '/api/list-files', auth: 'API KEY', color: '#0055FF', textColor: 'white', desc: 'List files in the repository. Query param: ?path=folder' },
                            { method: 'DELETE', path: '/api/delete-file', auth: 'API KEY', color: '#FF3535', textColor: 'white', desc: 'Delete a file. Body: { path, sha }' },
                            { method: 'POST', path: '/api/create-folder', auth: 'API KEY', color: '#0055FF', textColor: 'white', desc: 'Create a folder placeholder. Body: { path }' },
                        ].map(({ method, path, auth, color, textColor, desc }) => (
                            <div key={path} style={{ background: 'var(--white)', border: '3px solid var(--black)', padding: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ background: color, color: textColor, fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', border: '2px solid var(--black)' }}>{method}</span>
                                    <code style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', fontWeight: 700 }}>{path}</code>
                                    <span className="brutal-badge brutal-badge-black" style={{ fontSize: '0.55rem', marginLeft: 'auto' }}>{auth}</span>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: '#555', lineHeight: 1.5 }}>{desc}</p>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* —— SECTION 5: Code Examples —— */}
                <Section title="CODE EXAMPLES" badge="USAGE">
                    <div style={{ marginBottom: '1rem' }}>
                        <div className="brutal-tabs">
                            {(['curl', 'js', 'python'] as const).map(tab => (
                                <button key={tab} className={`brutal-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                                    {tab === 'js' ? 'JAVASCRIPT' : tab.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <CodeBlock code={codeSamples[activeTab]} id={activeTab === 'js' ? 'javascript' : activeTab} />
                    </div>

                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0' }}>
                            <Code size={16} />
                            <span style={{ fontWeight: 800, fontSize: '1rem' }}>EXAMPLE RESPONSE</span>
                        </div>
                        <CodeBlock code={exampleResponse} id="response" />
                    </div>
                </Section>

                {/* —— SECTION 6: URL Types —— */}
                <Section title="URL TYPES EXPLAINED">
                    <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                        {[
                            { badge: 'RECOMMENDED', color: 'var(--lime)', key: 'urls.jsdelivr_commit', title: 'jsDelivr CDN (commit)', desc: 'Permanent commit-based URL served via jsDelivr global CDN. Best performance + never breaks.' },
                            { badge: 'DYNAMIC', color: 'var(--yellow)', key: 'urls.jsdelivr', title: 'jsDelivr CDN (branch)', desc: 'Points to latest file on branch. May change if file is updated.' },
                            { badge: 'RAW', color: 'var(--surface2)', key: 'urls.raw_commit', title: 'Raw GitHub (commit)', desc: 'Direct raw GitHub URL, commit-pinned. No CDN edge caching.' },
                            { badge: 'SOURCE', color: 'var(--surface2)', key: 'urls.github_commit', title: 'GitHub Page', desc: 'GitHub web UI URL for viewing the file. Not for embedding.' },
                        ].map(({ badge, color, key, title, desc }) => (
                            <div key={key} style={{ background: color, border: '3px solid var(--black)', padding: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ marginBottom: '8px' }}>
                                    <span className="brutal-badge brutal-badge-black">{badge}</span>
                                </div>
                                <p style={{ fontWeight: 700, marginBottom: '4px' }}>{title}</p>
                                <code className="mono" style={{ fontSize: '0.65rem', color: '#666', display: 'block', marginBottom: '8px', wordBreak: 'break-all' }}>{key}</code>
                                <p style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>{desc}</p>
                            </div>
                        ))}
                    </div>
                </Section>

            </div>

            {/* Footer */}
            <footer style={{ background: 'var(--black)', borderTop: '3px solid var(--black)' }}>
                <div style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                        <div style={{ width: 28, height: 28, background: 'var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>CS</div>
                        <span style={{ color: 'var(--white)', fontWeight: 800 }}>CLOUDSNAP</span>
                    </Link>
                    <a href="https://github.com/baraa404/Cloud-Snap" target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', textDecoration: 'none', fontFamily: 'Space Mono, monospace', fontSize: '0.7rem' }}>
                        <Github size={13} /> baraa404/Cloud-Snap
                    </a>
                    <p className="mono" style={{ color: '#444', fontSize: '0.7rem' }}>CLOUDSNAP © 2026 · MADE BY BARAA</p>
                </div>
            </footer>
        </div>
    );
}
