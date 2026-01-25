'use client';
import { Layout, Menu, Button } from 'antd';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../stylesheets/Navbar.module.css'; // We will create this next
import { useAuth } from '@/hooks/useAuth';

const { Header } = Layout;

const Navbar = () => {
  const pathname = usePathname();
  const { user, logout, loading, refetch } = useAuth();
  // Revalidate auth state when the route changes or window becomes active
  useEffect(() => {
    refetch();
  }, [pathname]);

  useEffect(() => {
    const onFocus = () => refetch();
    const onVisibilityChange = () => {
      if (!document.hidden) refetch();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refetch]);

  const menuItems = [
    { key: '/', label: <Link href="/">Home</Link> },
    { key: '/account', label: <Link href="/account">Account</Link> },
  ];

  return (
    <Header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/">ReelStudy</Link>
      </div>
      
      <Menu 
        mode="horizontal" 
        selectedKeys={[pathname]} 
        items={menuItems} 
        className={styles.menu}
      />

      <div className={styles.authButtons}>
        {loading ? null : user ? (
          <Button type="default" className={styles.loginBtn} onClick={logout}>
            Sign out
          </Button>
        ) : (
          <>
            <Link href="/login" className={styles.loginBtn}>
              Log in
            </Link>
            <Button type="primary" className={styles.signupBtn}>
              <Link href="/signup" style={{ color: '#fff' }}>Sign up</Link>
            </Button>
          </>
        )}
      </div>
    </Header>
  );
};

export default Navbar;