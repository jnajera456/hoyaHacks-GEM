'use client';
import { Form, Input, Button, Typography, Layout, message } from 'antd'; // Added message here
import { useRouter } from 'next/navigation'; // Added this
import React from 'react';
import Link from 'next/link';
import styles from './signup.module.css';

const { Content } = Layout;
const { Title, Text } = Typography;

interface SignupValues {
  email?: string;
  password?: string;
  name?: string;
}

const SignupPage = () => {
  const [form] = Form.useForm();

  const router = useRouter();

  const onFinish = async (values: SignupValues) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
  
      if (response.ok) {
        message.success('Account created successfully! Redirecting to login...');
        router.push('/login');
      } else {
        const data = await response.json();
        message.error(data.error || 'Signup failed');
      }
    } catch (error) {
      message.error('Connection error. Please try again.');
    }
  };

  return (
    <Layout className={styles.signupLayout}>
      <Content className={styles.signupContent}>
        {/* Left Panel: Matching the notebook/backpack hero image */}
        <div className={styles.leftPanel}>
          <div className={styles.heroText}>
            <Title level={1} className={styles.mainTitle}>
              The best way to learn.
            </Title>
            <Title level={2} className={styles.subTitle}>
              Join for free today.
            </Title>
          </div>
        </div>

        {/* Right Panel: Form section matching the Login page position */}
        <div className={styles.rightPanel}>
          <div className={styles.topNav}>
            <span className={styles.activeTab}>Sign up</span>
            <Link href="/login" className={styles.navLink}>Log in</Link>
          </div>

          <div className={styles.formContainer}>
            {/* Standardized Title to match Login Page style */}
            <Title level={2} className={styles.signInTitle}>
              Create an account
            </Title>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              className={styles.signupForm}
            >
              <Form.Item
                label="Name"
                name="name"
                rules={[
                  { required: false }
                ]}
              >
                <Input placeholder="Your name (optional)" className={styles.inputField} />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Enter a valid email' }
                ]}
              >
                <Input placeholder="user@email.com" className={styles.inputField} />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please enter a password' }]}
              >
                <Input.Password placeholder="••••••••" className={styles.inputField} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" className={styles.signupButton}>
                  Sign up
                </Button>
              </Form.Item>
            </Form>

            <div className={styles.footerLink}>
              Already have an account? <Link href="/login" style={{color: '#fa541c', fontWeight: '600'}}>Log in</Link>
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

// This line is crucial to fix the "The default export is not a React Component" error
export default SignupPage;