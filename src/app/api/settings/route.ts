import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET store settings
export async function GET() {
  try {
    const store = await db.store.findFirst({
      where: { isActive: true }
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(store)
  } catch (error) {
    console.error('Error fetching store settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch store settings' },
      { status: 500 }
    )
  }
}

// PUT update store settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const store = await db.store.upsert({
      where: { id: body.id || '' },
      create: {
        name: body.name,
        phone: body.phone,
        email: body.email,
        address: body.address,
        city: body.city,
        logo: body.logo,
        currency: body.currency || 'BDT',
        paymentMethods: JSON.stringify(body.paymentMethods || []),
        shippingZones: JSON.stringify(body.shippingZones || []),
        isActive: true
      },
      update: {
        name: body.name,
        phone: body.phone,
        email: body.email,
        address: body.address,
        city: body.city,
        logo: body.logo,
        currency: body.currency,
        paymentMethods: JSON.stringify(body.paymentMethods),
        shippingZones: JSON.stringify(body.shippingZones),
        isActive: body.isActive
      }
    })

    return NextResponse.json(store)
  } catch (error) {
    console.error('Error updating store settings:', error)
    return NextResponse.json(
      { error: 'Failed to update store settings' },
      { status: 500 }
    )
  }
}
