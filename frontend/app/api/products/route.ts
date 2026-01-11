import { NextRequest, NextResponse } from 'next/server';
import  prisma from '@/prisma/connection';
import type { Prisma } from '@/lib/generated/prisma';
import { CreateProductSchema } from '@/schemas/product.schema';



export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '12'), 50);
        const skip = (page - 1) * limit;

        const categorySlug = url.searchParams.get('category');
        const brand = url.searchParams.get('brand');
        const minPrice = url.searchParams.get('minPrice');
        const maxPrice = url.searchParams.get('maxPrice');
        const search = url.searchParams.get('search');
        const sortParam = url.searchParams.get('sort');
        const featured = url.searchParams.get('featured');
        const status = url.searchParams.get('status');

        const filters: Prisma.ProductWhereInput = {};

        // Category filters
        if (categorySlug) {
            const category = await prisma.category.findUnique({
                where: { slug: categorySlug }
            });
            if (category) filters.categoryId = category.id;
        }

        if (brand) filters.brand = brand;
        if (status) filters.status = status as any;
        if (featured === 'true') filters.featured = true;

        // Price range filters
        if (minPrice || maxPrice) {
            filters.price = {} as Prisma.FloatFilter;
            if (minPrice) (filters.price as Prisma.FloatFilter).gte = parseFloat(minPrice);
            if (maxPrice) (filters.price as Prisma.FloatFilter).lte = parseFloat(maxPrice);
        }

        // search filter
        if (search) {
            filters.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Sorting
        const sortMap: Record<string, any> = {
            price: { price: 'asc'},
            '-price': { price: 'desc'},
            name: { name: 'asc'},
            '-createdAt': { createdAt: 'desc'},
        };
        const orderBy = sortMap[sortParam || '-createdAt'] || { createdAt: 'desc' };
        
        // Query products and total count
        const [products, totalItems] = await prisma.$transaction([
            prisma.product.findMany({
                where: filters,
                orderBy,
                skip,
                take: limit,
                include: { category: true, reviews: true }, // included reviews for summary
            }),
            prisma.product.count({ where: filters }),
        ]);

        // Compute reviews summary for each product
        const productsWithReviews = products.map((product) => {
            const reviewCount = product.reviews.length;
            const averageRating =
                reviewCount === 0
                ? 0
                : product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;

            const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
            for (const r of product.reviews) {
                const rating = r.rating.toString();
                if (distribution[rating] !== undefined) distribution[rating] += 1;
            }

            return {
                ...product,
                reviews: {
                average: Number(averageRating.toFixed(1)),
                count: reviewCount,
                distribution
                }
            };
            });
        return NextResponse.json({
            products: productsWithReviews,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                hasNext: page * limit < totalItems,
                hasPrev: page > 1
            }
        });
    } catch (err: any) {
        console.error('GET /api/products error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}



export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const parsed = CreateProductSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { errors: parsed.error.flatten()},
                { status: 400 }
            );
        }

        const product = await prisma.product.create({
            data: parsed.data,
        }); 

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error('POST /api/products error:', error);
        return NextResponse.json({ message: 'Failed to create product' }, { status: 500 });
    }
}