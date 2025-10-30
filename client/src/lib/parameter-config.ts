// パラメータの設定値に関する定数を定義するファイル
import { ParameterConfig } from "@/lib/effects";
import { noteImagePaths } from "@/lib/note-images";

// 音符オプション（RATEやSEQ RATEなどで使用）
export type MusicalNoteOption = {
  value: string;      // 内部で使用する値
  type: 'text' | 'image';  // 表示タイプ
  imagePath?: string; // 画像パス（type=imageの場合）
};

// 音符オプションの定義（画像表示）
export const MUSICAL_NOTE_OPTIONS: MusicalNoteOption[] = [
  // 小節値を最初に配置（テキストのみ）
  { value: "4MEAS", type: "text" },
  { value: "2MEAS", type: "text" },
  { value: "1MEAS", type: "text" },
  // 音符画像
  { value: "notes1", type: "image", imagePath: "notes1" }, // 2分音符
  { value: "notes2", type: "image", imagePath: "notes2" }, // 付点4分音符
  { value: "notes3", type: "image", imagePath: "notes3" }, // 3連符の2分音符
  { value: "notes4", type: "image", imagePath: "notes4" }, // 4分音符
  { value: "notes5", type: "image", imagePath: "notes5" }, // 付点8分音符
  { value: "notes6", type: "image", imagePath: "notes6" }, // 3連符の4分音符
  { value: "notes7", type: "image", imagePath: "notes7" }, // 8分音符
  { value: "notes8", type: "image", imagePath: "notes8" }, // 付点16分音符
  { value: "notes9", type: "image", imagePath: "notes9" }, // 3連符の8分音符
  { value: "notes10", type: "image", imagePath: "notes10" }, // 16分音符
  { value: "notes11", type: "image", imagePath: "notes11" } // 32分音符
];

// プレーンな文字列のミュージカルノート配列
export const MUSICAL_NOTE_VALUES = [
  "4MEAS", "2MEAS", "1MEAS", "notes1", "notes2", "notes3", "notes4", "notes5", "notes6", "notes7",
  "notes8", "notes9", "notes10", "notes11"
];

// OSC BOTのオシレーター選択肢
export const OSC_TYPES = ["SAW", "VINTAGE SAW", "DETUNE SAW", "SQUARE", "RECT"];

// 音階選択肢（C1～G9）を生成
export function generateMusicalNotes(): string[] {
  const notes = [];
  const baseNotes = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
  
  for (let octave = 1; octave <= 9; octave++) {
    for (const note of baseNotes) {
      const noteWithOctave = `${note}${octave}`;
      notes.push(noteWithOctave);
      // G9で終了
      if (noteWithOctave === "G9") {
        break;
      }
    }
  }
  
  return notes;
}

export const MUSICAL_NOTES = generateMusicalNotes();

// シーケンサー機能を備えたエフェクト
export const SEQUENCER_EFFECTS = [
  "LPF", "BPF", "HPF", "PHASER", "FLANGER", "SYNTH", "RINGMOD", "PITCH BEND",
  "ISOLATOR", "OCTAVE", "TREMOLO", "VIBRATO", "MANUAL PAN", "OSC BOT"
];

// TARGET設定の選択肢
export const TARGET_OPTIONS: Record<string, string[]> = {
  "LPF": ["CUTOFF","DEPTH"],
  "BPF": ["CUTOFF","DEPTH"],
  "HPF": ["CUTOFF","DEPTH"],
  "PHASER": ["DEPTH","RESONANCE","MANUAL","D.LEVEL","E.LEVEL"],
  "FLANGER": ["DEPTH","RESONANCE","MANUAL","SEPARATION","D.LEVEL","E.LEVEL"],
  "SYNTH": ["FREQUENCY","RESONANCE","DECAY"],
  "RINGMOD": ["FREQUENCY"],
  "TRANSPOSE": ["TRANS"],
  "PITCH BEND": ["BEND"],
  "OSC BOT": ["NOTE"],
  "ISOLATOR": ["DEPTH"],
  "OCTAVE": ["OCTAVE LEVEL"],
  "MANUAL PAN": ["POSITION"],
  "TREMOLO": ["DEPTH", "LEVEL"],
  "VIBRATO": ["DEPTH", "D.LEVEL", "E.LEVEL"]
};

// TARGETのデフォルト値
export const TARGET_DEFAULTS: Record<string, string> = {
  "LPF": "DEPTH",
  "BPF": "DEPTH",
  "HPF": "DEPTH",
  "PHASER": "DEPTH",
  "FLANGER": "DEPTH",
  "SYNTH": "FREQUENCY",
  "RINGMOD": "FREQUENCY",
  "TRANSPOSE": "TRANS",
  "PITCH BEND": "PITCH",
  "OSC BOT": "NOTE",
  "ISOLATOR": "DEPTH",
  "OCTAVE": "OCTAVE LEVEL",
  "MANUAL PAN": "POSITION",
  "TREMOLO": "DEPTH",
  "VIBRATO": "DEPTH"
};

// MANUAL PANのポジション値を生成
export function generatePanPositions(): string[] {
  const positions = [];
  for (let i = -50; i <= 50; i++) {
    if (i < 0) {
      positions.push(`L${Math.abs(i)}`);
    } else if (i > 0) {
      positions.push(`R${i}`);
    } else {
      positions.push("CENTER");
    }
  }
  return positions;
}

export const PAN_POSITIONS = generatePanPositions();

// エフェクト名から対応するシーケンサーパラメータを生成
export function getSequencerParameters(effectType: string): ParameterConfig[] {
  if (!SEQUENCER_EFFECTS.includes(effectType)) {
    return [];
  }

  const parameters: ParameterConfig[] = [
    {
      name: "SEQ_SW",
      type: "select",
      options: ["OFF", "ON"],
      defaultValue: "OFF"
    },
    {
      name: "SEQ_SYNC",
      type: "select",
      options: ["OFF", "ON"],
      defaultValue: "OFF"
    },
    {
      name: "SEQ_RETRIG",
      type: "select",
      options: ["OFF", "ON"],
      defaultValue: "OFF"
    }
  ];

  // TARGET
  if (TARGET_OPTIONS[effectType]) {
    parameters.push({
      name: "SEQ_TARGET",
      type: "select",
      options: TARGET_OPTIONS[effectType],
      defaultValue: TARGET_DEFAULTS[effectType] || TARGET_OPTIONS[effectType][0]
    });
  }

  // SEQ RATE (特殊な処理として音符画像を表示する)
  const specialMusicalParams: ParameterConfig = {
    name: "SEQ_RATE",
    type: "combined",
    isNumeric: false,
    min: 0,
    max: 100,
    step: 1,
    options: MUSICAL_NOTE_OPTIONS,
    defaultValue: "notes1",
    useImageNotes: true
  };
  parameters.push(specialMusicalParams);

  // SEQ MAX
  parameters.push({
    name: "SEQ_MAX",
    type: "range",
    min: 1,
    max: 16,
    step: 1,
    defaultValue: 16
  });

  // SEQ VAL1 から SEQ VAL16 まで
  for (let i = 1; i <= 16; i++) {
    // TRANSPOSEの場合の特別な処理
    if (effectType === "TRANSPOSE") {
      parameters.push({
        name: `SEQ_VAL${i}`,
        type: "range",
        min: -12,
        max: 12,
        step: 1,
        defaultValue: 0
      });
    }
    // MANUAL PANの場合の特別な処理
    else if (effectType === "MANUAL PAN") {
      parameters.push({
        name: `SEQ_VAL${i}`,
        type: "select",
        options: PAN_POSITIONS,
        defaultValue: "L50"
      });
    }
    // OSC BOTの場合の特別な処理（音階で選択）
    else if (effectType === "OSC BOT") {
      parameters.push({
        name: `SEQ_VAL${i}`,
        type: "select",
        options: MUSICAL_NOTES,
        defaultValue: "C1"
      });
    }
    // 通常のエフェクトの場合
    else {
      parameters.push({
        name: `SEQ_VAL${i}`,
        type: "range",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 0
      });
    }
  }

  return parameters;
}