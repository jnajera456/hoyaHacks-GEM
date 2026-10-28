'use client';
import { Layout, Menu, Button, Dropdown, type MenuProps } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../stylesheets/Navbar.module.css';
import { useAuth } from '@/hooks/useAuth';
import ReelStudyLogo from './ReelStudyLogo';

const { Header } = Layout;

const Navbar = () => {
  const pathname = usePathname();
  const { user, logout, loading, refetch } = useAuth();

  const handleLogout = () => {
    logout().catch((error: unknown) => {
      console.error('Sign out failed:', error);
    });
  };

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
  ] satisfies NonNullable<MenuProps['items']>;

  const mobileMenuItems = [
    ...menuItems,
    ...(loading
      ? []
      : user
        ? [{ key: 'sign-out', label: 'Sign out', onClick: handleLogout }]
        : [
            { key: '/login', label: <Link href="/login">Log in</Link> },
            { key: '/signup', label: <Link href="/signup">Sign up</Link> },
          ]),
  ] satisfies NonNullable<MenuProps['items']>;

  return (
    <Header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="ReelStudy home">
        <ReelStudyLogo priority />
      </Link>
      
      <Menu 
        mode="horizontal" 
        selectedKeys={[pathname]} 
        items={menuItems} 
        className={styles.menu}
      />

      <div className={styles.authButtons}>
        {loading ? null : user ? (
          <Button type="default" className={styles.loginBtn} onClick={handleLogout}>
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

      <div className={styles.mobileMenu}>
        <Dropdown
          menu={{ items: mobileMenuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Button
            type="text"
            className={styles.mobileMenuButton}
            icon={<MenuOutlined />}
            aria-label="Open navigation menu"
          />
        </Dropdown>
      </div>
    </Header>
  );
};

export default Navbar;