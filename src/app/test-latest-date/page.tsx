'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestLatestDatePage() {
  const [latestDate, setLatestDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const testLatestDate = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/incoming-ore-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataSource: 'jdxy',
          getLatestDate: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('API响应:', result);
        if (result.success && result.latestDate) {
          setLatestDate(result.latestDate);
        } else {
          setError('未找到最新日期数据');
        }
      } else {
        setError(`API请求失败: ${response.statusText}`);
      }
    } catch (error) {
      console.error('获取最新日期失败:', error);
      setError(`请求错误: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>测试最新日期API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testLatestDate} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? '获取中...' : '获取最新日期'}
          </Button>
          
          {latestDate && (
            <div className="p-4 bg-green-100 rounded">
              <strong>最新日期:</strong> {latestDate}
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-red-100 rounded">
              <strong>错误:</strong> {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
