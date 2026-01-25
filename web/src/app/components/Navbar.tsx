'use client';
import { Layout, Menu, Button } from 'antd';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../stylesheets/Navbar.module.css'; // We will create this next

const { Header } = Layout;

const Navbar = () => {
  const pathname = usePathname();

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
  <Link href="/login" className={styles.loginBtn}>
    Log in
  </Link>
  <Button type="primary" className={styles.signupBtn}>
    <Link href="/signup" style={{ color: '#fff' }}>Sign up</Link>
  </Button>
</div>
    </Header>
  );
};

export default Navbar;