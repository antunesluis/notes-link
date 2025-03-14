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

import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AuthTokenGuard } from 'src/auth/guards/auth-token.guard';
import { TokenPayloadParam } from 'src/auth/params/token-payload.param';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.notesService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.notesService.findOne(id);
  }

  @Post()
  @UseGuards(AuthTokenGuard)
  create(
    @Body() createNoteDto: CreateNoteDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.notesService.create(createNoteDto, tokenPayload);
  }

  @Patch(':id')
  @UseGuards(AuthTokenGuard)
  update(
    @Param('id') id: number,
    @Body() updateNoteDto: UpdateNoteDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.notesService.update(id, updateNoteDto, tokenPayload);
  }

  @Delete(':id')
  @UseGuards(AuthTokenGuard)
  remove(
    @Param('id') id: number,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.notesService.remove(id, tokenPayload);
  }
}
