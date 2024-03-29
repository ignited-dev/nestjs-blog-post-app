import {
  Logger,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { USER_ROLE } from '@common/app.constants';
import { PostService } from '@modules/post/post.service';
import { Comment } from '@modules/comment/comment.entity';
import { TCurrentUser } from '@modules/user/typings/current-user.type';
import { CommentRepository } from '@modules/comment/comment.repository';
import { CreateCommentDto } from '@modules/comment/dtos/create-comment.dto';

@Injectable()
export class CommentService {
  private logger = new Logger(CommentService.name);

  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly postService: PostService,
  ) {}

  async getCommentsOfPost(
    userId: number,
    postId: number,
  ): Promise<Array<Comment>> {
    const post = await this.postService.fetchPostOfUserById(userId, postId);
    if (!post) {
      this.logger.warn(
        'Trying to access comment of post which does not exists!',
        { userId, postId },
      );
      throw new NotFoundException(`No such post exists with id : ${postId}`);
    }

    return this.commentRepository.find({ where: { postId } });
  }

  async getCommentById(
    userId: number,
    postId: number,
    commentId: number,
  ): Promise<Comment> {
    const post = await this.postService.fetchPostOfUserById(userId, postId);

    if (!post) {
      this.logger.warn(
        'Trying to access comment of post which does not exists!',
        { userId, postId },
      );
      throw new NotFoundException(`No such post exists with id : ${postId}`);
    }

    return this.commentRepository.findOneBy({ postId, id: commentId });
  }

  async createComment(
    user: TCurrentUser,
    userId: number,
    postId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const post = await this.postService.fetchPostOfUserById(userId, postId);

    if (!post) {
      this.logger.warn(
        'Trying to create comment on post which does not exists!',
        { userId, postId },
      );
      throw new NotFoundException(`No such post exists with id : ${postId}`);
    }

    const comment = this.commentRepository.create({
      ...createCommentDto,
      userId: user.id,
      postId,
    });

    return await this.commentRepository.save(comment);
  }

  async deleteComment(
    user: TCurrentUser,
    userId: number,
    postId: number,
    commentId: number,
  ): Promise<{ message: string }> {
    const commentInfo =
      await this.commentRepository.getCommentWithPostAndAuthor(
        postId,
        commentId,
      );

    if (!commentInfo) {
      this.logger.warn('Trying to delete comment which does not exists!', {
        userId,
        postId,
      });
      throw new NotFoundException(
        `No such comment exists with id : ${commentId}`,
      );
    }

    const isUserAdmin = user.role === USER_ROLE.ADMIN;
    const isUserOwnsPost = commentInfo.post.authorId === user.id;
    const isUserOwnsComment = commentInfo.userId === user.id;

    if (!isUserAdmin && !isUserOwnsPost && !isUserOwnsComment) {
      throw new UnauthorizedException();
    }

    await this.commentRepository.delete({ id: commentId });
    return { message: 'Comment deleted successfully!' };
  }
}
