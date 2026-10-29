import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    
    // Get total revenue
    const orders = await db.order.findMany({
      where: {
        status: { in: ['DELIVERED', 'PROCESSING', 'SHIPPED'] }
      }
    })

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = orders.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Get unique customers
    const uniqueCustomers = await db.customer.count()

    // Get product stats
    const products = await db.product.findMany()
    const totalProducts = products.length
    const inStock = products.filter(p => p.quantity > 0).length
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity < 10).length
    const outOfStock = products.filter(p => p.quantity === 0).length

    // Get orders by payment method
    const paymentMethods = orders.reduce((acc: any, order) => {
      acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + order.total
      return acc
    }, {})

    // Get orders by city
    const cities = orders.reduce((acc: any, order) => {
      acc[order.city] = (acc[order.city] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      revenue: totalRevenue,
      orders: totalOrders,
      customers: uniqueCustomers,
      avgOrderValue,
      products: {
        total: totalProducts,
        inStock,
        lowStock,
        outOfStock
      },
      paymentMethods,
      cities
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
