import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UsersService } from 'src/users/users.service';
import { Note } from './entities/note.entity';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly notesRepository: Repository<Note>,
    private readonly usersService: UsersService,
  ) {}

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const notes = await this.notesRepository.find({
      take: limit,
      skip: offset,
      relations: ['from', 'to'],
      order: {
        id: 'desc',
      },
      select: {
        from: {
          id: true,
          name: true,
        },
        to: {
          id: true,
          name: true,
        },
      },
    });
    return notes;
  }

  async findOne(id: number) {
    const note = await this.notesRepository.findOne({
      where: { id },
      relations: ['from', 'to'],
      select: {
        from: {
          id: true,
          name: true,
        },
        to: {
          id: true,
          name: true,
        },
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return note;
  }

  async create(createNoteDto: CreateNoteDto, tokenPayload: TokenPayloadDto) {
    const { toId } = createNoteDto;

    // find the user that will receive the note
    const to = await this.usersService.findOne(toId);

    // find the user that sent the note
    const from = await this.usersService.findOne(tokenPayload.sub);

    const noteData = {
      text: createNoteDto.text,
      to: to,
      from: from,
      read: false,
      date: new Date(),
    };

    const newNote = this.notesRepository.create(noteData);
    await this.notesRepository.save(newNote);

    return {
      ...newNote,
      from: {
        id: newNote.from.id,
        name: newNote.from.name,
      },
      to: {
        id: newNote.to.id,
        name: newNote.to.name,
      },
    };
  }

  async update(
    id: number,
    updateNoteDto: UpdateNoteDto,
    tokenPayload: TokenPayloadDto,
  ) {
    const note = await this.findOne(id);

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.from.id !== tokenPayload.sub) {
      throw new ForbiddenException('this note is not yours');
    }

    note.text = updateNoteDto?.text ?? note.text;
    note.read = updateNoteDto?.read ?? note.read;

    return await this.notesRepository.save(note);
  }

  async remove(id: number, tokenPayload: TokenPayloadDto) {
    const note = await this.findOne(id);

    if (note.from.id !== tokenPayload.sub) {
      throw new ForbiddenException('this note is not yours');
    }

    return this.notesRepository.remove(note);
  }
}
