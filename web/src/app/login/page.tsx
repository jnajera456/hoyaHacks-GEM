'use client';
import { Button, Checkbox, Form, Input, Layout, Typography } from 'antd';
import Link from 'next/link';
import styles from './login.module.css';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

interface LoginValues {
  email?: string;
  password?: string;
  remember?: boolean;
}

const LoginPage = () => {
  const onFinish = async (values: LoginValues) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
  
      const data = await response.json();
      if (response.ok) {
        alert("Success: " + data.message);
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Failed to connect to the server", error);
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
            Sign in to access your account, manage your preferences, and pick up right where you left off. 
            If you’re new here, create an account to get started in minutes.
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
              layout="vertical" // Ensures labels sit on top of inputs
              initialValues={{ remember: true }}
              onFinish={onFinish}
              requiredMark={false} // Removes the red asterisks for a cleaner look
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

              <div className={styles.formActions} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox className={styles.rememberMe}>Remember Me</Checkbox>
                </Form.Item>

                <Link href="" style={{ color: '#fa541c', fontWeight: '600' }}>
                  Forgot your password?
                </Link>
              </div>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className={styles.loginFormButton}
                >
                  Sign in now
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