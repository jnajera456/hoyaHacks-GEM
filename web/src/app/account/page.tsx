"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layout,
  Typography,
  Button,
  Row,
  Col,
  Statistic,
  List,
  Tag,
  Avatar,
  Card,
  Tabs,
  Space,
  Divider,
  Switch,
  Select,
  ConfigProvider,
  Tooltip,
} from "antd";
import {
  BookOutlined,
  SettingOutlined,
  LogoutOutlined,
  EditOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FireTwoTone,
  TrophyTwoTone,
  ArrowLeftOutlined,
  LineChartOutlined,
  GlobalOutlined,
  BellOutlined,
} from "@ant-design/icons";

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const quizletTheme = {
    token: {
      colorPrimary: '#4255ff',
      borderRadius: 12,
      fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
      colorBgLayout: '#f6f7fb', // Matches the background
    },
  };

  return (
    <ConfigProvider theme={quizletTheme}>
      {/* STRETCH FIX: 
          We use a wrapper div with the same bg color as the layout 
          to ensure no black shows if the content is short.
      */}
      <div style={{ backgroundColor: '#f6f7fb', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
          <Header style={{ 
            background: '#fff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '0 40px',
            borderBottom: '1px solid #edeff4',
          }}>
            <Link href="/">
              <Button type="text" icon={<ArrowLeftOutlined />}>Back to Home</Button>
            </Link>
            <Title level={4} style={{ margin: 0 }}>My Profile</Title>
            <Button danger ghost icon={<LogoutOutlined />}>Sign Out</Button>
          </Header>

          <Layout hasSider style={{ background: 'transparent', flex: 1 }}>
            <Sider width={320} style={{ background: 'transparent', padding: '40px 0 40px 40px' }}>
              {/* Warning Fix: variant="borderless" instead of bordered={false} */}
              <Card variant="borderless" className="shadow-sm text-center">
                <Avatar size={84} style={{ backgroundColor: '#7c3aed', marginBottom: 16 }}>D</Avatar>
                <Title level={3} style={{ margin: 0 }}>Demo Student</Title>
                <Text type="secondary">demo@studytoks.com</Text>
                <Divider />
                <div className="text-left space-y-4">
                  {/* Warning Fix: styles={{ content: ... }} instead of valueStyle */}
                  <Statistic 
                    title="Daily Streak" 
                    value={14} 
                    prefix={<FireTwoTone twoToneColor="#ff7a45" />} 
                    styles={{ content: { fontSize: 20, fontWeight: 700 } }}
                  />
                  <Statistic 
                    title="Mastery Score" 
                    value={82} 
                    suffix="%" 
                    prefix={<TrophyTwoTone twoToneColor="#fadb14" />}
                    styles={{ content: { fontSize: 20, fontWeight: 700 } }}
                  />
                </div>
                <Button block type="primary" icon={<EditOutlined />} style={{ marginTop: 24 }}>
                  Edit Profile
                </Button>
              </Card>
            </Sider>

            <Content style={{ padding: '40px', flex: 1 }}>
              <div className="max-w-4xl mx-auto">
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  size="large"
                  items={[
                    {
                      key: 'overview',
                      label: <span className="flex items-center gap-2"><LineChartOutlined /> Overview</span>,
                      children: <OverviewTab />
                    },
                    {
                      key: 'decks',
                      label: <span className="flex items-center gap-2"><BookOutlined /> My Library</span>,
                      children: <DecksTab />
                    },
                    {
                      key: 'preferences',
                      label: <span className="flex items-center gap-2"><SettingOutlined /> Settings</span>,
                      children: <SettingsTab />
                    },
                  ]}
                />
              </div>
            </Content>
          </Layout>
        </Layout>
      </div>
    </ConfigProvider>
  );
}

const OverviewTab = () => (
  <div className="space-y-6">
    {/* Warning Fix: styles={{ body: ... }} instead of bodyStyle */}
    <Card 
      variant="borderless"
      style={{ background: 'linear-gradient(135deg, #4255ff 0%, #7c3aed 100%)' }}
      styles={{ body: { padding: '32px' } }}
    >
      <Title level={2} style={{ color: '#fff', margin: 0 }}>You're on fire! 🔥</Title>
      <Text style={{ color: 'rgba(255,255,255,0.8)' }}>You studied 45 minutes today. Only 15 more to reach your goal.</Text>
    </Card>
    
    <Row gutter={24}>
      <Col span={12}>
        <Card title="Recent History" variant="borderless" extra={<Button type="link">View All</Button>}>
          <List
            itemLayout="horizontal"
            dataSource={[{ title: 'Biology: Cell Structure', score: 85 }]}
            renderItem={(item) => (
              <List.Item extra={<Text strong style={{ color: '#52c41a' }}>{item.score}%</Text>}>
                <List.Item.Meta title={item.title} description="25 minutes ago" />
              </List.Item>
            )}
          />
        </Card>
      </Col>
      <Col span={12}>
        <Card title="Study Goals" variant="borderless">
          <Text type="secondary">Daily Progress</Text>
          <div className="mt-2 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: '75%' }} />
          </div>
          <Text className="mt-2 block font-bold text-right">45/60 min</Text>
        </Card>
      </Col>
    </Row>
  </div>
);

const DecksTab = () => (
  <Row gutter={[20, 20]}>
    {[1, 2].map(i => (
      <Col span={12} key={i}>
        <Card 
          hoverable 
          variant="borderless"
          styles={{ body: { padding: '24px' } }}
          actions={[
            <Tooltip title="Study" key="study"><BookOutlined /></Tooltip>,
            <Tooltip title="Export" key="export"><DownloadOutlined /></Tooltip>,
            <Tooltip title="Delete" key="delete"><DeleteOutlined style={{ color: '#ff4d4f' }} /></Tooltip>,
          ]}
        >
          <Tag color="blue">Biology</Tag>
          <Title level={4} style={{ margin: '8px 0' }}>Introduction to Genetics</Title>
          <Text type="secondary">24 Terms • Last studied 2 days ago</Text>
        </Card>
      </Col>
    ))}
  </Row>
);

const SettingsTab = () => (
  <Card variant="borderless">
    <List itemLayout="horizontal">
      <List.Item actions={[<Switch defaultChecked />]}>
        <List.Item.Meta 
          avatar={<Avatar icon={<BellOutlined />} />}
          title="Daily Reminders" 
          description="We'll nudge you to keep your streak alive." 
        />
      </List.Item>
      <List.Item actions={[<Select defaultValue="en" options={[{value: 'en', label: 'English'}]} />]}>
        <List.Item.Meta 
          avatar={<Avatar icon={<GlobalOutlined />} />}
          title="Language" 
          description="App display language." 
        />
      </List.Item>
    </List>
  </Card>
);