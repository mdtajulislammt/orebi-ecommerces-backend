import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import slugify from 'slugify';
import { TajulStorage } from 'src/common/lib/Disk/TajulStorage';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(
    admin_id: string,
    dto: any, // CreateProductDto use kora bhalo
    files: {
      thumbnail?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    const {
      name,
      category_id,
      brand_id,
      price,
      discount_price,
      stock,
      colors,
      sizes,
      ...rest
    } = dto;

    const existingUser = await this.prisma.user.findUnique({
      where: { id: admin_id },
    });
    if (!existingUser) throw new BadRequestException('User not found');

    if (existingUser.type !== 'ADMIN') {
      throw new BadRequestException('Only admin can create product');
    }

    // Slug generation logic
    const slug = `${slugify(name, { lower: true })}-${Date.now()}`;

    // 1. File Upload Processing
    let thumbnail_path: string | null = null;
    let image_paths: string[] = [];

    try {
      if (files?.thumbnail?.length) {
        const file = files.thumbnail[0];
        thumbnail_path = `products/thumbnails/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        await TajulStorage.put(thumbnail_path, file.buffer);
      }

      if (files?.images?.length) {
        image_paths = await Promise.all(
          files.images.map(async (file) => {
            const path = `products/gallery/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
            await TajulStorage.put(path, file.buffer);
            return path;
          }),
        );
      }
    } catch (error) {
      throw new BadRequestException('Failed to upload product assets.');
    }

    // 1.5 Verify Category and Brand existence
    const [category, brand] = await Promise.all([
      category_id
        ? this.prisma.category.findUnique({ where: { id: category_id } })
        : null,
      brand_id
        ? this.prisma.brand.findUnique({ where: { id: brand_id } })
        : null,
    ]);

    // 2. Database Operation
    try {
      const product = await this.prisma.product.create({
        data: {
          name,
          slug,
          description: rest.description,
          price: parseFloat(price),
          discount_price: discount_price ? parseFloat(discount_price) : null,
          stock: parseInt(stock),
          thumbnail: thumbnail_path || '',
          images: image_paths,
          colors: Array.isArray(colors) ? colors : [colors],
          sizes: Array.isArray(sizes) ? sizes : [sizes],
          category: category ? { connect: { id: category.id } } : undefined,
          brand: brand ? { connect: { id: brand.id } } : undefined,
        },
      });

      return {
        success: true,
        message: 'Product created successfully',
        data: product,
      };
    } catch (error: any) {
      console.error('Prisma Error:', error);
      throw new InternalServerErrorException('Database operation failed.');
    }
  }

  // get all products (with filter)
  async getAllProducts(query: any) {
    const {
      category_id,
      brand_id,
      color,
      min_price,
      max_price,
      search,
      page = 1,
      limit = 12,
    } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const filter: any = {
      AND: [
        category_id ? { category_id } : {},
        brand_id ? { brand_id } : {},
        {
          price: {
            gte: min_price ? parseFloat(min_price) : undefined,
            lte: max_price ? parseFloat(max_price) : undefined,
          },
        },
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        color ? { colors: { has: color } } : {},
      ],
    };

    try {
      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where: filter,
          skip,
          take,
          include: {
            category: { select: { id: true, name: true, slug: true } },
            brand: { select: { id: true, name: true } },
          },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.product.count({ where: filter }),
      ]);

      // Image URL Transformation
      const transformedProducts = products.map((product) => ({
        ...product,
        thumbnail: product.thumbnail
          ? TajulStorage.url(product.thumbnail)
          : null,
        images: product.images.map((img_path) => TajulStorage.url(img_path)),
      }));

      return {
        success: true,
        message: 'Products fetched successfully',
        meta: {
          total,
          page: Number(page),
          last_page: Math.ceil(total / take),
          limit: take,
        },
        data: transformedProducts,
      };
    } catch (error) {
      console.error('Fetch Error:', error);
      throw new InternalServerErrorException('Failed to fetch products.');
    }
  }

  async getSingleProduct(slug: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { slug },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true } },
          reviews: {
            include: {
              user: { select: { name: true, avatar: true } }, // Reviewer details
            },
            orderBy: { created_at: 'desc' },
          },
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Average Rating calculation (jodi model field update na thake)
      const totalReviews = product.reviews.length;
      const avgRating =
        totalReviews > 0
          ? product.reviews.reduce((acc, rev) => acc + rev.rating, 0) /
            totalReviews
          : 0;

      // Data Transformation (URL transformation)
      const transformedProduct = {
        ...product,
        thumbnail: product.thumbnail
          ? TajulStorage.url(product.thumbnail)
          : null,
        images: product.images.map((img) => TajulStorage.url(img)),
        avg_rating: parseFloat(avgRating.toFixed(1)),
        total_reviews: totalReviews,
        status: product.stock > 0 ? 'In Stock' : 'Out of Stock',
      };

      return {
        success: true,
        message: 'Product details fetched successfully',
        data: transformedProduct,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error fetching product:', error);
      throw new InternalServerErrorException('Failed to fetch product details');
    }
  }

  // get single product by slug
  // async getProductBySlug(slug: string) {
  //   const product = await this.prisma.product.findUnique({
  //     where: { slug },
  //     include: {
  //       category: true,
  //       brand: true,
  //       reviews: {
  //         include: { user: { select: { name: true, avatar: true } } },
  //       },
  //     },
  //   });

  //   if (!product) throw new NotFoundException('Product not found');
  //   return product;
  // }

  // delete product
  async deleteProduct(id: string) {
    return await this.prisma.product.delete({ where: { id } });
  }
}
