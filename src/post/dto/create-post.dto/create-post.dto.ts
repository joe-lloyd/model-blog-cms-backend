import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    description: 'The title of the post',
    example: 'My Painted Warhammer Model',
  })
  title: string;

  @ApiProperty({
    description: 'The content of the post, providing details about the model',
    example:
      'This is my custom-painted Space Marine with a red and black theme.',
  })
  content: string;

  @ApiProperty({
    description: 'Multiple image files for the post',
    type: 'array',
    items: { type: 'string', format: 'binary' },
    required: false,
  })
  images?: string[];
}
