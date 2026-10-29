import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (category) {
      where.category = category
    }
    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } }
      ]
    }

    const products = await db.product.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    const total = await db.product.count({ where })

    return NextResponse.json({
      products,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const product = await db.product.create({
      data: {
        name: body.name,
        description: body.description,
        price: body.price,
        comparePrice: body.comparePrice,
        sku: bodysku,
        barcode: body.barcode,
        quantity: body.quantity || 0,
        images: JSON.stringify(body.images || []),
        category: body.category,
        tags: JSON.stringify(body.tags || []),
        isActive: body.isActive !== false
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
