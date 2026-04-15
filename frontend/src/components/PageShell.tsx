import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import s from './PageShell.module.css';

interface Props {
  children: ReactNode;
}

export default function PageShell({ children }: Props) {
  return (
    <div className={s.shell}>
      <Header />
      <main className={s.main}>{children}</main>
      <Footer />
    </div>
  );
}
