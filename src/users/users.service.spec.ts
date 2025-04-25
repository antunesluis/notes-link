import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { HashingService } from 'src/auth/hashing/hashing.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersService', () => {
  let userService: UsersService;
  let userRepository: Repository<User>;
  let hashingService: HashingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: HashingService,
          useValue: {
            hash: jest.fn(),
          },
        },
      ],
    }).compile();

    userService = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    hashingService = module.get<HashingService>(HashingService);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      // ARRANGE
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@email.com',
        password: '12345678',
      };

      // Define o comportamento do metodo hash do mock do HashingService para que ele retorne um valor determinado
      const passwordHash = 'PASSWORDHASH';
      jest.spyOn(hashingService, 'hash').mockResolvedValue(passwordHash);

      // Define o comportamento do metodo create do mock do UserRepository para que ele retorne um novo objeto User
      const newUser = {
        id: 1,
        name: createUserDto.name,
        passwordHash,
        email: createUserDto.email,
      };
      jest.spyOn(userRepository, 'create').mockReturnValue(newUser as any);

      // ACT
      const result = await userService.create(createUserDto);

      // ASSERT
      expect(hashingService.hash).toHaveBeenCalledWith(createUserDto.password);
      expect(userRepository.create).toHaveBeenCalledWith({
        name: createUserDto.name,
        passwordHash,
        email: createUserDto.email,
      });
      expect(userRepository.save).toHaveBeenCalledWith(newUser);
      expect(result).toEqual(newUser);
    });
  });
});
