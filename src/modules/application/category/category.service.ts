import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import slugify from 'slugify';
import { UpdateCategoryDto } from 'src/modules/application/category/dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const slug = slugify(dto.name, { lower: true });

    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Category already exists');

    return await this.prisma.category.create({
      data: { name: dto.name, slug },
    });
  }

  async findAll() {
    return await this.prisma.category.findMany({
      include: { _count: { select: { products: true } } },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    await this.prisma.category.update({
      where: { id },
      data: { name: dto.name, slug: slugify(dto.name, { lower: true }) },
    });
    return {
      success: true,
      message: 'Category updated successfully',
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    await this.prisma.category.delete({ where: { id } });
    return {
      success: true,
      message: 'Category deleted successfully',
    };
  }
}
