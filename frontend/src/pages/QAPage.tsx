import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Bot, User, Send, Plus } from 'lucide-react';
import Header from '../components/Header';
import { getAIResponse } from '../data/mock';
import s from './QAPage.module.css';

interface Message {
  role: 'bot' | 'user';
  text: string;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
}

const INIT_SESSIONS: Session[] = [
  {
    id: 'sess1',
    title: '振动纹排查',
    messages: [
      { role: 'bot', text: '你好，我是首钢知库智能助手，请问有什么可以帮您？' },
      { role: 'user', text: '振动纹通常如何排查？' },
      { role: 'bot', text: getAIResponse('振动纹') },
    ],
  },
  {
    id: 'sess2',
    title: '设备巡检流程',
    messages: [
      { role: 'bot', text: '你好，我是首钢知库智能助手，请问有什么可以帮您？' },
      { role: 'user', text: '设备巡检流程有哪些关键步骤？' },
      { role: 'bot', text: getAIResponse('设备巡检流程') },
    ],
  },
  {
    id: 'sess3',
    title: '质量异议处理',
    messages: [
      { role: 'bot', text: '你好，我是首钢知库智能助手，请问有什么可以帮您？' },
      { role: 'user', text: '质量异议处理的标准流程是什么？' },
      { role: 'bot', text: getAIResponse('质量异议处理') },
    ],
  },
];

export default function QAPage() {
  const [sessions, setSessions] = useState<Session[]>(INIT_SESSIONS);
  const [activeId, setActiveId] = useState(INIT_SESSIONS[0].id);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeSession = sessions.find((ss) => ss.id === activeId)!;

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession.messages, streaming]);

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      if (streamRef.current) clearInterval(streamRef.current);
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim() || streaming) return;
    const text = input.trim();
    setInput('');

    const fullResponse = getAIResponse(text);
    setStreaming(true);
    let idx = 0;

    /* Add user message + empty bot message */
    setSessions((prev) =>
      prev.map((ss) =>
        ss.id === activeId
          ? { ...ss, messages: [...ss.messages, { role: 'user', text }, { role: 'bot', text: '' }] }
          : ss,
      ),
    );

    streamRef.current = setInterval(() => {
      idx++;
      setSessions((prev) =>
        prev.map((ss) => {
          if (ss.id !== activeId) return ss;
          const msgs = [...ss.messages];
          msgs[msgs.length - 1] = { role: 'bot', text: fullResponse.slice(0, idx) };
          return { ...ss, messages: msgs };
        }),
      );
      if (idx >= fullResponse.length) {
        if (streamRef.current) clearInterval(streamRef.current);
        streamRef.current = null;
        setStreaming(false);
      }
    }, 30);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage();
  };

  const newSession = () => {
    const id = `sess_${Date.now()}`;
    const ns: Session = {
      id,
      title: '新会话',
      messages: [{ role: 'bot', text: '你好，我是首钢知库智能助手，请问有什么可以帮您？' }],
    };
    setSessions((prev) => [...prev, ns]);
    setActiveId(id);
  };

  return (
    <>
      <Header />
      <div className={s.layout}>
        {/* Sidebar */}
        <aside className={s.sidebar}>
          <div className={s.sideHeader}>历史会话</div>
          <div className={s.sessionList}>
            {sessions.map((ss) => (
              <div
                key={ss.id}
                className={`${s.sessionItem} ${ss.id === activeId ? s.sessionItemActive : ''}`}
                onClick={() => setActiveId(ss.id)}
              >
                {ss.title}
              </div>
            ))}
          </div>
          <button className={s.newSessionBtn} onClick={newSession}>
            <Plus size={14} />
            新建会话
          </button>
        </aside>

        {/* Main */}
        <div className={s.main}>
          <div className={s.messages}>
            {activeSession.messages.map((msg, i) => (
              <div
                key={i}
                className={`${s.msgRow} ${msg.role === 'user' ? s.msgRowUser : ''}`}
              >
                <div className={`${s.avatar} ${msg.role === 'bot' ? s.avatarBot : s.avatarUser}`}>
                  {msg.role === 'bot' ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div className={`${s.msgBubble} ${msg.role === 'bot' ? s.msgBot : s.msgUser}`}>
                  {msg.text}
                  {streaming && msg.role === 'bot' && i === activeSession.messages.length - 1 && (
                    <span className={s.aiCursor} />
                  )}
                </div>
              </div>
            ))}
            <div ref={msgEndRef} />
          </div>

          <div className={s.inputBar}>
            <input
              className={s.chatInput}
              placeholder="请输入您的问题..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className={s.sendBtn} onClick={sendMessage}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
