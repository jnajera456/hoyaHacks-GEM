'use client';
import { Button, Form, Input, Layout, Typography, message } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './login.module.css';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

interface LoginValues {
  email: string;
  password: string;
}

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: LoginValues) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ensure cookie is set
        body: JSON.stringify(values),
      });
  
      const data = await response.json();
      if (response.ok) {
        message.success('Login successful!');
        router.push('/');
      } else {
        message.error(data.error || 'Login failed');
      }
    } catch (error) {
      message.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className={styles.loginLayout}>
      <Content className={styles.loginContent}>
        {/* Left Panel - Hero Section */}
        <div className={styles.leftPanel}>
          <Title level={1} className={styles.welcomeTitle}>
            Welcome Back
          </Title>
          <Paragraph className={styles.welcomeParagraph}>
            Sign in to access your account and pick up right where you left off.
          </Paragraph>
        </div>

        {/* Right Panel - Form Section */}
        <div className={styles.rightPanel}>
          {/* Top Navigation Tab */}
          <div className={styles.topNav}>
            <Link href="/signup" className={styles.navLink}>Sign up</Link>
            <span className={styles.activeTab}>Log in</span>
          </div>

          {/* Form Container: This groups the Title and Form for consistent positioning */}
          <div className={styles.formContainer}>
            <Title level={2} className={styles.signInTitle}>
              Sign In
            </Title>

            <Form
              name="normal_login"
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              className={styles.loginForm}
            >
              <Form.Item
                label="Email" // Moved label here to match Signup page
                name="email"
                rules={[
                  { required: true, message: 'Please input your Email!' },
                  { type: 'email', message: 'The input is not valid E-mail!' },
                ]}
              >
                <Input
                  placeholder="user@email.com"
                  className={styles.inputField}
                />
              </Form.Item>

              <Form.Item
                label="Password" // Moved label here to match Signup page
                name="password"
                rules={[{ required: true, message: 'Please input your Password!' }]}
              >
                <Input.Password // Changed to Password input for the "eye" icon
                  placeholder="••••••••"
                  className={styles.inputField}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className={styles.loginFormButton}
                >
                  Sign in
                </Button>
              </Form.Item>
            </Form>
            <div className={styles.footerLink}>
              New to us? <Link href="/signup" style={{color: '#fa541c', fontWeight: '600'}}>Sign up</Link>
          </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default LoginPage;