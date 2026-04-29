import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from 'src/modules/application/brand/dto/update-brand.dto';

@Injectable()
export class BrandService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBrandDto) {
    return await this.prisma.brand.create({
      data: { name: dto.name },
    });
  }

  async findAll() {
    return await this.prisma.brand.findMany({
      include: { _count: { select: { products: true } } },
    });
  }

  async update(id: string, dto: UpdateBrandDto) {
    await this.prisma.brand.update({
      where: { id },
      data: { name: dto.name },
    });
    return {
      success: true,
      message: 'Brand updated successfully',
    };
  }

  async remove(id: string) {
     await this.prisma.brand.delete({ where: { id } });
     return {
      success: true,
      message: 'Brand deleted successfully',
    };
  }
}
