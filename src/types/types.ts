import mongoose, { Document } from 'mongoose';
import { Request } from 'express';

export type comparePasswordFunction = (
  p1: string,
  p2: string,
  cb: (err: any, isMatch: any) => {}
) => void;

export type IUser = Document & {
  email: string;
  username: string;
  name: string;
  password: string;
  followers: Array<mongoose.Schema.Types.ObjectId>;
  following: Array<mongoose.Schema.Types.ObjectId>;
  followerRequests: Array<mongoose.Schema.Types.ObjectId>;
  private: boolean;
  blocked: Array<mongoose.Schema.Types.ObjectId>;
  bio: string;
  profilePic: string;
  savedLocations: Array<mongoose.Schema.Types.ObjectId>;
  identifiers: Array<String>;

  comparePassword: comparePasswordFunction;
};

export type Comment = Document & {
  postId: mongoose.Schema.Types.ObjectId;
  comment: string;
  likes: Array<mongoose.Schema.Types.ObjectId>;
  authorId: mongoose.Schema.Types.ObjectId;
};

export type Location = Document & {
  geoLocation: any;
  name: string;
  author: mongoose.Schema.Types.ObjectId;
  isOfficial: boolean;
};

export type Post = Document & {
  authorId: mongoose.Schema.Types.ObjectId ;
  images: string[];
  caption: string;
  location: mongoose.Schema.Types.ObjectId;
  likes: Array<mongoose.Schema.Types.ObjectId>;
  comments: Array<mongoose.Schema.Types.ObjectId>;
};

export type UserReport = Document & {
  reason: string;
  reportedBy: mongoose.Schema.Types.ObjectId;
  user: mongoose.Schema.Types.ObjectId;
}

export type CommentReport = Document & {
  reason: string;
  reportedBy: mongoose.Schema.Types.ObjectId;
  comment: mongoose.Schema.Types.ObjectId;
}

export type PostReport = Document & {
  reason: string;
  reportedBy: mongoose.Schema.Types.ObjectId;
  post: mongoose.Schema.Types.ObjectId;
}

export type LocationReport = Document & {
  reason: string;
  reportedBy: mongoose.Schema.Types.ObjectId;
  location: mongoose.Schema.Types.ObjectId;
}

export interface NewRequest extends Request {
    user: IUser;
}

export type Album = Document & {
    title: string;
    posts: Array<mongoose.Schema.Types.ObjectId>;
    collaborators: Array<mongoose.Schema.Types.ObjectId>;
    author: mongoose.Schema.Types.ObjectId;
    coverImage: string;
}
