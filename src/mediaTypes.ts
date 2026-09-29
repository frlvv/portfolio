export type MediaItem = { id: string; src: string; name?: string; kind?: 'image' | 'video' };
export type MediaSpec = {
  mode: 'mockup' | 'photo' | 'video';
  motion: 'static' | 'animated';
  mockupId: string;
  screens: MediaItem[];
  source?: MediaItem;
  background: { mode: 'photo' | 'video'; source?: MediaItem };
};
export type MockupTemplate = {
  id: string;
  name: string;
  frame: string;
  width: number;
  height: number;
  screenWidth: number;
  screenHeight: number;
  insetX: number;
  insetY: number;
  insetWidth: number;
  insetHeight: number;
  radius: number;
};
