# Coding Standards

## TypeScript & NestJS Guidelines

### Core Principles

- Use English for all code and documentation
- Always declare types for variables and functions (avoid `any`)
- Create necessary custom types instead of using primitives
- Use JSDoc for public classes and methods
- One export per file
- Follow modular architecture patterns

### Naming Conventions

- **Classes**: PascalCase (`UserService`, `AuthController`)
- **Variables/Functions/Methods**: camelCase (`getUserById`, `isAuthenticated`)
- **Files/Directories**: kebab-case (`user-management.service.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (`DEFAULT_PAGE_SIZE`)
- **Environment Variables**: UPPERCASE (`DATABASE_URL`)
- **Boolean Variables**: Use verbs (`isLoading`, `hasError`, `canDelete`)

### Function Guidelines

- Write short functions with single purpose (< 20 instructions)
- Start function names with verbs
- Use early returns to avoid nesting
- Prefer higher-order functions (`map`, `filter`, `reduce`)
- Use arrow functions for simple operations (< 3 instructions)
- Use default parameters instead of null/undefined checks

### Data Handling

- Avoid primitive obsession - encapsulate data in composite types
- Prefer immutability with `readonly` and `as const`
- Use RO-RO pattern (Receive Object, Return Object) for multiple parameters
- Validate data in DTOs, not in business logic

### Class Design

- Follow SOLID principles
- Prefer composition over inheritance
- Keep classes small (< 200 instructions, < 10 public methods)
- Define interfaces for contracts
- Single responsibility per class

## NestJS Specific Standards

### Module Architecture

```typescript
// One module per domain
@Module({
  imports: [SharedModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

### Controller Pattern

```typescript
@Controller('users')
@ApiTags('Users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUser(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.findById(id);
  }
}
```

### Service Pattern

```typescript
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
```

### DTO Validation

```typescript
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'User name' })
  name: string;

  @IsEmail()
  @ApiProperty({ description: 'User email' })
  email: string;
}

// Don't use PartialType extends
// Don't spread DTOs in services
```

### Path Aliases Usage

```typescript
// Use configured aliases
import { PrismaService } from '@app/prisma';
import { CoreModule } from '@app/core';
import { AuthGuard } from '@app/guards';
```

## Testing Standards

### Test Structure

```typescript
describe('UserService', () => {
  let service: UserService;
  let mockPrisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    // Arrange
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should find user by id', async () => {
    // Arrange
    const inputId = 'user-123';
    const expectedUser = { id: inputId, name: 'John' };
    mockPrisma.user.findUnique.mockResolvedValue(expectedUser);

    // Act
    const actualUser = await service.findById(inputId);

    // Assert
    expect(actualUser).toEqual(expectedUser);
  });
});
```

### Test Naming

- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Name variables clearly: `inputX`, `mockX`, `actualX`, `expectedX`
- Write unit tests for each public method
- Write integration tests for each module
- Add smoke tests via admin/test endpoints

## Error Handling

### Exception Strategy

```typescript
// Use specific exceptions
throw new NotFoundException('User not found');
throw new BadRequestException('Invalid input data');
throw new UnauthorizedException('Access denied');

// Add context when catching
try {
  await this.externalService.call();
} catch (error) {
  throw new ServiceUnavailableException('External service failed', error);
}
```

### Global Exception Handling

- Use global exception filters for unhandled errors
- Log errors with proper context
- Return consistent error response format
