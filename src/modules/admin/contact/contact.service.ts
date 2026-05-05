import { Injectable } from '@nestjs/common';
import { DateHelper } from '../../../common/helper/date.helper';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async create(createContactDto: CreateContactDto) {
    try {
      const data = {};
      if (createContactDto.first_name) {
        data['first_name'] = createContactDto.first_name;
      }
      if (createContactDto.last_name) {
        data['last_name'] = createContactDto.last_name;
      }
      if (createContactDto.email) {
        data['email'] = createContactDto.email;
      }
      if (createContactDto.phone_number) {
        data['phone_number'] = createContactDto.phone_number;
      }
      if (createContactDto.message) {
        data['message'] = createContactDto.message;
      }

      await this.prisma.contact.create({
        data: {
          ...data,
          updated_at: DateHelper.now(),
        },
      });
      return {
        success: true,
        message: 'Contact created successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findAll({
    q = null,
    page = 1,
    limit = 10,
  }: {
    q?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const currentPage = Number(page) || 1;
      const currentLimit = Number(limit) || 10;
      const skip = (currentPage - 1) * currentLimit;

      const where: any = {};
      if (q) {
        where.OR = [
          { first_name: { contains: q, mode: 'insensitive' } },
          { last_name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone_number: { contains: q, mode: 'insensitive' } },
          { message: { contains: q, mode: 'insensitive' } },
        ];
      }

      const [contacts, total_items] = await Promise.all([
        this.prisma.contact.findMany({
          where,
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_number: true,
            message: true,
            created_at: true,
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: currentLimit,
        }),
        this.prisma.contact.count({ where }),
      ]);

      const mappedContacts = contacts.map((contact) => ({
        ...contact,
        createdAt: contact.created_at,
      }));

      const total_pages = Math.ceil(total_items / currentLimit);

      return {
        success: true,
        data: mappedContacts,
        meta: {
          total_items,
          total_pages,
          current_page: currentPage,
          limit: currentLimit,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findOne(id: string) {
    try {
      const contact = await this.prisma.contact.findUnique({
        where: { id },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_number: true,
          message: true,
          created_at: true,
        },
      });

      if (!contact) {
        return {
          success: false,
          message: 'Contact not found',
        };
      }

      return {
        success: true,
        data: {
          ...contact,
          createdAt: contact.created_at,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async update(id: string, updateContactDto: UpdateContactDto) {
    try {
      const contact = await this.prisma.contact.findUnique({ where: { id } });
      if (!contact) {
        return {
          success: false,
          message: 'Contact not found',
        };
      }

      const data = {};
      if (updateContactDto.first_name) {
        data['first_name'] = updateContactDto.first_name;
      }
      if (updateContactDto.last_name) {
        data['last_name'] = updateContactDto.last_name;
      }
      if (updateContactDto.email) {
        data['email'] = updateContactDto.email;
      }
      if (updateContactDto.phone_number) {
        data['phone_number'] = updateContactDto.phone_number;
      }
      if (updateContactDto.message) {
        data['message'] = updateContactDto.message;
      }

      await this.prisma.contact.update({
        where: { id },
        data: {
          ...data,
          updated_at: DateHelper.now(),
        },
      });
      return {
        success: true,
        message: 'Contact updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async remove(id: string) {
    try {
      const contact = await this.prisma.contact.findUnique({ where: { id } });
      if (!contact) {
        return {
          success: false,
          message: 'Contact not found',
        };
      }

      await this.prisma.contact.delete({
        where: { id },
      });
      return {
        success: true,
        message: 'Contact deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
