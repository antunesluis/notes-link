export class ResponseUserDto {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  createdAt?: Date;
  updatedAt?: Date;
  active: boolean;
  picture: string;
}
