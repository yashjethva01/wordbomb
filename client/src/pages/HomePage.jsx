 import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import AvatarPicker from '../components/ui/AvatarPicker';
import RoomSettings from '../components/ui/RoomSettings';
import { validateNickname } from '../utils/roomUtils';
import socketService from '../services/socketService';
import { useGameState } from '../hooks/useGameState';

const DEFAULT_SETTINGS = { lives: 3, turnTime: 15, maxPlayers: 8, difficulty: 'medium' };

export default function HomePage() {
  const { state, dispatch } = useGameState();
  const [params]            = useSearchParams();
  const codeFromUrl         = params.get('join') ?? '';

  const [nickname,    setNickname]    = useState(localStorage.getItem('wb_nickname') ?? '');
  const [avatar,      setAvatar]      = useState(localStorage.getItem('wb_avatar')   ?? '');
  const [roomCode,    setRoomCode]    = useState(codeFromUrl.toUpperCase());
  const [mode,        setMode]        = useState(codeFromUrl ? 'join' : 'home');
  const [settings,    setSettings]    = useState(DEFAULT_SETTINGS);
  const [nicknameErr, setNicknameErr] = useState('');
  const [avatarErr,   setAvatarErr]   = useState('');
  const [roomErr,     setRoomErr]     = useState('');

  useEffect(() => {
    if (codeFromUrl) { setMode('join'); setRoomCode(codeFromUrl.toUpperCase()); }
  }, [codeFromUrl]);

  // Surface avatar conflict errors from the server
  useEffect(() => {
    if (state.avatarError) {
      setAvatarErr(state.avatarError);
      dispatch({ type: 'CLEAR_AVATAR_ERROR' });
    }
  }, [state.avatarError, dispatch]);

  const validate = () => {
    const nc = validateNickname(nickname);
    if (!nc.ok) { setNicknameErr(nc.error); return false; }
    if (!avatar) { setAvatarErr('Please choose an avatar'); return false; }
    setNicknameErr(''); setAvatarErr('');
    return true;
  };

  const handleCreate = () => {
    if (!validate()) return;
    localStorage.setItem('wb_avatar', avatar);
    socketService.emit('create_room', { nickname: nickname.trim(), avatar, settings });
  };

  const handleJoin = () => {
    if (!validate()) return;
    if (!roomCode.trim()) { setRoomErr('Room code is required'); return; }
    setRoomErr('');
    localStorage.setItem('wb_avatar', avatar);
    socketService.emit('join_room', { nickname: nickname.trim(), roomCode: roomCode.trim().toUpperCase(), avatar });
  };

  const onNameKey = e => { if (e.key === 'Enter') mode === 'join' ? handleJoin() : handleCreate(); };
  const onCodeKey = e => { if (e.key === 'Enter') handleJoin(); };

  return (
    <div className="page-center" style={{ flexDirection:'column', position:'relative', overflow:'hidden', alignItems:'center' }}>
      {/* Ambient orbs */}
      <div style={{ position:'fixed', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:'-80px', left:'50%', transform:'translateX(-50%)', width:'600px', height:'600px', borderRadius:'50%', background:'radial-gradient(circle,rgba(0,229,255,0.07) 0%,transparent 70%)', filter:'blur(10px)' }} />
        <div style={{ position:'absolute', bottom:'-100px', right:'-80px', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle,rgba(179,71,255,0.06) 0%,transparent 70%)', filter:'blur(10px)' }} />
      </div>

      <div className="gradient-border" style={{ padding:'clamp(28px,4vw,48px) clamp(20px,4vw,44px)', width:'100%', maxWidth:'500px', zIndex:1, animation:'fadeInUp 0.5s var(--ease-out-expo)', marginTop:'var(--sp-6)' }}>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ fontSize:'58px', lineHeight:1, marginBottom:'8px', animation:'bombFloat 3.5s ease-in-out infinite', filter:'drop-shadow(0 12px 24px rgba(0,0,0,0.55))' }}>💣</div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(40px,9vw,58px)', letterSpacing:'0.06em', color:'var(--text-primary)', lineHeight:0.95, marginBottom:'8px' }}>WORDBOMB</h1>
          <p style={{ fontSize:'13px', color:'var(--text-secondary)', fontFamily:'var(--font-body)' }}>Type fast. Don't explode. Last one standing wins.</p>
        </div>

        {/* Connection */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', justifyContent:'center', marginBottom:'24px' }}>
          <div style={{ width:'7px', height:'7px', borderRadius:'50%', background: state.connected ? 'var(--green)' : 'var(--amber)', boxShadow: state.connected ? 'var(--green-glow)' : 'var(--amber-glow-sm)', flexShrink:0 }} />
          <span style={{ fontSize:'11px', fontFamily:'var(--font-heading)', fontWeight:600, letterSpacing:'0.10em', textTransform:'uppercase', color: state.connected ? 'var(--text-muted)' : 'var(--amber)' }}>
            {state.connected ? 'Server Connected' : 'Connecting…'}
          </span>
        </div>

        {/* Nickname */}
        <div style={{ marginBottom:'16px' }}>
          <Input label="Your Nickname" placeholder="Enter a name…" value={nickname} onChange={e => { setNickname(e.target.value); setNicknameErr(''); }} onKeyDown={onNameKey} error={nicknameErr} maxLength={20} autoFocus />
        </div>

        {/* Avatar picker */}
        <div style={{ marginBottom:'20px', padding:'14px', background:'var(--glass-1)', borderRadius:'var(--r-lg)', border:'1px solid var(--border-0)' }}>
          <AvatarPicker selected={avatar} takenIds={[]} onSelect={id => { setAvatar(id); setAvatarErr(''); }} error={avatarErr} />
        </div>

        {/* Mode panels */}
        {mode === 'home' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <Button variant="secondary" size="sm" fullWidth onClick={() => setMode('create')} style={{ marginBottom:'4px' }}>
              ⚙️ Create Room with Settings
            </Button>
            <Button variant="primary" size="lg" fullWidth onClick={handleCreate} disabled={!state.connected}>💣 Quick Create</Button>
            <Button variant="secondary" size="lg" fullWidth onClick={() => setMode('join')}>🔗 Join with Code</Button>
          </div>
        )}

        {mode === 'create' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div style={{ padding:'16px', background:'var(--glass-1)', borderRadius:'var(--r-lg)', border:'1px solid var(--border-0)' }}>
              <RoomSettings settings={settings} onChange={setSettings} />
            </div>
            <Button variant="primary" size="lg" fullWidth onClick={handleCreate} disabled={!state.connected}>🚀 Create Room</Button>
            <Button variant="ghost" size="md" fullWidth onClick={() => setMode('home')}>← Back</Button>
          </div>
        )}

        {mode === 'join' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <Input label="Room Code" placeholder="e.g. ABCD12" value={roomCode} onChange={e => { setRoomCode(e.target.value.toUpperCase()); setRoomErr(''); }} onKeyDown={onCodeKey} error={roomErr} maxLength={6} style={{ fontFamily:'var(--font-mono)', letterSpacing:'0.22em', fontSize:'22px', textAlign:'center' }} />
            <Button variant="primary" size="lg" fullWidth onClick={handleJoin} disabled={!state.connected}>Join Room →</Button>
            <Button variant="ghost" size="md" fullWidth onClick={() => setMode('home')}>← Back</Button>
          </div>
        )}

        {/* Tags */}
        <div style={{ marginTop:'24px', paddingTop:'20px', borderTop:'1px solid var(--border-0)', display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap' }}>
          {[{icon:'❤️',label:'Configurable lives'},{icon:'⚡',label:'Real-time'},{icon:'🎭',label:'16 avatars'}].map(({icon,label}) => (
            <span key={label} style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'12px', color:'var(--text-muted)', fontFamily:'var(--font-body)', padding:'4px 10px', background:'var(--glass-1)', border:'1px solid var(--border-0)', borderRadius:'var(--r-full)' }}>
              <span style={{ fontSize:'12px' }}>{icon}</span>{label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
