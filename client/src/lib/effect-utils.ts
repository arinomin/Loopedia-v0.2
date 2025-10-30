import { EffectType, EffectPosition, ExtendedEffectPosition } from "@shared/schema";
import { EFFECTS, TRACK_A_EFFECTS } from "./effects";

/**
 * FXタイプとポジションに応じた適切なエフェクトオプションを返す
 * @param fxType エフェクトタイプ (INPUT_FX, TRACK_FX, INPUT_TRACK_FX)
 * @param position エフェクトポジション (A, B, C, D)
 */
export function getAppropriateEffectOptions(
  fxType: EffectType, 
  position: EffectPosition
) {
  // エフェクトの完全なリスト
  const allEffects = Object.keys(EFFECTS);
  
  // フィルタリングロジック
  let filteredEffects = allEffects;
  
  // デフォルトでは標準エフェクトのみを表示
  filteredEffects = allEffects;
  
  // TRACK FXのFX Aの場合のみTRACK_A_EFFECTSを追加
  if ((position === "A" && fxType === "TRACK_FX") || 
      (String(position) === "TRACK_A" && fxType === "INPUT_TRACK_FX")) {
    // TRACK_A_EFFECTS専用エフェクトを追加
    // 重複を避けるためにSetを使用
    const uniqueEffects = new Set([...filteredEffects, ...TRACK_A_EFFECTS]);
    filteredEffects = Array.from(uniqueEffects);
  }
  
  // SelectItem用にオブジェクト配列に変換
  return filteredEffects.map(effect => ({
    value: effect,
    label: effect
  }));
}

/**
 * ポジション表記をINPUT/TRACKに対応した拡張ポジションに変換
 * @param position 基本ポジション (A, B, C, D)
 * @param group "input" または "track"
 */
export function getExtendedPosition(
  position: EffectPosition,
  group: "input" | "track"
): ExtendedEffectPosition {
  if (group === "input") {
    return `INPUT_${position}` as ExtendedEffectPosition;
  } else {
    return `TRACK_${position}` as ExtendedEffectPosition;
  }
}