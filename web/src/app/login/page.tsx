'use client';
import { Button, Checkbox, Form, Input, Layout, Typography } from 'antd';
import { 
  LockOutlined, 
  MailOutlined, 
  FacebookFilled, 
  TwitterOutlined, 
  YoutubeFilled, 
  InstagramOutlined 
} from '@ant-design/icons'; // Added the specific social icons
import Link from 'next/link';
import styles from './login.module.css';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

// 1. Move the interface OUTSIDE the component
interface LoginValues {
  email?: string;
  password?: string;
  remember?: boolean;
}

// 2. Only declare the component once
const LoginPage = () => {
  // 3. Use the interface for the values parameter
  const onFinish = async (values: LoginValues) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values), // Sends email and password to the API
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert("Success: " + data.message);
        // Redirect user to dashboard here, e.g., router.push('/dashboard')
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
        <div className={styles.leftPanel}>
          <Title level={1} className={styles.welcomeTitle}>
            Welcome Back
          </Title>
          <Paragraph className={styles.welcomeParagraph}>
          Sign in to access your account, manage your preferences, and pick up right where you left off. If you’re new here, create an account to get started in minutes.
          </Paragraph>
</div>

        <div className={styles.rightPanel}>
          <Title level={2} className={styles.signInTitle}>
            Sign In
          </Title>
          <Form
            name="normal_login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            className={styles.loginForm}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your Email!' },
                { type: 'email', message: 'The input is not valid E-mail!' },
              ]}
            >
              <Input
                prefix={<MailOutlined className="site-form-item-icon" />}
                placeholder="Email Address"
                className={styles.inputField}
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your Password!' }]}
            >
              <Input
                prefix={<LockOutlined className="site-form-item-icon" />}
                type="password"
                placeholder="Password"
                className={styles.inputField}
              />
            </Form.Item>
            <Form.Item className={styles.formActions}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox className={styles.rememberMe}>Remember Me</Checkbox>
              </Form.Item>

              <Link className={styles.loginFormForgot} href="">
                Forgot your password?
              </Link>
            </Form.Item>

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
        </div>
      </Content>
    </Layout>
  );
};

export default LoginPage;