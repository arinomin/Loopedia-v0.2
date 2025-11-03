import type { 
  EffectRecordingType, 
  BankType, 
  SlotType, 
  FxGroup,
  Effect,
  SwitchMode,
  InsertType 
} from "@shared/schema";
import { BANKS, SLOTS, getAvailableBanks, getAvailableSlots, isSlotEnabled } from "./effects";

export interface EffectConfig {
  fxGroup: FxGroup;
  bank: BankType;
  slot: SlotType;
  effectType: string;
  sw: boolean;
  swMode: SwitchMode;
  insert: InsertType;
  parameters: Record<string, any>;
}

export type EffectGrid = Record<FxGroup, Record<BankType, Record<SlotType, EffectConfig | null>>>;

const createEmptyEffect = (
  fxGroup: FxGroup,
  bank: BankType,
  slot: SlotType
): EffectConfig => ({
  fxGroup,
  bank,
  slot,
  effectType: "LPF",
  sw: true,
  swMode: "TOGGLE",
  insert: "ALL",
  parameters: {},
});

export function createEmptyEffectGrid(): EffectGrid {
  const grid: any = {};
  
  (["input", "track"] as FxGroup[]).forEach(fxGroup => {
    grid[fxGroup] = {};
    BANKS.forEach(bank => {
      grid[fxGroup][bank] = {};
      SLOTS.forEach(slot => {
        grid[fxGroup][bank][slot] = createEmptyEffect(fxGroup, bank, slot);
      });
    });
  });
  
  return grid as EffectGrid;
}

export function getEffect(
  grid: EffectGrid,
  fxGroup: FxGroup,
  bank: BankType,
  slot: SlotType
): EffectConfig | null {
  return grid[fxGroup]?.[bank]?.[slot] ?? null;
}

export function setEffect(
  grid: EffectGrid,
  fxGroup: FxGroup,
  bank: BankType,
  slot: SlotType,
  effect: EffectConfig | null
): EffectGrid {
  return {
    ...grid,
    [fxGroup]: {
      ...grid[fxGroup],
      [bank]: {
        ...grid[fxGroup][bank],
        [slot]: effect,
      },
    },
  };
}

export function filterEnabledEffects(
  grid: EffectGrid,
  effectRecordingType: EffectRecordingType
): EffectConfig[] {
  const enabledEffects: EffectConfig[] = [];
  
  (["input", "track"] as FxGroup[]).forEach(fxGroup => {
    BANKS.forEach(bank => {
      SLOTS.forEach(slot => {
        if (isSlotEnabled(effectRecordingType, fxGroup, bank, slot)) {
          const effect = getEffect(grid, fxGroup, bank, slot);
          if (effect) {
            enabledEffects.push(effect);
          }
        }
      });
    });
  });
  
  return enabledEffects;
}

export function convertLegacyEffectsToGrid(effects: Effect[]): EffectGrid {
  const grid = createEmptyEffectGrid();
  
  effects.forEach(effect => {
    const fxGroup = effect.fxGroup as FxGroup;
    const bank = (effect.bank || "A") as BankType;
    const slot = (effect.slot || "A") as SlotType;
    
    const parameters = typeof effect.parameters === 'string' 
      ? JSON.parse(effect.parameters)
      : effect.parameters;
    
    grid[fxGroup][bank][slot] = {
      fxGroup,
      bank,
      slot,
      effectType: effect.effectType,
      sw: effect.sw,
      swMode: effect.swMode as SwitchMode,
      insert: effect.insert as InsertType,
      parameters,
    };
  });
  
  return grid;
}

export function convertGridToEffectArray(
  grid: EffectGrid,
  effectRecordingType: EffectRecordingType
): Omit<EffectConfig, "fxGroup" | "bank" | "slot">[] {
  const effects = filterEnabledEffects(grid, effectRecordingType);
  
  return effects.map(({ fxGroup, bank, slot, ...rest }) => rest);
}

export interface EffectGridSelection {
  fxGroup: FxGroup;
  bank: BankType;
  slot: SlotType;
}

export function getEnabledBanks(
  effectRecordingType: EffectRecordingType,
  fxGroup: FxGroup
): BankType[] {
  return getAvailableBanks(effectRecordingType, fxGroup);
}

export function getEnabledSlots(effectRecordingType: EffectRecordingType): SlotType[] {
  return getAvailableSlots(effectRecordingType);
}
