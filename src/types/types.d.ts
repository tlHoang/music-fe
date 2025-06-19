interface IUser {
  _id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  profilePicture?: string;
  bio?: string;
  name?: string;
  followersCount?: number;
  followingCount?: number;
}

interface ISong {
  _id: string;
  title: string;
  artist?: string;
  album?: string;
  duration: number;
  uploadDate: Date;
  playCount: number;
  likeCount: number;
  commentCount: number;
  lyrics: string;
  audioUrl: string;
  thumbnail: string;
  coverImage?: string;
  visibility: string;
  userId: IUser;
  userId: IUser;
}

interface IPlaylist {
  _id: string;
  name: string;
  userId: IUser;
  songs: ISong[];
  visibility: string;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ISongsAndPlaylists {
  songs: ISong[];
  playlists: IPlaylist[];
}
