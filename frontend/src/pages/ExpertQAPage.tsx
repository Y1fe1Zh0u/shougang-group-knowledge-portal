import { Link } from 'react-router-dom';
import { Award, MessageSquarePlus } from 'lucide-react';
import PageShell from '../components/PageShell';
import s from './ExpertQAPage.module.css';

const RECOMMENDED_QUESTIONS = [
  '连铸坯角部裂纹有哪些常见判定标准？',
  '高炉煤气含氧量超标可能由哪些原因引起？',
  '轧机液压系统压力波动如何诊断？',
  '辊缝调整对成材率的影响如何评估？',
];

export default function ExpertQAPage() {
  return (
    <PageShell>
      <div className={s.container}>
        <header className={s.head}>
          <div className={s.headLeft}>
            <div className={s.headIcon}>
              <Award size={20} />
            </div>
            <div>
              <h1 className={s.title}>专家问答</h1>
              <p className={s.subtitle}>
                向认证专家发起一对一提问，按业务域定向接收回复。
              </p>
            </div>
          </div>
          <Link to="/login?redirect=%2Fexpert-qa" className={s.askBtn}>
            <MessageSquarePlus size={16} />
            向专家提问
          </Link>
        </header>

        <section className={s.placeholder}>
          <div className={s.placeholderTitle}>专家问答模块即将上线</div>
          <p className={s.placeholderDesc}>
            正在打通专家身份与悬赏机制，下一阶段将开放问题列表、专家排行与提问入口。
          </p>
          <div className={s.list}>
            {RECOMMENDED_QUESTIONS.map((question, index) => (
              <div key={index} className={s.listItem}>
                <span className={s.qBadge}>Q</span>
                <span className={s.qText}>{question}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
