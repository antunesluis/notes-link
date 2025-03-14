import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { HashingService } from 'src/auth/hashing/hashing.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { User } from './entities/user.entity';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly hashingService: HashingService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const passwordHash = await this.hashingService.hash(
        createUserDto.password,
      );

      const userData = {
        name: createUserDto.name,
        email: createUserDto.email,
        passwordHash,
      };

      const newUser = this.usersRepository.create(userData);
      await this.usersRepository.save(newUser);

      return newUser;
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('User with this email already exists');
      }
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const users = await this.usersRepository.find({
      take: limit,
      skip: offset,
      order: {
        id: 'ASC',
      },
    });

    return users;
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    tokenPayload: TokenPayloadDto,
  ) {
    const partialUpdateUser = {
      name: updateUserDto?.name,
    };

    if (updateUserDto?.password) {
      const passwordHash = await this.hashingService.hash(
        updateUserDto.password,
      );
      partialUpdateUser['passwordHash'] = passwordHash;
    }

    const user = await this.usersRepository.preload({
      id,
      ...partialUpdateUser,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.id !== tokenPayload.sub) {
      throw new ForbiddenException('You can only update your own user');
    }

    return this.usersRepository.save(user);
  }

  async remove(id: number, tokenPayload: TokenPayloadDto) {
    const user = await this.usersRepository.findOneBy({
      id,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.id !== tokenPayload.sub) {
      throw new ForbiddenException('You can only delete your own user');
    }

    return this.usersRepository.remove(user);
  }
}
