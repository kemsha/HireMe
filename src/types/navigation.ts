export type RootStackParamList = {
  Home: undefined;
  Profile: {screen: string; params: { userId: string, userName?: string, isViewingOtherProfile?: boolean } } | undefined;
  EditProfile: undefined;
  CreatePost: undefined;
  Login: undefined;
  Register: undefined;
}; 

export type ProfileStackParamList = {
  ProfileMain: { userId: string } | undefined
  EditProfile: undefined;
};