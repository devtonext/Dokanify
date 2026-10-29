'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Store, 
  CreditCard, 
  Truck, 
  BellRing, 
  ShieldCheck, 
  Globe,
  Save
} from 'lucide-react'

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your store configuration and preferences
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Store Information
                </CardTitle>
                <CardDescription>
                  Basic information about your store
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="store-name">Store Name</Label>
                    <Input id="store-name" defaultValue="Dokanio - Premium Clothing" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="store-email">Store Email</Label>
                    <Input id="store-email" type="email" defaultValue="support@shopbd.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="store-phone">Phone Number</Label>
                    <Input id="store-phone" placeholder="+880 1XXX-XXXXXX" defaultValue="+880 1712-345678" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="store-currency">Currency</Label>
                    <Input id="store-currency" defaultValue="BDT - Bangladeshi Taka" disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-address">Address</Label>
                  <Textarea 
                    id="store-address" 
                    placeholder="Enter your store address"
                    defaultValue="House 12, Road 5, Dhanmondi, Dhaka-1205"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-city">City</Label>
                  <Input id="store-city" defaultValue="Dhaka" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Regional Settings
                </CardTitle>
                <CardDescription>
                  Configure location-based settings for Bangladesh
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select 
                      id="timezone" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="Asia/Dhaka" selected>Asia/Dhaka (GMT+6)</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                      <option value="UTC">UTC (GMT+0)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <select 
                      id="language" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="en" selected>English</option>
                      <option value="bn">বাংলা (Bengali)</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show prices with tax included</Label>
                    <p className="text-xs text-muted-foreground">
                      Display product prices including VAT/Tax
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Gateways
                </CardTitle>
                <CardDescription>
                  Configure payment methods for Bangladesh
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* bKash */}
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">bKash</h4>
                      <p className="text-sm text-muted-foreground">Bangladesh's largest mobile financial service</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bkash-merchant">Merchant Account</Label>
                      <Input id="bkash-merchant" placeholder="017XXXXXXXX" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bkash-api">API Key</Label>
                      <Input id="bkash-api" type="password" placeholder="Enter API key" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bkash-secret">App Secret</Label>
                      <Input id="bkash-secret" type="password" placeholder="Enter app secret" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bkash-username">Username</Label>
                      <Input id="bkash-username" placeholder="Enter username" />
                    </div>
                  </div>
                </div>

                {/* Nagad */}
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Nagad</h4>
                      <p className="text-sm text-muted-foreground">Popular mobile financial service in Bangladesh</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nagad-merchant">Merchant Account</Label>
                      <Input id="nagad-merchant" placeholder="018XXXXXXXX" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nagad-api">API Key</Label>
                      <Input id="nagad-api" type="password" placeholder="Enter API key" />
                    </div>
                  </div>
                </div>

                {/* Rocket */}
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Rocket</h4>
                      <p className="text-sm text-muted-foreground">Dutch-Bangla Bank's mobile financial service</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="rocket-merchant">Merchant Account</Label>
                      <Input id="rocket-merchant" placeholder="019XXXXXXXX" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rocket-api">API Key</Label>
                      <Input id="rocket-api" type="password" placeholder="Enter API key" />
                    </div>
                  </div>
                </div>

                {/* Cash on Delivery */}
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Cash on Delivery (COD)</h4>
                      <p className="text-sm text-muted-foreground">Allow customers to pay when they receive their order</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cod-fee">Additional Fee (BDT)</Label>
                      <Input id="cod-fee" type="number" placeholder="0" defaultValue="50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cod-max">Maximum Order Amount (BDT)</Label>
                      <Input id="cod-max" type="number" placeholder="Maximum amount" defaultValue="10000" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </TabsContent>

          {/* Shipping Settings */}
          <TabsContent value="shipping" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Zones
                </CardTitle>
                <CardDescription>
                  Configure shipping rates for different regions in Bangladesh
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Dhaka Metro</h4>
                      <p className="text-sm text-muted-foreground">Dhaka city and metropolitan area</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="dhaka-rate">Base Rate (BDT)</Label>
                      <Input id="dhaka-rate" type="number" defaultValue="60" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dhaka-time">Delivery Time</Label>
                      <Input id="dhaka-time" defaultValue="2-3 business days" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Outside Dhaka</h4>
                      <p className="text-sm text-muted-foreground">All other districts in Bangladesh</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="outside-dhaka-rate">Base Rate (BDT)</Label>
                      <Input id="outside-dhaka-rate" type="number" defaultValue="120" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="outside-dhaka-time">Delivery Time</Label>
                      <Input id="outside-dhaka-time" defaultValue="3-5 business days" />
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  + Add New Shipping Zone
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BellRing className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Manage how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Order Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>New Order Received</Label>
                        <p className="text-xs text-muted-foreground">Get notified when a new order is placed</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Order Status Update</Label>
                        <p className="text-xs text-muted-foreground">Get notified when order status changes</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Low Stock Alert</Label>
                        <p className="text-xs text-muted-foreground">Get notified when products are low in stock</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Customer Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Order Confirmation</Label>
                        <p className="text-xs text-muted-foreground">Send confirmation email to customers</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Shipping Update</Label>
                        <p className="text-xs text-muted-foreground">Send shipping notification to customers</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Delivery Confirmation</Label>
                        <p className="text-xs text-muted-foreground">Send delivery confirmation to customers</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Notification Channels</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>SMS Notifications</Label>
                        <p className="text-xs text-muted-foreground">Receive notifications via SMS (BDT 0.50/SMS)</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Password</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </div>
                  <Button variant="outline">Update Password</Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Two-Factor Authentication</h4>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label>Enable 2FA</Label>
                      <p className="text-xs text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Active Sessions</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">Chrome on Windows</p>
                        <p className="text-xs text-muted-foreground">
                          Dhaka, Bangladesh • Last active 2 minutes ago
                        </p>
                      </div>
                      <Badge>Current</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">Safari on iPhone</p>
                        <p className="text-xs text-muted-foreground">
                          Dhaka, Bangladesh • Last active 1 hour ago
                        </p>
                      </div>
                      <Button variant="destructive" size="sm">Revoke</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
