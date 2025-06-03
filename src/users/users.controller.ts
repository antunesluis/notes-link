import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiCreatedResponse,
  ApiResponse,
  ApiOkResponse,
  ApiQuery,
  ApiNotFoundResponse,
  ApiParam,
  ApiForbiddenResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AuthTokenGuard } from 'src/auth/guards/auth-token.guard';
import { TokenPayloadParam } from 'src/auth/params/token-payload.param';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';
import { ResponseUserDto } from './dto/response-user.dto';

@ApiTags('Users') // Group all user endpoints under 'Users' in Swagger UI
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Register a new user account',
  })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: ResponseUserDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already registered',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve a paginated list of users (requires auth)',
  })
  @ApiOkResponse({
    description: 'List of users',
    type: [ResponseUserDto],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Pagination limit',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    example: 0,
    description: 'Pagination offset',
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  @Get(':id')
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user details',
    description: 'Retrieve a user by ID (requires auth)',
  })
  @ApiOkResponse({
    description: 'User details',
    type: ResponseUserDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'User ID',
  })
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update user data (only owner can modify)',
  })
  @ApiOkResponse({
    description: 'User updated',
    type: ResponseUserDto,
  })
  @ApiForbiddenResponse({
    description: 'Not the owner of this account',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'User ID',
  })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.usersService.update(+id, updateUserDto, tokenPayload);
  }

  @Delete(':id')
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete user account',
    description: 'Delete a user (only owner can delete)',
  })
  @ApiOkResponse({
    description: 'User deleted',
    type: ResponseUserDto,
  })
  @ApiForbiddenResponse({
    description: 'Not the owner of this account',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'User ID',
  })
  remove(
    @Param('id') id: string,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.usersService.remove(+id, tokenPayload);
  }

  @Post('upload-picture')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload a profile picture (JPEG/PNG, max 10MB)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload profile picture',
    description: 'Updates the user profile picture',
  })
  @ApiOkResponse({
    description: 'Picture uploaded successfully',
    type: ResponseUserDto,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid file type or size',
  })
  async uploadPicture(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /jpeg|jpg|png/g,
        })
        .addMaxSizeValidator({
          maxSize: 10 * (1024 * 1024),
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.usersService.uploadPicture(file, tokenPayload);
  }
}
