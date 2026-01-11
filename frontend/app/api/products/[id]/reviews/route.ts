import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/connection';
import { CreateReviewSchema } from '@/schemas/review.schema';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const parsed = CreateReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid review data', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        ...parsed.data,
        productId: params.id,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/products/[id]/reviews failed:', error);
    return NextResponse.json(
      { message: 'Failed to submit review' },
      { status: 500 }
    );
  }
}


export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const reviews = await prisma.review.findMany({
    where: { productId: params.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(reviews);
}
