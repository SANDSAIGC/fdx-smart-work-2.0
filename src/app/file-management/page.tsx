"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Folder, Upload, Download, Eye, Search, Filter,
  FolderOpen, FileImage, FileVideo, FileAudio, Archive,
  Settings, MoreVertical, Grid, List, SortAsc, SortDesc,
  Calendar, User, HardDrive, Cloud, Trash2, Edit, Share,
  Plus, RefreshCw, ChevronRight, Home, ArrowLeft,
  Bot, Sparkles, Wand2, Brain, Zap
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { Header2 } from "@/components/headers/header-2";
import { Footer } from "@/components/ui/footer";

// 类型定义
interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  mimeType?: string;
  createdAt: Date;
  updatedAt: Date;
  category: string;
  tags?: string[];
  description?: string;
  url?: string;
}

interface FileCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  count: number;
}

export default function FileManagementPage() {
  const router = useRouter();

  // 状态管理
  const [currentPath, setCurrentPath] = useState<string[]>(['根目录']);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  // 文件分类配置
  const fileCategories: FileCategory[] = [
    { id: 'all', name: '全部文件', icon: <Folder className="h-5 w-5" />, description: '所有文档和文件', color: 'gray', count: 0 },
    { id: 'production', name: '生产管理', icon: <Settings className="h-5 w-5" />, description: '生产管理相关文档', color: 'blue', count: 0 },
    { id: 'planning', name: '生产计划', icon: <Calendar className="h-5 w-5" />, description: '生产计划和调度文档', color: 'green', count: 0 },
    { id: 'safety', name: '安全生产', icon: <FileText className="h-5 w-5" />, description: '安全生产规范和记录', color: 'red', count: 0 },
    { id: 'equipment', name: '设备参数', icon: <HardDrive className="h-5 w-5" />, description: '设备技术参数文档', color: 'purple', count: 0 },
    { id: 'guidance', name: '工作指导', icon: <FileText className="h-5 w-5" />, description: '操作指导和工作手册', color: 'orange', count: 0 },
    { id: 'meeting', name: '会议纪要', icon: <FileText className="h-5 w-5" />, description: '会议记录和纪要', color: 'teal', count: 0 },
    { id: 'regulation', name: '制度章程', icon: <FileText className="h-5 w-5" />, description: '规章制度和管理办法', color: 'indigo', count: 0 },
    { id: 'training', name: '培训资料', icon: <FileText className="h-5 w-5" />, description: '培训教材和学习资料', color: 'pink', count: 0 },
  ];

  // 图库分类
  const imageCategories: FileCategory[] = [
    { id: 'concentration', name: '浓细度操作图库', icon: <FileImage className="h-5 w-5" />, description: '浓细度操作相关图片', color: 'cyan', count: 0 },
    { id: 'situation', name: '情况反映图库', icon: <FileImage className="h-5 w-5" />, description: '现场情况反映图片', color: 'yellow', count: 0 },
    { id: 'safety-drill', name: '安全生产演练图库', icon: <FileImage className="h-5 w-5" />, description: '安全演练活动图片', color: 'red', count: 0 },
    { id: 'construction', name: '工程施工图库', icon: <FileImage className="h-5 w-5" />, description: '工程施工现场图片', color: 'brown', count: 0 },
  ];

  // 示例文件数据
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: '1',
      name: '生产管理制度.pdf',
      type: 'file',
      size: 2048000,
      mimeType: 'application/pdf',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      category: 'production',
      tags: ['制度', '管理'],
      description: '生产管理相关制度文档'
    },
    {
      id: '2',
      name: '安全操作规程',
      type: 'folder',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-20'),
      category: 'safety',
      description: '安全操作相关文档集合'
    }
  ]);

  // 格式化文件大小
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // 获取文件图标
  const getFileIcon = useCallback((file: FileItem) => {
    if (file.type === 'folder') {
      return <FolderOpen className="h-8 w-8 text-blue-500" />;
    }
    
    const mimeType = file.mimeType || '';
    if (mimeType.startsWith('image/')) {
      return <FileImage className="h-8 w-8 text-green-500" />;
    } else if (mimeType.startsWith('video/')) {
      return <FileVideo className="h-8 w-8 text-purple-500" />;
    } else if (mimeType.startsWith('audio/')) {
      return <FileAudio className="h-8 w-8 text-orange-500" />;
    } else if (mimeType.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else if (mimeType.includes('zip') || mimeType.includes('rar')) {
      return <Archive className="h-8 w-8 text-yellow-500" />;
    } else {
      return <FileText className="h-8 w-8 text-gray-500" />;
    }
  }, []);

  // 文件上传处理
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 文件类型验证
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'text/plain',
          'text/csv'
        ];

        if (!allowedTypes.includes(file.type)) {
          alert(`不支持的文件类型: ${file.name}`);
          continue;
        }

        // 文件大小验证 (50MB限制)
        if (file.size > 50 * 1024 * 1024) {
          alert(`文件过大: ${file.name} (最大50MB)`);
          continue;
        }

        // 模拟上传进度
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', selectedCategory);

        // 模拟上传进度
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(progress);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 添加到文件列表 (模拟)
        const newFile: FileItem = {
          id: Date.now().toString() + i,
          name: file.name,
          type: 'file',
          size: file.size,
          mimeType: file.type,
          createdAt: new Date(),
          updatedAt: new Date(),
          category: selectedCategory,
          description: `上传的${file.type.includes('image') ? '图片' : '文档'}文件`
        };

        setFiles(prev => [...prev, newFile]);
      }

      setShowUploadDialog(false);
    } catch (error) {
      console.error('文件上传失败:', error);
      alert('文件上传失败，请重试');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [selectedCategory]);

  // 拖拽上传处理
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  // 文件输入处理
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  }, [handleFileUpload]);

  // 文件预览处理
  const handleFilePreview = useCallback((file: FileItem) => {
    if (file.type === 'folder') {
      // 进入文件夹
      setCurrentPath(prev => [...prev, file.name]);
      return;
    }

    // 根据文件类型处理预览
    const mimeType = file.mimeType || '';

    if (mimeType.startsWith('image/')) {
      // 图片预览 - 可以使用Dialog显示大图
      window.open(file.url || '#', '_blank');
    } else if (mimeType.includes('pdf')) {
      // PDF预览 - 在新窗口打开
      window.open(file.url || '#', '_blank');
    } else if (mimeType.includes('text/')) {
      // 文本文件预览
      window.open(file.url || '#', '_blank');
    } else {
      // 其他文件类型直接下载
      handleFileDownload(file);
    }
  }, []);

  // 文件下载处理
  const handleFileDownload = useCallback(async (file: FileItem) => {
    try {
      // 这里应该调用实际的下载API
      // const response = await fetch(`/api/file-management/download/${file.id}`);
      // const blob = await response.blob();

      // 模拟下载
      const link = document.createElement('a');
      link.href = file.url || '#';
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`下载文件: ${file.name}`);
    } catch (error) {
      console.error('文件下载失败:', error);
      alert('文件下载失败，请重试');
    }
  }, []);

  // 文件删除处理
  const handleFileDelete = useCallback(async (file: FileItem) => {
    if (!confirm(`确定要删除文件 "${file.name}" 吗？`)) {
      return;
    }

    try {
      // 这里应该调用实际的删除API
      // await fetch(`/api/file-management/delete/${file.id}`, { method: 'DELETE' });

      // 从列表中移除
      setFiles(prev => prev.filter(f => f.id !== file.id));
      console.log(`删除文件: ${file.name}`);
    } catch (error) {
      console.error('文件删除失败:', error);
      alert('文件删除失败，请重试');
    }
  }, []);

  // 文件重命名处理
  const handleFileRename = useCallback(async (file: FileItem) => {
    const newName = prompt('请输入新的文件名:', file.name);
    if (!newName || newName === file.name) {
      return;
    }

    try {
      // 这里应该调用实际的重命名API
      // await fetch(`/api/file-management/rename/${file.id}`, {
      //   method: 'PUT',
      //   body: JSON.stringify({ name: newName })
      // });

      // 更新文件列表
      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, name: newName } : f
      ));
      console.log(`重命名文件: ${file.name} -> ${newName}`);
    } catch (error) {
      console.error('文件重命名失败:', error);
      alert('文件重命名失败，请重试');
    }
  }, []);

  // 文件分享处理
  const handleFileShare = useCallback(async (file: FileItem) => {
    try {
      // 生成分享链接
      const shareUrl = `${window.location.origin}/file-share/${file.id}`;

      // 复制到剪贴板
      await navigator.clipboard.writeText(shareUrl);
      alert('分享链接已复制到剪贴板');
    } catch (error) {
      console.error('生成分享链接失败:', error);
      alert('生成分享链接失败，请重试');
    }
  }, []);

  // AI辅助功能处理函数
  const handleAIAnalysis = useCallback(async (file: FileItem) => {
    setIsAIProcessing(true);
    setShowAIPanel(true);

    try {
      // 这里是AI分析的预留接口
      // const response = await fetch('/api/ai/analyze-document', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ fileId: file.id, fileUrl: file.url })
      // });

      // 模拟AI分析过程
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 模拟AI分析结果
      const mockAnalysis = `AI文档分析报告 - ${file.name}

📄 文档概要：
• 文件类型：${file.mimeType?.includes('pdf') ? 'PDF文档' : file.mimeType?.includes('image') ? '图片文件' : '文档文件'}
• 文件大小：${file.size ? formatFileSize(file.size) : '未知'}
• 创建时间：${file.createdAt.toLocaleDateString()}

🔍 内容分析：
• 文档结构完整，格式规范
• 包含重要的生产管理信息
• 建议归档到${fileCategories.find(c => c.id === file.category)?.name || '相应分类'}

💡 智能建议：
• 可与相关生产计划文档建立关联
• 建议定期更新和审核
• 推荐添加标签：生产、管理、${new Date().getFullYear()}年

🚀 后续操作建议：
• 分享给相关团队成员
• 设置定期提醒更新
• 建立版本控制机制`;

      setAiAnalysisResult(mockAnalysis);
    } catch (error) {
      console.error('AI分析失败:', error);
      setAiAnalysisResult('AI分析暂时不可用，请稍后重试。');
    } finally {
      setIsAIProcessing(false);
    }
  }, [fileCategories, formatFileSize]);

  // AI文档生成功能
  const handleAIGenerate = useCallback(async (category: string, prompt: string) => {
    setIsAIProcessing(true);

    try {
      // 这里是AI生成的预留接口
      // const response = await fetch('/api/ai/generate-document', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ category, prompt })
      // });

      // 模拟AI生成过程
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log(`AI生成文档 - 分类: ${category}, 提示: ${prompt}`);
      alert('AI文档生成功能即将上线，敬请期待！');
    } catch (error) {
      console.error('AI生成失败:', error);
      alert('AI生成功能暂时不可用，请稍后重试。');
    } finally {
      setIsAIProcessing(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header2 
        title="文件管理中心"
        onBack={() => router.back()}
      />

      <div className="container mx-auto px-6 pb-6">
        {/* 面包屑导航 */}
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <Home className="h-4 w-4" />
          {currentPath.map((path, index) => (
            <React.Fragment key={index}>
              <span className={index === currentPath.length - 1 ? 'text-foreground font-medium' : 'hover:text-foreground cursor-pointer'}>
                {path}
              </span>
              {index < currentPath.length - 1 && <ChevronRight className="h-4 w-4" />}
            </React.Fragment>
          ))}
        </div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 侧边栏 - 文件分类 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">文档分类</CardTitle>
                <CardDescription>按类型浏览文档</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {fileCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.icon}
                    <span className="ml-2">{category.name}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {category.count}
                    </Badge>
                  </Button>
                ))}
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">图库分类</h4>
                  {imageCategories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "ghost"}
                      className="w-full justify-start text-sm"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.icon}
                      <span className="ml-2">{category.name}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {category.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 主内容区域 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 工具栏 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  {/* 搜索和筛选 */}
                  <div className="flex flex-1 gap-2">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="搜索文件..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={sortBy} onValueChange={(value: 'name' | 'date' | 'size') => setSortBy(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">按名称</SelectItem>
                        <SelectItem value="date">按日期</SelectItem>
                        <SelectItem value="size">按大小</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    >
                      {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAIPanel(true)}
                      disabled={isAIProcessing}
                    >
                      {isAIProcessing ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Bot className="h-4 w-4 mr-2" />
                      )}
                      AI助手
                    </Button>
                    <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          上传文件
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>上传文件</DialogTitle>
                          <DialogDescription>
                            选择文件上传到 {fileCategories.find(c => c.id === selectedCategory)?.name || '当前分类'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {/* 拖拽上传区域 */}
                          <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                              dragActive
                                ? 'border-primary bg-primary/5'
                                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                          >
                            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <div className="space-y-2">
                              <p className="text-sm font-medium">拖拽文件到此处上传</p>
                              <p className="text-xs text-muted-foreground">
                                或者点击下方按钮选择文件
                              </p>
                            </div>
                          </div>

                          {/* 文件选择按钮 */}
                          <div className="flex justify-center">
                            <Label htmlFor="file-upload" className="cursor-pointer">
                              <Button variant="outline" asChild>
                                <span>
                                  <Folder className="h-4 w-4 mr-2" />
                                  选择文件
                                </span>
                              </Button>
                            </Label>
                            <Input
                              id="file-upload"
                              type="file"
                              multiple
                              className="hidden"
                              onChange={handleFileInput}
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv"
                            />
                          </div>

                          {/* 上传进度 */}
                          {isUploading && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>上传进度</span>
                                <span>{uploadProgress}%</span>
                              </div>
                              <Progress value={uploadProgress} className="w-full" />
                            </div>
                          )}

                          {/* 支持的文件类型说明 */}
                          <div className="text-xs text-muted-foreground">
                            <p className="font-medium mb-1">支持的文件类型：</p>
                            <p>文档: PDF, Word, Excel, PowerPoint</p>
                            <p>图片: JPG, PNG, GIF, WebP</p>
                            <p>其他: TXT, CSV</p>
                            <p className="mt-1">最大文件大小: 50MB</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 文件列表区域 */}
            <Card>
              <CardHeader>
                <CardTitle>文件列表</CardTitle>
                <CardDescription>
                  {selectedCategory === 'all' ? '显示所有文件' : `显示 ${fileCategories.find(c => c.id === selectedCategory)?.name || imageCategories.find(c => c.id === selectedCategory)?.name} 分类文件`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* 文件网格视图 */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map((file) => (
                      <Card
                        key={file.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleFilePreview(file)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="flex justify-center mb-3">
                            {getFileIcon(file)}
                          </div>
                          <h4 className="font-medium text-sm truncate mb-1">{file.name}</h4>
                          {file.size && (
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {file.updatedAt.toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  /* 文件列表视图 */
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleFilePreview(file)}
                      >
                        {getFileIcon(file)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{file.name}</h4>
                          <p className="text-sm text-muted-foreground truncate">{file.description}</p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {file.size && <div>{formatFileSize(file.size)}</div>}
                          <div>{file.updatedAt.toLocaleDateString()}</div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleFilePreview(file)}>
                              <Eye className="h-4 w-4 mr-2" />
                              预览
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFileDownload(file)}>
                              <Download className="h-4 w-4 mr-2" />
                              下载
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFileShare(file)}>
                              <Share className="h-4 w-4 mr-2" />
                              分享
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAIAnalysis(file)}>
                              <Bot className="h-4 w-4 mr-2" />
                              AI分析
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleFileRename(file)}>
                              <Edit className="h-4 w-4 mr-2" />
                              重命名
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleFileDelete(file)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}

                {/* 空状态 */}
                {files.length === 0 && (
                  <div className="text-center py-12">
                    <Folder className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">暂无文件</h3>
                    <p className="text-muted-foreground mb-4">开始上传文件来构建您的文档库</p>
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      上传第一个文件
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI助手面板 */}
      <Dialog open={showAIPanel} onOpenChange={setShowAIPanel}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI智能助手
              <Badge variant="secondary" className="ml-2">
                <Sparkles className="h-3 w-3 mr-1" />
                Beta
              </Badge>
            </DialogTitle>
            <DialogDescription>
              AI助手可以帮您分析文档、生成内容、智能分类等
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* AI功能选项卡 */}
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="analysis">文档分析</TabsTrigger>
                <TabsTrigger value="generate">智能生成</TabsTrigger>
                <TabsTrigger value="classify">智能分类</TabsTrigger>
              </TabsList>

              {/* 文档分析 */}
              <TabsContent value="analysis" className="space-y-4">
                <div className="text-center py-6">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-medium mb-2">AI文档分析</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    选择文件后点击"AI分析"按钮，获取智能分析报告
                  </p>

                  {isAIProcessing && (
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>AI正在分析中...</span>
                    </div>
                  )}

                  {aiAnalysisResult && (
                    <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                      <pre className="whitespace-pre-wrap text-sm">{aiAnalysisResult}</pre>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* 智能生成 */}
              <TabsContent value="generate" className="space-y-4">
                <div className="text-center py-6">
                  <Wand2 className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-medium mb-2">AI智能生成</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    基于模板和提示词，AI可以帮您生成各类文档
                  </p>

                  <div className="space-y-4 max-w-md mx-auto">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择文档类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">生产管理文档</SelectItem>
                        <SelectItem value="safety">安全生产规范</SelectItem>
                        <SelectItem value="training">培训资料</SelectItem>
                        <SelectItem value="meeting">会议纪要</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input placeholder="输入生成提示词..." />

                    <Button
                      className="w-full"
                      onClick={() => handleAIGenerate('production', '生产管理制度')}
                      disabled={isAIProcessing}
                    >
                      {isAIProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          开始生成
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* 智能分类 */}
              <TabsContent value="classify" className="space-y-4">
                <div className="text-center py-6">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-medium mb-2">AI智能分类</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    AI可以根据文档内容自动推荐最合适的分类
                  </p>

                  <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                    {fileCategories.slice(1, 5).map((category) => (
                      <Button
                        key={category.id}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground mt-4">
                    功能即将上线，敬请期待
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <Footer />
    </div>
  );
}
