-- fx_groupカラムを追加
ALTER TABLE effects ADD COLUMN IF NOT EXISTS fx_group TEXT NOT NULL DEFAULT 'input';

-- TRACK_FXタイプのプリセットの既存エフェクトをtrackグループに更新
UPDATE effects
SET fx_group = 'track'
WHERE preset_id IN (
  SELECT id FROM presets WHERE type = 'TRACK_FX'
);

-- COMMIT TRANSACTION;