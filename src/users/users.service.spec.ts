/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { HashingService } from 'src/auth/hashing/hashing.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs/promises';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';

describe('UsersService', () => {
  let userService: UsersService;
  let userRepository: Repository<User>;
  let hashingService: HashingService;

  // Mock completo do usuário com todas as propriedades necessárias
  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    active: true,
    picture: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    notesSent: [],
    notesReceived: [],
  };

  const mockFile = {
    originalname: 'test.jpg',
    buffer: Buffer.from('test'),
    size: 1024,
  } as Express.Multer.File;

  // Mock do payload do token
  const mockTokenPayload: TokenPayloadDto = {
    sub: mockUser.id,
    email: mockUser.email,
    iam: 'user',
    exp: Date.now() + 3600,
    aud: 'test-audience',
    iss: 'test-issuer',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            save: jest.fn(),
            create: jest.fn(),
            findOneBy: jest.fn(),
            find: jest.fn(),
            preload: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: HashingService,
          useValue: {
            hash: jest.fn().mockResolvedValue('hashedpassword'),
            compare: jest.fn(),
          },
        },
        {
          provide: 'fs/promises',
          useValue: {
            writeFile: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    userService = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    hashingService = module.get<HashingService>(HashingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@email.com',
        password: '12345678',
      };

      const newUser: User = {
        ...mockUser,
        name: createUserDto.name,
        email: createUserDto.email,
      };

      jest.spyOn(userRepository, 'create').mockReturnValue(newUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(newUser);

      const result = await userService.create(createUserDto);

      expect(hashingService.hash).toHaveBeenCalledWith(createUserDto.password);
      expect(userRepository.create).toHaveBeenCalledWith({
        name: createUserDto.name,
        passwordHash: 'hashedpassword',
        email: createUserDto.email,
      });
      expect(result).toEqual(newUser);
    });

    it('should throw ConflictException when email already exists', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@email.com',
        password: '12345678',
      };

      jest.spyOn(userRepository, 'save').mockRejectedValue({ code: '23505' });

      await expect(userService.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should propagate non-unique errors', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@email.com',
        password: '12345678',
      };

      const error = new Error('Database connection failed');
      jest.spyOn(userRepository, 'save').mockRejectedValue(error);

      await expect(userService.create(createUserDto)).rejects.toThrow(error);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(mockUser);
      const result = await userService.findOne(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        id: mockUser.id,
      });
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);

      await expect(userService.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return an array of users with pagination', async () => {
      const paginationDto = { limit: 10, offset: 0 };
      const usersArray = [mockUser];
      jest.spyOn(userRepository, 'find').mockResolvedValue(usersArray);

      const result = await userService.findAll(paginationDto);

      expect(userRepository.find).toHaveBeenCalledWith({
        take: paginationDto.limit,
        skip: paginationDto.offset,
        order: { id: 'ASC' },
      });
      expect(result).toEqual(usersArray);
    });
  });

  describe('update', () => {
    const updateUserDto = { name: 'Updated Name', password: 'newpassword' };
    const updatedUser: User = { ...mockUser, name: updateUserDto.name };
    const hashedPassword = mockUser.passwordHash;

    it('should update user when valid data and ownership', async () => {
      jest.spyOn(hashingService, 'hash').mockResolvedValueOnce(hashedPassword);
      jest.spyOn(userRepository, 'preload').mockResolvedValue(updatedUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(updatedUser);
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(mockUser);

      const result = await userService.update(
        mockUser.id,
        updateUserDto,
        mockTokenPayload,
      );

      expect(hashingService.hash).toHaveBeenCalledWith(updateUserDto.password);
      expect(userRepository.preload).toHaveBeenCalledWith({
        id: mockUser.id,
        name: updateUserDto.name,
        passwordHash: hashedPassword,
      });
      expect(userRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual(updatedUser);
    });

    it('should throw ForbiddenException when updating another user', async () => {
      const otherTokenPayload = { ...mockTokenPayload, sub: 2 };
      jest.spyOn(userRepository, 'preload').mockResolvedValue(mockUser);

      await expect(
        userService.update(mockUser.id, updateUserDto, otherTokenPayload),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if person does not exist', async () => {
      jest.spyOn(userRepository, 'preload').mockResolvedValue(undefined);

      await expect(
        userService.update(mockUser.id, updateUserDto, mockTokenPayload),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'remove').mockResolvedValue(mockUser);

      const result = await userService.remove(mockUser.id, mockTokenPayload);

      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        id: mockUser.id,
      });
      expect(userRepository.remove).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const otherTokenPayload = { ...mockTokenPayload, sub: 2 };
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);

      await expect(
        userService.remove(mockUser.id, otherTokenPayload),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadPicture', () => {
    it('should upload picture and update user', async () => {
      const updatedUser = { ...mockUser, picture: '1.jpg' };

      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(updatedUser);
      jest.spyOn(fs, 'writeFile').mockResolvedValue();

      const result = await userService.uploadPicture(
        mockFile,
        mockTokenPayload,
      );

      expect(fs.writeFile).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual(updatedUser);
      expect(result.picture).toBeDefined();
    });

    it('should throw BadRequestException for small files', async () => {
      const smallFile = { ...mockFile, size: 500 };

      await expect(
        userService.uploadPicture(smallFile, mockTokenPayload),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);

      await expect(
        userService.uploadPicture(mockFile, mockTokenPayload),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
