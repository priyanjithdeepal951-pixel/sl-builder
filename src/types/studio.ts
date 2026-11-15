export type ScratchCategoryId =
  | 'motion'
  | 'looks'
  | 'sound'
  | 'events'
  | 'control'
  | 'sensing'
  | 'operators'
  | 'variables'
  | 'myblocks';

export type ScratchBlockShape = 'hat' | 'stack' | 'c-block' | 'reporter' | 'boolean' | 'cap';

export interface BlockParamDef {
  key: string;
  type: 'number' | 'text' | 'dropdown';
  defaultValue: string | number;
  options?: string[];
}

export type BlockSegment =
  | { kind: 'text'; value: string; siValue?: string }
  | { kind: 'input'; key: string; inputType: 'number' | 'text' | 'dropdown'; options?: string[] }
  | { kind: 'icon'; icon: 'turn-right' | 'turn-left' | 'flag' };

export interface ScratchBlockDef {
  opcode: string;
  category: ScratchCategoryId;
  shape: ScratchBlockShape;
  segments: BlockSegment[];
  defaults: Record<string, string | number>;
  hasMonitor?: boolean;
  monitorLabel?: string;
}

export interface WorkspaceBlock {
  id: string;
  opcode: string;
  category: ScratchCategoryId;
  shape: ScratchBlockShape;
  params: Record<string, string | number>;
  children?: WorkspaceBlock[];
}

export interface WorkspaceScript {
  id: string;
  x: number;
  y: number;
  blocks: WorkspaceBlock[];
}

export interface SpriteCostume {
  id: string;
  name: string;
  presetKey: 'cat' | 'robot' | 'rocket' | 'star' | 'ball';
  tint?: string;
  flipX?: boolean;
}

export interface SpriteSound {
  id: string;
  name: string;
  preset: 'pop' | 'meow' | 'laser' | 'coin' | 'chime';
  duration: number;
}

export interface StudioSprite {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: number;
  size: number;
  visible: boolean;
  rotationStyle: 'all around' | 'left-right' | "don't rotate";
  activeCostumeIndex: number;
  costumes: SpriteCostume[];
  sounds: SpriteSound[];
  scripts: WorkspaceScript[];
  sayText?: string;
  sayType?: 'say' | 'think';
}

export interface StudioBackdrop {
  id: string;
  name: string;
  presetKey: 'white' | 'xy-grid' | 'blue-sky' | 'neon-space' | 'sunset';
}

export interface StudioVariable {
  id: string;
  name: string;
  value: number | string;
  visible: boolean;
}

export interface StudioWorkspaceState {
  sprites: StudioSprite[];
  activeSpriteId: string;
  backdrops: StudioBackdrop[];
  activeBackdropId: string;
  variables: StudioVariable[];
  stageSize: 'small' | 'normal' | 'fullscreen';
}
