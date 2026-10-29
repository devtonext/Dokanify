'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ThemeEditorPage() {
    return (
        <div className="h-screen flex flex-col overflow-hidden bg-background">
            {/* Editor Header */}
            <div className="h-12 border-b bg-card flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/theme">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Exit Editor
                        </Link>
                    </Button>
                    <div className="h-4 w-px bg-border" />
                    <h1 className="text-sm font-semibold">Lumière Fashion - Theme Editor</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">Save Draft</Button>
                    <Button size="sm">Publish Changes</Button>
                </div>
            </div>

            {/* Editor Iframe */}
            <div className="flex-1 bg-muted relative">
                <iframe
                    src="http://localhost:5173/builder"
                    className="w-full h-full border-none"
                    title="Theme Editor"
                />

                {/* Fallback/Overlay if editor is not running */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity bg-background/50">
                    <p className="text-sm text-muted-foreground">
                        Make sure the sdk-dev editor is running on port 5173
                    </p>
                </div>
            </div>
        </div>
    )
}
