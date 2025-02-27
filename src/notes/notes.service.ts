import { Injectable, NotFoundException } from '@nestjs/common';
import { Note } from './entities/note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly notesRepository: Repository<Note>,
  ) {}

  async findAll() {
    const notes = await this.notesRepository.find();
    return notes;
  }

  async findOne(id: number) {
    const note = await this.notesRepository.findOne({
      where: { id },
    });

    if (!note) {
      throw new NotFoundException('User not found');
    }

    return note;
  }

  async create(createNoteDto: CreateNoteDto) {
    const noteData = {
      ...createNoteDto,
      read: false,
      date: new Date(),
    };

    const newNote = this.notesRepository.create(noteData);
    return this.notesRepository.save(newNote);
  }

  async update(id: number, updateNoteDto: UpdateNoteDto) {
    const partialUpdateNote = {
      read: updateNoteDto?.read,
      text: updateNoteDto?.text,
    };

    const note = await this.notesRepository.preload({
      id,
      ...partialUpdateNote,
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return await this.notesRepository.save(note);
  }

  async remove(id: number) {
    const note = await this.notesRepository.findOneBy({ id });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return this.notesRepository.remove(note);
  }
}
