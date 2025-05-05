/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotesService } from './notes.service';
import { Note } from './entities/note.entity';
import { User } from '../users/entities/user.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

describe('NotesService', () => {
  let service: NotesService;
  let notesRepository: Repository<Note>;
  let usersService: UsersService;

  // Mocks
  const mockUserFrom: User = {
    id: 1,
    name: 'Remetente',
    email: 'from@example.com',
    passwordHash: 'hash',
    active: true,
    picture: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    notesSent: [],
    notesReceived: [],
  };

  const mockUserTo: User = {
    id: 2,
    name: 'Destinatário',
    email: 'to@example.com',
    passwordHash: 'hash',
    active: true,
    picture: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    notesSent: [],
    notesReceived: [],
  };

  const mockNote: Note = {
    id: 1,
    text: 'Nota de teste',
    read: false,
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    from: mockUserFrom,
    to: mockUserTo,
  };

  const mockTokenPayload = {
    sub: mockUserFrom.id,
    email: mockUserFrom.email,
    iam: 'user',
    exp: Date.now() + 3600,
    aud: 'test',
    iss: 'test',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        {
          provide: getRepositoryToken(Note),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            preload: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    notesRepository = module.get<Repository<Note>>(getRepositoryToken(Note));
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new note', async () => {
      const createNoteDto: CreateNoteDto = {
        text: 'Nova nota',
        toId: mockUserTo.id,
      };

      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValueOnce(mockUserTo) // Para toId
        .mockResolvedValueOnce(mockUserFrom); // Para from (tokenPayload.sub)

      jest.spyOn(notesRepository, 'create').mockReturnValue(mockNote);
      jest.spyOn(notesRepository, 'save').mockResolvedValue(mockNote);

      const result = await service.create(createNoteDto, mockTokenPayload);

      expect(usersService.findOne).toHaveBeenCalledWith(createNoteDto.toId);
      expect(usersService.findOne).toHaveBeenCalledWith(mockTokenPayload.sub);
      expect(notesRepository.create).toHaveBeenCalledWith({
        text: createNoteDto.text,
        to: mockUserTo,
        from: mockUserFrom,
        read: false,
        date: expect.any(Date),
      });
      expect(result).toEqual({
        ...mockNote,
        from: { id: mockUserFrom.id, name: mockUserFrom.name },
        to: { id: mockUserTo.id, name: mockUserTo.name },
      });
    });

    it('should throw NotFoundException if recipient does not exist', async () => {
      const createNoteDto: CreateNoteDto = {
        text: 'Nova nota',
        toId: 999, // ID inexistente
      };

      jest
        .spyOn(usersService, 'findOne')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(
        service.create(createNoteDto, mockTokenPayload),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return an array of notes with pagination', async () => {
      const paginationDto: PaginationDto = { limit: 10, offset: 0 };
      const notesArray = [mockNote];

      jest.spyOn(notesRepository, 'find').mockResolvedValue(notesArray);

      const result = await service.findAll(paginationDto);

      expect(notesRepository.find).toHaveBeenCalledWith({
        take: paginationDto.limit,
        skip: paginationDto.offset,
        relations: ['from', 'to'],
        order: { id: 'desc' },
        select: {
          from: { id: true, name: true },
          to: { id: true, name: true },
        },
      });
      expect(result).toEqual(notesArray);
    });
  });

  describe('findOne', () => {
    it('should return a single note', async () => {
      jest.spyOn(notesRepository, 'findOne').mockResolvedValue(mockNote);

      const result = await service.findOne(mockNote.id);

      expect(notesRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockNote.id },
        relations: ['from', 'to'],
        select: {
          from: { id: true, name: true },
          to: { id: true, name: true },
        },
      });
      expect(result).toEqual(mockNote);
    });

    it('should throw NotFoundException if note does not exist', async () => {
      jest.spyOn(notesRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateNoteDto: UpdateNoteDto = {
      text: 'Texto atualizado',
      read: true,
    };

    it('should update a note', async () => {
      const updatedNote = { ...mockNote, ...updateNoteDto };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockNote);
      jest.spyOn(notesRepository, 'save').mockResolvedValue(updatedNote);

      const result = await service.update(
        mockNote.id,
        updateNoteDto,
        mockTokenPayload,
      );

      expect(service.findOne).toHaveBeenCalledWith(mockNote.id);
      expect(notesRepository.save).toHaveBeenCalledWith(updatedNote);
      expect(result).toEqual(updatedNote);
    });

    it('should throw ForbiddenException if user is not the sender', async () => {
      const otherUserToken = { ...mockTokenPayload, sub: 999 }; // Outro usuário

      jest.spyOn(service, 'findOne').mockResolvedValue(mockNote);

      await expect(
        service.update(mockNote.id, updateNoteDto, otherUserToken),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if note is null within update method', async () => {
      // Override the findOne method to return null instead of throwing
      jest.spyOn(service, 'findOne').mockImplementation(() => {
        return Promise.resolve(null as unknown as Note);
      });

      await expect(
        service.update(999, updateNoteDto, mockTokenPayload),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if note does not exist', async () => {
      // Correção: Usar mockRejectedValue em vez de mockResolvedValue
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new NotFoundException('Note not found'));

      await expect(
        service.update(999, updateNoteDto, mockTokenPayload),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a note', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockNote);
      jest.spyOn(notesRepository, 'remove').mockResolvedValue(mockNote);

      const result = await service.remove(mockNote.id, mockTokenPayload);

      expect(service.findOne).toHaveBeenCalledWith(mockNote.id);
      expect(notesRepository.remove).toHaveBeenCalledWith(mockNote);
      expect(result).toEqual(mockNote);
    });

    it('should throw ForbiddenException if user is not the sender', async () => {
      const otherUserToken = { ...mockTokenPayload, sub: 999 }; // Outro usuário

      jest.spyOn(service, 'findOne').mockResolvedValue(mockNote);

      await expect(service.remove(mockNote.id, otherUserToken)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
