import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

import {
  CreatePostDtoStub,
  UpdatePostDtoStub,
} from '@modules/post/tests/stubs';
import { Post } from '@modules/post/post.entity';
import { PostService } from '@modules/post/post.service';
import { CurrentUserDtoStub } from '@/modules/user/tests/stubs';
import { UpdatePostDto } from '@modules/post/dtos/update-post.dto';
import { PostRepositoryMock } from '@modules/post/tests/mocks/post.repository.mock';

describe('PostRepository', () => {
  let postService: PostService;
  const currentUser = CurrentUserDtoStub();
  const createPostDto = CreatePostDtoStub();

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          /* 
            Only use when you have injected repository using
            @InjectRepository() decorator
          */
          provide: getRepositoryToken(Post),
          useClass: PostRepositoryMock,
        },
      ],
    }).compile();

    postService = moduleRef.get<PostService>(PostService);
  });

  describe('Define', () => {
    it('Should Define the dependencies', () => {
      expect(postService).toBeDefined();
    });
  });

  describe('createPost', () => {
    it('Should create new post', async () => {
      const result = await postService.createPost(currentUser, createPostDto);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('text', 'Test Text');
    });
  });

  describe('fetchPostOfUser', () => {
    it('Should return empty list of posts', async () => {
      const result = await postService.fetchPostOfUser(1);
      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
      expect(result).toStrictEqual([]);
    });

    it('Should return list of posts', async () => {
      await postService.createPost(currentUser, createPostDto);
      const result = await postService.fetchPostOfUser(1);
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 1);
      expect(result[0]).toHaveProperty('authorId', 1);
      expect(result[0]).toHaveProperty('text', 'Test Text');
      expect(result[0]).toHaveProperty('title', 'Test Title');
      expect(result[0]).toHaveProperty('createdAt');
      expect(result[0]).toHaveProperty('updatedAt');
    });
  });

  describe('fetchPostOfUserById', () => {
    it('It should not return post on invalid userId or postId', async () => {
      const post = await postService.fetchPostOfUserById(1, 1);
      expect(post).toBeFalsy();
    });

    it('should return a post found by userId and postId', async () => {
      await postService.createPost(currentUser, createPostDto);
      const post = await postService.fetchPostOfUserById(1, 1);

      expect(post).toBeDefined();
      expect(post).toHaveProperty('id', 1);
      expect(post).toHaveProperty('authorId', 1);
      expect(post).toHaveProperty('text', 'Test Text');
      expect(post).toHaveProperty('title', 'Test Title');
      expect(post).toHaveProperty('createdAt');
      expect(post).toHaveProperty('updatedAt');
    });
  });

  describe('updatePost', () => {
    const updatePostDto: UpdatePostDto = UpdatePostDtoStub();

    it('Should throw NotFoundException', async () => {
      await expect(postService.updatePost(1, 1, updatePostDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(postService.updatePost(1, 1, updatePostDto)).rejects.toThrow(
        new NotFoundException('No such post found with id : 1'),
      );
    });

    it('Should update the post info', async () => {
      await postService.createPost(currentUser, createPostDto);
      const result = await postService.updatePost(1, 1, updatePostDto);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('authorId', 1);
      expect(result).toHaveProperty('text', 'UpdatedText');
      expect(result).toHaveProperty('title', 'Updated Title');
    });
  });

  describe('deletePost', () => {
    it('Should throw NotFoundException on wrong postId or userId', async () => {
      await expect(postService.deletePost(currentUser, 1, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(postService.deletePost(currentUser, 1, 1)).rejects.toThrow(
        new NotFoundException('No such post found with id : 1'),
      );
    });

    it('Should throw UnAuthorizedException on insufficient access', async () => {
      await postService.createPost(currentUser, createPostDto);

      await expect(
        postService.deletePost({ ...currentUser, id: 2 }, 1, 1),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('Should delete own post', async () => {
      await postService.createPost(currentUser, createPostDto);
      const result = await postService.deletePost(currentUser, 1, 1);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('message', 'Post deleted successfully.');
    });
  });
});
