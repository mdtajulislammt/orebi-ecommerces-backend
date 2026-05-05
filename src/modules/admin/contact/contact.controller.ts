import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

// @ApiExcludeController()
@ApiBearerAuth()
@ApiTags('Contact')
@UseGuards(JwtAuthGuard)
@Controller('admin/contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @ApiOperation({ summary: 'Create contact' })
  @Post()
  async create(@Body() createContactDto: CreateContactDto) {
    try {
      const contact = await this.contactService.create(createContactDto);
      return contact;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Read all contacts' })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('all')
  async findAll(
    @Query('q') q?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const searchQuery = search || q;
      const data = await this.contactService.findAll({
        q: searchQuery,
        page,
        limit,
      });
      return data;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Read one contact' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const contact = await this.contactService.findOne(id);
      return contact;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Update contact' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    try {
      const contact = await this.contactService.update(id, updateContactDto);
      return contact;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Delete contact' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const contact = await this.contactService.remove(id);
      return contact;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
