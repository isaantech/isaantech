import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowRight, Search, Play, Menu, X, Code2, Smartphone, Laptop,
  ShieldCheck, Sparkles, Youtube, LayoutDashboard, Plus, LogOut,
  Pencil, Trash2, Eye, EyeOff, ExternalLink, ChevronRight, Clock3
} from 'lucide-react';
import './styles.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const ADMIN_USER_ID = '0b545fa3-70a6-45e5-8bee-66d20c89d3b8';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const demoVideos = [
  { id: 'demo-1', title: 'Build a modern website from scratch', description: 'A practical walkthrough of planning and building a clean, responsive website.', category: 'Web Development', youtube_id: 'dQw4w9WgXcQ', published: true, created_at: '2026-10-12T10:00:00Z' },
  { id: 'demo-2', title: 'Essential computer tips everyone should know', description: 'Simple productivity tips and useful shortcuts to work smarter on your computer.', category: 'Computer Tips', youtube_id: 'jfKfPfyJRdk', published: true, created_at: '2026-10-10T10:00:00Z' },
  { id: 'demo-3', title: 'Understand networking basics', description: 'Learn the fundamentals of IP addresses, routers, DNS and how devices connect.', category: 'Networking', youtube_id: 'qiQR5rTSshw', published: true, created_at: '2026-10-08T10:00:00Z' },
  { id: 'demo-4', title: 'Getting started with Python programming', description: 'An approachable introduction to Python and writing your first lines of code.', category: 'Programming', youtube_id: 'kqtD5dpn9C8', published: true, created_at: '2026-10-05T10:00:00Z' },
  { id: 'demo-5', title: 'Protect your accounts online', description: 'Practical security habits for stronger passwords and safer online accounts.', category: 'Cybersecurity', youtube_id: 'inWWhr5tn-k', published: true, created_at: '2026-10-01T10:00:00Z' },
  { id: 'demo-6', title: 'Useful Android features and settings', description: 'Discover settings and features that make your Android phone more useful.', category: 'Mobile Technology', youtube_id: 'f7uBsb-0sGQ', published: true, created_at: '2026-09-28T10:00:00Z' }
];

const categories = ['All tutorials', 'Web Development', 'Programming', 'Computer Tips', 'Networking', 'Cybersecurity', 'Mobile Technology', 'Software'];

function getYoutubeId(value) {
  const input = (value || '').trim();
  const patterns = [
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/watch\?.*v=([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return /^[\w-]{11}$/.test(input) ? input : null;
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [videos, setVideos] = useState(demoVideos);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All tutorials');
  const [activeVideo, setActiveVideo] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [notice, setNotice] = useState('');

  const navigate = (to) => {
    window.history.pushState({}, '', to);
    setPath(to);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadVideos = async () => {
    if (!supabase) { setLoading(false); return; }
    const { data, error } = await supabase.from('tutorials').select('*').order('created_at', { ascending: false });
    if (error) setNotice(error.message);
    else setVideos(data || []);
    setLoading(false);
  };

  useEffect(() => { loadVideos(); }, []);

  const publishedVideos = videos.filter(v => v.published);
  const filtered = useMemo(() => publishedVideos.filter(v => {
    const matchesCategory = category === 'All tutorials' || v.category === category;
    const text = `${v.title} ${v.description} ${v.category}`.toLowerCase();
    return matchesCategory && text.includes(query.toLowerCase());
  }), [videos, category, query]);

  const isAdmin = path.startsWith('/admin');
  const isAuthorizedAdmin = session?.user?.id === ADMIN_USER_ID;
  const isConfigured = Boolean(supabase);

  return (
    <div className="app-shell">
      <Header navigate={navigate} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      {isAdmin
        ? <AdminPage supabase={supabase} session={session} isAuthorizedAdmin={isAuthorizedAdmin} setSession={setSession} videos={videos} reload={loadVideos} navigate={navigate} notice={notice} setNotice={setNotice} />
        : <HomePage videos={filtered} allVideos={publishedVideos} query={query} setQuery={setQuery} category={category} setCategory={setCategory} loading={loading} openVideo={setActiveVideo} navigate={navigate} />}
      <Footer navigate={navigate} />
      {activeVideo && <VideoModal video={activeVideo} close={() => setActiveVideo(null)} />}
      {!isConfigured && <div className="setup-note"><span className="setup-dot" /> Preview mode · Connect Supabase to enable admin tools and save tutorials</div>}
    </div>
  );
}

function Header({ navigate, menuOpen, setMenuOpen }) {
  return <header className="site-header">
    <div className="header-inner">
      <button className="brand" onClick={() => navigate('/')} aria-label="ISAANTECH home">
        <span className="brand-mark"><Code2 size={22} strokeWidth={2.5} /></span>
        <span>ISAAN<span className="brand-blue">TECH</span><small>LEARN. BUILD. INNOVATE.</small></span>
      </button>
      <nav className={menuOpen ? 'main-nav nav-open' : 'main-nav'}>
        <a href="#tutorials" onClick={(e) => { e.preventDefault(); navigate('/'); document.getElementById('tutorials')?.scrollIntoView({ behavior: 'smooth' }); }}>Tutorials</a>
        <a href="#about" onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }}>About</a>
        <button className="nav-admin" onClick={() => navigate('/admin')}>Admin login <ArrowRight size={15} /></button>
      </nav>
      <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</button>
    </div>
  </header>;
}

function HomePage({ videos, allVideos, query, setQuery, category, setCategory, loading, openVideo, navigate }) {
  const featured = allVideos[0];
  return <>
    <main>
      <section className="hero-section">
        <div className="hero-glow" />
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> YOUR TECH LEARNING SPACE</div>
          <h1>Technology made<br /><span>simple.</span> Skills made<br className="mobile-break" /> powerful.</h1>
          <p className="hero-description">Practical tech tutorials to help you learn new skills, solve problems and stay ahead in a digital world.</p>
          <div className="hero-actions">
            <a href="#tutorials" className="button-primary">Explore tutorials <ArrowRight size={17} /></a>
            <div className="hero-trust"><span className="trust-icon"><Play size={12} fill="currentColor" /></span> Learn at your own pace</div>
          </div>
          <div className="hero-stats">
            <div><strong>{allVideos.length.toString().padStart(2, '0')}+</strong><span>Video tutorials</span></div>
            <i />
            <div><strong>100%</strong><span>Free to learn</span></div>
            <i />
            <div><strong>Anytime</strong><span>Learn anywhere</span></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          <div className="hero-code-card">
            <div className="code-top"><span /><span /><span /><label>isaantech.dev</label></div>
            <div className="code-content">
              <div><b className="code-purple">const</b> <b className="code-blue">knowledge</b> = {'{'}</div>
              <div className="code-indent">learn: <b className="code-green">'continuously'</b>,</div>
              <div className="code-indent">build: <b className="code-green">'fearlessly'</b>,</div>
              <div className="code-indent">share: <b className="code-green">'knowledge'</b></div>
              <div>{'}'};</div>
              <div className="code-comment">// Your next skill starts here.</div>
              <div className="code-cursor">▍</div>
            </div>
          </div>
          <div className="float-chip chip-top"><span className="chip-icon chip-purple"><Code2 size={17} /></span><span><b>Learn to code</b><small>One step at a time</small></span></div>
          <div className="float-chip chip-bottom"><span className="chip-icon chip-green"><Sparkles size={17} /></span><span><b>Level up your skills</b><small>Keep discovering</small></span></div>
          <div className="hero-circle"><Code2 size={30} /></div>
        </div>
      </section>

      <section className="benefit-strip">
        <div><span><Laptop size={20} /></span><p><b>Practical lessons</b><small>Real-world tech skills</small></p></div>
        <div><span><Play size={20} /></span><p><b>Video learning</b><small>Clear, visual tutorials</small></p></div>
        <div><span><ShieldCheck size={20} /></span><p><b>Learn for free</b><small>Knowledge for everyone</small></p></div>
        <div><span><Smartphone size={20} /></span><p><b>Learn anywhere</b><small>Desktop, tablet or mobile</small></p></div>
      </section>

      <section className="tutorial-section section-wrap" id="tutorials">
        <div className="section-heading">
          <div><div className="eyebrow"><span className="eyebrow-line" /> THE VIDEO LIBRARY</div><h2>Explore the <span>tutorials.</span></h2><p>Find your next lesson and turn curiosity into practical skills.</p></div>
          <div className="video-count"><b>{allVideos.length}</b><span>tutorials available</span></div>
        </div>
        <div className="library-tools">
          <div className="category-tabs">
            {categories.map(c => <button key={c} className={category === c ? 'category-tab active' : 'category-tab'} onClick={() => setCategory(c)}>{c}</button>)}
          </div>
          <label className="search-box"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tutorials..." /><kbd>⌕</kbd></label>
        </div>
        {loading ? <div className="loading-state">Loading tutorials…</div> : videos.length ? <div className="video-grid">
          {videos.map((video, index) => <VideoCard key={video.id} video={video} index={index} openVideo={openVideo} />)}
        </div> : <div className="empty-state"><div className="empty-icon"><Search /></div><h3>No tutorials found</h3><p>Try another search term or choose a different category.</p><button className="text-button" onClick={() => { setQuery(''); setCategory('All tutorials'); }}>Clear filters</button></div>}
      </section>

      <section className="about-section" id="about">
        <div className="about-inner">
          <div className="about-symbol"><div className="symbol-square"><Code2 size={48} /></div><span className="symbol-dot dot-a" /><span className="symbol-dot dot-b" /><span className="symbol-dot dot-c" /></div>
          <div className="about-copy"><div className="eyebrow"><span className="eyebrow-line" /> ABOUT ISAANTECH</div><h2>Curiosity is the<br /><span>start of everything.</span></h2><p>ISAANTECH is a space for sharing practical technology knowledge. Whether you're taking your first steps or sharpening your skills, there's always something new to discover.</p><a href="#tutorials" className="about-link">Find your next tutorial <ArrowRight size={16} /></a></div>
        </div>
      </section>
      <section className="bottom-cta"><div><span className="cta-icon"><Youtube size={23} /></span><div><h3>Ready to learn something new?</h3><p>Pick a tutorial and let's get started.</p></div></div><a href="#tutorials" className="button-primary">Browse tutorials <ArrowRight size={16} /></a></section>
    </main>
  </>;
}

function VideoCard({ video, index, openVideo }) {
  const thumbnail = `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`;
  return <article className="video-card" onClick={() => openVideo(video)} tabIndex="0" onKeyDown={e => e.key === 'Enter' && openVideo(video)}>
    <div className="thumbnail-wrap"><img src={thumbnail} alt="" loading="lazy" onError={e => { e.currentTarget.src = 'https://placehold.co/640x360/eaf1fb/2878d0?text=ISAANTECH+Tutorial'; }} /><span className="play-overlay"><Play size={23} fill="currentColor" /></span><span className="thumbnail-number">{String(index + 1).padStart(2, '0')}</span></div>
    <div className="video-card-content"><span className="video-category">{video.category || 'General'}</span><h3>{video.title}</h3><p>{video.description}</p><div className="card-meta"><span><Play size={13} /> Watch tutorial</span><ChevronRight size={16} /></div></div>
  </article>;
}

function VideoModal({ video, close }) {
  useEffect(() => { const onKey = e => e.key === 'Escape' && close(); window.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden'; return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; }; }, []);
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && close()}><div className="video-modal"><button className="modal-close" onClick={close}><X size={21} /></button><div className="embed-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${video.youtube_id}?autoplay=1&rel=0`} title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div><div className="modal-info"><span className="video-category">{video.category}</span><h2>{video.title}</h2><p>{video.description}</p><a href={`https://www.youtube.com/watch?v=${video.youtube_id}`} target="_blank" rel="noreferrer" className="youtube-link">Watch on YouTube <ExternalLink size={15} /></a></div></div></div>;
}

function AdminPage({ supabase, session, isAuthorizedAdmin, setSession, videos, reload, navigate, notice, setNotice }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [form, setForm] = useState({ title: '', description: '', youtube_url: '', category: 'Web Development', published: true });
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const signIn = async (e) => {
    e.preventDefault(); if (!supabase) return;
    setBusy(true); setNotice('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false); if (error) setNotice(error.message);
  };
  const signOut = async () => { await supabase?.auth.signOut(); setSession(null); };
  const saveVideo = async (e) => {
    e.preventDefault();
    const youtube_id = getYoutubeId(form.youtube_url);
    if (!youtube_id) { setNotice('Please enter a valid YouTube video URL or 11-character video ID.'); return; }
    setBusy(true); setNotice('');
    const payload = { ...form, youtube_id };
    const result = editing
      ? await supabase.from('tutorials').update(payload).eq('id', editing)
      : await supabase.from('tutorials').insert(payload);
    setBusy(false);
    if (result.error) setNotice(result.error.message);
    else { setNotice(editing ? 'Tutorial updated.' : 'Tutorial added.'); setForm({ title: '', description: '', youtube_url: '', category: 'Web Development', published: true }); setEditing(null); setShowForm(false); reload(); }
  };
  const editVideo = video => { setEditing(video.id); setForm({ title: video.title, description: video.description || '', youtube_url: video.youtube_url || `https://youtu.be/${video.youtube_id}`, category: video.category || 'General', published: video.published }); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const deleteVideo = async id => { if (!window.confirm('Delete this tutorial? This cannot be undone.')) return; const { error } = await supabase.from('tutorials').delete().eq('id', id); setNotice(error ? error.message : 'Tutorial deleted.'); reload(); };

  if (!supabase) return <main className="admin-page"><div className="admin-gate"><div className="admin-lock"><ShieldCheck size={30} /></div><div className="eyebrow">ADMINISTRATION</div><h1>Connect your <span>dashboard.</span></h1><p>To sign in and manage tutorials, add your Supabase project URL and anon key to the environment variables. Follow the setup guide in the project README.</p><button className="button-primary" onClick={() => navigate('/')}>Back to website <ArrowRight size={16} /></button></div></main>;

  if (!session) return <main className="admin-page"><form className="login-card" onSubmit={signIn}><div className="login-brand"><span className="brand-mark"><Code2 /></span><span>ISAAN<span className="brand-blue">TECH</span></span></div><div className="eyebrow">SECURE ADMIN AREA</div><h1>Welcome <span>back.</span></h1><p>Sign in to manage your tutorials and content.</p>{notice && <div className="notice error">{notice}</div>}<label>Email address<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" /></label><label>Password<input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" /></label><button className="button-primary login-submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in to dashboard'} <ArrowRight size={16} /></button><button type="button" className="back-link" onClick={() => navigate('/')}>← Back to ISAANTECH</button></form></main>;

  if (session && !isAuthorizedAdmin) return <main className="admin-page"><div className="admin-gate"><div className="admin-lock"><ShieldCheck size={30} /></div><div className="eyebrow">ACCESS RESTRICTED</div><h1>Admin access <span>denied.</span></h1><p>This account is not authorized to manage ISAANTECH tutorials. Sign in with the designated administrator account.</p><button className="button-primary" onClick={signOut}>Sign out <ArrowRight size={16} /></button></div></main>;

  return <main className="admin-page admin-dashboard"><div className="admin-topline"><div><div className="eyebrow">CONTENT MANAGEMENT</div><h1>Admin <span>dashboard.</span></h1><p>Manage the tutorials on your ISAANTECH website.</p></div><button className="outline-button" onClick={signOut}><LogOut size={16} /> Sign out</button></div>
    {notice && <div className="notice">{notice}<button onClick={() => setNotice('')}><X size={15} /></button></div>}
    <div className="admin-stats"><div><span>Total tutorials</span><b>{videos.length}</b></div><div><span>Published</span><b>{videos.filter(v => v.published).length}</b></div><div><span>Drafts</span><b>{videos.filter(v => !v.published).length}</b></div></div>
    <div className="admin-list-head"><div><h2>Your tutorials</h2><p>Add and organize your video content.</p></div><button className="button-primary" onClick={() => { setEditing(null); setForm({ title: '', description: '', youtube_url: '', category: 'Web Development', published: true }); setShowForm(!showForm); }}><Plus size={17} /> Add tutorial</button></div>
    {showForm && <form className="tutorial-form" onSubmit={saveVideo}><div className="form-title"><h3>{editing ? 'Edit tutorial' : 'Add a new tutorial'}</h3><button type="button" onClick={() => setShowForm(false)}><X size={18} /></button></div><div className="form-grid"><label className="span-two">Tutorial title<input required maxLength="120" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. How to build a website with React" /></label><label className="span-two">YouTube video URL<input required value={form.youtube_url} onChange={e => setForm({ ...form, youtube_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." /></label><label>Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.filter(c => c !== 'All tutorials').map(c => <option key={c}>{c}</option>)}</select></label><label className="publish-check"><input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} /> Publish immediately</label><label className="span-two">Description<textarea rows="3" maxLength="500" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What will viewers learn in this tutorial?" /></label></div><div className="form-actions"><button type="button" className="outline-button" onClick={() => setShowForm(false)}>Cancel</button><button className="button-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add tutorial'} <ArrowRight size={15} /></button></div></form>}
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>TUTORIAL</th><th>CATEGORY</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{videos.map(v => <tr key={v.id}><td><div className="table-video"><img src={`https://img.youtube.com/vi/${v.youtube_id}/default.jpg`} alt="" /><b>{v.title}</b></div></td><td>{v.category}</td><td><span className={v.published ? 'status published' : 'status draft'}>{v.published ? 'Published' : 'Draft'}</span></td><td><div className="table-actions"><button title="Edit" onClick={() => editVideo(v)}><Pencil size={16} /></button><button title={v.published ? 'Unpublish' : 'Publish'} onClick={async () => { const { error } = await supabase.from('tutorials').update({ published: !v.published }).eq('id', v.id); setNotice(error ? error.message : 'Tutorial status updated.'); reload(); }}>{v.published ? <EyeOff size={16} /> : <Eye size={16} />}</button><button title="Delete" className="delete-action" onClick={() => deleteVideo(v.id)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table>{!videos.length && <div className="empty-state"><h3>No tutorials yet</h3><p>Add your first YouTube tutorial to get started.</p></div>}</div>
  </main>;
}

function Footer({ navigate }) {
  return <footer className="site-footer"><div className="footer-main"><button className="brand footer-brand" onClick={() => navigate('/')}><span className="brand-mark"><Code2 size={21} /></span><span>ISAAN<span className="brand-blue">TECH</span><small>LEARN. BUILD. INNOVATE.</small></span></button><p>Making technology easier to understand,<br />one tutorial at a time.</p><div className="footer-social"><a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube size={19} /></a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} ISAANTECH. All rights reserved.</span><span>Built for curious minds <span className="footer-heart">♥</span></span></div></footer>;
}

createRoot(document.getElementById('root')).render(<App />);
