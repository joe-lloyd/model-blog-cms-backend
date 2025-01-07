import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { PostService } from './post.service';
import { ApprovedGuard } from '../auth/approved/approved.guard';
import { CreatePostDto } from './dto/create-post.dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto/update-post.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';

@ApiBearerAuth()
@Controller('posts')
@UseGuards(AuthGuard('jwt'), ApprovedGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Post data including multiple optional image files',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'My Painted Warhammer Model' },
        content: {
          type: 'string',
          example:
            'This is my custom-painted Space Marine with a red and black theme.',
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 10 }, // Allow up to 10 images
    ]),
  )
  async create(
    // @ts-ignore
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @Body() createPostDto: CreatePostDto,
    @Req() req,
  ): Promise<any> {
    const images = files?.images || [];
    return this.postService.create(createPostDto, req.user.userId, images);
  }

  @Get()
  findAll(): Promise<any> {
    return this.postService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<any> {
    return this.postService.findOne(id);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Update post data, optionally including an image file',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Updated Title' },
        content: { type: 'string', example: 'Updated Content' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 10 }, // Allow up to 10 images
    ]),
  )
  async update(
    @Param('id') id: string,
    // @ts-ignore
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<any> {
    console.log('files: ', files);
    console.log('updatePostDto: ', updatePostDto);
    const images = files?.images || [];
    return this.postService.update(id, updatePostDto, images);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.postService.remove(id);
  }

  @Delete(':id/images')
  async deleteImage(
    @Param('id') id: string,
    @Body('imagePath') imagePath: string, // Get the imagePath from the request body
  ): Promise<any> {
    return this.postService.deleteImage(id, imagePath);
  }
}
