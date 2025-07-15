"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, AlertTriangle, Save, Loader2, CheckCircle,
  AlertCircle, MapPin, User, Calendar, FileText, Camera,
  Clock, Flag, MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { Footer } from "@/components/ui/footer";
import { cn } from "@/lib/utils";

// 情况上报表单数据接口
interface SituationReportFormData {
  title: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | '';
  location: string;
  description: string;
  immediateAction: string;
  estimatedImpact: string;
  contactPerson: string;
  contactPhone: string;
  followUpRequired: boolean;
  attachments: File[];
  priority: number;
}

// 初始表单数据
const initialFormData: SituationReportFormData = {
  title: "",
  category: "",
  severity: "",
  location: "",
  description: "",
  immediateAction: "",
  estimatedImpact: "",
  contactPerson: "",
  contactPhone: "",
  followUpRequired: false,
  attachments: [],
  priority: 3
};

export default function SituationReportPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SituationReportFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState<string>("");

  // 更新表单字段
  const updateFormField = (field: keyof SituationReportFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      updateFormField('attachments', [...formData.attachments, ...fileArray]);
    }
  };

  // 移除附件
  const removeAttachment = (index: number) => {
    const newAttachments = formData.attachments.filter((_, i) => i !== index);
    updateFormField('attachments', newAttachments);
  };

  // 表单验证
  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setSubmitMessage("请填写事件标题");
      setSubmitStatus('error');
      return false;
    }
    if (!formData.category) {
      setSubmitMessage("请选择事件类别");
      setSubmitStatus('error');
      return false;
    }
    if (!formData.severity) {
      setSubmitMessage("请选择严重程度");
      setSubmitStatus('error');
      return false;
    }
    if (!formData.location.trim()) {
      setSubmitMessage("请填写发生地点");
      setSubmitStatus('error');
      return false;
    }
    if (!formData.description.trim()) {
      setSubmitMessage("请填写详细描述");
      setSubmitStatus('error');
      return false;
    }
    if (!formData.contactPerson.trim()) {
      setSubmitMessage("请填写联系人");
      setSubmitStatus('error');
      return false;
    }
    if (!formData.contactPhone.trim()) {
      setSubmitMessage("请填写联系电话");
      setSubmitStatus('error');
      return false;
    }
    return true;
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) {
      setTimeout(() => {
        setSubmitStatus('idle');
        setSubmitMessage("");
      }, 3000);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // 生成报告编号
      const now = new Date();
      const reportNumber = `SR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      
      // 构建提交数据
      const submitData = {
        ...formData,
        reportNumber,
        reportTime: now.toISOString(),
        reporter: "当前用户", // 实际应用中从用户上下文获取
        status: 'pending'
      };

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟成功响应
      console.log('提交的情况报告数据:', submitData);
      
      setSubmitStatus('success');
      setSubmitMessage(`情况报告提交成功！报告编号：${reportNumber}`);
      
      // 重置表单
      setTimeout(() => {
        setFormData(initialFormData);
        setSubmitStatus('idle');
        setSubmitMessage("");
      }, 3000);
      
    } catch (error) {
      console.error('提交失败:', error);
      setSubmitStatus('error');
      setSubmitMessage('提交失败，请稍后重试');
      
      setTimeout(() => {
        setSubmitStatus('idle');
        setSubmitMessage("");
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 获取严重程度颜色
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // 获取优先级星级
  const getPriorityStars = (priority: number) => {
    return '★'.repeat(priority) + '☆'.repeat(5 - priority);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">情况上报</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <HamburgerMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 主要内容 */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>情况上报</span>
            </CardTitle>
            <CardDescription>
              请详细填写事件信息，确保信息准确完整以便及时处理
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 基础信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>基础信息</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 事件标题 */}
                <div className="space-y-2">
                  <Label htmlFor="title">事件标题 *</Label>
                  <Input
                    id="title"
                    placeholder="请简要描述事件"
                    value={formData.title}
                    onChange={(e) => updateFormField('title', e.target.value)}
                  />
                </div>

                {/* 事件类别 */}
                <div className="space-y-2">
                  <Label htmlFor="category">事件类别 *</Label>
                  <Select value={formData.category} onValueChange={(value) => updateFormField('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择事件类别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="安全事故">安全事故</SelectItem>
                      <SelectItem value="设备故障">设备故障</SelectItem>
                      <SelectItem value="质量问题">质量问题</SelectItem>
                      <SelectItem value="环境异常">环境异常</SelectItem>
                      <SelectItem value="人员事件">人员事件</SelectItem>
                      <SelectItem value="其他">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 严重程度 */}
                <div className="space-y-2">
                  <Label htmlFor="severity">严重程度 *</Label>
                  <Select value={formData.severity} onValueChange={(value) => updateFormField('severity', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择严重程度" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">
                        <span className="text-red-600">严重 - 需要立即处理</span>
                      </SelectItem>
                      <SelectItem value="high">
                        <span className="text-orange-600">高 - 需要优先处理</span>
                      </SelectItem>
                      <SelectItem value="medium">
                        <span className="text-yellow-600">中 - 正常处理</span>
                      </SelectItem>
                      <SelectItem value="low">
                        <span className="text-green-600">低 - 可延后处理</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 发生地点 */}
                <div className="space-y-2">
                  <Label htmlFor="location">发生地点 *</Label>
                  <Input
                    id="location"
                    placeholder="请填写具体地点"
                    value={formData.location}
                    onChange={(e) => updateFormField('location', e.target.value)}
                  />
                </div>
              </div>

              {/* 优先级设置 */}
              <div className="space-y-2">
                <Label htmlFor="priority">优先级 (1-5星，5星最高)</Label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    id="priority"
                    min="1"
                    max="5"
                    value={formData.priority}
                    onChange={(e) => updateFormField('priority', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-yellow-500 text-lg min-w-[100px]">
                    {getPriorityStars(formData.priority)}
                  </span>
                </div>
              </div>
            </div>

            {/* 详细描述 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>详细信息</span>
              </h3>

              {/* 事件描述 */}
              <div className="space-y-2">
                <Label htmlFor="description">详细描述 *</Label>
                <Textarea
                  id="description"
                  placeholder="请详细描述事件的发生经过、现状等信息"
                  value={formData.description}
                  onChange={(e) => updateFormField('description', e.target.value)}
                  rows={4}
                />
              </div>

              {/* 已采取措施 */}
              <div className="space-y-2">
                <Label htmlFor="immediateAction">已采取的紧急措施</Label>
                <Textarea
                  id="immediateAction"
                  placeholder="请描述已经采取的紧急处理措施"
                  value={formData.immediateAction}
                  onChange={(e) => updateFormField('immediateAction', e.target.value)}
                  rows={3}
                />
              </div>

              {/* 预估影响 */}
              <div className="space-y-2">
                <Label htmlFor="estimatedImpact">预估影响</Label>
                <Textarea
                  id="estimatedImpact"
                  placeholder="请描述事件可能造成的影响"
                  value={formData.estimatedImpact}
                  onChange={(e) => updateFormField('estimatedImpact', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* 联系信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>联系信息</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 联系人 */}
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">联系人 *</Label>
                  <Input
                    id="contactPerson"
                    placeholder="请填写联系人姓名"
                    value={formData.contactPerson}
                    onChange={(e) => updateFormField('contactPerson', e.target.value)}
                  />
                </div>

                {/* 联系电话 */}
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">联系电话 *</Label>
                  <Input
                    id="contactPhone"
                    placeholder="请填写联系电话"
                    value={formData.contactPhone}
                    onChange={(e) => updateFormField('contactPhone', e.target.value)}
                  />
                </div>
              </div>

              {/* 是否需要跟进 */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="followUpRequired"
                  checked={formData.followUpRequired}
                  onChange={(e) => updateFormField('followUpRequired', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="followUpRequired">需要后续跟进</Label>
              </div>
            </div>

            {/* 附件上传 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Camera className="h-5 w-5" />
                <span>附件上传</span>
              </h3>

              <div className="space-y-2">
                <Label htmlFor="attachments">上传相关图片或文件</Label>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                />
                <p className="text-sm text-muted-foreground">
                  支持图片、PDF、Word文档，最多上传5个文件
                </p>
              </div>

              {/* 已上传文件列表 */}
              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  <Label>已上传文件：</Label>
                  <div className="space-y-1">
                    {formData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeAttachment(index)}
                        >
                          移除
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 提交状态显示 */}
            {submitStatus !== 'idle' && (
              <div className={cn(
                "flex items-center space-x-2 p-3 rounded-lg",
                submitStatus === 'success' ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
              )}>
                {submitStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{submitMessage}</span>
              </div>
            )}

            {/* 提交按钮 */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setFormData(initialFormData)}
                disabled={isSubmitting}
              >
                重置表单
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    提交报告
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 底部签名 */}
      <Footer />
    </div>
  );
}
