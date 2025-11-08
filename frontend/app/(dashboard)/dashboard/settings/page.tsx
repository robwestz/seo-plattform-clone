'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/lib/store/auth-store'
import { useToast } from '@/components/ui/use-toast'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [rankingAlerts, setRankingAlerts] = useState(true)
  const [weeklyReports, setWeeklyReports] = useState(false)

  const handleSaveProfile = () => {
    toast({
      title: 'Success',
      description: 'Profile updated successfully',
    })
  }

  const handleSaveNotifications = () => {
    toast({
      title: 'Success',
      description: 'Notification preferences saved',
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Leave blank to keep current password"
                  />
                </div>
                <Button onClick={handleSaveProfile}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ranking Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when your rankings change significantly
                    </p>
                  </div>
                  <Switch
                    checked={rankingAlerts}
                    onCheckedChange={setRankingAlerts}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly performance summaries
                    </p>
                  </div>
                  <Switch
                    checked={weeklyReports}
                    onCheckedChange={setWeeklyReports}
                  />
                </div>
                <Button onClick={handleSaveNotifications}>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>
                  Manage your subscription and billing information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold">Current Plan</h3>
                  <p className="text-2xl font-bold mt-2">Professional</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    $99/month - Billed monthly
                  </p>
                  <Button variant="outline" className="mt-4">
                    Upgrade Plan
                  </Button>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">Usage</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Keywords tracked</span>
                      <span className="font-medium">500 / 1000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Projects</span>
                      <span className="font-medium">3 / 10</span>
                    </div>
                    <div className="flex justify-between">
                      <span>API calls this month</span>
                      <span className="font-medium">12,450 / 50,000</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Manage your API keys for integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Your API Key</Label>
                  <div className="flex space-x-2">
                    <Input
                      value="sk_live_••••••••••••••••••••••••"
                      readOnly
                    />
                    <Button variant="outline">Copy</Button>
                  </div>
                </div>
                <Button variant="destructive">Regenerate API Key</Button>
                <p className="text-sm text-muted-foreground">
                  Warning: Regenerating your API key will invalidate the current key
                  and may break existing integrations.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
