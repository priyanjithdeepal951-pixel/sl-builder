import {
  ScratchCategoryId,
  ScratchBlockDef,
  StudioWorkspaceState,
  SpriteCostume,
  StudioBackdrop,
} from '../types/studio';

export interface ScratchCategoryMeta {
  id: ScratchCategoryId;
  label: string;
  siLabel: string;
  color: string;
  borderColor: string;
  darkColor: string;
}

export const SCRATCH_CATEGORIES: ScratchCategoryMeta[] = [
  { id: 'motion', label: 'Motion', siLabel: 'චලනය', color: '#4C97FF', borderColor: '#3373CC', darkColor: '#2E66B8' },
  { id: 'looks', label: 'Looks', siLabel: 'පෙනුම', color: '#9966FF', borderColor: '#774DCB', darkColor: '#663DB8' },
  { id: 'sound', label: 'Sound', siLabel: 'ශබ්ද', color: '#CF63CF', borderColor: '#BD42BD', darkColor: '#A633A6' },
  { id: 'events', label: 'Events', siLabel: 'සිදුවීම්', color: '#FFBF00', borderColor: '#CC9900', darkColor: '#B88A00' },
  { id: 'control', label: 'Control', siLabel: 'පාලනය', color: '#FFAB19', borderColor: '#CF8B17', darkColor: '#BA7C13' },
  { id: 'sensing', label: 'Sensing', siLabel: 'සංවේදන', color: '#5CB1D6', borderColor: '#2E8EB8', darkColor: '#247BA3' },
  { id: 'operators', label: 'Operators', siLabel: 'ක්‍රියාකරුවන්', color: '#59C059', borderColor: '#389438', darkColor: '#2E802E' },
  { id: 'variables', label: 'Variables', siLabel: 'විචල්‍ය', color: '#FF8C1A', borderColor: '#DB6E00', darkColor: '#C46200' },
  { id: 'myblocks', label: 'My Blocks', siLabel: 'මගේ බ්ලොක්', color: '#FF6680', borderColor: '#FF3355', darkColor: '#E62244' },
];

export const CATEGORY_COLOR_MAP: Record<ScratchCategoryId, ScratchCategoryMeta> = SCRATCH_CATEGORIES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<ScratchCategoryId, ScratchCategoryMeta>
);

export const SCRATCH_BLOCK_DEFS: ScratchBlockDef[] = [
  // ================= MOTION =================
  {
    opcode: 'motion_movesteps',
    category: 'motion',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'move', siValue: 'පියවර' },
      { kind: 'input', key: 'STEPS', inputType: 'number' },
      { kind: 'text', value: 'steps', siValue: 'ක් ඉදිරියට' },
    ],
    defaults: { STEPS: 10 },
  },
  {
    opcode: 'motion_turnright',
    category: 'motion',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'turn', siValue: 'හරවන්න' },
      { kind: 'icon', icon: 'turn-right' },
      { kind: 'input', key: 'DEGREES', inputType: 'number' },
      { kind: 'text', value: 'degrees', siValue: 'අංශක' },
    ],
    defaults: { DEGREES: 15 },
  },
  {
    opcode: 'motion_turnleft',
    category: 'motion',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'turn', siValue: 'හරවන්න' },
      { kind: 'icon', icon: 'turn-left' },
      { kind: 'input', key: 'DEGREES', inputType: 'number' },
      { kind: 'text', value: 'degrees', siValue: 'අංශක' },
    ],
    defaults: { DEGREES: 15 },
  },
  {
    opcode: 'motion_goto',
    category: 'motion',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'go to', siValue: 'යන්න' },
      { kind: 'input', key: 'TO', inputType: 'dropdown', options: ['random position', 'mouse-pointer', 'center (0,0)'] },
    ],
    defaults: { TO: 'random position' },
  },
  {
    opcode: 'motion_gotoxy',
    category: 'motion',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'go to x:', siValue: 'යන්න x:' },
      { kind: 'input', key: 'X', inputType: 'number' },
      { kind: 'text', value: 'y:', siValue: 'y:' },
      { kind: 'input', key: 'Y', inputType: 'number' },
    ],
    defaults: { X: 0, Y: 0 },
  },
  {
    opcode: 'motion_glideto',
    category: 'motion',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'glide', siValue: 'ලිස්සා යන්න' },
      { kind: 'input', key: 'SECS', inputType: 'number' },
      { kind: 'text', value: 'secs to', siValue: 'තත්පර' },
      { kind: 'input', key: 'TO', inputType: 'dropdown', options: ['random position', 'mouse-pointer'] },
    ],
    defaults: { SECS: 1, TO: 'random position' },
  },
  {
    opcode: 'motion_glidesecstoxy',
    category: 'motion',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'glide', siValue: 'ලිස්සා යන්න' },
      { kind: 'input', key: 'SECS', inputType: 'number' },
      { kind: 'text', value: 'secs to x:', siValue: 'තත් x:' },
      { kind: 'input', key: 'X', inputType: 'number' },
      { kind: 'text', value: 'y:', siValue: 'y:' },
      { kind: 'input', key: 'Y', inputType: 'number' },
    ],
    defaults: { SECS: 1, X: 0, Y: 0 },
  },
  {
    opcode: 'motion_pointindirection',
    category: 'motion',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'point in direction', siValue: 'දිශාවට යොමු වන්න' },
      { kind: 'input', key: 'DIRECTION', inputType: 'number' },
    ],
    defaults: { DIRECTION: 90 },
  },
  {
    opcode: 'motion_pointtowards',
    category: 'motion',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'point towards', siValue: 'දෙසට යොමු වන්න' },
      { kind: 'input', key: 'TOWARDS', inputType: 'dropdown', options: ['mouse-pointer', 'center'] },
    ],
    defaults: { TOWARDS: 'mouse-pointer' },
  },
  {
    opcode: 'motion_changexby',
    category: 'motion',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'change x by', siValue: 'x වෙනස් කරන්න' },
      { kind: 'input', key: 'DX', inputType: 'number' },
    ],
    defaults: { DX: 10 },
  },
  {
    opcode: 'motion_setx',
    category: 'motion',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'set x to', siValue: 'x සකසන්න' },
      { kind: 'input', key: 'X', inputType: 'number' },
    ],
    defaults: { X: 0 },
  },
  {
    opcode: 'motion_changeyby',
    category: 'motion',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'change y by', siValue: 'y වෙනස් කරන්න' },
      { kind: 'input', key: 'DY', inputType: 'number' },
    ],
    defaults: { DY: 10 },
  },
  {
    opcode: 'motion_sety',
    category: 'motion',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'set y to', siValue: 'y සකසන්න' },
      { kind: 'input', key: 'Y', inputType: 'number' },
    ],
    defaults: { Y: 0 },
  },
  {
    opcode: 'motion_ifonedgebounce',
    category: 'motion',
    shape: 'stack',
    segments: [{ kind: 'text', value: 'if on edge, bounce', siValue: 'දාරයේ ගැටුණොත් ආපසු හරවන්න' }],
    defaults: {},
  },
  {
    opcode: 'motion_setrotationstyle',
    category: 'motion',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'set rotation style', siValue: 'භ්‍රමණ රටාව' },
      { kind: 'input', key: 'STYLE', inputType: 'dropdown', options: ['left-right', "don't rotate", 'all around'] },
    ],
    defaults: { STYLE: 'left-right' },
  },
  {
    opcode: 'motion_xposition',
    category: 'motion',
    shape: 'reporter',
    segments: [{ kind: 'text', value: 'x position', siValue: 'x ස්ථානය' }],
    defaults: {},
    hasMonitor: true,
    monitorLabel: 'x position',
  },
  {
    opcode: 'motion_yposition',
    category: 'motion',
    shape: 'reporter',
    segments: [{ kind: 'text', value: 'y position', siValue: 'y ස්ථානය' }],
    defaults: {},
    hasMonitor: true,
    monitorLabel: 'y position',
  },
  {
    opcode: 'motion_direction',
    category: 'motion',
    shape: 'reporter',
    segments: [{ kind: 'text', value: 'direction', siValue: 'දිශාව' }],
    defaults: {},
    hasMonitor: true,
    monitorLabel: 'direction',
  },

  // ================= LOOKS =================
  {
    opcode: 'looks_sayforsecs',
    category: 'looks',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'say', siValue: 'කියන්න' },
      { kind: 'input', key: 'MESSAGE', inputType: 'text' },
      { kind: 'text', value: 'for', siValue: 'තත්' },
      { kind: 'input', key: 'SECS', inputType: 'number' },
      { kind: 'text', value: 'seconds', siValue: 'ක්' },
    ],
    defaults: { MESSAGE: 'Hello!', SECS: 2 },
  },
  {
    opcode: 'looks_say',
    category: 'looks',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'say', siValue: 'කියන්න' },
      { kind: 'input', key: 'MESSAGE', inputType: 'text' },
    ],
    defaults: { MESSAGE: 'Hello!' },
  },
  {
    opcode: 'looks_thinkforsecs',
    category: 'looks',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'think', siValue: 'සිතන්න' },
      { kind: 'input', key: 'MESSAGE', inputType: 'text' },
      { kind: 'text', value: 'for', siValue: 'තත්' },
      { kind: 'input', key: 'SECS', inputType: 'number' },
      { kind: 'text', value: 'seconds', siValue: 'ක්' },
    ],
    defaults: { MESSAGE: 'Hmm...', SECS: 2 },
  },
  {
    opcode: 'looks_nextcostume',
    category: 'looks',
    shape: 'stack',
    segments: [{ kind: 'text', value: 'next costume', siValue: 'ඊළඟ ඇඳුම' }],
    defaults: {},
  },
  {
    opcode: 'looks_nextbackdrop',
    category: 'looks',
    shape: 'stack',
    segments: [{ kind: 'text', value: 'next backdrop', siValue: 'ඊළඟ පසුබිම' }],
    defaults: {},
  },
  {
    opcode: 'looks_changesizeby',
    category: 'looks',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'change size by', siValue: 'ප්‍රමාණය වෙනස් කරන්න' },
      { kind: 'input', key: 'CHANGE', inputType: 'number' },
    ],
    defaults: { CHANGE: 10 },
  },
  {
    opcode: 'looks_setsizeto',
    category: 'looks',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'set size to', siValue: 'ප්‍රමාණය සකසන්න' },
      { kind: 'input', key: 'SIZE', inputType: 'number' },
      { kind: 'text', value: '%', siValue: '%' },
    ],
    defaults: { SIZE: 100 },
  },
  {
    opcode: 'looks_show',
    category: 'looks',
    shape: 'stack',
    segments: [{ kind: 'text', value: 'show', siValue: 'පෙන්වන්න' }],
    defaults: {},
  },
  {
    opcode: 'looks_hide',
    category: 'looks',
    shape: 'stack',
    segments: [{ kind: 'text', value: 'hide', siValue: 'සඟවන්න' }],
    defaults: {},
  },

  // ================= SOUND =================
  {
    opcode: 'sound_playuntildone',
    category: 'sound',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'play sound', siValue: 'ශබ්දය වාදනය කරන්න' },
      { kind: 'input', key: 'SOUND', inputType: 'dropdown', options: ['Meow', 'Pop', 'Laser', 'Coin', 'Chime'] },
      { kind: 'text', value: 'until done', siValue: 'අවසන් වන තුරු' },
    ],
    defaults: { SOUND: 'Meow' },
  },
  {
    opcode: 'sound_play',
    category: 'sound',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'start sound', siValue: 'ශබ්දය අරඹන්න' },
      { kind: 'input', key: 'SOUND', inputType: 'dropdown', options: ['Pop', 'Meow', 'Laser', 'Coin', 'Chime'] },
    ],
    defaults: { SOUND: 'Pop' },
  },
  {
    opcode: 'sound_stopallsounds',
    category: 'sound',
    shape: 'stack',
    segments: [{ kind: 'text', value: 'stop all sounds', siValue: 'සියලු ශබ්ද නවත්වන්න' }],
    defaults: {},
  },

  // ================= EVENTS =================
  {
    opcode: 'event_whenflagclicked',
    category: 'events',
    shape: 'hat',
    segments: [
      { kind: 'text', value: 'when', siValue: 'විට' },
      { kind: 'icon', icon: 'flag' },
      { kind: 'text', value: 'clicked', siValue: 'ක්ලික් කළ' },
    ],
    defaults: {},
  },
  {
    opcode: 'event_whenkeypressed',
    category: 'events',
    shape: 'hat',
    segments: [
      { kind: 'text', value: 'when', siValue: 'විට' },
      { kind: 'input', key: 'KEY', inputType: 'dropdown', options: ['space', 'up arrow', 'down arrow', 'right arrow', 'left arrow', 'any'] },
      { kind: 'text', value: 'key pressed', siValue: 'යතුර එබූ' },
    ],
    defaults: { KEY: 'space' },
  },
  {
    opcode: 'event_whenthisspriteclicked',
    category: 'events',
    shape: 'hat',
    segments: [{ kind: 'text', value: 'when this sprite clicked', siValue: 'මෙම sprite ක්ලික් කළ විට' }],
    defaults: {},
  },
  {
    opcode: 'event_broadcast',
    category: 'events',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'broadcast', siValue: 'පණිවිඩය යවන්න' },
      { kind: 'input', key: 'MESSAGE', inputType: 'dropdown', options: ['message1', 'start', 'next level'] },
    ],
    defaults: { MESSAGE: 'message1' },
  },

  // ================= CONTROL =================
  {
    opcode: 'control_wait',
    category: 'control',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'wait', siValue: 'රැඳී සිටින්න' },
      { kind: 'input', key: 'DURATION', inputType: 'number' },
      { kind: 'text', value: 'seconds', siValue: 'තත්පර' },
    ],
    defaults: { DURATION: 1 },
  },
  {
    opcode: 'control_repeat',
    category: 'control',
    shape: 'c-block',
    segments: [
      { kind: 'text', value: 'repeat', siValue: 'නැවත කරන්න' },
      { kind: 'input', key: 'TIMES', inputType: 'number' },
    ],
    defaults: { TIMES: 10 },
  },
  {
    opcode: 'control_forever',
    category: 'control',
    shape: 'c-block',
    segments: [{ kind: 'text', value: 'forever', siValue: 'සදහටම' }],
    defaults: {},
  },
  {
    opcode: 'control_if',
    category: 'control',
    shape: 'c-block',
    segments: [
      { kind: 'text', value: 'if', siValue: 'නම්' },
      { kind: 'input', key: 'COND', inputType: 'dropdown', options: ['touching edge?', 'mouse down?', 'x > 100'] },
      { kind: 'text', value: 'then', siValue: 'එවිට' },
    ],
    defaults: { COND: 'touching edge?' },
  },
  {
    opcode: 'control_stop',
    category: 'control',
    shape: 'cap',
    segments: [
      { kind: 'text', value: 'stop', siValue: 'නවත්වන්න' },
      { kind: 'input', key: 'STOP_OPTION', inputType: 'dropdown', options: ['all', 'this script', 'other scripts'] },
    ],
    defaults: { STOP_OPTION: 'all' },
  },

  // ================= SENSING =================
  {
    opcode: 'sensing_touchingobject',
    category: 'sensing',
    shape: 'boolean',
    segments: [
      { kind: 'text', value: 'touching', siValue: 'ස්පර්ශ වේද' },
      { kind: 'input', key: 'OBJECT', inputType: 'dropdown', options: ['mouse-pointer', 'edge'] },
      { kind: 'text', value: '?', siValue: '?' },
    ],
    defaults: { OBJECT: 'edge' },
  },
  {
    opcode: 'sensing_askandwait',
    category: 'sensing',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'ask', siValue: 'අසන්න' },
      { kind: 'input', key: 'QUESTION', inputType: 'text' },
      { kind: 'text', value: 'and wait', siValue: 'සහ රැඳී සිටින්න' },
    ],
    defaults: { QUESTION: "What's your name?" },
  },
  {
    opcode: 'sensing_timer',
    category: 'sensing',
    shape: 'reporter',
    segments: [{ kind: 'text', value: 'timer', siValue: 'ටයිමරය' }],
    defaults: {},
  },

  // ================= OPERATORS =================
  {
    opcode: 'operator_add',
    category: 'operators',
    shape: 'reporter',
    segments: [
      { kind: 'input', key: 'NUM1', inputType: 'number' },
      { kind: 'text', value: '+', siValue: '+' },
      { kind: 'input', key: 'NUM2', inputType: 'number' },
    ],
    defaults: { NUM1: 1, NUM2: 2 },
  },
  {
    opcode: 'operator_random',
    category: 'operators',
    shape: 'reporter',
    segments: [
      { kind: 'text', value: 'pick random', siValue: 'අහඹු ලෙස' },
      { kind: 'input', key: 'FROM', inputType: 'number' },
      { kind: 'text', value: 'to', siValue: 'සිට' },
      { kind: 'input', key: 'TO', inputType: 'number' },
    ],
    defaults: { FROM: 1, TO: 10 },
  },
  {
    opcode: 'operator_join',
    category: 'operators',
    shape: 'reporter',
    segments: [
      { kind: 'text', value: 'join', siValue: 'එකතු කරන්න' },
      { kind: 'input', key: 'STR1', inputType: 'text' },
      { kind: 'input', key: 'STR2', inputType: 'text' },
    ],
    defaults: { STR1: 'apple ', STR2: 'banana' },
  },

  // ================= VARIABLES =================
  {
    opcode: 'data_variable',
    category: 'variables',
    shape: 'reporter',
    segments: [{ kind: 'text', value: 'my variable', siValue: 'මගේ විචල්‍යය' }],
    defaults: {},
    hasMonitor: true,
    monitorLabel: 'my variable',
  },
  {
    opcode: 'data_setvariableto',
    category: 'variables',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'set', siValue: 'සකසන්න' },
      { kind: 'input', key: 'VAR', inputType: 'dropdown', options: ['my variable', 'score'] },
      { kind: 'text', value: 'to', siValue: 'අගය' },
      { kind: 'input', key: 'VALUE', inputType: 'text' },
    ],
    defaults: { VAR: 'my variable', VALUE: '0' },
  },
  {
    opcode: 'data_changevariableby',
    category: 'variables',
    shape: 'stack',
    segments: [
      { kind: 'text', value: 'change', siValue: 'වෙනස් කරන්න' },
      { kind: 'input', key: 'VAR', inputType: 'dropdown', options: ['my variable', 'score'] },
      { kind: 'text', value: 'by', siValue: 'මගින්' },
      { kind: 'input', key: 'VALUE', inputType: 'number' },
    ],
    defaults: { VAR: 'my variable', VALUE: 1 },
  },

  // ================= MY BLOCKS =================
  {
    opcode: 'procedures_definition',
    category: 'myblocks',
    shape: 'hat',
    segments: [
      { kind: 'text', value: 'define', siValue: 'අර්ථ දක්වන්න' },
      { kind: 'input', key: 'PROC_NAME', inputType: 'text' },
    ],
    defaults: { PROC_NAME: 'jump spin' },
  },
  {
    opcode: 'procedures_call',
    category: 'myblocks',
    shape: 'stack',
    segments: [{ kind: 'input', key: 'PROC_NAME', inputType: 'text' }],
    defaults: { PROC_NAME: 'jump spin' },
  },
];

export const SPRITE_PRESETS: { name: string; presetKey: SpriteCostume['presetKey']; description: string }[] = [
  { name: 'Sprite1', presetKey: 'cat', description: 'Classic orange studio cat' },
  { name: 'Astro Bot', presetKey: 'robot', description: 'Friendly blue cyber robot' },
  { name: 'Cosmic Rocket', presetKey: 'rocket', description: 'Orbital explorer craft' },
  { name: 'Star Gem', presetKey: 'star', description: 'Glowing golden star' },
  { name: 'Cyber Ball', presetKey: 'ball', description: 'Neon gradient sphere' },
];

export const BACKDROP_PRESETS: { name: string; presetKey: StudioBackdrop['presetKey'] }[] = [
  { name: 'Backdrop1', presetKey: 'white' },
  { name: 'XY Grid (480x360)', presetKey: 'xy-grid' },
  { name: 'Blue Sky', presetKey: 'blue-sky' },
  { name: 'Neon Space', presetKey: 'neon-space' },
  { name: 'Sunset Horizon', presetKey: 'sunset' },
];

export function createDefaultStudioState(): StudioWorkspaceState {
  return {
    activeSpriteId: 'sprite_1',
    activeBackdropId: 'backdrop_1',
    stageSize: 'normal',
    variables: [
      { id: 'var_my', name: 'my variable', value: 0, visible: false },
      { id: 'var_score', name: 'score', value: 0, visible: false },
    ],
    backdrops: [{ id: 'backdrop_1', name: 'backdrop1', presetKey: 'white' }],
    sprites: [
      {
        id: 'sprite_1',
        name: 'Sprite1',
        x: 0,
        y: 0,
        direction: 90,
        size: 100,
        visible: true,
        rotationStyle: 'all around',
        activeCostumeIndex: 0,
        costumes: [
          { id: 'costume_1', name: 'costume1', presetKey: 'cat' },
          { id: 'costume_2', name: 'costume2', presetKey: 'cat', flipX: true },
        ],
        sounds: [
          { id: 'sound_1', name: 'Meow', preset: 'meow', duration: 0.4 },
          { id: 'sound_2', name: 'Pop', preset: 'pop', duration: 0.1 },
        ],
        scripts: [
          {
            id: 'script_init_1',
            x: 32,
            y: 32,
            blocks: [
              {
                id: 'blk_1',
                opcode: 'event_whenflagclicked',
                category: 'events',
                shape: 'hat',
                params: {},
              },
              {
                id: 'blk_2',
                opcode: 'motion_movesteps',
                category: 'motion',
                shape: 'stack',
                params: { STEPS: 20 },
              },
              {
                id: 'blk_3',
                opcode: 'looks_sayforsecs',
                category: 'looks',
                shape: 'stack',
                params: { MESSAGE: 'Hello from BlockCraft Studio!', SECS: 2 },
              },
            ],
          },
        ],
      },
    ],
  };
}
