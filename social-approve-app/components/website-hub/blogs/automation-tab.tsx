'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BlogAutomationTabProps {
  domain: string;
}
import {
  Bot,
  Power,
  PowerOff,
  Clock,
  Calendar,
  TrendingUp,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Settings
} from 'lucide-react';

interface AutomationConfig {
  enabled: boolean;
  domain: string;
  schedule: string;
  cronExpression: string;
  lastRun?: string;
  nextRun?: string;
  totalProcessed: number;
  history: Array<{
    timestamp: string;
    articleTitle: string;
    articleId: string;
    status: 'started' | 'completed' | 'failed';
    error?: string;
  }>;
}

const SCHEDULE_PRESETS = [
  { label: 'Every 2 hours', cron: '0 */2 * * *' },
  { label: 'Every 4 hours', cron: '0 */4 * * *' },
  { label: 'Every 6 hours', cron: '0 */6 * * *' },
  { label: 'Every 12 hours', cron: '0 */12 * * *' },
  { label: 'Daily at 3 AM', cron: '0 3 * * *' },
  { label: 'Daily at 9 AM', cron: '0 9 * * *' },
  { label: 'Twice daily (9 AM, 9 PM)', cron: '0 9,21 * * *' },
];

export function BlogAutomationTab({ domain }: BlogAutomationTabProps) {
  const [config, setConfig] = useState<AutomationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [domain]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/websites/article-queue/automation?domain=${encodeURIComponent(domain)}`);
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      console.error('Error loading automation config:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomation = async () => {
    if (!config) return;

    setUpdating(true);
    try {
      const res = await fetch('/api/websites/article-queue/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          enabled: !config.enabled,
          schedule: config.schedule,
          cronExpression: config.cronExpression
        })
      });

      const data = await res.json();

      if (data.success) {
        setConfig(data.config);
        alert(data.message);
      } else {
        alert('Failed to update automation: ' + data.error);
      }
    } catch (err) {
      console.error('Error updating automation:', err);
      alert('Failed to update automation');
    } finally {
      setUpdating(false);
    }
  };

  const updateSchedule = async (schedule: string, cronExpression: string) => {
    if (!config) return;

    setUpdating(true);
    try {
      const res = await fetch('/api/websites/article-queue/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          enabled: config.enabled,
          schedule,
          cronExpression
        })
      });

      const data = await res.json();

      if (data.success) {
        setConfig(data.config);
        alert('Schedule updated successfully!');
      } else {
        alert('Failed to update schedule: ' + data.error);
      }
    } catch (err) {
      console.error('Error updating schedule:', err);
      alert('Failed to update schedule');
    } finally {
      setUpdating(false);
    }
  };

  const manualTrigger = async () => {
    setTriggering(true);
    try {
      const res = await fetch('/api/websites/article-queue/automation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });

      const data = await res.json();

      if (data.success) {
        alert(
          `✅ Article Research Started!\n\n` +
          `Title: ${data.article.title}\n` +
          `Keyword: ${data.article.keyword}\n\n` +
          `This will run in detached mode and take ~30-45 minutes.`
        );
        loadConfig(); // Reload to show updated history
      } else {
        alert(`❌ ${data.error}\n\n${data.message || 'Please add articles to the queue first.'}`);
      }
    } catch (err) {
      console.error('Error triggering automation:', err);
      alert('Failed to trigger automation');
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Loading automation settings...</p>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Bot className="h-16 w-16 mx-auto text-muted-foreground/20" />
          <p className="mt-4 text-sm text-muted-foreground">Failed to load automation configuration</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Automated Article Research
              </CardTitle>
              <CardDescription>
                Automatically process articles from the queue at scheduled intervals
              </CardDescription>
            </div>
            <Button
              size="lg"
              variant={config.enabled ? 'destructive' : 'default'}
              onClick={toggleAutomation}
              disabled={updating}
              className="gap-2"
            >
              {updating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : config.enabled ? (
                <PowerOff className="h-5 w-5" />
              ) : (
                <Power className="h-5 w-5" />
              )}
              {config.enabled ? 'Disable' : 'Enable'} Automation
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  {config.enabled ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-lg font-semibold">
                      {config.enabled ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Schedule</p>
                    <p className="text-lg font-semibold">{config.schedule}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Last Run</p>
                    <p className="text-lg font-semibold">
                      {config.lastRun
                        ? new Date(config.lastRun).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Total Processed</p>
                    <p className="text-lg font-semibold">{config.totalProcessed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Manual Trigger */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div>
              <h3 className="font-semibold">Manual Trigger</h3>
              <p className="text-sm text-muted-foreground">
                Process the next article in queue immediately
              </p>
            </div>
            <Button
              variant="outline"
              onClick={manualTrigger}
              disabled={triggering}
              className="gap-2"
            >
              {triggering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Trigger Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Schedule Configuration
          </CardTitle>
          <CardDescription>
            Choose how often to automatically process articles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {SCHEDULE_PRESETS.map((preset) => (
              <Button
                key={preset.cron}
                variant={config.cronExpression === preset.cron ? 'default' : 'outline'}
                onClick={() => updateSchedule(preset.label, preset.cron)}
                disabled={updating}
                className="justify-start"
              >
                <Clock className="h-4 w-4 mr-2" />
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm">
            <span className="font-medium">Current Cron Expression:</span>{' '}
            <code className="px-2 py-1 rounded bg-background">{config.cronExpression}</code>
          </div>
        </CardContent>
      </Card>

      {/* Automation History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Automation History</CardTitle>
              <CardDescription>Recent automated article processing runs</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadConfig}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {config.history && config.history.length > 0 ? (
            <div className="space-y-3">
              {config.history.map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-start gap-3">
                    {entry.status === 'started' && (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    )}
                    {entry.status === 'completed' && (
                      <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5" />
                    )}
                    {entry.status === 'failed' && (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">{entry.articleTitle}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                      {entry.error && (
                        <p className="text-sm text-red-500 mt-1">{entry.error}</p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      entry.status === 'started'
                        ? 'default'
                        : entry.status === 'completed'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {entry.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground/20" />
              <p className="mt-4 text-sm text-muted-foreground">No automation history yet</p>
              <p className="text-xs text-muted-foreground">
                Enable automation or use manual trigger to start processing
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
