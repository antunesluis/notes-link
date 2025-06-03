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
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AuthTokenGuard } from 'src/auth/guards/auth-token.guard';
import { TokenPayloadParam } from 'src/auth/params/token-payload.param';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';
import { ResponseNoteDto } from './dto/response-note.dto';

@ApiTags('Notes') // Add this to group all notes endpoints in Swagger UI
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all notes',
    description: 'Retrieve paginated notes',
  })
  @ApiOkResponse({
    description: 'List of notes',
    type: [ResponseNoteDto],
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
    return this.notesService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get note details',
    description: 'Retrieve a specific note by ID',
  })
  @ApiOkResponse({
    description: 'Note details',
    type: ResponseNoteDto,
  })
  @ApiNotFoundResponse({
    description: 'Note not found',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Note ID',
  })
  findOne(@Param('id') id: number) {
    return this.notesService.findOne(id);
  }

  @Post()
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new note',
    description: 'Send a note to another user (requires auth)',
  })
  @ApiCreatedResponse({
    description: 'Note created successfully',
    type: ResponseNoteDto,
  })
  @ApiNotFoundResponse({
    description: 'Recipient user not found',
  })
  create(
    @Body() createNoteDto: CreateNoteDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.notesService.create(createNoteDto, tokenPayload);
  }

  @Patch(':id')
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a note',
    description: 'Edit note content or mark as read (only sender can update)',
  })
  @ApiOkResponse({
    description: 'Note updated',
    type: ResponseNoteDto,
  })
  @ApiForbiddenResponse({
    description: 'Not the sender of this note',
  })
  @ApiNotFoundResponse({
    description: 'Note not found',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Note ID',
  })
  update(
    @Param('id') id: number,
    @Body() updateNoteDto: UpdateNoteDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.notesService.update(id, updateNoteDto, tokenPayload);
  }

  @Delete(':id')
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a note',
    description: 'Remove a note (only sender can delete)',
  })
  @ApiOkResponse({
    description: 'Note deleted',
    type: ResponseNoteDto,
  })
  @ApiForbiddenResponse({
    description: 'Not the sender of this note',
  })
  @ApiNotFoundResponse({
    description: 'Note not found',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Note ID',
  })
  remove(
    @Param('id') id: number,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.notesService.remove(id, tokenPayload);
  }
}
