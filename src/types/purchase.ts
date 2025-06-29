// 采购申请相关类型定义

// 采购申请接口（对应数据库"采购申请"表）
export interface PurchaseRequest {
  id: number;
  date: string;           // 对应"日期"
  applicant: string;      // 对应"申请者"
  itemName: string;       // 对应"品名"
  quantity: number;       // 对应"数量"
  purpose: string;        // 对应"用途"
  expectedDate?: string;  // 对应"期望完成日期"
  status: string;         // 对应"完成状态"
  created_at?: string;
  updated_at?: string;
}

// 采购申请状态枚举
export enum PurchaseStatus {
  PENDING = '待处理',
  APPROVED = '已批准',
  REJECTED = '已拒绝',
  IN_PROGRESS = '进行中',
  COMPLETED = '已完成',
  CANCELLED = '已取消'
}

// 采购申请表单数据
export interface PurchaseRequestForm {
  date: string;
  applicant: string;
  itemName: string;
  quantity: number;
  purpose: string;
  expectedDate?: string;
  status: string;
}

// 采购申请筛选条件
export interface PurchaseRequestFilter {
  searchTerm: string;
  status: string;
  dateRange: {
    from?: string;
    to?: string;
  };
  applicant: string;
}
