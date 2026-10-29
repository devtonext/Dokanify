'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  BellRing, 
  Languages, 
  CircleUserRound,
  Plus,
  Monitor,
  Smartphone,
  MoreHorizontal,
  ArrowRight,
  SwatchBook,
  Store
} from 'lucide-react'

const themes = [
  {
    id: 1,
    name: 'Lumière Fashion',
    category: 'Fashion & Apparel',
    image: '/themes/lumiere.png',
    featured: true
  },
  {
    id: 2,
    name: 'Bazaar',
    category: 'Fashion & Apparel',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop',
    featured: false
  },
  {
    id: 3,
    name: 'Khadok',
    category: 'Food & Restaurant',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=800&fit=crop',
    featured: false
  },
  {
    id: 4,
    name: 'Circuit',
    category: 'Tech & Gadgets',
    image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&h=800&fit=crop',
    featured: false
  },
  {
    id: 5,
    name: 'Bloom',
    category: 'Beauty & Wellness',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=800&fit=crop',
    featured: false
  },
  {
    id: 6,
    name: 'Velocity',
    category: 'Sports & Fitness',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=800&fit=crop',
    featured: false
  },
  {
    id: 7,
    name: 'Artisan',
    category: 'Handmade & Crafts',
    image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&h=800&fit=crop',
    featured: false
  }
]

export default function ThemePage() {
  const handleCustomize = () => {
    window.location.href = '/theme/editor';
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="h-14 bg-card border-b flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="w-full bg-muted/50 border-transparent focus:ring-1 focus:ring-border rounded-lg pl-10 pr-4 py-1.5 text-sm"
                placeholder="Search"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <BellRing className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                3
              </span>
            </Button>
            <Button variant="ghost" size="icon" className="flex items-center gap-1">
              <Languages className="h-5 w-5" />
              <span className="text-xs font-bold">EN</span>
            </Button>
            <Button variant="ghost" size="icon">
              <CircleUserRound className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8 max-w-[1000px] mx-auto">
          {/* Page Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Themes</h1>
              <p className="text-sm text-muted-foreground">
                Manage and customize your store's appearance.
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Upload theme
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="library" className="mb-8">
            <div className="flex border-b">
              <TabsList className="h-auto bg-transparent border-b-0 rounded-none">
                <TabsTrigger 
                  value="library" 
                  className="border-b-2 border-primary data-[state=active]:bg-transparent rounded-none px-4 py-2"
                >
                  Theme library
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 py-2"
                >
                  Theme settings
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="library" className="space-y-12">
              {/* Current Theme Section */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Store className="h-4 w-4" />
                  Current theme
                </div>
                <Card className="overflow-hidden">
                  <CardContent className="p-2">
                    <div className="relative group">
                      <div className="absolute right-6 top-6 z-10 flex gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="bg-white/90 hover:bg-white shadow-sm"
                          title="Desktop Preview"
                        >
                          <Monitor className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="bg-white/90 hover:bg-white shadow-sm"
                          title="Mobile Preview"
                        >
                          <Smartphone className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="relative rounded-lg overflow-hidden bg-muted aspect-[16/7]">
                        <img
                          alt="Store preview mockup"
                          className="w-full h-full object-cover"
                          src="/themes/lumiere.png"
                        />
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Live
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-t">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-lg font-bold">Lumière Fashion</h3>
                          <span className="text-xs text-muted-foreground">v1.0.0</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Last published: Today at 2:15 PM
                        </p>
                      </div>
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button variant="outline" className="flex-1 md:flex-none">
                          Actions
                        </Button>
                        <Button className="flex-1 md:flex-none" onClick={handleCustomize}>
                          Customize
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Theme Library Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold">Theme library</h3>
                  <Button variant="ghost" className="text-sm font-medium gap-1">
                    Explore more themes
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {themes.map((theme) => (
                    <ThemeCard key={theme.id} theme={theme} onCustomize={handleCustomize} />
                  ))}
                </div>
              </section>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SwatchBook className="h-5 w-5" />
                    Theme Settings
                  </CardTitle>
                  <CardDescription>
                    Customize your current theme settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Theme Name</label>
                    <Input defaultValue="Lumière Fashion" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input 
                      defaultValue="A modern, clean theme for e-commerce stores"
                      placeholder="Enter theme description"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Primary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        defaultValue="#1a1a1a"
                        className="h-10 w-10 rounded cursor-pointer"
                      />
                      <Input defaultValue="#1a1a1a" className="flex-1" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button>Save Changes</Button>
                    <Button variant="outline">Reset to Default</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}

function ThemeCard({ theme, onCustomize }: { theme: typeof themes[0], onCustomize: () => void }) {
  return (
    <Card className="group overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-[4/4] bg-muted overflow-hidden relative">
        <img
          alt={theme.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={theme.image}
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" onClick={onCustomize}>
            Customize
          </Button>
        </div>
      </div>
      <CardContent className="p-4 flex items-center justify-between border-t">
        <div>
          <h4 className="font-semibold text-sm">{theme.name}</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">{theme.category}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
