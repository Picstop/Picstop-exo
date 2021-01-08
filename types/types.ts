import mongoose, { Document } from 'mongoose';

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

  comparePassword: comparePasswordFunction;
};

export type Post = Document & {
  authorId: mongoose.Schema.Types.ObjectId;
  image: string;
  caption: string;
  location: mongoose.Schema.Types.ObjectId;
  likes: Array<mongoose.Schema.Types.ObjectId>;
  comments: Array<mongoose.Schema.Types.ObjectId>;
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
  author: string;
  isOfficial: boolean;
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

