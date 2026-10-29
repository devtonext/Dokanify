import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('paymentMethod')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (status) {
      where.status = status.toUpperCase()
    }
    if (paymentMethod) {
      where.paymentMethod = paymentMethod
    }

    const orders = await db.order.findMany({
      where,
      include: {
        customer: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    const total = await db.order.count({ where })

    return NextResponse.json({
      orders,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const order = await db.order.create({
      data: {
        orderNumber: body.orderNumber,
        customerId: body.customerId,
        status: body.status || 'PENDING',
        subtotal: body.subtotal,
        shipping: body.shipping || 0,
        discount: body.discount || 0,
        total: body.total,
        paymentMethod: body.paymentMethod,
        paymentStatus: body.paymentStatus || 'PENDING',
        shippingAddress: body.shippingAddress,
        city: body.city,
        phone: body.phone,
        notes: body.notes,
        items: JSON.stringify(body.items || [])
      }
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
