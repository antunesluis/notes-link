import { Controller } from '@nestjs/common';

@Controller('notes')
export class NotesController {
  // Find all notes
  findAll() {
    return 'This action returns all notes';
  }

  // Find one note
  findOne(id: string) {
    return `This action returns a #${id} note`;
  }
}
