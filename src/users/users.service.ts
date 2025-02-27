import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const userData = {
        name: createUserDto.name,
        email: createUserDto.email,
        passwordHash: createUserDto.password,
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

  async findAll() {
    const users = await this.usersRepository.find({
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
      throw new NotFoundException('Note not found');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const partialUpdateUser = {
      nome: updateUserDto?.name,
      passwordHash: updateUserDto?.password,
    };

    const user = await this.usersRepository.preload({
      id,
      ...partialUpdateUser,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.usersRepository.save(user);
  }

  async remove(id: number) {
    const user = await this.usersRepository.findOneBy({
      id,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.usersRepository.remove(user);
  }
}
