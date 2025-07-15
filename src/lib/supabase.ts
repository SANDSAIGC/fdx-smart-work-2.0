import { createClient } from '@supabase/supabase-js'

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 用户数据接口（映射到标准化中文字段）
export interface UserProfile {
  id: string
  username: string    // 映射到 账号
  name: string        // 映射到 姓名
  position: string    // 映射到 职称
  department: string  // 映射到 部门
  phone: string       // 映射到 联系电话
  wechat: string      // 映射到 微信号
  points: number      // 暂无对应字段，使用默认值
  avatar_url?: string // 映射到 avatar_url
  created_at?: string // 映射到 created_at
  updated_at?: string // 映射到 updated_at
}

// 用户服务类
export class UserService {
  // 获取用户信息（从中文字段映射）
  static async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('用户资料')
        .select('id, 账号, 姓名, 职称, 部门, 联系电话, 微信号, avatar_url, created_at, updated_at')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('获取用户信息失败:', error)
        return null
      }

      // 映射标准化中文字段到英文接口
      const mappedData: UserProfile = {
        id: data.id,
        username: data.账号,
        name: data.姓名,
        position: data.职称 || '',
        department: data.部门 || '',
        phone: data.联系电话 || '',
        wechat: data.微信号 || '',
        points: 0, // 暂无对应字段，使用默认值
        avatar_url: data.avatar_url,
        created_at: data.created_at,
        updated_at: data.updated_at
      }

      return mappedData
    } catch (error) {
      console.error('用户服务错误:', error)
      return null
    }
  }

  // 更新用户信息（映射到中文字段）
  static async updateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      // 将英文字段映射到中文字段
      const chineseUpdates: any = {
        updated_at: new Date().toISOString()
      }

      if (updates.username) chineseUpdates.账号 = updates.username
      if (updates.name) chineseUpdates.姓名 = updates.name
      if (updates.position) chineseUpdates.职称 = updates.position
      if (updates.department) chineseUpdates.部门 = updates.department
      if (updates.phone) chineseUpdates.联系电话 = updates.phone
      if (updates.wechat) chineseUpdates.微信号 = updates.wechat
      if (updates.avatar_url !== undefined) chineseUpdates.avatar_url = updates.avatar_url

      const { data, error } = await supabase
        .from('用户资料')
        .update(chineseUpdates)
        .eq('id', userId)
        .select('id, 账号, 姓名, 职称, 部门, 联系电话, 微信号, avatar_url, created_at, updated_at')
        .single()

      if (error) {
        console.error('更新用户信息失败:', error)
        return null
      }

      // 映射标准化中文字段回英文接口
      const mappedData: UserProfile = {
        id: data.id,
        username: data.账号,
        name: data.姓名,
        position: data.职称 || '',
        department: data.部门 || '',
        phone: data.联系电话 || '',
        wechat: data.微信号 || '',
        points: 0, // 暂无对应字段
        avatar_url: data.avatar_url,
        created_at: data.created_at,
        updated_at: data.updated_at
      }

      return mappedData
    } catch (error) {
      console.error('更新用户服务错误:', error)
      return null
    }
  }

  // 创建用户
  static async createUser(userData: Omit<UserProfile, 'created_at' | 'updated_at'>): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          ...userData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('创建用户失败:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('创建用户服务错误:', error)
      return null
    }
  }
}

// 样品数据接口定义
export interface ShiftSampleData {
  日期: string
  班次: string
  '氧化锌原矿-水份（%）': number
  '氧化锌原矿-Pb全品位（%）': number
  '氧化锌原矿-Zn全品位（%）': number
  '氧化锌精矿-Pb品位（%）': number
  '氧化锌精矿-Zn品位（%）': number
  '尾矿-Pb全品位（%）': number
  '尾矿-Zn全品位（%）': number
}

export interface FilterSampleData {
  操作员: string
  开始时间: string
  结束时间: string
  水份: number
  铅品位: number
  锌品位: number
  备注?: string
}

export interface IncomingSampleData {
  计量日期: string
  发货单位名称: string
  原矿类型: string
  '水份(%)': number
  Pb: number
  Zn: number
}

export interface OutgoingSampleData {
  计量日期: string
  收货单位名称: string
  样品编号: string
  '水份(%)': number
  Pb: number
  Zn: number
}

export interface BallMillData {
  操作员: string
  日期: string
  时间: string
  进料流量?: number
  一号壶称重?: number
  一号壶浓度?: number
  二号壶称重?: number
  二号壶浓度?: number
  二号壶细度称重?: number
  二号壶细度?: number
  一号壶称重照片url?: string
  二号壶称重照片url?: string
  二号壶细度称重照片url?: string
}

// 获取当前用户信息的辅助函数
async function getCurrentUserHeaders(): Promise<Record<string, string>> {
  try {
    // 从localStorage获取当前用户ID
    const currentUserId = localStorage.getItem('fdx_current_user_id');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (currentUserId) {
      headers['x-user-id'] = currentUserId;
    }

    // 如果有会话token，也可以添加到Authorization头
    const sessionData = localStorage.getItem('fdx_session_data');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        if (session.token) {
          headers['Authorization'] = `Bearer ${session.token}`;
        }
      } catch (e) {
        console.warn('解析会话数据失败:', e);
      }
    }

    return headers;
  } catch (error) {
    console.error('获取用户头信息失败:', error);
    return {
      'Content-Type': 'application/json',
    };
  }
}

// 样品数据服务类
export class SampleDataService {
  // 提交班样数据到生产班报-FDX表
  static async submitShiftSample(data: ShiftSampleData): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const headers = await getCurrentUserHeaders();

      const response = await fetch('/api/samples/shift-sample', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })

      // 检查HTTP状态码
      if (!response.ok) {
        console.error('❌ [班样服务] HTTP错误:', response.status, response.statusText)
        return {
          success: false,
          message: `网络请求失败: ${response.status} ${response.statusText}`
        }
      }

      const result = await response.json()
      console.log('📤 [班样服务] API响应:', result)
      return result
    } catch (error) {
      console.error('❌ [班样服务] 网络异常:', error)
      return {
        success: false,
        message: `网络连接失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  // 提交压滤样数据到压滤样化验记录表
  static async submitFilterSample(data: FilterSampleData): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const headers = await getCurrentUserHeaders();

      const response = await fetch('/api/samples/filter-sample', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })

      // 检查HTTP状态码
      if (!response.ok) {
        console.error('❌ [压滤样服务] HTTP错误:', response.status, response.statusText)
        return {
          success: false,
          message: `网络请求失败: ${response.status} ${response.statusText}`
        }
      }

      const result = await response.json()
      console.log('📤 [压滤样服务] API响应:', result)
      return result
    } catch (error) {
      console.error('❌ [压滤样服务] 网络异常:', error)
      return {
        success: false,
        message: `网络连接失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  // 提交进厂样数据到进厂原矿-FDX表
  static async submitIncomingSample(data: IncomingSampleData): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const headers = await getCurrentUserHeaders();

      const response = await fetch('/api/samples/incoming-sample', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })

      // 检查HTTP状态码
      if (!response.ok) {
        console.error('❌ [进厂样服务] HTTP错误:', response.status, response.statusText)
        return {
          success: false,
          message: `网络请求失败: ${response.status} ${response.statusText}`
        }
      }

      const result = await response.json()
      console.log('📤 [进厂样服务] API响应:', result)
      return result
    } catch (error) {
      console.error('❌ [进厂样服务] 网络异常:', error)
      return {
        success: false,
        message: `网络连接失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  // 提交出厂样数据到出厂精矿-FDX表
  static async submitOutgoingSample(data: OutgoingSampleData): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const headers = await getCurrentUserHeaders();

      const response = await fetch('/api/samples/outgoing-sample', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })

      // 检查HTTP状态码
      if (!response.ok) {
        console.error('❌ [出厂样服务] HTTP错误:', response.status, response.statusText)
        return {
          success: false,
          message: `网络请求失败: ${response.status} ${response.statusText}`
        }
      }

      const result = await response.json()
      console.log('📤 [出厂样服务] API响应:', result)
      return result
    } catch (error) {
      console.error('❌ [出厂样服务] 网络异常:', error)
      return {
        success: false,
        message: `网络连接失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  // 提交球磨车间数据到浓细度记录-FDX表
  static async submitBallMillData(data: BallMillData): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const headers = await getCurrentUserHeaders();

      const response = await fetch('/api/samples/ball-mill-data', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })

      // 检查HTTP状态码
      if (!response.ok) {
        console.error('❌ [球磨车间服务] HTTP错误:', response.status, response.statusText)
        return {
          success: false,
          message: `网络请求失败: ${response.status} ${response.statusText}`
        }
      }

      const result = await response.json()
      console.log('📤 [球磨车间服务] API响应:', result)
      return result
    } catch (error) {
      console.error('❌ [球磨车间服务] 网络异常:', error)
      return {
        success: false,
        message: `网络连接失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }
}

// 头像存储服务类
export class AvatarService {
  // 上传头像到 Supabase Storage
  static async uploadAvatar(file: File, userId: string): Promise<string | null> {
    try {
      // 1. 压缩图片（如果需要）
      const compressedFile = await this.compressImage(file)

      // 2. 生成文件名
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      // 3. 上传到 Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('头像上传失败:', error)
        return null
      }

      // 4. 获取公开 URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // 5. 更新用户表的 avatar_url
      await UserService.updateUser(userId, { avatar_url: publicUrl })

      // 6. 更新本地缓存
      localStorage.setItem(`avatar_${userId}`, publicUrl)

      return publicUrl
    } catch (error) {
      console.error('头像上传服务错误:', error)
      return null
    }
  }

  // 压缩图片
  private static async compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        // 设置最大尺寸
        const maxSize = 512
        let { width, height } = img

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height

        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height)

        // 转换为 Blob
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob!], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(compressedFile)
          },
          'image/jpeg',
          0.8 // 压缩质量
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }

  // 删除旧头像
  static async deleteOldAvatar(avatarUrl: string): Promise<boolean> {
    try {
      // 从 URL 中提取文件路径
      const urlParts = avatarUrl.split('/avatars/')
      if (urlParts.length < 2) return false

      const filePath = urlParts[1]

      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath])

      if (error) {
        console.error('删除旧头像失败:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('删除头像服务错误:', error)
      return false
    }
  }
}
