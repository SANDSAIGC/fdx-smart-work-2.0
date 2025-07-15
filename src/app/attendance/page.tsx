"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Clock, MapPin, Calendar, User, CheckCircle, 
  XCircle, ArrowLeft, Camera, Wifi, WifiOff,
  Timer, CalendarDays, Users, BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { Footer } from "@/components/ui/footer";

// 考勤记录接口
interface AttendanceRecord {
  id: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  location: string;
  status: 'present' | 'late' | 'absent' | 'leave';
  workHours?: number;
}

// 位置信息接口
interface LocationInfo {
  latitude: number;
  longitude: number;
  address: string;
  accuracy: number;
}

export default function AttendancePage() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);

  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 检查网络状态
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 获取位置信息
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: "富鼎翔选矿厂",
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error("获取位置失败:", error);
          setLocation({
            latitude: 0,
            longitude: 0,
            address: "位置获取失败",
            accuracy: 0
          });
        }
      );
    }
  }, []);

  // 模拟今日考勤记录
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const mockRecord: AttendanceRecord = {
      id: '1',
      date: today,
      checkInTime: '08:30:00',
      location: '富鼎翔选矿厂',
      status: 'present'
    };
    setTodayRecord(mockRecord);
    setIsCheckedIn(true);

    // 模拟最近考勤记录
    const mockRecords: AttendanceRecord[] = [
      {
        id: '1',
        date: today,
        checkInTime: '08:30:00',
        location: '富鼎翔选矿厂',
        status: 'present'
      },
      {
        id: '2',
        date: '2024-12-27',
        checkInTime: '08:25:00',
        checkOutTime: '17:30:00',
        location: '富鼎翔选矿厂',
        status: 'present',
        workHours: 9
      },
      {
        id: '3',
        date: '2024-12-26',
        checkInTime: '08:45:00',
        checkOutTime: '17:25:00',
        location: '富鼎翔选矿厂',
        status: 'late',
        workHours: 8.67
      }
    ];
    setRecentRecords(mockRecords);
  }, []);

  // 打卡操作
  const handleCheckIn = () => {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];
    
    if (!isCheckedIn) {
      // 签到
      const newRecord: AttendanceRecord = {
        id: Date.now().toString(),
        date: now.toISOString().split('T')[0],
        checkInTime: timeString,
        location: location?.address || '未知位置',
        status: now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 30) ? 'late' : 'present'
      };
      setTodayRecord(newRecord);
      setIsCheckedIn(true);
    } else {
      // 签退
      if (todayRecord) {
        const updatedRecord = {
          ...todayRecord,
          checkOutTime: timeString,
          workHours: calculateWorkHours(todayRecord.checkInTime!, timeString)
        };
        setTodayRecord(updatedRecord);
      }
    }
  };

  // 计算工作时长
  const calculateWorkHours = (checkIn: string, checkOut: string): number => {
    const [inHour, inMin] = checkIn.split(':').map(Number);
    const [outHour, outMin] = checkOut.split(':').map(Number);
    
    const inMinutes = inHour * 60 + inMin;
    const outMinutes = outHour * 60 + outMin;
    
    return Math.round((outMinutes - inMinutes) / 60 * 100) / 100;
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-500';
      case 'late': return 'text-yellow-500';
      case 'absent': return 'text-red-500';
      case 'leave': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return '正常';
      case 'late': return '迟到';
      case 'absent': return '缺勤';
      case 'leave': return '请假';
      default: return '未知';
    }
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
            <h1 className="text-lg font-semibold">考勤打卡</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <HamburgerMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 当前时间和状态 */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold">
                {currentTime.toLocaleTimeString('zh-CN', { 
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
              <div className="text-lg text-muted-foreground">
                {currentTime.toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </div>
              
              {/* 网络和位置状态 */}
              <div className="flex justify-center items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  {isOnline ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <span>{isOnline ? '网络正常' : '网络断开'}</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <span>{location?.address || '获取位置中...'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 打卡按钮 */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Button
                size="lg"
                className="w-32 h-32 rounded-full text-lg font-semibold"
                onClick={handleCheckIn}
                disabled={!isOnline || !location}
              >
                <div className="flex flex-col items-center gap-2">
                  {!isCheckedIn ? (
                    <>
                      <CheckCircle className="h-8 w-8" />
                      <span>签到</span>
                    </>
                  ) : !todayRecord?.checkOutTime ? (
                    <>
                      <XCircle className="h-8 w-8" />
                      <span>签退</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-8 w-8" />
                      <span>已完成</span>
                    </>
                  )}
                </div>
              </Button>
              
              {todayRecord && (
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <Badge variant={todayRecord.status === 'present' ? 'default' : 'destructive'}>
                      {getStatusText(todayRecord.status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {todayRecord.checkInTime && (
                      <div>签到时间: {todayRecord.checkInTime}</div>
                    )}
                    {todayRecord.checkOutTime && (
                      <div>签退时间: {todayRecord.checkOutTime}</div>
                    )}
                    {todayRecord.workHours && (
                      <div>工作时长: {todayRecord.workHours} 小时</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 考勤统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">本月出勤</p>
                  <p className="text-2xl font-bold">22</p>
                </div>
                <CalendarDays className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">迟到次数</p>
                  <p className="text-2xl font-bold">2</p>
                </div>
                <Timer className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">请假天数</p>
                  <p className="text-2xl font-bold">1</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">工时统计</p>
                  <p className="text-2xl font-bold">176</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 最近考勤记录 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              最近考勤记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      record.status === 'present' ? 'bg-green-500' :
                      record.status === 'late' ? 'bg-yellow-500' :
                      record.status === 'absent' ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <div className="font-medium">{record.date}</div>
                      <div className="text-sm text-muted-foreground">
                        {record.checkInTime} - {record.checkOutTime || '未签退'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getStatusColor(record.status)}`}>
                      {getStatusText(record.status)}
                    </div>
                    {record.workHours && (
                      <div className="text-xs text-muted-foreground">
                        {record.workHours}h
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 底部签名 */}
      <Footer />
    </div>
  );
}
