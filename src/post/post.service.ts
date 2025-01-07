import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity/post.entity';
import { CreatePostDto } from './dto/create-post.dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto/update-post.dto';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async create(
    createPostDto: CreatePostDto,
    userId: string,
    // @ts-ignore
    files?: Express.Multer.File[], // Accept multiple files
  ): Promise<Post> {
    const imagePaths: string[] = []; // Store paths for multiple images

    if (files && files.length > 0) {
      console.log('process.cwd(): ', process.cwd());
      const uploadDir = join(process.cwd(), 'uploads', 'images');

      // Ensure the uploads directory exists
      await fs.mkdir(uploadDir, { recursive: true });

      // Save each file
      for (const [index, file] of files.entries()) {
        const timestamp = Date.now(); // Timestamp for unique filenames
        const uniqueFilename = `${timestamp}-${file.originalname}`;
        const filePath = join(uploadDir, uniqueFilename);

        // Write the file to the directory
        await fs.writeFile(filePath, file.buffer);

        // Store the relative path for the file
        imagePaths.push(`/uploads/images/${uniqueFilename}`);
      }
    }

    // Create the post object
    const postObject = {
      ...createPostDto,
      user: { id: userId },
      images: imagePaths, // Store the array of image paths
    };

    // Save the post to the database
    const post = this.postRepository.create(postObject);
    return this.postRepository.save(post);
  }
  findAll(): Promise<Post[]> {
    return this.postRepository.find({ relations: ['user'] });
  }

  findOne(id: string): Promise<Post> {
    return this.postRepository.findOne({ where: { id }, relations: ['user'] });
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    // @ts-ignore
    files?: Express.Multer.File[], // Accept multiple files
  ): Promise<Post> {
    const existingPost = await this.findOne(id);

    if (!existingPost) {
      throw new Error('Post not found');
    }

    console.log('files: ', files);

    const imagePaths = existingPost.images || []; // Keep existing images by default

    if (files && files.length > 0) {
      const uploadDir = join(process.cwd(), 'uploads', 'images');

      // Ensure the uploads directory exists
      await fs.mkdir(uploadDir, { recursive: true });

      // Save each new file
      for (const [index, file] of files.entries()) {
        const timestamp = Date.now();
        const uniqueFilename = `${timestamp}-${file.originalname}`;
        const filePath = join(uploadDir, uniqueFilename);

        // Write the new file to the directory
        await fs.writeFile(filePath, file.buffer);

        // Add the new file path to the imagePaths array
        imagePaths.push(`/uploads/images/${uniqueFilename}`);
      }
    }

    // Update the post with new data and images
    const updatedPost = {
      ...existingPost,
      ...updatePostDto,
      images: imagePaths, // Update images array
    };

    await this.postRepository.save(updatedPost); // Save updated post
    return this.findOne(id); // Return the updated post
  }
  remove(id: string): Promise<void> {
    return this.postRepository.delete(id).then(() => undefined);
  }

  async deleteImage(postId: string, imagePath: string): Promise<Post> {
    const post = await this.findOne(postId);

    if (!post) {
      throw new Error('Post not found');
    }

    // Remove the specified image from the post's images array
    post.images = post.images.filter((img) => img !== imagePath);

    // Save the updated post to the database
    await this.postRepository.save(post);

    // Delete the file from the file system
    const absolutePath = join(process.cwd(), imagePath);
    try {
      await fs.unlink(absolutePath); // Remove the file
    } catch (error) {
      console.warn(`Failed to delete image file: ${absolutePath}`, error);
    }

    return post; // Return the updated post
  }
}
