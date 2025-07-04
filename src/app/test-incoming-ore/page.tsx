"use client";

import React, { useState, useEffect } from 'react';
import { Header2 } from '@/components/headers';
import { Footer } from '@/components/ui/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function TestIncomingOrePage() {
  const [fdxData, setFdxData] = useState([]);
  const [jdxyData, setJdxyData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // 测试富鼎翔数据
      const fdxResponse = await fetch('/api/lab/fdx-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: '2024-01-01',
          endDate: '2025-12-31'
        })
      });

      if (fdxResponse.ok) {
        const fdxResult = await fdxResponse.json();
        setFdxData(fdxResult.data?.incoming || []);
        console.log('富鼎翔数据:', fdxResult.data?.incoming);
      }

      // 测试金鼎数据
      const jdxyResponse = await fetch('/api/lab/jdxy-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: '2024-01-01',
          endDate: '2025-12-31'
        })
      });

      if (jdxyResponse.ok) {
        const jdxyResult = await jdxyResponse.json();
        setJdxyData(jdxyResult.data?.incoming || []);
        console.log('金鼎数据:', jdxyResult.data?.incoming);
      }

    } catch (err) {
      setError('获取数据失败: ' + err.message);
      console.error('获取数据失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header2 title="进厂原矿数据测试" />
      
      <div className="container mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>数据测试结果</CardTitle>
            <CardDescription>测试进厂原矿数据API连接</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={fetchData} disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                刷新数据
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-destructive">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">富鼎翔数据</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>记录数: {fdxData.length}</p>
                  {fdxData.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium">最新记录:</h4>
                      {fdxData.slice(0, 3).map((item, index) => (
                        <div key={index} className="p-2 bg-muted rounded text-sm">
                          <p>日期: {item.计量日期}</p>
                          <p>湿重: {item.进厂湿重}t</p>
                          <p>水份: {item['水份(%)']}%</p>
                          <p>Pb: {item.Pb}%</p>
                          <p>Zn: {item.Zn}%</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">金鼎数据</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>记录数: {jdxyData.length}</p>
                  {jdxyData.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium">最新记录:</h4>
                      {jdxyData.slice(0, 3).map((item, index) => (
                        <div key={index} className="p-2 bg-muted rounded text-sm">
                          <p>日期: {item.计量日期}</p>
                          <p>湿重: {item.进厂湿重}t</p>
                          <p>水份: {item['水份(%)']}%</p>
                          <p>Pb: {item.Pb}%</p>
                          <p>Zn: {item.Zn}%</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">原始数据 (JSON)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">富鼎翔原始数据:</h4>
                    <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(fdxData, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">金鼎原始数据:</h4>
                    <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(jdxyData, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
