// Import options from parameter-config
import { MUSICAL_NOTE_OPTIONS, MUSICAL_NOTE_VALUES, SEQUENCER_EFFECTS, TARGET_OPTIONS, TARGET_DEFAULTS, PAN_POSITIONS, OSC_TYPES, MUSICAL_NOTES, getSequencerParameters, MusicalNoteOption } from './parameter-config';

// Effect definitions for RC505mk2
export const EFFECTS: Record<string, string[]> = {
  "LPF": ["LPF_RATE", "LPF_DEPTH", "LPF_RESONANCE", "LPF_CUTOFF", "LPF_STEP_RATE"],
  "BPF": ["BPF_RATE", "BPF_DEPTH", "BPF_RESONANCE", "BPF_CUTOFF", "BPF_STEP_RATE"],
  "HPF": ["HPF_RATE", "HPF_DEPTH", "HPF_RESONANCE", "HPF_CUTOFF", "HPF_STEP_RATE"],
  "PHASER": ["PHASER_RATE", "PHASER_DEPTH", "PHASER_RESONANCE", "PHASER_MANUAL", "PHASER_STEP_RATE", "PHASER_D_LEVEL", "PHASER_E_LEVEL", "PHASER_STAGE"],
  "FLANGER": ["FLANGER_RATE", "FLANGER_DEPTH", "FLANGER_RESONANCE", "FLANGER_MANUAL", "FLANGER_STEP_RATE", "FLANGER_D_LEVEL", "FLANGER_E_LEVEL", "FLANGER_SEPARATION"],
  "SYNTH": ["SYNTH_FREQUENCY", "SYNTH_RESONANCE", "SYNTH_DECAY", "SYNTH_BALANCE"],
  "LO-FI": ["LOFI_BITDEPTH", "LOFI_SAMPLERATE", "LOFI_BALANCE"],
  "RADIO": ["RADIO_LOFI", "RADIO_LEVEL"],
  "RINGMOD": ["RINGMOD_FREQUENCY", "RINGMOD_BALANCE", "RINGMOD_MODE"],
  "G2B": ["G2B_BALANCE", "G2B_MODE"],
  "SUSTAINER": ["SUSTAINER_ATTACK", "SUSTAINER_RELEASE", "SUSTAINER_LEVEL", "SUSTAINER_LOW_GAIN", "SUSTAINER_HI_GAIN", "SUSTAINER_SUSTAIN"],
  "AUTO RIFF": ["AUTORIFF_PHARASE", "AUTORIFF_TEMPO", "AUTORIFF_HOLD", "AUTORIFF_ATTACK", "AUTORIFF_LOOP", "AUTORIFF_KEY", "AUTORIFF_BALANCE"],
  "SLOW GEAR": ["SLOWGEAR_SENS", "SLOWGEAR_RISE_TIME", "SLOWGEAR_LEVEL", "SLOWGEAR_MODE"],
  "TRANSPOSE": ["TRANSPOSE_TRANS", "TRANSPOSE_MODE"],
  "PITCH BEND": ["PITCHBEND_PITCH", "PITCHBEND_BEND", "PITCHBEND_MODE"],
  "ROBOT": ["ROBOT_ROBOT_NOTE", "ROBOT_FORMANT", "ROBOT_MODE"],
  "ELECTRIC": ["ELECTRIC_SHIFT", "ELECTRIC_FORMANT", "ELECTRIC_SPEED", "ELECTRIC_STABILITY", "ELECTRIC_SCALE"],
  "HRM MANUAL": ["HRMMANUAL_VOICE", "HRMMANUAL_FORMANT", "HRMMANUAL_PAN", "HRMMANUAL_KEY", "HRMMANUAL_D_LEVEL", "HRMMANUAL_HRM_LEVEL"],
  "HRM AUTO(M)": ["HRMAUTO_VOICE", "HRMAUTO_FORMANT", "HRMAUTO_PAN", "HRMAUTO_HRM_MODE", "HRMAUTO_KEY", "HRMAUTO_D_LEVEL", "HRMAUTO_E_LEVEL"],
  "VOCODER": ["VOCODER_CARRIER", "VOCODER_TONE", "VOCODER_ATTACK", "VOCODER_MOD_SENS", "VOCODER_CARRIER_THRU", "VOCODER_BALANCE"],
  "OSC VOC(M)": ["OSCVOC_CARRIER", "OSCVOC_TONE", "OSCVOC_ATTACK", "OSCVOC_OCTAVE", "OSCVOC_MOD_SENS", "OSCVOC_RELEASE", "OSCVOC_BALANCE"],
  "OSC BOT": ["OSCBOT_OSC", "OSCBOT_TONE", "OSCBOT_ATTACK", "OSCBOT_NOTE", "OSCBOT_MOD_SENS", "OSCBOT_BALANCE"],
  "PREAMP": ["PREAMP_AMP_TYPE", "PREAMP_SPK_TYPE", "PREAMP_GAIN", "PREAMP_T_COMP", "PREAMP_BASS", "PREAMP_MIDDLE", "PREAMP_TREBLE", "PREAMP_PRESENCE", "PREAMP_MIC_TYPE", "PREAMP_MIC_DIS", "PREAMP_MIC_POS", "PREAMP_E_LEVEL"],
  "DIST": ["DIST_TYPE", "DIST_TONE", "DIST_DIST", "DIST_D_LEVEL", "DIST_E_LEVEL"],
  "DYNAMICS": ["DYNAMICS_TYPE", "DYNAMICS_DYNAMICS"],
  "EQ": ["EQ_LOW_GAIN", "EQ_HI_GAIN", "EQ_LO_MID_FREQ", "EQ_LO_MID_Q", "EQ_LO_MID_GAIN", "EQ_HIGH_MID_FREQ", "EQ_HIGH_MID_Q", "EQ_HIGH_MID_GAIN", "EQ_LEVEL"],
  "ISOLATOR": ["ISOLATOR_BAND", "ISOLATOR_RATE", "ISOLATOR_BAND_LEVEL", "ISOLATOR_DEPTH", "ISOLATOR_STEP_RATE", "ISOLATOR_WAVE_FORM"],
  "OCTAVE": ["OCTAVE_OCTAVE", "OCTAVE_MODE", "OCTAVE_OCTAVE_LEVEL"],
  "AUTO PAN": ["AUTOPAN_RATE", "AUTOPAN_WAVEFORM", "AUTOPAN_DEPTH", "AUTOPAN_INIT_PHASE", "AUTOPAN_STEP_RATE"],
  "MANUAL PAN": ["MANUALPAN_POSITION"],
  "STEREO ENHANCE": ["STEREOENHANCE_LO_CUT", "STEREOENHANCE_HI_CUT", "STEREOENHANCE_ENHANCE"],
  "TREMOLO": ["TREMOLO_RATE", "TREMOLO_DEPTH", "TREMOLO_WAVEFORM"],
  "VIBRATO": ["VIBRATO_RATE", "VIBRATO_DEPTH", "VIBRATO_COLOR", "VIBRATO_D_LEVEL", "VIBRATO_E_LEVEL"],
  "PATTERN SLICER": ["PATTERNSLICER_RATE", "PATTERNSLICER_DUTY", "PATTERNSLICER_ATTACK", "PATTERNSLICER_PATTERN", "PATTERNSLICER_DEPTH", "PATTERNSLICER_THRESHOLD", "PATTERNSLICER_GAIN"],
  "STEP SLICER": ["STEPSLICER_RATE", "STEPSLICER_DEPTH", "STEPSLICER_THRESHOLD", "STEPSLICER_GAIN", "STEPSLICER_STEP_MAX", "STEPSLICER_STEP_LEN1", "STEPSLICER_STEP_LEN2", "STEPSLICER_STEP_LEN3", "STEPSLICER_STEP_LEN4", "STEPSLICER_STEP_LEN5", "STEPSLICER_STEP_LEN6", "STEPSLICER_STEP_LEN7", "STEPSLICER_STEP_LEN8", "STEPSLICER_STEP_LEN9", "STEPSLICER_STEP_LEN10", "STEPSLICER_STEP_LEN11", "STEPSLICER_STEP_LEN12", "STEPSLICER_STEP_LEN13", "STEPSLICER_STEP_LEN14", "STEPSLICER_STEP_LEN15", "STEPSLICER_STEP_LEN16", "STEPSLICER_STEP_LVL1", "STEPSLICER_STEP_LVL2", "STEPSLICER_STEP_LVL3", "STEPSLICER_STEP_LVL4", "STEPSLICER_STEP_LVL5", "STEPSLICER_STEP_LVL6", "STEPSLICER_STEP_LVL7", "STEPSLICER_STEP_LVL8", "STEPSLICER_STEP_LVL9", "STEPSLICER_STEP_LVL10", "STEPSLICER_STEP_LVL11", "STEPSLICER_STEP_LVL12", "STEPSLICER_STEP_LVL13", "STEPSLICER_STEP_LVL14", "STEPSLICER_STEP_LVL15", "STEPSLICER_STEP_LVL16"],
  "DELAY": ["DELAY_TIME", "DELAY_FEEDBACK", "DELAY_D_LEVEL", "DELAY_LOW_CUT", "DELAY_HIGH_CUT", "DELAY_E_LEVEL"],
  "PANNING DELAY": ["PANNINGDELAY_TIME", "PANNINGDELAY_FEEDBACK", "PANNINGDELAY_D_LEVEL", "PANNINGDELAY_LOW_CUT", "PANNINGDELAY_HIGH_CUT", "PANNINGDELAY_E_LEVEL"],
  "REVERSE DELAY": ["REVERSEDELAY_TIME", "REVERSEDELAY_FEEDBACK", "REVERSEDELAY_D_LEVEL", "REVERSEDELAY_LOW_CUT", "REVERSEDELAY_HIGH_CUT", "REVERSEDELAY_E_LEVEL"],
  "MOD DELAY": ["MODDELAY_TIME", "MODDELAY_FEEDBACK", "MODDELAY_MOD_DEPTH", "MODDELAY_D_LEVEL", "MODDELAY_LOW_CUT", "MODDELAY_HIGH_CUT", "MODDELAY_E_LEVEL"],
  "TYPE ECHO 1": ["TYPEECHO1_REPEAT_TIME", "TYPEECHO1_INTENSITY", "TYPEECHO1_D_LEVEL", "TYPEECHO1_BASS", "TYPEECHO1_TREBLE", "TYPEECHO1_E_LEVEL"],
  "TYPE ECHO 2": ["TYPEECHO2_TIME", "TYPEECHO2_FEEDBACK", "TYPEECHO2_D_LEVEL", "TYPEECHO2_LOW_CUT", "TYPEECHO2_HIGH_CUT", "TYPEECHO2_E_LEVEL"],
  "GNR DELAY": ["GNRDELAY_TIME", "GNRDELAY_FEEDBACK", "GNRDELAY_E_LEVEL"],
  "WARP": ["WARP_LEVEL"],
  "TWIST": ["TWIST_RELEASE", "TWIST_RISE", "TWIST_FALL", "TWIST_LEVEL"],
  "ROLL 1": ["ROLL1_TIME", "ROLL1_FEEDBACK", "ROLL1_ROLL", "ROLL1_BALANCE"],
  "ROLL 2": ["ROLL2_TIME", "ROLL2_REPEAT", "ROLL2_ROLL", "ROLL2_BALANCE"],
  "FREEZE": ["FREEZE_ATTACK", "FREEZE_RELEASE", "FREEZE_DECAY", "FREEZE_SUSTAIN", "FREEZE_BALANCE"],
  "CHORUS": ["CHORUS_RATE", "CHORUS_DEPTH", "CHORUS_LOW_CUT", "CHORUS_HIGH_CUT", "CHORUS_D_LEVEL", "CHORUS_E_LEVEL"],
  "REVERB": ["REVERB_TIME", "REVERB_PRE_DELAY", "REVERB_DENSITY", "REVERB_LOW_CUT", "REVERB_HIGH_CUT", "REVERB_D_LEVEL", "REVERB_E_LEVEL"],
  "GATE REVERB": ["GATEREVERB_TIME", "GATEREVERB_PRE_DELAY", "GATEREVERB_THRESHOLD", "GATEREVERB_LOW_CUT", "GATEREVERB_HIGH_CUT", "GATEREVERB_D_LEVEL", "GATEREVERB_E_LEVEL"],
  "REVERSE REVERB": ["REVERSEREVERB_TIME", "REVERSEREVERB_PRE_DELAY", "REVERSEREVERB_GATE_DELAY", "REVERSEREVERB_LOW_CUT", "REVERSEREVERB_HIGH_CUT", "REVERSEREVERB_D_LEVEL", "REVERSEREVERB_E_LEVEL"],
  "BEAT SCATTER": ["BEATSCATTER_TYPE", "BEATSCATTER_LENGTH"],
  "BEAT REPEAT": ["BEATREPEAT_TYPE", "BEATREPEAT_LENGTH"],
  "BEAT SHIFT": ["BEATSHIFT_TYPE", "BEATSHIFT_SHIFT"],
  "VINYL FLICK": ["VINYLFLICK_FLICK"],
};

// Track FX-specific effects (only available for FX A when TRACK FX is selected)
export const TRACK_A_EFFECTS = ["BEAT SCATTER", "BEAT REPEAT", "BEAT SHIFT", "VINYL FLICK"];

// STEP SLICER parameters
const STEP_SLICER_PARAMETERS: Record<string, ParameterConfig> = {
  "STEPSLICER_RATE": createCombinedParameter("STEPSLICER_RATE"),
  "STEPSLICER_DEPTH": { name: "STEPSLICER_DEPTH", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "STEPSLICER_THRESHOLD": { name: "STEPSLICER_THRESHOLD", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "STEPSLICER_GAIN": { name: "STEPSLICER_GAIN", type: "range", min: -60, max: 60, step: 1, defaultValue: 0 },
  "STEPSLICER_STEP_MAX": { name: "STEPSLICER_STEP_MAX", type: "range", min: 1, max: 16, step: 1, defaultValue: 16 },
  
  // STEP LEN parameters (1-16)
  "STEPSLICER_STEP_LEN1": { name: "STEPSLICER_STEP_LEN1", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "STEPSLICER_STEP_LEN2": { name: "STEPSLICER_STEP_LEN2", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "STEPSLICER_STEP_LEN3": { name: "STEPSLICER_STEP_LEN3", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "STEPSLICER_STEP_LEN4": { name: "STEPSLICER_STEP_LEN4", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "STEPSLICER_STEP_LEN5": { name: "STEPSLICER_STEP_LEN5", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "STEPSLICER_STEP_LEN6": { name: "STEPSLICER_STEP_LEN6", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "STEPSLICER_STEP_LEN7": { name: "STEPSLICER_STEP_LEN7", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "STEPSLICER_STEP_LEN8": { name: "STEPSLICER_STEP_LEN8", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "STEPSLICER_STEP_LEN9": { name: "STEPSLICER_STEP_LEN9", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "STEPSLICER_STEP_LEN10": { name: "STEPSLICER_STEP_LEN10", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "STEPSLICER_STEP_LEN11": { name: "STEPSLICER_STEP_LEN11", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "STEPSLICER_STEP_LEN12": { name: "STEPSLICER_STEP_LEN12", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "STEPSLICER_STEP_LEN13": { name: "STEPSLICER_STEP_LEN13", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "STEPSLICER_STEP_LEN14": { name: "STEPSLICER_STEP_LEN14", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "STEPSLICER_STEP_LEN15": { name: "STEPSLICER_STEP_LEN15", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "STEPSLICER_STEP_LEN16": { name: "STEPSLICER_STEP_LEN16", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  
  // STEP LVL parameters (1-16)
  "STEPSLICER_STEP_LVL1": { name: "STEPSLICER_STEP_LVL1", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "STEPSLICER_STEP_LVL2": { name: "STEPSLICER_STEP_LVL2", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "STEPSLICER_STEP_LVL3": { name: "STEPSLICER_STEP_LVL3", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "STEPSLICER_STEP_LVL4": { name: "STEPSLICER_STEP_LVL4", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "STEPSLICER_STEP_LVL5": { name: "STEPSLICER_STEP_LVL5", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "STEPSLICER_STEP_LVL6": { name: "STEPSLICER_STEP_LVL6", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "STEPSLICER_STEP_LVL7": { name: "STEPSLICER_STEP_LVL7", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "STEPSLICER_STEP_LVL8": { name: "STEPSLICER_STEP_LVL8", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "STEPSLICER_STEP_LVL9": { name: "STEPSLICER_STEP_LVL9", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "STEPSLICER_STEP_LVL10": { name: "STEPSLICER_STEP_LVL10", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "STEPSLICER_STEP_LVL11": { name: "STEPSLICER_STEP_LVL11", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "STEPSLICER_STEP_LVL12": { name: "STEPSLICER_STEP_LVL12", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "STEPSLICER_STEP_LVL13": { name: "STEPSLICER_STEP_LVL13", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "STEPSLICER_STEP_LVL14": { name: "STEPSLICER_STEP_LVL14", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "STEPSLICER_STEP_LVL15": { name: "STEPSLICER_STEP_LVL15", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "STEPSLICER_STEP_LVL16": { name: "STEPSLICER_STEP_LVL16", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 }
};

// Parameter configurations for each effect parameter
export interface ParameterConfig {
  name: string;
  display_name?: string; // 表示用の名前 (省略された場合はnameが使用される)
  type: 'range' | 'select' | 'text' | 'combined';
  min?: number;
  max?: number;
  step?: number;
  options?: (string | MusicalNoteOption)[];
  defaultValue: any;
  isNumeric?: boolean; // 複合型パラメータで数値入力モードかどうかを示す
  useImageNotes?: boolean; // 画像形式の音符を使用するかどうか
}

// ミュージカルノートとしても数値としても設定できるパラメータ用の設定を生成する関数
function createCombinedParameter(name: string, defaultValue: string = "notes1", useImageNotes: boolean = true): ParameterConfig {
  return {
    name,
    type: "combined",
    min: 0,
    max: 100,
    step: 1,
    options: useImageNotes ? MUSICAL_NOTE_OPTIONS : MUSICAL_NOTE_VALUES,
    defaultValue,
    isNumeric: false,
    useImageNotes
  };
}

// Parameter configuration map
const PARAMETER_CONFIGS: Record<string, ParameterConfig> = {
  // LPF parameters
  "LPF_RATE": createCombinedParameter("LPF_RATE"),
  "LPF_DEPTH": { name: "LPF_DEPTH", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "LPF_RESONANCE": { name: "LPF_RESONANCE", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "LPF_CUTOFF": { name: "LPF_CUTOFF", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "LPF_STEP_RATE": { name: "LPF_STEP_RATE", type: "combined", min: 0, max: 100, step: 1, options: ["OFF" as string, ...MUSICAL_NOTE_OPTIONS], defaultValue: "OFF", isNumeric: false, useImageNotes: true },
  
  // BPF parameters
  "BPF_RATE": createCombinedParameter("BPF_RATE"),
  "BPF_DEPTH": { name: "BPF_DEPTH", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "BPF_RESONANCE": { name: "BPF_RESONANCE", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "BPF_CUTOFF": { name: "BPF_CUTOFF", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "BPF_STEP_RATE": { name: "BPF_STEP_RATE", type: "combined", min: 0, max: 100, step: 1, options: ["OFF" as string, ...MUSICAL_NOTE_OPTIONS], defaultValue: "OFF", isNumeric: false },
  
  // HPF parameters
  "HPF_RATE": createCombinedParameter("HPF_RATE"),
  "HPF_DEPTH": { name: "HPF_DEPTH", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "HPF_RESONANCE": { name: "HPF_RESONANCE", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "HPF_CUTOFF": { name: "HPF_CUTOFF", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "HPF_STEP_RATE": { name: "HPF_STEP_RATE", type: "combined", min: 0, max: 100, step: 1, options: ["OFF" as string, ...MUSICAL_NOTE_OPTIONS], defaultValue: "OFF", isNumeric: false },
  
  // PHASER parameters
  "PHASER_RATE": createCombinedParameter("PHASER_RATE"),
  "PHASER_DEPTH": { name: "PHASER_DEPTH", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "PHASER_RESONANCE": { name: "PHASER_RESONANCE", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "PHASER_MANUAL": { name: "PHASER_MANUAL", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "PHASER_STEP_RATE": { name: "PHASER_STEP_RATE", type: "combined", min: 0, max: 100, step: 1, options: ["OFF" as string, ...MUSICAL_NOTE_OPTIONS], defaultValue: "OFF", isNumeric: false },
  "PHASER_D_LEVEL": { name: "PHASER_D_LEVEL", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "PHASER_E_LEVEL": { name: "PHASER_E_LEVEL", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "PHASER_STAGE": { name: "PHASER_STAGE", type: "select", options: ["4", "8", "12", "BI-PHASE"], defaultValue: "8" },
  
  // FLANGER parameters
  "FLANGER_RATE": createCombinedParameter("FLANGER_RATE", "1MEAS"),
  "FLANGER_DEPTH": { name: "FLANGER_DEPTH", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "FLANGER_RESONANCE": { name: "FLANGER_RESONANCE", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "FLANGER_MANUAL": { name: "FLANGER_MANUAL", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "FLANGER_STEP_RATE": { name: "FLANGER_STEP_RATE", type: "combined", min: 0, max: 100, step: 1, options: ["OFF" as string, ...MUSICAL_NOTE_OPTIONS], defaultValue: "OFF", isNumeric: false },
  "FLANGER_D_LEVEL": { name: "FLANGER_D_LEVEL", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "FLANGER_E_LEVEL": { name: "FLANGER_E_LEVEL", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "FLANGER_SEPARATION": { name: "FLANGER_SEPARATION", type: "range", min: 0, max: 100, step: 1, defaultValue: 0 },
  
  // SYNTH parameters
  "SYNTH_FREQUENCY": { name: "SYNTH_FREQUENCY", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "SYNTH_RESONANCE": { name: "SYNTH_RESONANCE", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "SYNTH_DECAY": { name: "SYNTH_DECAY", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "SYNTH_BALANCE": { name: "SYNTH_BALANCE", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  
  // LO-FI parameters
  "LOFI_BITDEPTH": { name: "LOFI_BITDEPTH", type: "select", options: ["OFF", ...Array.from({length: 31}, (_, i) => String(31 - i))], defaultValue: "8" },
  "LOFI_SAMPLERATE": { name: "LOFI_SAMPLERATE", type: "select", options: ["OFF", ...Array.from({length: 31}, (_, i) => `1/${i+2}`)], defaultValue: "1/4" },
  "LOFI_BALANCE": { name: "LOFI_BALANCE", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  
  // RADIO parameters
  "RADIO_LOFI": { name: "RADIO_LOFI", type: "range", min: 1, max: 10, step: 1, defaultValue: 5 },
  "RADIO_LEVEL": { name: "RADIO_LEVEL", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  
  // RINGMOD parameters
  "RINGMOD_FREQUENCY": { name: "RINGMOD_FREQUENCY", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "RINGMOD_BALANCE": { name: "RINGMOD_BALANCE", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "RINGMOD_MODE": { name: "RINGMOD_MODE", type: "select", options: ["1", "2"], defaultValue: "2" },
  
  // G2B parameters
  "G2B_BALANCE": { name: "G2B_BALANCE", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "G2B_MODE": { name: "G2B_MODE", type: "select", options: ["1", "2"], defaultValue: "2" },
  
  // SUSTAINER parameters
  "SUSTAINER_ATTACK": { name: "SUSTAINER_ATTACK", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "SUSTAINER_RELEASE": { name: "SUSTAINER_RELEASE", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "SUSTAINER_LEVEL": { name: "SUSTAINER_LEVEL", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "SUSTAINER_LOW_GAIN": { name: "SUSTAINER_LOW_GAIN", type: "range", min: -20, max: 20, step: 1, defaultValue: 0 },
  "SUSTAINER_HI_GAIN": { name: "SUSTAINER_HI_GAIN", type: "range", min: -20, max: 20, step: 1, defaultValue: 0 },
  "SUSTAINER_SUSTAIN": { name: "SUSTAINER_SUSTAIN", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  
  // AUTO RIFF parameters
  "AUTORIFF_PHARASE": { name: "AUTORIFF_PHARASE", type: "select", options: Array.from({length: 30}, (_, i) => `P${String(i+1).padStart(2, '0')}`), defaultValue: "P01" },
  "AUTORIFF_TEMPO": createCombinedParameter("AUTORIFF_TEMPO", "QUARTER"),
  "AUTORIFF_HOLD": { name: "AUTORIFF_HOLD", type: "select", options: ["OFF", "ON"], defaultValue: "OFF" },
  "AUTORIFF_ATTACK": { name: "AUTORIFF_ATTACK", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "AUTORIFF_LOOP": { name: "AUTORIFF_LOOP", type: "select", options: ["OFF", "ON"], defaultValue: "ON" },
  "AUTORIFF_KEY": { name: "AUTORIFF_KEY", type: "select", options: ["C(Am)", "D♭(B♭m)", "D(Bm)", "E♭(Cm)", "E(C♯m)", "F(Dm)", "F♯(D♯m)", "G(Em)", "A♭(Fm)", "A(F♯m)", "B♭(Gm)", "B(G♯m)"], defaultValue: "C(Am)" },
  "AUTORIFF_BALANCE": { name: "AUTORIFF_BALANCE", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  
  // SLOW GEAR parameters
  "SLOWGEAR_SENS": { name: "SLOWGEAR_SENS", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "SLOWGEAR_RISE_TIME": { name: "SLOWGEAR_RISE_TIME", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "SLOWGEAR_LEVEL": { name: "SLOWGEAR_LEVEL", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "SLOWGEAR_MODE": { name: "SLOWGEAR_MODE", type: "select", options: ["1", "2"], defaultValue: "2" },
  
  // TRANSPOSE parameters
  "TRANSPOSE_TRANS": { name: "TRANSPOSE_TRANS", type: "range", min: -12, max: 12, step: 1, defaultValue: 0 },
  "TRANSPOSE_MODE": { name: "TRANSPOSE_MODE", type: "select", options: ["1", "2"], defaultValue: "2" },
  
  // PITCH BEND parameters
  "PITCHBEND_PITCH": { name: "PITCHBEND_PITCH", type: "range", min: -30, max: 40, step: 1, defaultValue: 40 },
  "PITCHBEND_BEND": { name: "PITCHBEND_BEND", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "PITCHBEND_MODE": { name: "PITCHBEND_MODE", type: "select", options: ["1", "2"], defaultValue: "2" },
  
  // ROBOT parameters
  "ROBOT_ROBOT_NOTE": { name: "ROBOT_ROBOT_NOTE", type: "select", options: ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"], defaultValue: "C" },
  "ROBOT_FORMANT": { name: "ROBOT_FORMANT", type: "range", min: -50, max: 50, step: 1, defaultValue: 0 },
  "ROBOT_MODE": { name: "ROBOT_MODE", type: "select", options: ["1", "2"], defaultValue: "2" },
  
  // ELECTRIC parameters
  "ELECTRIC_SHIFT": { name: "ELECTRIC_SHIFT", type: "range", min: -12, max: 12, step: 1, defaultValue: 0 },
  "ELECTRIC_FORMANT": { name: "ELECTRIC_FORMANT", type: "range", min: -50, max: 50, step: 1, defaultValue: 0 },
  "ELECTRIC_SPEED": { name: "ELECTRIC_SPEED", type: "range", min: 0, max: 10, step: 1, defaultValue: 5 },
  "ELECTRIC_STABILITY": { name: "ELECTRIC_STABILITY", type: "range", min: -10, max: 10, step: 1, defaultValue: 0 },
  "ELECTRIC_SCALE": { name: "ELECTRIC_SCALE", type: "select", options: ["CHROMATIC", "C(Am)", "D♭(B♭m)", "D(Bm)", "E♭(Cm)", "E(C♯m)", "F(Dm)", "F♯(D♯m)", "G(Em)", "A♭(Fm)", "A(F♯m)", "B♭(Gm)", "B(G♯m)"], defaultValue: "CHROMATIC" },
  
  // HRM MANUAL parameters
  "HRMMANUAL_VOICE": { name: "HRMMANUAL_VOICE", type: "select", options: ["OCT-", "-6TH", "-5TH", "-4TH", "-3RD", "UNISON", "+3RD", "+4TH", "+5TH", "+6TH", "OCT+"], defaultValue: "+3RD" },
  "HRMMANUAL_FORMANT": { name: "HRMMANUAL_FORMANT", type: "range", min: -50, max: 50, step: 1, defaultValue: 0 },
  "HRMMANUAL_PAN": { name: "HRMMANUAL_PAN", type: "select", options: ["L100", "L50", "CENTER", "R50", "R100"], defaultValue: "R50" },
  "HRMMANUAL_KEY": { name: "HRMMANUAL_KEY", type: "select", options: ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"], defaultValue: "C" },
  "HRMMANUAL_D_LEVEL": { name: "HRMMANUAL_D_LEVEL", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "HRMMANUAL_HRM_LEVEL": { name: "HRMMANUAL_HRM_LEVEL", type: "range", min: 0, max: 100, step: 1, defaultValue: 80 },
  
  // HRM AUTO(M) parameters
  "HRMAUTO_VOICE": { name: "HRMAUTO_VOICE", type: "select", options: ["OCT-", "-6TH", "-5TH", "-4TH", "-3RD", "UNISON", "+3RD", "+4TH", "+5TH", "+6TH", "OCT+"], defaultValue: "+3RD" },
  "HRMAUTO_FORMANT": { name: "HRMAUTO_FORMANT", type: "range", min: -50, max: 50, step: 1, defaultValue: 0 },
  "HRMAUTO_PAN": { name: "HRMAUTO_PAN", type: "select", options: ["L100", "L50", "CENTER", "R50", "R100"], defaultValue: "R50" },
  "HRMAUTO_HRM_MODE": { name: "HRMAUTO_HRM_MODE", type: "select", options: ["MAJOR", "MINOR"], defaultValue: "MAJOR" },
  "HRMAUTO_KEY": { name: "HRMAUTO_KEY", type: "select", options: ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"], defaultValue: "C" },
  "HRMAUTO_D_LEVEL": { name: "HRMAUTO_D_LEVEL", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "HRMAUTO_E_LEVEL": { name: "HRMAUTO_E_LEVEL", type: "range", min: 0, max: 100, step: 1, defaultValue: 80 },
  
  // Reverb parameters
  "REVERB_TIME": { name: "REVERB_TIME", type: "range", min: 0.1, max: 10, step: 0.1, defaultValue: 3.2 },
  "REVERB_PRE_DELAY": { name: "REVERB_PRE_DELAY", type: "range", min: 0, max: 500, step: 10, defaultValue: 50 },
  "REVERB_DENSITY": { name: "REVERB_DENSITY", type: "range", min: 0, max: 100, step: 1, defaultValue: 70 },
  "REVERB_LOW_CUT": { name: "REVERB_LOW_CUT", type: "select", options: ["FLAT", "20Hz", "50Hz", "100Hz", "200Hz", "400Hz"], defaultValue: "FLAT" },
  "REVERB_HIGH_CUT": { name: "REVERB_HIGH_CUT", type: "select", options: ["FLAT", "4.0kHz", "6.0kHz", "8.0kHz", "10.0kHz", "12.0kHz", "14.0kHz"], defaultValue: "8.0kHz" },
  "REVERB_D_LEVEL": { name: "REVERB_D_LEVEL", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "REVERB_E_LEVEL": { name: "REVERB_E_LEVEL", type: "range", min: 0, max: 100, step: 1, defaultValue: 70 },
  
  // Delay parameters
  "DELAY_TIME": { name: "DELAY_TIME", type: "combined", min: 1, max: 2000, step: 1, options: MUSICAL_NOTE_OPTIONS, defaultValue: "notes4", isNumeric: false, useImageNotes: true },
  "DELAY_FEEDBACK": { name: "DELAY_FEEDBACK", type: "range", min: 0, max: 100, step: 1, defaultValue: 30 },
  "DELAY_D_LEVEL": { name: "DELAY_D_LEVEL", type: "range", min: 0, max: 100, step: 1, defaultValue: 100 },
  "DELAY_LOW_CUT": { name: "DELAY_LOW_CUT", type: "select", options: ["FLAT", "20Hz", "25Hz", "31.5Hz", "40Hz", "50Hz", "63Hz", "80Hz", "100Hz", "125Hz", "160Hz", "200Hz", "250Hz", "315Hz", "400Hz", "500Hz", "630Hz", "800Hz"], defaultValue: "FLAT" },
  "DELAY_HIGH_CUT": { name: "DELAY_HIGH_CUT", type: "select", options: ["630Hz", "800Hz", "1kHz", "1.25kHz", "1.6kHz", "2kHz", "2.5kHz", "3.15kHz", "4kHz", "5kHz", "6.3kHz", "8kHz", "10kHz", "12.5kHz", "FLAT"], defaultValue: "4kHz" },
  "DELAY_E_LEVEL": { name: "DELAY_E_LEVEL", type: "range", min: 0, max: 100, step: 1, defaultValue: 60 },
  
  // BEAT SCATTER parameters
  "BEATSCATTER_TYPE": { name: "BEATSCATTER_TYPE", type: "select", options: ["SCATTER1", "SCATTER2"], defaultValue: "SCATTER1" },
  "BEATSCATTER_LENGTH": { name: "BEATSCATTER_LENGTH", type: "select", options: ["1MEAS", "1/2", "1/4", "1/8", "1/16"], defaultValue: "1/4" },
  
  // BEAT REPEAT parameters
  "BEATREPEAT_TYPE": { name: "BEATREPEAT_TYPE", type: "select", options: ["REPEAT1", "REPEAT2"], defaultValue: "REPEAT1" },
  "BEATREPEAT_LENGTH": { name: "BEATREPEAT_LENGTH", type: "select", options: ["1MEAS", "1/2", "1/4", "1/8", "1/16"], defaultValue: "1/4" },
  
  // BEAT SHIFT parameters
  "BEATSHIFT_TYPE": { name: "BEATSHIFT_TYPE", type: "select", options: ["SHIFT1", "SHIFT2"], defaultValue: "SHIFT1" },
  "BEATSHIFT_SHIFT": { name: "BEATSHIFT_SHIFT", type: "select", options: ["-3/4", "-1/2", "-1/4", "-1/8", "1/8", "1/4", "1/2", "3/4"], defaultValue: "1/4" },
  
  // VINYL FLICK parameters
  "VINYLFLICK_FLICK": { name: "VINYLFLICK_FLICK", type: "select", options: [">>", "<<"], defaultValue: ">>" },
  
  // MANUAL PAN parameters
  "MANUALPAN_POSITION": { name: "MANUALPAN_POSITION", type: "select", options: PAN_POSITIONS, defaultValue: "CENTER" },
  
  // Default fallback for any parameter without specific config
  "DEFAULT": { name: "PARAMETER", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 }
};

// Get parameter configurations for an effect
// STEP SLICERのパラメータを取得する関数
// パラメータにグループヘッダーやセパレータを追加する
function getStepSlicerParameters(): ParameterConfig[] {
  // 基本パラメータ
  const basicParams = [
    STEP_SLICER_PARAMETERS["STEPSLICER_RATE"],
    STEP_SLICER_PARAMETERS["STEPSLICER_DEPTH"],
    STEP_SLICER_PARAMETERS["STEPSLICER_THRESHOLD"],
    STEP_SLICER_PARAMETERS["STEPSLICER_GAIN"],
    STEP_SLICER_PARAMETERS["STEPSLICER_STEP_MAX"],
    // グループヘッダーとして機能するセパレータ
    { 
      name: "STEP_LENGTH_HEADER", 
      type: "text", 
      defaultValue: "STEP LENGTH (1-16)" 
    } as ParameterConfig,
  ];
  
  // STEP LENパラメータ (1-16)
  const stepLenParams = Array.from({length: 16}, (_, i) => {
    return STEP_SLICER_PARAMETERS[`STEPSLICER_STEP_LEN${i+1}`];
  });
  
  // STEP LVLのヘッダー
  const stepLvlHeader = { 
    name: "STEP_LEVEL_HEADER", 
    type: "text", 
    defaultValue: "STEP LEVEL (1-16)" 
  } as ParameterConfig;
  
  // STEP LVLパラメータ (1-16)
  const stepLvlParams = Array.from({length: 16}, (_, i) => {
    return STEP_SLICER_PARAMETERS[`STEPSLICER_STEP_LVL${i+1}`];
  });
  
  // すべてのパラメータを結合
  return [...basicParams, ...stepLenParams, stepLvlHeader, ...stepLvlParams];
}

// エフェクトのリストをSelect用オプションとして取得
export function getEffectOptions(fxType?: "INPUT_FX" | "TRACK_FX" | "INPUT_TRACK_FX", position?: "A" | "B" | "C" | "D") {
  // すべてのエフェクト
  const allEffects = Object.keys(EFFECTS);
  
  // フィルタリング（デフォルトはすべてのエフェクトを返す）
  let filteredEffects = allEffects;
  
  // TRACKエフェクトのFX Aの場合、TRACK_A_EFFECTSのみ表示
  if (fxType === "TRACK_FX" && position === "A") {
    filteredEffects = TRACK_A_EFFECTS;
  } 
  // TRACKエフェクトかつFX A以外の場合は、TRACK_A_EFFECTS以外を表示
  else if (fxType === "TRACK_FX" && position !== "A") {
    filteredEffects = allEffects.filter(effect => !TRACK_A_EFFECTS.includes(effect));
  }
  // INPUT_TRACKエフェクトがINPUT側の場合はTRACK_A_EFFECTS以外を表示
  else if (fxType === "INPUT_TRACK_FX" && position !== undefined) {
    filteredEffects = allEffects.filter(effect => !TRACK_A_EFFECTS.includes(effect));
  }
  
  return filteredEffects.map(key => ({
    value: key,
    label: key
  }));
}

export function getEffectParameters(effectType: string): ParameterConfig[] {
  const parameterNames = EFFECTS[effectType] || [];
  
  // 通常のパラメータ
  const standardParams = parameterNames.map(name => {
    // Return specific config if available, otherwise use default
    return PARAMETER_CONFIGS[name] || { 
      name, 
      type: 'range', 
      min: 0, 
      max: 100, 
      step: 1, 
      defaultValue: 50 
    };
  });
  
  // シーケンサー機能を持つエフェクトの場合、シーケンサーパラメータを追加
  if (SEQUENCER_EFFECTS.includes(effectType)) {
    return [...standardParams, ...getSequencerParameters(effectType)];
  }
  
  // STEP SLICERの場合、専用のパラメータ設定を使用
  if (effectType === "STEP SLICER") {
    return getStepSlicerParameters();
  }
  
  return standardParams;
}

// OSC BOT parameters
const OSCBOT_PARAMETERS = {
  "OSCBOT_OSC": { name: "OSCBOT_OSC", type: "select", options: OSC_TYPES, defaultValue: "SAW" },
  "OSCBOT_TONE": { name: "OSCBOT_TONE", type: "range", min: -50, max: 50, step: 1, defaultValue: 0 },
  "OSCBOT_ATTACK": { name: "OSCBOT_ATTACK", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 },
  "OSCBOT_NOTE": { name: "OSCBOT_NOTE", type: "select", options: MUSICAL_NOTES, defaultValue: "C2" },
  "OSCBOT_MOD_SENS": { name: "OSCBOT_MOD_SENS", type: "range", min: -50, max: 50, step: 1, defaultValue: 0 },
  "OSCBOT_BALANCE": { name: "OSCBOT_BALANCE", type: "range", min: 0, max: 100, step: 1, defaultValue: 50 }
};