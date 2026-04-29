import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';

@ApiTags('User')
@Controller('chat/user')
@ApiExcludeController()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll() {
    try {
      const users = await this.userService.findAll();
      return users;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
