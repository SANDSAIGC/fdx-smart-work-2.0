# API接口文档

## 接口概述

FDX SMART WORK 2.0 系统提供完整的 RESTful API 接口，支持用户管理、考勤打卡、任务管理、数据监控等核心功能。

## 基础信息

### 接口地址
- **开发环境**: `http://localhost:3000/api`
- **生产环境**: `https://your-domain.com/api`

### 认证方式
- **类型**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`

### 响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## 用户管理模块

### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "张三",
  "department": "生产部"
}
```

### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "张三",
      "role": "employee"
    },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### 获取用户信息
```http
GET /api/user/profile
Authorization: Bearer <token>
```

### 更新用户信息
```http
PUT /api/user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "李四",
  "avatar": "avatar-url",
  "phone": "13800138000"
}
```

## 考勤管理模块

### 打卡记录
```http
POST /api/attendance/checkin
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "checkin", // checkin | checkout
  "location": {
    "latitude": 39.9042,
    "longitude": 116.4074
  },
  "note": "正常上班"
}
```

### 获取考勤记录
```http
GET /api/attendance/records?date=2025-01-01&limit=10&offset=0
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "uuid",
        "type": "checkin",
        "timestamp": "2025-01-01T08:00:00.000Z",
        "location": {
          "latitude": 39.9042,
          "longitude": 116.4074
        },
        "note": "正常上班"
      }
    ],
    "total": 100,
    "hasMore": true
  }
}
```

### 考勤统计
```http
GET /api/attendance/statistics?month=2025-01
Authorization: Bearer <token>
```

## 任务管理模块

### 获取任务列表
```http
GET /api/tasks?status=pending&limit=20&offset=0
Authorization: Bearer <token>
```

**查询参数**:
- `status`: pending | in_progress | completed | cancelled
- `priority`: low | medium | high | urgent
- `assignee`: 指派人ID
- `limit`: 每页数量
- `offset`: 偏移量

### 创建任务
```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "设备维护检查",
  "description": "检查球磨机运行状态",
  "priority": "high",
  "assignee": "user-id",
  "dueDate": "2025-01-15T18:00:00.000Z",
  "tags": ["维护", "设备"]
}
```

### 更新任务状态
```http
PATCH /api/tasks/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed",
  "note": "任务已完成"
}
```

## 情况上报模块

### 提交报告
```http
POST /api/reports
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "incident", // incident | maintenance | safety
  "title": "设备异常报告",
  "description": "球磨机出现异常噪音",
  "severity": "medium", // low | medium | high | critical
  "location": "车间A-1",
  "attachments": ["file-url-1", "file-url-2"]
}
```

### 获取报告列表
```http
GET /api/reports?type=incident&status=open&limit=20
Authorization: Bearer <token>
```

### 处理报告
```http
PATCH /api/reports/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "resolved",
  "resolution": "已更换设备部件",
  "handledBy": "user-id"
}
```

## 积分系统模块

### 获取积分记录
```http
GET /api/points/records?limit=20&offset=0
Authorization: Bearer <token>
```

### 获取积分统计
```http
GET /api/points/statistics
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "totalPoints": 1250,
    "monthlyPoints": 180,
    "rank": 5,
    "level": "高级员工",
    "nextLevelPoints": 1500
  }
}
```

### 积分兑换
```http
POST /api/points/redeem
Authorization: Bearer <token>
Content-Type: application/json

{
  "itemId": "reward-item-id",
  "points": 100
}
```

## 数据监控模块

### 获取实时数据
```http
GET /api/monitoring/realtime?equipment=ball-mill-1
Authorization: Bearer <token>
```

### 获取历史数据
```http
GET /api/monitoring/history?equipment=ball-mill-1&start=2025-01-01&end=2025-01-31
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "equipment": "ball-mill-1",
    "metrics": [
      {
        "timestamp": "2025-01-01T08:00:00.000Z",
        "temperature": 85.5,
        "pressure": 2.3,
        "speed": 1200,
        "vibration": 0.8
      }
    ]
  }
}
```

### 设置告警规则
```http
POST /api/monitoring/alerts
Authorization: Bearer <token>
Content-Type: application/json

{
  "equipment": "ball-mill-1",
  "metric": "temperature",
  "condition": "greater_than",
  "threshold": 90,
  "enabled": true
}
```

## 文件上传模块

### 上传文件
```http
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary-data>
type: image | document | video
```

**响应**:
```json
{
  "success": true,
  "data": {
    "url": "https://storage.example.com/files/uuid.jpg",
    "filename": "image.jpg",
    "size": 1024000,
    "type": "image/jpeg"
  }
}
```

## WebSocket 实时通信

### 连接地址
```
ws://localhost:3000/api/ws
```

### 认证
```json
{
  "type": "auth",
  "token": "jwt-token"
}
```

### 订阅数据
```json
{
  "type": "subscribe",
  "channel": "monitoring",
  "equipment": "ball-mill-1"
}
```

### 接收数据
```json
{
  "type": "data",
  "channel": "monitoring",
  "data": {
    "equipment": "ball-mill-1",
    "timestamp": "2025-01-01T08:00:00.000Z",
    "metrics": {
      "temperature": 85.5,
      "pressure": 2.3
    }
  }
}
```

## 错误代码说明

| 错误代码 | HTTP状态码 | 描述 |
|---------|-----------|------|
| AUTH_REQUIRED | 401 | 需要认证 |
| AUTH_INVALID | 401 | 认证无效 |
| FORBIDDEN | 403 | 权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 400 | 参数验证失败 |
| RATE_LIMIT | 429 | 请求频率超限 |
| SERVER_ERROR | 500 | 服务器内部错误 |

## 接口限制

### 请求频率限制
- **普通用户**: 100 请求/分钟
- **管理员**: 500 请求/分钟
- **系统级**: 无限制

### 文件上传限制
- **单文件大小**: 最大 10MB
- **支持格式**: jpg, png, pdf, doc, docx
- **每日上传**: 最大 100MB

## SDK 和工具

### JavaScript SDK
```bash
npm install @fdx/smart-work-sdk
```

```javascript
import { FDXClient } from '@fdx/smart-work-sdk'

const client = new FDXClient({
  baseURL: 'https://api.example.com',
  token: 'your-jwt-token'
})

// 获取用户信息
const user = await client.user.getProfile()

// 打卡
await client.attendance.checkin({
  location: { latitude: 39.9042, longitude: 116.4074 }
})
```
